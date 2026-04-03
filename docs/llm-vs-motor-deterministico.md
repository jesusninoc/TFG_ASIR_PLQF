# LLM vs. motor determinista — por qué separar inferencia de decisión

## La pregunta fundamental

Cuando se diseña un sistema de recomendación de hardware con IA, la primera pregunta que surge es inevitable: **¿por qué no dejar que el LLM haga todo?**

Un modelo de lenguaje grande como Mistral puede mantener conversaciones fluidas, conoce miles de componentes de PC, entiende las diferencias entre una build gaming y una workstation, habla español, y es capaz de formatear respuestas de manera legible. ¿Por qué es necesario todo ese motor determinista si el modelo podría recomendar una build directamente en su respuesta?

Esta página responde a esa pregunta con detalle. La respuesta corta es: **porque los LLMs son excelentes analizando texto y terribles tomando decisiones con datos dinámicos, restricciones duras y requisitos de corrección absoluta**. La respuesta larga es todo lo que sigue.

---

## Los dos roles del sistema

El sistema tiene dos trabajos fundamentalmente distintos:

| Trabajo A | Trabajo B |
|---|---|
| Entender lo que el usuario quiere decir | Encontrar la mejor build posible |
| "Quiero gaming con AMD sin gastar mucho" | "Consultar stock, aplicar pesos, verificar compatibilidad" |
| Lenguaje natural → estructura | Estructura → resultado correcto |
| Ambiguo, contextual, subjetivo | Determinista, verificable, correcto o incorrecto |

**El LLM es el experto en el Trabajo A**. El motor determinista es el experto en el Trabajo B. El sistema los conecta: el LLM hace el Trabajo A y entrega un objeto JSON tipado; el motor recoge ese JSON y ejecuta el Trabajo B.

Esta separación no es arbitraria ni capricho de diseño. Es el resultado de entender en qué falla cada tecnología cuando se le pide hacer lo que no es su fortaleza.

---

## Por qué los LLMs no deben tomar decisiones de negocio

### 1. Los LLMs alucinan datos concretos

Un modelo de lenguaje fue entrenado sobre texto extraído de internet y libros. Su conocimiento de productos de hardware es estático, incompleto, y tiene una fecha de corte. Cuando un LLM responde "te recomiendo la Ryzen 7 9800X3D por 450€", ese precio puede estar incorrecto. Ese producto puede no estar en stock. Ese producto puede no existir en la base de datos de la tienda.

En PC Selector, el stock y los precios cambian. Un componente puede agotarse entre una consulta y la siguiente. Un proveedor puede actualizar un precio. Si el LLM generara builds directamente, el sistema estaría recomendando productos ficticios con precios ficticios, posiblemente creando expectativas que el proceso de compra no podría cumplir.

El motor determinista consulta la base de datos **en el momento exacto** en que se genera la recomendación. Lo que recomienda existe ahora mismo, con el precio correcto a este instante.

### 2. Los LLMs no garantizan compatibilidad

Las reglas de compatibilidad de hardware son binarias y absolutas:
- Una CPU AM5 en una placa AM4 no funciona. Sin excepciones.
- DDR5 en una placa que solo admite DDR4 no funciona. Sin excepciones.
- Una placa mATX en una caja Mini-ITX no cabe. Sin excepciones.
- Una fuente de 550W para un sistema que necesita 720W puede dañar el hardware. Sin excepciones.

Los LLMs aprenden patrones estadísticos. Generalmente conocen estas restricciones, pero las violan ocasionalmente, especialmente en modelos de menor tamaño o cuando la conversación es larga y el contexto importante ha salido de la ventana de atención. Un 99% de exactitud no es suficiente cuando el 1% restante significa que el usuario compra componentes que no son compatibles y tiene que devolverlos o, peor, los daña.

`evaluateBuildCompatibility()` es código TypeScript. Verifica las reglas y devuelve verdadero o falso. No tiene días buenos ni días malos. No olvida reglas. No las viola por presión del contexto.

### 3. Los LLMs no respetan el presupuesto con precisión

Un modelo de lenguaje que intenta generar una build dentro de un presupuesto debe hacer suma de precios en su cabeza mientras construye la respuesta. No tiene acceso a una calculadora. Comete errores aritméticos, especialmente cuando los precios tienen decimales complejos o cuando van sumando componente a componente.

En pruebas informales con modelos de 7B-13B parámetros, es común que la suma total de los componentes recomendados exceda el presupuesto indicado en un 5-20%. En casos extremos, el modelo "olvida" el presupuesto a mitad de la respuesta y recomienda hardware muy por encima del límite.

El motor determinista calcula el total con aritmética de enteros en céntimos. Nunca comete errores de redondeo. Nunca olvida el presupuesto. La verificación final `if (report.totalPriceCents > tierBudget) return null` es matemáticamente imposible de eludir.

### 4. Las respuestas de los LLMs no son reproducibles

