# Compatibilidad y validación — `lib/compatibility.ts`

## ¿Qué es la capa de compatibilidad?

La capa de compatibilidad es la última barrera de calidad del sistema. Después de que el motor de builds ha seleccionado los componentes más adecuados para un tier, se invoca `evaluateBuildCompatibility()` para verificar que la combinación elegida es técnicamente viable.

Esta función es completamente pura: recibe una selección de componentes y devuelve un informe de compatibilidad. No consulta la base de datos, no llama a ningún servicio externo, no tiene efectos secundarios. Dado el mismo input, siempre devuelve el mismo output. Esto la hace fácilmente testeable y completamente predecible.

---

## La firma de la función

```typescript
function evaluateBuildCompatibility(selection: PcBuildSelection): CompatibilityReport
```

**Entrada:** `PcBuildSelection`, que es un objeto con referencias opcionales a cada tipo de componente:

```typescript
interface PcBuildSelection {
  cpu?:         CpuProduct;
  motherboard?: MotherboardProduct;
  memory?:      MemoryProduct;
  storage?:     StorageProduct;
  gpu?:         GpuProduct;
  psu?:         PsuProduct;
  case?:        CaseProduct;
}
```

Los campos son opcionales porque la función también se usa en el PC Builder manual, donde el usuario puede tener seleccionados solo algunos componentes. El validador verifica solo las restricciones que involucran componentes que están presentes.

**Salida:** `CompatibilityReport`, que contiene:

```typescript
interface CompatibilityReport {
  checks:               CompatibilityCheck[];  // lista de verificaciones con resultado
  totalPriceCents:      number;                // suma real de precios de componentes presentes
  estimatedPowerWatts:  number;                // consumo estimado del sistema
  isCompatible:         boolean;               // true si todas las verificaciones pasaron
}
```

Cada elemento de `checks` describe una verificación individual:

```typescript
interface CompatibilityCheck {
  label:  string;   // nombre legible de la verificación
  ok:     boolean;  // resultado
  detail: string;   // explicación en español del resultado
}
```

---

## Las cinco verificaciones de compatibilidad

### Verificación 1: Socket CPU ↔ Placa base

```
Condición: cpu.socket === motherboard.socket
```

El socket es el conector físico entre la CPU y la placa base. Los sockets modernos más comunes son:

- **AM4** (AMD Ryzen gen 3/4/5): anclaje mecánico con 1331 pines en la placa.
- **AM5** (AMD Ryzen gen 7/8/9): migración al estándar LGA, 1718 contactos en placa.
- **LGA1700** (Intel gen 12/13/14): 1700 contactos en placa.

Una CPU AM5 físicamente no puede montarse en una placa AM4. No es cuestión de configuración ni drivers: los conectores son diferentes.

**Ejemplo de mensaje si falla:**
```
"CPU AM5 vs placa AM4"
```

### Verificación 2: Tipo de memoria RAM ↔ Placa base

```
Condición: memory.memoryType === motherboard.memoryType
```

DDR4 y DDR5 son físicamente incompatibles. Los módulos tienen una muesca (key) en posiciones distintas que impide montar el tipo incorrecto en el slot. Además, los controladores de memoria en CPU son diferentes para cada generación.

Las placas AM4 usan exclusivamente DDR4. Las placas AM5 usan exclusivamente DDR5. Las placas Intel LGA1700 de gen 12 admitiían ambas (según modelo), pero en LGA1700 gen 13/14 la mayoría son DDR5 exclusivamente.

**Ejemplo de mensaje si falla:**
```
"RAM DDR5 vs placa DDR4"
```

### Verificación 3: Interfaz de almacenamiento ↔ Placa base

```
Condición:
  si storage.interface === "M2_NVME" → motherboard.m2Slots > 0
  si storage.interface === "SATA"    → motherboard.sataPorts > 0
```

Los discos NVMe M.2 requieren que la placa base tenga al menos un slot M.2 físico (el conector B+M Key de 80mm). No todas las placas de entrada tienen estos slots, especialmente en factores de forma Mini-ITX de bajo coste.

