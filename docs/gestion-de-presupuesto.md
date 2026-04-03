# Gestión de presupuesto — diseño completo del sistema de control económico

## Introducción

El sistema de gestión de presupuesto es uno de los aspectos más críticos de PC Selector. Cuando un usuario indica que quiere gastar "1500€ en una PC gaming", espera recibir builds que no superen ese importe. No hay margen para el error: una build que excede el presupuesto en 50€ puede ser la diferencia entre que el usuario pueda comprarla o no.

Este documento explica, de arriba a abajo, cómo funciona el sistema de presupuesto: desde cómo se captura el número del lenguaje natural del usuario hasta cómo se garantiza matemáticamente que el total nunca supera el límite.

---

## Capa 1: Extracción del presupuesto en lenguaje natural

El primer desafío es convertir lo que el usuario escribe en un número. Los usuarios no dicen "budgetCents: 150000". Dicen cosas como:

- "1500€"
- "1.500 euros"
- "entre 1000 y 1500"
- "sobre 2k"
- "1.5k"
- "algo por 800 más o menos"
- "sin límite de presupuesto"

Esta conversión es responsabilidad del LLM en `lib/intent-parser.ts`. El system prompt incluye instrucciones explícitas para manejar los patrones más comunes:

```
Regla 0: Currency: users ALWAYS speak in euros. "10k" = 10000€, "2k" = 2000€,
"1.5k" = 1500€. Convert shorthand first, then multiply by 100 for budgetCents.
```

Los casos especiales más importantes:

**Notación "k"**: "2k" significa 2000€, "1.5k" significa 1500€. El LLM debe interpretar "k" como "kilo" (× 1000) antes de multiplicar por 100 para convertir a céntimos.

**Separadores locales**: en España, "1.500" con punto es el separador de miles (= 1500€), no un decimal. El LLM recibe esta instrucción implícitamente por su conocimiento del español europeo.

**"Sin límite"**: el sistema no puede trabajar con infinito. Cuando el usuario dice "sin límite de presupuesto", el LLM genera `intent: "clarify"` y pide un valor aproximado.

**Rangos**: "entre 1000 y 1500" — el LLM usa el límite superior como `budgetCents`.

### El presupuesto como céntimos de euro

Todo el sistema trabaja internamente en **céntimos de euro** (enteros), no en euros con decimales. Esto es una elección deliberada de diseño:

1. **Evita imprecisiones de punto flotante**: 1199.99€ × 100 = 119999.0 en aritmética de punto flotante podría producir resultados inesperados. En céntimos enteros: 1500€ = 150000, sin riesgo de redondeo.
2. **Facilita la comparación exacta**: `if (totalPriceCents > tierBudget)` es una comparación de enteros, sin ambigüedad.
3. **Consistencia con Stripe**: la API de pagos de Stripe también trabaja en las unidades más pequeñas de la moneda (céntimos), así que el formato es coherente en todo el sistema.

---

## Capa 2: Recuperación del presupuesto del historial

Los LLMs en conversaciones multi-turno a veces "olvidan" el presupuesto que el usuario mencionó en un turno anterior. El síntoma es que el LLM devuelve `budgetCents: 0` en un turno posterior aunque el presupuesto ya estaba establecido.

`lib/rag.ts` incluye una red de seguridad determinista para este caso:

```typescript
function extractBudgetCentsFromHistory(
  messages: ConversationMessage[],
  question: string,
): number | null {
  const userText = [
    ...messages.filter((m) => m.role === "user").map((m) => m.content),
    question,
  ].join(" ");

  const kPattern    = /(\d+(?:[.,]\d+)?)\s*k\b/gi;      // "2k", "1.5k"
  const euroPattern = /(\d+(?:[.,]\d+)?)\s*(?:€|euros?)/gi;  // "1500€", "1.500 euros"
  
  // ... escanea todos los matches, devuelve el último valor válido encontrado
}
```