Dada la misma pregunta, un LLM puede dar respuestas distintas en ejecuciones diferentes. Esto es por diseño: el muestreo estocástico durante la generación produce variabilidad. Para un sistema de recomendación de compras con precios reales, esta variabilidad es peligrosa.

Si el usuario pregunta "¿qué me recomendaste antes?" o compara dos sesiones con el mismo presupuesto, el LLM podría dar respuestas inconsistentes. El motor determinista da siempre el mismo resultado para el mismo catálogo de stock.

### 5. El debugging de un LLM que "falla" es extremadamente difícil

Cuando el motor determinista produce un resultado inesperado, el flujo de ejecución es completamente trazable: se puede ver exactamente qué productos había disponibles, qué `pickBest` eligió y por qué, qué verificaciones pasó o falló. Los logs del sistema pueden reproducir la decisión.

Cuando un LLM genera una recomendación incorrecta, la causa es una función de los pesos de millones de parámetros y del contexto de entrada. Es extremadamente difícil decir "el modelo recomendó esta build incorrecta porque en el texto de entrenamiento hay más artículos sobre Intel que sobre AMD en ese rango de precio". La lógica de un LLM no es auditable.

---

## Por qué los motores deterministas no pueden reemplazar al LLM

El motor determinista es muy bueno tomando decisiones, pero no puede interpretar lenguaje natural. Veamos qué tendría que hacer sin el LLM:

```
Usuario: "montadme una PC como la del xokas pero más barata, que no llegue al límite"
```

Para parsear esta frase sin LLM, el motor necesitaría:
1. Reconocer "xokas" como un influencer y saber que usa setups AMD de gama alta.
2. Entender "más barata" como una comparación relativa sin valor numérico.
3. Interpretar "que no llegue al límite" como que el presupuesto está implícito en el contexto ("el límite") y no está dado explícitamente.
4. Combinar todo esto para inferir: "gaming, AMD, sin límite explícito → pedir aclaración sobre presupuesto".

Esto requeriría un sistema de reglas de lenguaje natural enormemente complejo, frágil ante nuevas expresiones, y desactualizado en cuanto aparecieran nuevos influencers o nuevas formas de expresar presupuesto.

El LLM hace esto de manera natural porque fue entrenado en millones de conversaciones humanas. Su función es precisamente esta: bridge entre el lenguaje humano impreciso y la estructura de datos precisa que el motor necesita.

---

## La interfaz entre las dos capas: `AssistantIntent`

La clave del diseño es que la comunicación entre las dos capas se realiza a través de un **tipo estrictamente definido**:

```typescript
// Lo que el LLM produce (lib/types.ts, validado con Zod)
interface AssistantIntent {
  intent: "build" | "clarify" | "faq" | "unknown";
  buildFilters?: {
    budgetCents: number;
    useCase?: "gaming" | "workstation_gpu" | "workstation_cpu" | "office";
    preferBrands?: BrandFilters;
    excludeBrands?: BrandFilters;
    minSpecs?: MinSpecs;
    requireDedicatedGpu?: boolean;
    preferFormFactor?: FormFactor;
  };
  clarifyQuestion?: string;
  faqQuery?: string;
}
```

Este contrato tiene propiedades importantes:

**Es pequeño.** El LLM solo necesita extraer un puñado de campos. No tiene que conocer el catálogo. No tiene que calcular qué componentes elegir. Solo tiene que mapear el texto del usuario a este esquema.

**Es validado.** Antes de que el motor use el resultado del LLM, Zod verifica que el JSON tiene la estructura correcta, los tipos correctos y los valores dentro de los enums definidos. Si el LLM devuelve algo malformado (alucinación de estructura), la validación falla y el sistema devuelve un intent `"unknown"` en lugar de pasarle datos corruptos al motor.

**Es determinista desde aquí en adelante.** Una vez que el `AssistantIntent` es validado, todo lo que sigue es 100% determinista. El mismo intent con el mismo catálogo siempre produce la misma build.

---

## El problema del context carry-forward

Un área donde los LLMs muestran sus limitaciones en conversaciones multi-turno es el **carry-forward de contexto**: recordar lo que el usuario dijo en turnos anteriores y aplicarlo al turno actual.

Ejemplo de conversación problemática:

```
Turno 1 — Usuario: "quiero una PC gamer por 1500€"
Turno 1 — LLM: [intent: "build", budgetCents: 150000, useCase: "gaming"]

Turno 2 — Usuario: "y que sea con AMD para la CPU y GPU"
Turno 2 — LLM: [intent: "build", budgetCents: 0, useCase: "gaming", preferBrands: {cpu: ["AMD"], gpu: ["AMD"]}]
                                   ^^^^^^^^^^^^
                                   Olvidó el presupuesto del turno anterior
```

Esto ocurre con cierta frecuencia en modelos de 7B parámetros con ventanas de contexto cortas, o cuando el historial de conversación es largo. EL LLM solo ve el turno actual y extrae "AMD gaming" pero no "reitera" el presupuesto que ya sabe de antes.

