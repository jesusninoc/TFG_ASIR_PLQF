# El motor de builds — `lib/build-engine.ts`

## ¿Qué es el motor de builds?

El motor de builds es el núcleo funcional de PC Selector. Es el módulo encargado de tomar un conjunto de filtros (presupuesto, caso de uso, preferencias de marca, especificaciones mínimas) y devolver hasta tres configuraciones de PC completas, compatibles entre sí y ajustadas al presupuesto.

Es **completamente determinista**: dado el mismo catálogo de stock y los mismos filtros de entrada, siempre produce el mismo resultado. No hay aleatoriedad, no hay modelos de lenguaje, no hay lógica difusa. Solo datos de base de datos, reglas de compatibilidad y aritmética de presupuesto.

---

## Responsabilidades del motor

1. **Consultar el stock real** de la base de datos para cada categoría de componente.
2. **Aplicar filtros** de marca, especificaciones mínimas y caso de uso antes de seleccionar componentes.
3. **Generar hasta tres builds** con distintos niveles de precio (budget, mid, premium).
4. **Distribuir el presupuesto** de cada tier entre los componentes según tablas de pesos predefinidas.
5. **Seleccionar el componente óptimo** de cada categoría con el algoritmo `pickBest`.
6. **Seguir el presupuesto restante** para que ningún componente anticipe fondos que otros necesitan.
7. **Deduplicar builds** para evitar que dos tiers presenten el mismo procesador.
8. **Delegar la validación final** de compatibilidad y precio a `lib/compatibility.ts`.

---

## Punto de entrada: `generateBuilds(filters)`

La función pública del módulo es `generateBuilds`. Recibe un objeto `BuildFilters`:

```typescript
interface BuildFilters {
  budgetCents: number;           // Presupuesto total en céntimos de euro
  useCase?: UseCase;             // "gaming" | "workstation_gpu" | "workstation_cpu" | "office"
  preferBrands?: BrandFilters;   // Marcas preferidas por categoría
  excludeBrands?: BrandFilters;  // Marcas a excluir por categoría
  minSpecs?: MinSpecs;           // Especificaciones mínimas (núcleos, VRAM, GB de RAM, etc.)
  requireDedicatedGpu?: boolean; // Forzar o inhibir GPU dedicada
  preferFormFactor?: FormFactor; // Preferencia de factor de forma de placa/torre
}
```

Y devuelve `Promise<BuildResult[]>`: un array de entre 0 y 3 objetos `BuildResult`, uno por cada tier que haya conseguido generar una build válida.

---

## Fase 1: Consulta paralela del stock

El motor lanza **siete consultas Prisma en paralelo** usando `Promise.all`. Esto es importante: si las consultas fueran secuenciales, el tiempo de respuesta se multiplicaría. Al lanzarlas en paralelo, el tiempo total es el de la consulta más lenta, no la suma de todas.

Las consultas aplican ya en esta fase los filtros de marca y especificaciones mínimas. Por ejemplo, si el usuario quiere solo procesadores AMD, la condición `brand LIKE '%AMD%'` ya aparece en la cláusula SQL. Esto reduce el volumen de datos que el motor tiene que manejar en memoria y alivia la carga de filtrado posterior.

Todos los resultados se ordenan por precio ascendente (`orderBy: { priceCents: "asc" }`). Esto no es solo por convención: `pickBest` asume que los pools pueden estar en cualquier orden (usa `reduce`), así que el orden no afecta la corrección del algoritmo, pero facilita el debug y la lectura de logs.

Los productos crudos de Prisma se convierten a los tipos del dominio mediante `dbProductsToTypes()`, una capa de adaptación en `lib/db-to-types.ts`.

```typescript
const [cpusRaw, motherboardsRaw, memoriesRaw, storagesRaw, gpusRaw, psusRaw, casesRaw] =
  await Promise.all([
    prisma.product.findMany({ where: { componentType: "CPU", stock: { gt: 0 }, ...marcasCpu }, include: FULL_INCLUDE }),
    prisma.product.findMany({ where: { componentType: "MOTHERBOARD", stock: { gt: 0 }, ...marcasPlaca }, include: FULL_INCLUDE }),
    // ... etc para RAM, almacenamiento, GPU, fuente, caja
  ]);
```

### ¿Por qué `stock: { gt: 0 }`?

Solo se consideran productos con stock mayor que cero. El motor no puede recomendar un componente que no se puede comprar. Esta condición garantiza que cualquier build generada puede añadirse al carrito en ese momento.