Los discos SATA (tanto SSD de 2.5" como HDD de 3.5") se conectan mediante el protocolo SATA, que requiere puertos SATA en la placa. Las placas modernas suelen tener 4-6 puertos SATA, pero algunas placas de gama muy entrada tienen solo 2.

**Ejemplo de mensaje si falla:**
```
"La placa no soporta M2_NVME"
```

### Verificación 4: Factor de forma de la placa ↔ Torre

```
Condición: case.supportedFormFactors.includes(motherboard.formFactor)
```

El factor de forma define las dimensiones físicas y la distribución de los orificios de montaje de una placa base. Los factores de forma estándar son:

| Factor de forma | Dimensiones | Descripción |
|---|---|---|
| Mini-ITX | 170 × 170 mm | Muy compacto, 2 slots RAM, 1 slot PCIe |
| mATX (Micro-ATX) | 244 × 244 mm | Compacto, 4 slots RAM, 2-3 slots PCIe |
| ATX | 305 × 244 mm | Estándar, 4 slots RAM, 4-7 slots PCIe |
| E-ATX | 305 × 330 mm | Extendido, workstations, 8 slots RAM |
| XL-ATX | 345 × 262 mm | Muy grande, servidores y workstations extremas |

Una placa ATX no cabe en una torre Mini-ITX (sus dimensiones son más del doble). Una placa Mini-ITX cabe en la mayoría de torres, pero desperdiciaría el espacio de una torre Full Tower.

Las torres diseñadas para ATX suelen admitir también mATX y Mini-ITX (las placas más pequeñas siempre caben en torres más grandes). Las torres más pequeñas solo admiten su factor de forma o inferiores.

**Ejemplo de mensaje si falla:**
```
"La torre no soporta ATX"
```

### Verificación 5: Potencia de la fuente ↔ Consumo del sistema

```
Condición: psu.wattage >= Math.ceil(estimatedPowerWatts × 1.3)
```

La fuente de alimentación debe tener suficiente potencia para alimentar el sistema completo con margen de seguridad. El margen del 30% (factor 1.3) sirve para:

1. **Eficiencia bajo carga**: las fuentes operan con menos eficiencia cuando están cerca de su límite máximo. Operar al 70-80% de la capacidad maximiza la eficiencia en el rango del "80+ Gold" de eficiencia.
2. **Picos de consumo**: algunos componentes (especialmente GPUs y CPUs con boost) tienen picos de consumo muy por encima del TDP nominal durante fracciones de segundo. La fuente debe absorber esos picos sin disparar las protecciones OCP/OVP.
3. **Degradación con el tiempo**: la capacidad real de una fuente disminuye con el uso. Una fuente con margen del 30% al inicio de su vida seguirá siendo suficiente años después.

El consumo estimado se calcula de la siguiente forma:

```typescript
const estimatedPowerWatts =
  (cpu.tdpWatts ?? 0)          // TDP nominal de la CPU
  + (gpu.tdpWatts ?? 0)        // TDP nominal de la GPU (0 si no hay GPU dedicada)
  + (motherboard ? 60 : 0)     // consumo fijo estimado de la placa base
  + (memory ? 10 : 0)          // consumo estimado de los módulos de RAM
  + (storage ? 10 : 0);        // consumo estimado del almacenamiento
```

Los valores fijos (60W para la placa, 10W para RAM, 10W para almacenamiento) son estimaciones conservadoras basadas en consumos típicos de hardware moderno. La placa base es la estimación más variable: una placa de gama alta con VRM robusto puede consumir 80-100W, mientras una de entrada consume 30-40W. La estimación de 60W es moderadamente conservadora.

**Ejemplo de mensaje si pasa:**
```
"850W para consumo estimado 550W"
```

**Ejemplo de mensaje si falla:**
```
"Recomendado 720W y tienes 550W"
```

---

## El campo `isCompatible`