El sistema tiene una red de seguridad explícita en `lib/rag.ts`: la función `extractBudgetCentsFromHistory()`. Si el motor recibe `budgetCents: 0`, el orquestador escanea todos los mensajes del usuario en el historial con expresiones regulares para recuperar el presupuesto más reciente mencionado. Esta recuperación es determinista (regex sobre texto) y no depende del LLM.

Esta es otra ilustración del patrón general: **las limitaciones del LLM se compensan con lógica determinista, no con un LLM más grande**.

---

## Comparación de enfoques alternativos

### Alternativa A: LLM "todo en uno"

El LLM recibe la pregunta, consulta el stock (via function calling o herramientas), y devuelve directamente la build recomendada en texto narrativo.

**Ventajas**: una sola capa, más simple en apariencia.

**Desventajas**:
- El LLM necesita múltiples llamadas a herramientas para consultar el stock → latencia multiplicada.
- La selección de componentes dentro del LLM no es reproducible ni auditable.
- Las verificaciones de compatibilidad deben estar en el prompt o en herramientas, y el LLM puede ignorarlas.
- No hay garantía de que el total no supere el presupuesto.
- Si el LLM alucinó un componente, no hay nada que lo intercepte.
- El coste por token de usar un modelo suficientemente capaz es mucho mayor.

### Alternativa B: RAG puro con vector DB de productos

El sistema convierte el catálogo de productos a embeddings, y ante cada consulta recupera los N productos más relevantes para incluirlos en el contexto del LLM.

**Ventajas**: el LLM tiene "acceso" a productos reales sin function calling.

**Desventajas**:
- La "relevancia" semántica no equivale a "compatibilidad técnica". Una GPU puede ser semánticamente similar a "gaming de gama media" aunque sea incompatible con la placa base del contexto.
- Los embeddings no capturan restricciones técnicas binarias como sockets o tipos de RAM.
- La ventana de contexto se llena rápidamente si hay muchos productos, degradando la atención del modelo.
- El presupuesto sigue siendo un problema aritmético que el LLM maneja mal.

### Alternativa C: El enfoque actual — LLM de intención + motor determinista

**Ventajas**:
- El LLM hace solo lo que hace bien: parsear lenguaje.
- El motor hace solo lo que hace bien: aplicar restricciones con datos reales.
- El resultado es reproducible, auditable y correcto.
- La latencia del LLM es mínima porque solo necesita generar un JSON pequeño.
- Se puede usar un modelo pequeño (Mistral 7B) con bajo coste y latencia.
- El sistema puede actualizarse sin reentrenar ningún modelo: basta con actualizar las tablas de pesos o las reglas de compatibilidad.

**Desventajas**:
- Más complejidad arquitectural.
- El LLM puede fallar en parsear intenciones complejas (se mitiga con el schema Zod y el sistema de clarificación).

---

## Cuándo actualizar el motor vs. cuándo actualizar el prompt

Esta distinción es práctica e importante para el desarrollo futuro del sistema:

**Actualiza el motor (`build-engine.ts`, `compatibility.ts`) cuando:**
- Se añade una nueva categoría de componente (ej. cooler de CPU).
- Cambia una regla de compatibilidad técnica del hardware.
- Se añade un nuevo caso de uso con una distribución de pesos diferente.
- Se ajustan los multiplicadores de tier.
- Se introduce un nuevo criterio de selección de componentes.

**Actualiza el prompt (`intent-parser.ts`) cuando:**
- Aparece un nuevo streamer o influencer al que los usuarios referencia.
- Se añade un nuevo caso de uso que los usuarios expresan con nuevo vocabulario.
- El LLM falla en interpretar una forma específica de expresar el presupuesto.
- Se añade un nuevo campo al schema `AssistantIntent`.

**Nunca** se debe trasladar lógica de negocio al prompt para que el LLM "tome decisiones" con ella. Si la lógica puede expresarse como código, debe estar en código.

---

## Propiedades de corrección que el sistema garantiza

Gracias a la separación LLM/motor, el sistema puede garantizar formalmente estas propiedades:

1. **Corrección de presupuesto**: `totalPriceCents ≤ tierBudget ≤ 0.95 × filters.budgetCents` — verificado por aritmética, no por el LLM.

2. **Corrección de stock**: todos los componentes recomendados tienen `stock > 0` en el momento de la consulta.

3. **Corrección de compatibilidad**: al menos las 5 reglas técnicas verificadas por `evaluateBuildCompatibility` se cumplen en todo build devuelto.

4. **Corrección de precio**: el precio mostrado al usuario es el precio de la base de datos, no el que el LLM cree que debería ser.

5. **Ausencia de alucinaciones en productos**: no se puede recomendar un producto que no existe en la base de datos.

Ninguna de estas garantías sería posible si el LLM tomara las decisiones de selección de componentes.