### ¿Y si el usuario no especifica marcas?

Los helpers `brandContainsFilter` y `brandExcludeFilter` devuelven `undefined` cuando no se especifican marcas, lo que en Prisma equivale a no añadir ninguna condición extra. El motor trabaja entonces con todo el catálogo disponible.

---

## Fase 2: Generación por tiers

Una vez que el motor tiene los pools de componentes, intenta generar una build por cada uno de los tres tiers: `"budget"`, `"mid"` y `"premium"`.

### Los tres tiers y sus multiplicadores

```typescript
const TIER_MULTIPLIERS: Record<BuildTier, number> = {
  budget:  0.50,   // 50% del presupuesto total
  mid:     0.75,   // 75% del presupuesto total
  premium: 0.95,   // 95% del presupuesto total
};
```

Nótese que el tier premium llega al **95%, no al 100%**. El 5% restante actúa como margen de seguridad para absorber la imprecisión inherente a los pesos fraccionales (los pesos suman exactamente 1.0, pero al multiplicar por enteros y aplicar `Math.floor` pueden acumularse céntimos de diferencia). El motor nunca genera un build que supere el 95% del presupuesto del usuario, lo que garantiza que el total presentado nunca excede lo que el usuario indicó.

El presupuesto de cada tier se calcula como:

```
tierBudget = Math.floor(filters.budgetCents × TIER_MULTIPLIERS[tier])
```

Para un presupuesto de 1200€ (120.000 céntimos):
- budget:  60.000 céntimos = 600€
- mid:     90.000 céntimos = 900€
- premium: 114.000 céntimos = 1.140€

Si algún tier no produce una build válida (porque no hay suficientes componentes compatibles, o porque el presupuesto es demasiado bajo para ese tier), ese tier simplemente no aparece en la respuesta. Es perfectamente válido devolver solo 1 o 2 builds.

---

## Fase 3: Distribución de presupuesto por caso de uso

Dentro de cada tier, el presupuesto disponible se distribuye entre las categorías de componentes según **tablas de pesos fijas por caso de uso**. No se usa IA para tomar esta decisión: son constantes definidas por expertos en hardware.

```typescript
const USE_CASE_WEIGHTS: Record<UseCase, BudgetWeights> = {
  gaming:           { cpu: 0.28, gpu: 0.38, ram: 0.08, storage: 0.07, mb: 0.09, psu: 0.06, case: 0.04 },
  workstation_gpu:  { cpu: 0.25, gpu: 0.32, ram: 0.18, storage: 0.09, mb: 0.08, psu: 0.05, case: 0.03 },
  workstation_cpu:  { cpu: 0.38, gpu: 0,    ram: 0.28, storage: 0.12, mb: 0.10, psu: 0.07, case: 0.05 },
  office:           { cpu: 0.30, gpu: 0,    ram: 0.22, storage: 0.18, mb: 0.14, psu: 0.10, case: 0.06 },
};
```

### Justificación de las tablas de pesos

**Gaming**: el componente de mayor impacto en rendimiento de juego es la GPU, de ahí que absorba el 38% del presupuesto. La CPU en gaming actúa principalmente como "alimentador de la GPU" y recibe el 28%. La RAM y el almacenamiento son componentes donde gastar más rinde pocos beneficios en juego, por lo que tienen pesos bajos.

**Workstation GPU** (renderizado 3D, machine learning con GPU): la GPU sigue siendo importante (32%), pero la RAM sube al 18% porque estos flujos de trabajo necesitan grandes cantidades de memoria del sistema para los datos que la GPU no puede mantener en VRAM. La CPU recibe el 25%.

**Workstation CPU** (compilación, simulación, tareas multi-hilo): aquí no se incluye GPU dedicada (`gpu: 0`). La CPU recibe el peso más alto de todos los casos (38%) para primar núcleos y frecuencia. La RAM recibe el 28% porque compilar proyectos grandes o hacer renderizado en CPU requiere mucha memoria. El almacenamiento recibe el 12% para discos NVMe rápidos.

**Office** (uso general, ofimática, navegación): sin GPU dedicada, distribución más equilibrada entre CPU y RAM, con especial atención al almacenamiento (18%) porque en equipos de oficina los discos lentos son el mayor cuello de botella del día a día.

### Invariante de los pesos