```typescript
const isCompatible = checks.length === 0 || checks.every((check) => check.ok);
```

La condición `checks.length === 0` merece explicación. Si la selección no tiene ningún par de componentes que active ninguna verificación (por ejemplo, en el PC Builder donde el usuario solo ha seleccionado una CPU y nada más), no se genera ninguna verificación y el build se considera "compatible" en ese estado parcial. Esto es correcto: no hay nada que verificar todavía.

Cuando el motor de builds llama a esta función, el build siempre tiene todos los componentes seleccionados, por lo que `checks.length > 0` siempre y `isCompatible` refleja el resultado real.

---

## El cálculo de precio total

```typescript
const totalPriceCents = Object.values(selection).reduce(
  (sum, product) => sum + (product?.priceCents ?? 0),
  0,
);
```

Esta suma es la **fuente de verdad sobre el precio total de la build**. Es importante entender que:

1. Usa los `priceCents` reales de los objetos de producto que vienen de la base de datos, no los targets calculados por el motor.
2. Funciona con builds parciales (productos ausentes contribuyen 0 al total).
3. Esta es la cifra que el motor compara contra `tierBudget` para decidir si la build es válida.

El resultado de esta suma es también el precio que se muestra al usuario, garantizando que lo que ve es exactamente lo que pagaría si añadiera todos los componentes al carrito.

---

## Integración con el PC Builder manual

El PC Builder (`components/pc-builder.tsx`) permite al usuario seleccionar componentes manualmente, uno a uno, para construir su propia configuración. La capa de compatibilidad también se usa aquí, y el comportamiento de verificaciones parciales cobra todo su sentido.

Cuando el usuario tiene seleccionada solo la CPU y la placa base:
- Se verifica el socket (hay CPU y MB presentes).
- **No** se verifica el tipo de memoria (no hay RAM seleccionada todavía).
- **No** se verifica la interfaz de almacenamiento (no hay disco seleccionado).
- `isCompatible` es `true` si el socket coincide.

Esto permite mostrar al usuario feedback en tiempo real sobre cada par de componentes que elige, sin marcar la build como "incompatible" por componentes que aún no ha seleccionado.

---

## ¿Por qué no más verificaciones?

El sistema verifica actualmente las 5 restricciones más comunes e importantes. Algunas restricciones adicionales que podrían añadirse en el futuro:

**Compatibilidad de velocidad de RAM**: una placa puede soportar DDR5 hasta 5600 MHz, pero si el usuario elige RAM de 7200 MHz, funcionará rebajada al máximo de la placa. No es incompatible, es subóptimo. Esta verificación podría añadirse como "advertencia" (ok: true pero con mensaje informativo).

**Compatibilidad de disipador CPU**: algunos procesadores de gama alta (TDP > 150W) requieren disipadores de alto rendimiento. Sin un componente "cooler" en el esquema actual, esta verificación no es posible. Añadir la categoría "cooler" al sistema habilitaría esta verificación.

**Número de módulos de RAM**: algunas placas mini-ITX solo tienen 2 slots de RAM. Si el usuario elige un kit de 4 módulos, no caben. La verificación requeriría comparar `memory.modules` con el número de slots de la placa (no actualmente almacenado en el schema).

**Restricciones de PCIe para GPUs**: las GPUs modernas necesitan ranura PCIe x16. Las placas mini-ITX tienen solo una ranura PCIe x16, lo que limita a una GPU. Las placas mATX tienen 2-3 ranuras pero la segunda suele ser x4 en ancho de banda. Esta verificación es complicada porque depende de la topología PCIe específica de cada placa, no solo de la cantidad de ranuras.

Estas verificaciones adicionales no se implementan actualmente porque el catálogo de la tienda no incluye los datos necesarios (número de slots RAM en la placa, slots PCIe detallados, etc.) y añadirlos requeriría enriquecer el schema de Prisma y el proceso de seed. La arquitectura existente soporta añadirlos sin cambios estructurales.
