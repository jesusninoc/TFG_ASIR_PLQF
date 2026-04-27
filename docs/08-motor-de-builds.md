# 08 - Motor de builds

## Proposito

El motor de builds es la pieza mas importante de la promesa tecnica de PC Selector. Su responsabilidad es generar configuraciones completas a partir de presupuesto, uso, preferencias y stock real. Vive en `lib/build-engine.ts` y se apoya en `lib/compatibility.ts`.

La decision central es que el motor sea determinista. Dado el mismo catalogo y los mismos filtros, debe devolver el mismo resultado. No usa aleatoriedad ni delega seleccion de componentes al LLM. Esto hace que el resultado sea auditable.

## Entrada

La funcion principal `generateBuilds(filters)` recibe `BuildFilters`: presupuesto en centimos, caso de uso, marcas preferidas, marcas excluidas, specs minimas, GPU dedicada y factor de forma. El presupuesto se expresa en centimos por consistencia con Stripe y para evitar decimales.

El caso de uso modifica pesos. No es lo mismo gaming que oficina. Esta distincion evita builds formalmente compatibles pero mal repartidas.

## Consulta de stock

El motor consulta productos por categoria usando Prisma. Solo considera stock mayor que cero. Esta regla es innegociable: recomendar algo que no se puede comprar rompe la confianza.

Las consultas pueden aplicar filtros de marca y specs. Despues los resultados se convierten a tipos de dominio. El motor no trabaja con registros Prisma crudos cuando necesita razonar sobre sockets, TDP o factores de forma.

## Tiers

El motor intenta generar hasta tres opciones: `budget`, `mid` y `premium`. Cada tier usa un porcentaje del presupuesto declarado. La opcion premium no usa el 100%, sino un margen de seguridad. Esta decision evita que redondeos, disponibilidad o picks ligeramente superiores empujen la build por encima del limite.

Ofrecer tres tiers tiene valor de producto. El usuario no siempre quiere gastar todo. Mostrar una opcion mas contenida y otra mas ambiciosa permite comparar coste marginal y rendimiento esperado.

## Pesos por caso de uso

Los pesos reparten presupuesto entre CPU, GPU, RAM, almacenamiento, placa, fuente y caja. En gaming, la GPU recibe mas peso. En workstation CPU, el procesador y la RAM ganan relevancia. En oficina, la GPU puede ser cero.

Estos pesos son conocimiento de dominio codificado. No viven en prompts porque afectan a decisiones economicas. Si se ajustan, debe hacerse en codigo, con pruebas y documentacion.

## `pickBest`

`pickBest` elige el componente mas caro por debajo del objetivo y del `hardMax`. Si no hay ninguno por debajo del objetivo, elige el mas barato que quepa bajo `hardMax`. Si no hay nada que quepa, el tier falla.

Esta logica evita un problema comun: elegir "el mas cercano" puede seleccionar un componente por encima del objetivo y agotar presupuesto necesario para otros. `pickBest` prefiere preservar presupuesto salvo que no haya alternativa viable.

## `hardMax` dinamico

Antes de cada componente, el motor calcula cuanto puede gastar como maximo dejando dinero para los minimos de los componentes restantes. Esta tecnica evita que una CPU cara impida comprar placa, RAM o fuente.

El `hardMax` es una defensa temprana, no la garantia final. Puede usar minimos globales que subestimen el coste real despues de aplicar compatibilidad. Por eso el motor valida el total al final.

## Orden de seleccion

El orden importa:

1. CPU define socket.
2. Placa define memoria, slots y formato.
3. RAM depende de placa.
4. Almacenamiento depende de M.2/SATA.
5. GPU depende de caso de uso.
6. Caja depende de formato de placa.
7. Fuente depende del consumo final.

Elegir fuente antes de GPU seria prematuro. Elegir placa antes de CPU podria producir sockets incompatibles. El orden codifica dependencias tecnicas.

## Compatibilidad final

Cada build pasa por `evaluateBuildCompatibility`. Se revisan socket, memoria, almacenamiento, factor de forma y potencia de fuente. Tambien se calcula precio total real.

El motor descarta cualquier build incompatible o cuyo total supere el presupuesto del tier. Esta es la red de seguridad definitiva. Aunque una heuristica anterior falle, la build no llega al usuario si no pasa esta validacion.

## Deduplicacion

Si varios tiers terminan con la misma CPU, el motor puede deduplicar para evitar resultados confusos. En catalogos pequeños, es normal que opciones distintas converjan en un mismo componente. Presentar tres builds casi identicas daria una falsa sensacion de variedad.

## Relacion con el asistente

El asistente no genera builds directamente. Llama a una herramienta que ejecuta el motor. Esto permite que el usuario use lenguaje natural sin sacrificar correccion tecnica.

## Alternativas descartadas

La alternativa mas obvia era que el LLM eligiera componentes. Se descarta porque no garantiza stock, precio, compatibilidad ni reproducibilidad. Otra alternativa era optimizacion combinatoria exhaustiva. Podria encontrar combinaciones mejores, pero aumentaria coste y complejidad. Para 1.0, heuristicas deterministas con validacion final ofrecen un equilibrio razonable.

## Futuro

El motor puede evolucionar con nuevas categorias, scoring multicriterio, benchmarks, consumo mas preciso, warnings y optimizacion por rendimiento esperado. Cada mejora debe conservar la propiedad fundamental: las builds presentadas deben ser verificables.