Cada fila de la tabla suma exactamente 1.0:
- gaming: 0.28 + 0.38 + 0.08 + 0.07 + 0.09 + 0.06 + 0.04 = **1.00** ✓
- workstation_gpu: 0.25 + 0.32 + 0.18 + 0.09 + 0.08 + 0.05 + 0.03 = **1.00** ✓
- workstation_cpu: 0.38 + 0 + 0.28 + 0.12 + 0.10 + 0.07 + 0.05 = **1.00** ✓
- office: 0.30 + 0 + 0.22 + 0.18 + 0.14 + 0.10 + 0.06 = **1.00** ✓

Esta propiedad es esencial: garantiza que si todos los componentes se eligieran exactamente a su precio objetivo, el total exactamente igualaría el tierBudget (con diferencias mínimas por los `Math.floor`).

---

## Fase 4: Selección secuencial con `pickBest`

La función `tryBuildForTier` selecciona los componentes **en orden secuencial**, no en paralelo. Esto es deliberado: cada elección depende de la anterior (la placa base debe ser compatible con el socket del procesador elegido; la RAM debe ser DDR4 o DDR5 según la placa; etc.) y el presupuesto restante va reduciéndose con cada pick.

### El algoritmo `pickBest`

```typescript
function pickBest<T extends { priceCents: number }>(
  items: T[],
  targetCents: number,  // precio objetivo (fracción del tierBudget)
  hardMax: number,      // techo duro: lo máximo que se puede gastar en este componente
): T | undefined
```

El algoritmo tiene tres resultados posibles, evaluados en orden de prioridad:

**Resultado 1 — Hay productos por debajo del precio objetivo y del techo duro:**
Se elige el más caro de ellos. Esta es la estrategia "mejor calidad dentro del presupuesto asignado". Si el objetivo es 280€ y hay CPUs a 150€, 220€ y 260€, se elige la de 260€ porque es la mejor que cabe.

**Resultado 2 — No hay nada por debajo del objetivo, pero sí hay productos por debajo del techo duro:**
Se elige el más barato de los que superan el objetivo. Esto minimiza el sobregasto. Si el objetivo era 280€ pero el más barato disponible cuesta 320€, se elige ese en lugar de uno de 450€. La diferencia (40€ en lugar de 170€) afecta menos al presupuesto de componentes posteriores.

**Resultado 3 — No hay nada por debajo del techo duro:**
Se devuelve `undefined`. El tier falla en este punto y `tryBuildForTier` retorna `null`. El tier no produce ninguna build.

### ¿Por qué no simplemente el más cercano en precio?

El algoritmo anterior a `pickBest` era `pickClosest`, que elegía el componente con precio más próximo al objetivo en cualquier dirección. El problema es este ejemplo concreto:

- Objetivo: 420€
- Opciones disponibles: CPU a 300€ y CPU a 520€
- `pickClosest` escoge 520€ (diferencia de 100€) en lugar de 300€ (diferencia de 120€)

El resultado es que se gasta 100€ más de lo previsto en la CPU, reduciendo el presupuesto disponible para GPU, RAM y otros componentes. En el peor caso, esta cadena de sobregastos lleva a que el precio total supere el `tierBudget` y el tier entero se descarte.

Con `pickBest`, el ejemplo anterior produce 300€ (el mejor precio por debajo del objetivo), preservando los 120€ para los demás componentes.

### El techo dinámico `hardMax`

El `hardMax` se calcula dinámicamente antes de cada pick:

```
hardMax_CPU = tierBudget - minPrecio(MB) - minPrecio(RAM) - minPrecio(almacenamiento)
              - minPrecio(GPU) - minPrecio(caja) - minPrecio(fuente)
```

Es decir: lo máximo que se puede gastar en la CPU es el presupuesto total menos el precio mínimo posible de todos los demás componentes. Si la CPU costara más que ese `hardMax`, no quedaría dinero suficiente ni para las opciones más baratas del resto de componentes.

Tras cada pick, el presupuesto restante se reduce:

```typescript
let remaining = tierBudget;

const cpu = pickBest(cpus, cpuBudget, remaining - minMB - minRAM - minStorage - minGPU - minCase - minPSU);
remaining -= cpu.priceCents;

const mb = pickBest(compatMbs, mbBudget, remaining - minRAM - minStorage - minGPU - minCase - minPSU);
remaining -= mb.priceCents;

// ... y así sucesivamente
```

Este seguimiento dinámico hace que el `hardMax` de cada componente se ajuste al gasto real realizado hasta el momento, no al target teórico. Si el CPU costó 50€ menos de lo planificado, ese dinero extra está disponible para los siguientes componentes.