La función:
1. Combina todos los mensajes del usuario en el historial en una sola cadena de texto.
2. Busca patrones de presupuesto con dos expresiones regulares.
3. Devuelve el **último** valor encontrado (el más reciente siempre gana).
4. Aplica una validación de rango: acepta valores entre 100€ y 100.000€. Fuera de ese rango probablemente es un número que no es un presupuesto.

Este mecanismo no sustituye al LLM: si el LLM ya devuelve un `budgetCents > 0`, se usa ese valor. Solo interviene cuando el LLM falla.

---

## Capa 3: Los tiers de presupuesto

Una vez que el motor tiene `filters.budgetCents`, lo divide en tres niveles de gasto. La idea es ofrecer al usuario opciones a distintos precios, no solo una build al límite máximo de su presupuesto.

```typescript
const TIER_MULTIPLIERS: Record<BuildTier, number> = {
  budget:  0.50,   // 50% del presupuesto declarado
  mid:     0.75,   // 75% del presupuesto declarado
  premium: 0.95,   // 95% del presupuesto declarado
};
```

### ¿Por qué 0.50 / 0.75 / 0.95 y no 0.33 / 0.66 / 1.00?

La elección tiene varias motivaciones:

**El tier budget al 50% permite una separación clara**: si el usuario tiene 1500€, el tier budget cuesta alrededor de 750€. Esa diferencia de 750€ entre el tier más barato y el más caro es suficiente como para que haya una diferencia real de rendimiento entre las builds (diferentes procesadores, diferente GPU). Si los tiers estuvieran más juntos (por ejemplo, 0.70 / 0.85 / 1.00), los tres builds podrían terminar eligiendo el mismo procesador (lo que la deduplicación eliminaría, dejando solo 1-2 builds en vez de 3).

**El tier premium al 95% añade margen de error**: cuando los pesos se multiplican por un entero y se aplica `Math.floor`, se acumula una pequeña pérdida de céntimos. Además, el algoritmo `pickBest` puede elegir productos ligeramente por encima de su target (el fallback al más barato sobre el target). El 5% de margen garantiza que estos efectos nunca hacen que el total supere el presupuesto del usuario, incluso en el peor caso.

**El tier mid al 75% es el "punto dulce"**: la literatura sobre teoría de la decisión muestra que cuando se le presentan tres opciones con precios muy distintos, la mayoría de las personas elige la opción del medio. El tier mid al 75% del presupuesto es la opción que el usuario probablemente elegirá, y al estar al 75% (no al 50% ni al 90%) ofrece una calidad significativa sin "usar" todo el presupuesto.

### ¿Qué ocurre si el presupuesto es muy bajo?

Si el usuario tiene un presupuesto de 300€, los tiers serían:
- budget: 150€
- mid: 225€
- premium: 285€

Con 150€ es extremadamente difícil construir un PC funcional con stock comercial moderno. El tier budget probablemente fallará. El tier mid a 225€ podría generar una build de oficina muy básica. El tier premium a 285€ tiene más opciones.

En este escenario el motor simplemente devuelve los tiers que pueda generar. Si solo el premium funciona, el usuario recibe una sola opción. Si ninguno funciona, el orquestador informa al usuario de que el presupuesto es insuficiente para el catálogo disponible.

---

## Capa 4: Distribución del tier entre componentes (pesos)

Dentro de cada tier, el presupuesto `tierBudget` se distribuye entre los siete tipos de componentes según las tablas de pesos por caso de uso. Los pesos son fraccionales y representan qué porción del presupuesto total debería destinarse a cada categoría.

```
tierBudget × weight = targetCents para ese componente
```

Para gaming con 1500€ en el tier premium (1425€ = 142.500 céntimos):

| Componente | Peso | Target |
|---|---|---|
| CPU | 0.28 | 39.900 céntimos = 399€ |
| GPU | 0.38 | 54.150 céntimos = 541,50€ |
| RAM | 0.08 | 11.400 céntimos = 114€ |
| Almacenamiento | 0.07 | 9.975 céntimos = 99,75€ |
| Placa base | 0.09 | 12.825 céntimos = 128,25€ |
| Fuente | 0.06 | 8.550 céntimos = 85,50€ |
| Caja | 0.04 | 5.700 céntimos = 57€ |
| **Total** | **1.00** | **142.500 céntimos = 1.425€** |

