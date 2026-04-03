# Arquitectura general del sistema

## Introducción

PC Selector es una aplicación Next.js 15 que combina una tienda de hardware real (con stock en base de datos, carrito, pago con Stripe) con un asistente conversacional que recomienda configuraciones de PC completas adaptadas al presupuesto, caso de uso y preferencias del usuario.

La decisión de diseño más importante del proyecto es la **separación explícita entre la capa de comprensión del lenguaje (LLM) y la capa de toma de decisiones (motor determinista)**. Este documento explica esa separación y cómo todas las piezas encajan.

---

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  Usuario (navegador)                                                 │
│   ↓  texto libre en chat                                             │
│   ↑  respuesta formateada + opción de añadir al carrito              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP POST /api/assistant
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  API Route — app/api/assistant/route.ts                              │
│  • Recibe mensaje + historial de conversación                        │
│  • Delega en lib/rag.ts                                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Orquestador — lib/rag.ts                                            │
│  • Llama a parseIntent() para extraer intención estructurada         │
│  • Según el intent, ramifica:                                        │
│    - "build"   → llama a generateBuilds()                            │
│    - "clarify" → devuelve la pregunta de clarificación               │
│    - "faq"     → busca en tabla FAQ + productos de la BD             │
│    - "unknown" → mensaje de ayuda genérico                           │
│  • Recupera presupuesto del historial si el LLM devuelve 0           │
└────────────┬──────────────────────────┬────────────────────────────┘
             │                          │
             ▼                          ▼
┌────────────────────────┐   ┌─────────────────────────────────────────┐
│  lib/intent-parser.ts  │   │  lib/build-engine.ts                     │
│  CAPA LLM              │   │  MOTOR DETERMINISTA                       │
│                        │   │                                           │
│  • Convierte texto     │   │  • Consulta stock real (Prisma)           │
│    libre en JSON       │   │  • Aplica pesos por caso de uso           │
│    AssistantIntent     │   │  • Genera hasta 3 builds (budget/mid/    │
│  • Usa Ollama/Mistral  │   │    premium)                               │
│  • Valida con Zod      │   │  • pickBest + seguimiento de presupuesto  │
│  • NO toma decisiones  │   │  • Delega validación en compatibility.ts  │
│    de negocio          │   │  • NO usa IA                              │
└────────────────────────┘   └─────────────────────────────────────────┘
                                         │
                                         ▼
                             ┌─────────────────────────────────────────┐
                             │  lib/compatibility.ts                    │
                             │  VALIDADOR                                │
                             │                                           │
                             │  • Verifica socket CPU ↔ placa base       │
                             │  • Verifica tipo de RAM ↔ placa base      │
                             │  • Verifica interfaz almacenamiento        │
                             │  • Verifica factor de forma placa/torre    │
                             │  • Verifica potencia de la fuente          │
                             │  • Calcula precio real total               │
                             └─────────────────────────────────────────┘
```

---

## Descripción de cada capa

### 1. Interfaz de usuario — `components/ai-assistant.tsx`

El componente de chat mantiene el historial de conversación en estado local de React. Cada mensaje del usuario se envía a `/api/assistant` junto con el historial completo (hasta los últimos N mensajes). Las respuestas de tipo "build" se resumen en el historial para no enviar listas de componentes completas al LLM en cada turno, lo que reduciría el contexto útil y aumentaría la latencia.

### 2. API Route — `app/api/assistant/route.ts`

Punto de entrada HTTP. Recibe el cuerpo de la petición, extrae `question` y `history`, y los pasa al orquestador. No contiene lógica de negocio.

### 3. Orquestador — `lib/rag.ts`

Es el director de orquesta del sistema. Sus responsabilidades son:

- **Llamar al parser de intención** y recibir un objeto `AssistantIntent` tipado.
- **Recuperar el presupuesto del historial** si el LLM falla en el carry-forward (caso frecuente en conversaciones multi-turno). Usa una expresión regular sobre el historial de texto del usuario para detectar patrones como "1500€", "2k", "1.5k".
- **Ramificar según el intent**: la decisión de qué hacer (generar un build, hacer una pregunta, buscar en FAQ) es completamente determinista una vez que el intent está clasificado.
- **Invocar `generateBuilds()`** con los filtros parseados y formatear el resultado en texto legible.
- **Buscar en la tabla FAQ** cuando el intent es "faq", sin usar el LLM para esta búsqueda.

### 4. Parser de intención — `lib/intent-parser.ts`

Esta es la **única capa que usa el LLM**. Su único trabajo es convertir un mensaje de lenguaje natural en un objeto JSON estructurado de tipo `AssistantIntent`. Específicamente:

- Clasifica la intención del mensaje: `build`, `clarify`, `faq`, o `unknown`.
- Extrae filtros de build cuando corresponde: presupuesto, caso de uso, marcas preferidas, especificaciones mínimas.
- Genera una pregunta de clarificación cuando falta información esencial.
- Aplica context carry-forward: si en un turno anterior se estableció un presupuesto, lo copia al intent actual.

El LLM **no toma ninguna decisión de negocio**. No sabe qué componentes existen en stock, no sabe si AMD o Intel es mejor para el caso de uso, y no genera descripciones de productos. Sus respuestas son validadas con un schema Zod antes de usarse.

### 5. Motor de builds — `lib/build-engine.ts`

El corazón del sistema. Completamente determinista, sin ninguna dependencia de IA. Sus responsabilidades son:

- **Consultar el stock real** de la base de datos en paralelo para todas las categorías de componentes.
- **Aplicar filtros** de marca, especificaciones mínimas y caso de uso.
- **Intentar generar un build por cada tier** (budget al 50% del presupuesto, mid al 75%, premium al 95%).
- **Distribuir el presupuesto** de cada tier según tablas de pesos fijas por caso de uso.
- **Seleccionar el mejor componente** dentro del presupuesto asignado con `pickBest`, con seguimiento del presupuesto restante.
- **Deduplicar resultados** para evitar que dos tiers presenten el mismo procesador.
- **Delegar la validación final** en `compatibility.ts`.

### 6. Validador — `lib/compatibility.ts`

Capa pura de validación y cálculo. Recibe una selección completa de componentes y verifica:

1. Compatibilidad de socket entre CPU y placa base.
2. Compatibilidad de tipo de memoria (DDR4/DDR5) entre RAM y placa base.
3. Que la placa base tenga el puerto requerido por el almacenamiento (M.2 NVMe o SATA).
4. Que la torre soporte el factor de forma de la placa base.
5. Que la fuente de alimentación tenga vatios suficientes (consumo estimado × 1,3).

Si alguna verificación falla, el build se descarta. También calcula el precio total real sumando los `priceCents` de cada componente seleccionado, lo que sirve como verificación definitiva de presupuesto.

---

## Flujo completo de una petición de build

A continuación se describe, paso a paso, lo que ocurre cuando un usuario escribe "montadme una PC gamer por 1200€ con AMD":

```
1. El componente ai-assistant.tsx captura el texto y hace POST /api/assistant
   con { question: "montadme una PC gamer por 1200€ con AMD", history: [...] }