---

## Fase 5: Deduplicación de tiers

Cuando los tres tiers se generan correctamente, puede ocurrir que dos tiers diferentes elijan el mismo procesador. Esto pasa cuando el catálogo de CPUs es reducido (por ejemplo, si el usuario filtró a una sola marca) y el componente más apropiado para el 50% y el 75% del presupuesto resulta ser el mismo.

Presentar el mismo procesador en dos builds distintas sería confuso para el usuario. La deduplicación resuelve esto:

```typescript
// Se procesa en orden inverso (premium primero) para que el tier más alto "gane"
const seenCpuIds = new Set<string>();
const results = rawResults
  .slice()
  .reverse()   // premium → mid → budget
  .filter((r) => {
    const cpuId = r.build.cpu?.id;
    if (!cpuId || seenCpuIds.has(cpuId)) return false;
    seenCpuIds.add(cpuId);
    return true;
  })
  .reverse();  // restaura el orden budget → mid → premium
```

El tier premium siempre "gana" en caso de conflicto porque ofrece más valor al usuario. Si el mismo CPU aparece en mid y premium, se elimina el build de mid y se mantiene el de premium.

---

## Fase 6: Validación final

Antes de devolver cualquier build, esta pasa por `evaluateBuildCompatibility()` (ver `lib/compatibility.ts`). Esta función:

1. Verifica las 5 restricciones de compatibilidad física.
2. Suma los `priceCents` reales de todos los componentes seleccionados.

El motor aplica dos comprobaciones sobre el resultado:

```typescript
if (!report.isCompatible) return null;
if (report.totalPriceCents > tierBudget) return null;
```

El segundo check es la **red de seguridad definitiva**. Incluso si el algoritmo `pickBest` con sus `hardMax` dinámicos filló en algún caso extremo (por ejemplo, cuando los `minPrecio` eran subestimaciones de los precios de sus pools filtrados), el precio total calculado a partir de los productos reales eligidos nunca puede superar el `tierBudget`.

---

## Orden de selección y por qué importa

El orden en que se seleccionan los componentes no es arbitrario:

1. **CPU primero**: determina el socket, que filtra las placas base disponibles.
2. **Placa base**: determina el tipo de memoria (DDR4/DDR5) y si hay slots M.2.
3. **RAM**: filtrada por tipo de memoria de la placa.
4. **Almacenamiento**: preferencia NVMe si hay slots M.2; fallback a SATA.
5. **GPU**: opcional, según el caso de uso. Solo después de RAM y storage porque son componentes de precio fijo por especificación.
6. **Caja**: filtrada por los factores de forma que soporta vs. el factor de forma de la placa.
7. **Fuente de alimentación**: filtrada por vatios mínimos (130% del TDP estimado), luego seleccionada por precio dentro del presupuesto restante.

La fuente siempre es la última porque su precio mínimo se conoce también en el paso de `hardMax`, pero su selección depende del TDP real de CPU + GPU elegidos, que no se conoce hasta que ambos están seleccionados.

---

## Casos extremos y comportamiento documentado

### El presupuesto es tan bajo que ningún tier puede generar una build válida

`generateBuilds` devuelve un array vacío. El orquestador `rag.ts` formatea esto como un mensaje al usuario indicando que el presupuesto es insuficiente para el catálogo disponible.

### Solo hay un procesador en stock que cumpla los filtros

Los tres tiers intentarán elegirlo. Los tres tendrán el mismo `cpuId` después de la deduplicación. El resultado final será una sola build: la del tier más alto que haya podido generar una configuración compatible.

### Un tier tiene un presupuesto tan bajo que el `hardMax` del CPU resulta negativo

Si la suma de los precios mínimos de todo lo demás ya supera el tierBudget, el `hardMax` del CPU será negativo. `pickBest` filtrará `items.filter(i => i.priceCents <= hardMax)` y obtendrá un array vacío, devolviendo `undefined`. El tier falla inmediatamente sin llegar a hacer más cálculos.

### La fuente más barata con los vatios requeridos supera el presupuesto restante

`pickBest(compatPsus, psuBudget, remaining)` no encontrará nada dentro del `remaining` y devolverá `undefined`. El tier falla. Esto puede ocurrir con CPUs de muy alto TDP en builds de presupuesto ajustado; en esos casos el motor no puede generar ese tier.