Estos valores son los **targets** — el punto de referencia para `pickBest`, no un límite duro. Un componente puede seleccionarse por encima de su target si es necesario (fallback de `pickBest`), siempre que el `hardMax` lo permita.

### ¿Por qué los pesos se aplican al tierBudget y no al presupuesto total?

Si los pesos se aplicaran al presupuesto total y el motor intentara generar el tier budget, la CPU target sería 420€ (28% de 1500€) pero el tier budget solo tiene 750€ en total. Eso significaría que la CPU sola consumiría el 56% del tier budget, dejando muy poco para los otros seis componentes.

Al aplicar los pesos al `tierBudget` de cada tier, la distribución es proporcional al nivel de gasto de ese tier. En el tier budget, la CPU target sería 28% × 750€ = 210€, que es coherente con el nivel general de la build.

---

## Capa 5: `pickBest` con `hardMax` dinámico

Este es el núcleo del sistema de control de presupuesto en tiempo de selección. Antes de elegir cada componente, el motor calcula un `hardMax`: el precio máximo que puede costar ese componente y aun así permitir terminar la build.

### Cálculo del `hardMax`

```
hardMax_{componente_actual} = remaining - Σ(minPrecio de cada componente aún no seleccionado)
```

Donde:
- `remaining` es el presupuesto que queda después de todos los picks anteriores.
- `minPrecio` de un pool es el precio más bajo disponible en ese pool de productos.

Ejemplo concreto con gaming, tier premium (142.500 cénts), asumiendo que los precios mínimos son:
- minMB = 8.000 cénts (80€)
- minRAM = 4.000 cénts (40€)
- minStorage = 3.000 cénts (30€)
- minGPU = 15.000 cénts (150€)
- minCase = 3.000 cénts (30€)
- minPSU = 4.500 cénts (45€)

```
hardMax_CPU = 142.500 - 8.000 - 4.000 - 3.000 - 15.000 - 3.000 - 4.500 = 105.000 cénts = 1.050€
```

La CPU no puede costar más de 1.050€ si queremos poder completar el resto de la build con las opciones más baratas disponibles. El target era 39.900 cénts (399€), pero el `hardMax` es 105.000 cénts. El motor buscará el mejor CPU por debajo de 399€, y solo si no encuentra ninguno buscará el más barato entre los que cuestan hasta 1.050€.

Supongamos que la CPU elegida cuesta 38.900 cénts (389€). El remaining se actualiza:

```
remaining = 142.500 - 38.900 = 103.600 cénts
```

Ahora el `hardMax` de la placa base:

```
hardMax_MB = 103.600 - 4.000 - 3.000 - 15.000 - 3.000 - 4.500 = 74.100 cénts = 741€
```

Y así sucesivamente. Cada pick reduce el `remaining` y estrecha el `hardMax` de los picks siguientes.

### ¿Qué ocurre cuando el `hardMax` es negativo?

Si la suma de los precios mínimos de los componentes no seleccionados ya supera el `remaining`, el `hardMax` sería negativo:

```
hardMax_CPU = 50.000 - 60.000 = -10.000  (los mínimos de los demás ya superan el tierBudget)
```

En este caso, `pickBest` filtra `items.filter(i => i.priceCents <= hardMax)` y obtiene un array vacío. Devuelve `undefined`. El tier falla inmediatamente y no continúa. Este es el comportamiento correcto: si el catálogo disponible (filtrado por marcas, especificaciones mínimas, etc.) no puede construir una build de 7 componentes dentro del presupuesto del tier, ese tier no debe producir ningún resultado.

### Los `minPrecio` son del pool global, no del pool filtrado

Existe una sutileza importante: los `minPrecio` se calculan sobre el pool global de componentes (todos los que tienen stock), no sobre el pool filtrado por socket, tipo de memoria, etc.:

```typescript
const minMB  = motherboards.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
const minRAM = memories.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
// ...
```