2. intent-parser.ts envía el texto a Ollama/Mistral con el system prompt
   que instruye a devolver SOLO JSON. El modelo devuelve:
   {
     "intent": "build",
     "buildFilters": {
       "budgetCents": 120000,
       "useCase": "gaming",
       "preferBrands": { "cpu": ["AMD"], "gpu": ["AMD"] },
       "requireDedicatedGpu": true
     }
   }
   Zod valida el JSON. Si la validación falla, se devuelve un intent "unknown".

3. rag.ts comprueba budgetCents > 0. Si fuera 0 aplicaría extractBudgetCentsFromHistory().

4. generateBuilds({ budgetCents: 120000, useCase: "gaming", ... }) es invocado.

5. build-engine.ts lanza 7 consultas Prisma en paralelo:
   CPUs AMD en stock, placas base en stock, RAMs en stock, etc.

6. Para cada tier ["budget", "mid", "premium"]:
   tierBudget = 120000 × [0.50, 0.75, 0.95] = [60000, 90000, 114000]
   
   Se llama a tryBuildForTier con ese tierBudget y los pesos gaming:
   { cpu: 0.28, gpu: 0.38, ram: 0.08, storage: 0.07, mb: 0.09, psu: 0.06, case: 0.04 }

7. Dentro de tryBuildForTier:
   - cpuBudget  = 60000 × 0.28 = 16800 céntimos = 168€ (tier budget)
   - Se precomputan los precios mínimos de todos los pools como floor de seguridad
   - CPU: pickBest(cpusAMD, 16800, remaining - minMB - minRAM - ...) → elige el mejor dentro de ~168€
   - remaining -= cpu.priceCents
   - Placa base compatible con el socket del CPU elegido
   - RAM compatible con el tipo de memoria de la placa
   - Almacenamiento preferiblemente NVMe si la placa tiene slot M.2
   - GPU AMD dentro de lo que queda
   - Torre compatible con el factor de forma de la placa
   - Fuente que supere el 130% del TDP estimado

8. compatibility.ts valida el build completo:
   - Socket OK, RAM OK, almacenamiento OK, torre OK, fuente OK
   - totalPriceCents = suma real de todos los componentes elegidos
   - Si totalPriceCents > tierBudget → se descarta el tier

9. Se deduplicación: si budget y mid eligieron el mismo procesador, se elimina la build de menor tier.

10. rag.ts formatea los builds en texto con precios formateados y devuelve la respuesta.

11. ai-assistant.tsx muestra el texto y el botón "Añadir al carrito".
```

---

## Principios de diseño que guían la arquitectura

### Separación total entre comprensión y decisión

El LLM comprende el lenguaje, el motor decide con datos reales. Ninguno invade el territorio del otro. Esta separación hace el sistema predecible, testeable y seguro.

### Stock real siempre

Los builds se generan a partir de lo que hay disponible en base de datos en ese momento. No hay catálogos estáticos ni alucinaciones de productos que no existen.

### Presupuesto como invariante dura

El usuario nunca se enfrenta a un build que exceda su presupuesto. Hay tres capas de protección: la distribución de pesos, el seguimiento de presupuesto restante en `pickBest`, y la verificación final con precio real en `compatibility.ts`.

### Fallar antes que mentir

Si para un tier no se puede construir una configuración válida dentro del presupuesto, ese tier simplemente no aparece. El sistema prefiere devolver 1 o 2 builds correctos antes que 3 builds con datos incorrectos.

### Sin estado compartido entre tiers

Cada tier se genera de forma independiente usando el mismo pool de componentes. La deduplicación se hace al final comparando IDs de CPU. Esto evita que la elección de un tier contamine las opciones de otro.
