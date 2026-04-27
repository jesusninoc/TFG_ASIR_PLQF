# 12 - Testing y calidad

## Filosofia

La estrategia de calidad de PC Selector 1.0 es pragmatica. No intenta cubrir cada render con snapshots, sino proteger contratos que, si se rompen, dañan el producto: paginas corporativas, header, asistente, schemas, herramientas, build cards, sanitizacion y orquestador.

El proyecto usa `node:test`, `assert`, `tsx`, ESLint y TypeScript. Las pruebas son ligeras y rapidas, adecuadas para una base en crecimiento.

## Pruebas existentes

Hay tests en:

- `components/__tests__/company-pages_test.ts`
- `components/__tests__/design-system-shell_test.ts`
- `components/__tests__/build-card_test.tsx`
- `lib/assistant/__tests__/...`
- `lib/agent/__tests__/agent-config_test.ts`
- `lib/__tests__/sanitizer_test.ts`

Estas pruebas mezclan lectura estatica de archivos, validacion de schemas y comportamiento de funciones. Aunque algunas no son pruebas de UI completas, cumplen un papel util: detectar regresiones de estructura.

## Tests de documentacion editorial

La prueba de paginas corporativas verifica que existan `/about`, `/contact`, `/privacy`, `/terms` y que los parrafos tengan profundidad editorial minima. Es inusual probar longitud de copy, pero aqui responde a un requisito de producto: las paginas no debian quedarse en parrafos de linea y media.

Esto ilustra una idea importante: no todo test debe ser puramente tecnico. Si un requisito editorial es importante, puede protegerse.

## Tests del asistente

Las pruebas del asistente cubren schemas, orquestador, ruta, tool registry, loading messages y LLM. Tambien se añadio una prueba estatica para garantizar persistencia de conversacion durante navegaciones de filtros.

La persistencia del chat se probo porque resolvia un bug concreto. Este es buen criterio: cuando un bug aparece en producto, se añade una prueba que exprese su causa.

## Lint y TypeScript

`npm run lint` ejecuta ESLint. `npx tsc --noEmit` comprueba tipos. Aunque no esten ambos en scripts de package, se usan como verificacion manual.

TypeScript es especialmente valioso en `lib/types`, asistente, tools y checkout. El dominio tiene muchos contratos y union types; un cambio sin typecheck puede romper lejos del archivo editado.

## Limitaciones

La suite no cubre aun flujos end-to-end con navegador. No hay Playwright. Tampoco hay pruebas de integracion reales con Stripe, ni tests contra una base PostgreSQL temporal para checkout y motor.

El motor de builds deberia tener mas pruebas deterministas: presupuestos bajos, filtros de marca, incompatibilidades, deduplicacion y casos sin stock. La compatibilidad deberia probar cada check.

## Calidad de IA

Probar IA es distinto. No basta con snapshots de texto. Lo importante es contrato: la respuesta normalizada debe tener forma valida, las herramientas deben ejecutarse con parametros seguros y el sistema debe fallar de forma recuperable.

En futuras versiones, conviene añadir evaluaciones: prompts representativos, expected tool calls, comparativas de calidad y latencia. Estas pruebas pueden ser semiautomaticas.

## Smoke tests

El script `scripts/smoke-assistant.ts` sugiere una direccion para pruebas de humo. Un smoke test no demuestra correccion formal, pero detecta fallos groseros de configuracion.

## Criterio de aceptacion 1.0

Antes de declarar una version sana:

1. `npm run lint` debe pasar.
2. `npx tsc --noEmit` debe pasar.
3. Tests especificos con `npx tsx --test ...` deben pasar.
4. El flujo manual home -> shop -> carrito -> checkout debe revisarse.
5. El asistente debe responder una consulta de catalogo y una build.
6. El webhook debe verificarse en local o entorno de pruebas.

## Futuro

La siguiente mejora de calidad deberia ser Playwright para flujos criticos: filtros sin perder chat, añadir producto al carrito, cargar build desde IA, checkout redirect y paginas legales. Despues, tests de integracion con DB efimera.