Esto es una subestimación deliberada. Cuando se calcula `hardMax_CPU`, no se sabe todavía qué socket tendrá el CPU elegido y por tanto no se puede calcular el precio mínimo de las placas compatibles. Usar el precio mínimo global (que puede ser menor que el precio real de las placas compatibles con el socket elegido) da un `hardMax` más permisivo de lo estrictamente necesario.

Esto **no compromete la corrección**: si la subestimación hace que el `hardMax` sea demasiado permisivo y el pick resulta en un total que supera el presupuesto, la verificación final `if (report.totalPriceCents > tierBudget) return null` lo rechaza igualmente. Los `hardMax` dinámicos son una optimización para rechazar builds inviables lo antes posible (antes de hacer todos los picks), no la única línea de defensa.

---

## Capa 6: La verificación final con precio real

Después de que los 7 componentes han sido seleccionados, la compatibilidad validada, y todo parece en orden, hay una última verificación de presupuesto:

```typescript
const report = evaluateBuildCompatibility(build);

if (!report.isCompatible) return null;
if (report.totalPriceCents > tierBudget) return null;
```

`report.totalPriceCents` es la suma de los `priceCents` reales de los 7 productos seleccionados, calculada por `evaluateBuildCompatibility`:

```typescript
const totalPriceCents = Object.values(selection).reduce(
  (sum, product) => sum + (product?.priceCents ?? 0),
  0,
);
```

Esta es la **fuente de verdad definitiva** sobre el precio de la build. Es este valor (no los targets ni los `hardMax`) el que se compara contra `tierBudget`. Solo si pasa esta verificación la build se devuelve al usuario.

### Por qué esta verificación puede dispararse incluso con `pickBest` y `hardMax`

Hay un escenario donde `pickBest` puede seleccionar un componente dentro de su `hardMax` pero aun así el total superar el `tierBudget`:

- El `hardMax` usa `minPrecio` del pool global.
- Pero el pool real para ese componente (filtrado por socket, tipo de memoria, etc.) solo tiene opciones más caras que `minPrecio_global`.
- `pickBest` elige el más barato del pool filtrado (que puede ser más caro que `minPrecio_global`).
- La suma acumulada excede `tierBudget`.

Este es el escenario "subestimación del `hardMax`" mencionado antes. La verificación final lo captura y descarta el tier. Es el comportamiento correcto: mejor no mostrar esa build que mostrar una build que sobrepasa el presupuesto del usuario.

---

## Resumen: las tres capas de seguridad del presupuesto

El sistema tiene tres mecanismos independientes que garantizan el respeto al presupuesto, de más permisivo a más estricto:

| Capa | Mecanismo | Qué previene |
|---|---|---|
| **Capa A** | `pickBest` + targeting por pesos | Seleccionar componentes por encima de su asignación proporcional |
| **Capa B** | `hardMax` dinámico en cada pick | Que un componente consuma presupuesto necesario para los que siguen |
| **Capa C** | `if (totalPriceCents > tierBudget) return null` | Cualquier caso que las capas A y B no hayan podido prevenir |

Solo cuando una build pasa la Capa C se devuelve al usuario. La Capa C garantiza que **ninguna build presentada al usuario supera el 95% de su presupuesto declarado**.

---

## El presupuesto en el contexto del carrito y el pago

Para cerrar el ciclo, vale la pena mencionar cómo el presupuesto fluye desde la recomendación hasta el pago:

1. El motor genera builds con precios reales de BD.
2. El usuario añade la build al carrito (los `priceCents` van al estado del carrito).
3. En el checkout, los precios **se verifican de nuevo contra la BD** en `app/api/checkout/route.ts`: el precio del carrito del cliente nunca se usa directamente, siempre se consulta la BD para prevenir manipulaciones.
4. El PaymentIntent de Stripe se crea con el importe total recalculado desde la BD, incluyendo envío.
5. Stripe verifica el cargo al cobrar.

El precio que el usuario vio en la recomendación es el precio con el que trabaja todo el flujo posterior. No hay lugar donde un cambio de precio de carrito pueda colarse entre la recomendación y el cobro.
