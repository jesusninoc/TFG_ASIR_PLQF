# 05 - Catalogo y tienda

## Proposito

La tienda `/shop` es la superficie principal de exploracion. Permite buscar productos, filtrar por tipo, marca, precio y ordenar resultados. Aunque visualmente parezca una grilla sencilla, cumple una funcion arquitectonica importante: expone el catalogo real que despues usan el builder, el asistente y el checkout.

La decision de que `/shop` sea una pagina servidor responde a la naturaleza de los datos. Los productos, precios y stock no son estado local del usuario. Viven en base de datos. Renderizarlos en servidor reduce complejidad cliente y evita duplicar logica de filtrado.

## Filtros por query string

Los filtros se expresan como parametros:

- `q`: busqueda textual.
- `type`: tipo de componente.
- `brand`: marca.
- `min`: precio minimo.
- `max`: precio maximo.
- `sort`: orden.

Usar query string tiene ventajas concretas: una URL filtrada se puede compartir, recargar y abrir en otra pestaña. Tambien encaja con Server Components: `searchParams` llega al servidor, se convierte en condiciones Prisma y renderiza HTML actualizado.

La desventaja es que aplicar filtros implica navegacion. En 1.0 esto produjo un bug visible: si el usuario hablaba con Chipi y aplicaba un filtro, el chat podia perderse al reconstruirse el arbol cliente. La solucion correcta fue persistir la conversacion del asistente en `sessionStorage`, porque el problema era el estado efimero del chat, no el diseño de filtros.

## Consulta Prisma

`app/shop/page.tsx` hace tres consultas en paralelo:

1. Productos filtrados para la grilla.
2. Marcas distintas para el selector.
3. Tipos distintos para el selector.

La consulta de productos usa `where` condicional. Si no hay filtro, no añade condicion. Si hay `q`, busca en nombre, descripcion y marca. Si hay precio minimo o maximo, filtra `priceCents`. El orden se decide con `orderBy`.

La conversion final se hace con `dbProductsToTypes`. Esto evita que el componente de pagina conozca detalles internos de Prisma.

## Tipos y normalizacion

En la base, `ComponentType` usa mayusculas: `CPU`, `GPU`, `MEMORY`. En el dominio UI, muchos tipos se usan en minuscula: `cpu`, `gpu`, `memory`. Este desajuste es manejable siempre que se concentre en adaptadores. Es peligroso si cada componente inventa su propia conversion.

En `/shop`, `params.type` se convierte a uppercase para Prisma. Las opciones se muestran en minuscula. En futuras versiones podria añadirse una capa de labels humanos: "Procesadores", "Tarjetas graficas", "Memoria RAM". La decision de 1.0 prioriza funcionalidad sobre localizacion perfecta de cada enum.

## API `/api/products`

La ruta API de productos permite obtener catalogo filtrado desde cliente o herramientas. Valida tipo contra un conjunto permitido y aplica limites. Su existencia evita que cada consumidor cliente dependa de consultas servidor embebidas en paginas.

La diferencia entre `/shop` y `/api/products` es importante: `/shop` renderiza una experiencia; `/api/products` entrega datos. Mantener ambas separadas ayuda a que el asistente, builder o futuras vistas puedan consumir datos sin depender del HTML de tienda.

## API `/api/products/by-type`

El builder necesita productos agrupados por tipo. `/api/products/by-type` consulta todos los productos y los agrupa en `cpu`, `motherboard`, `memory`, `storage`, `gpu`, `psu`, `case`. Esta forma evita que el builder tenga que filtrar desde una lista plana cada vez.

El coste de enviar todos los productos al builder es aceptable en 1.0 por tamaño de catalogo. En una tienda real con miles de productos, habria que paginar, lazy-load por paso o filtrar en servidor segun seleccion previa.

## Producto individual

`/product/[slug]` sirve para inspeccion. Muestra informacion del producto, precio y productos relacionados. Tambien da contexto al asistente: cuando el usuario pregunta "esta grafica sirve para 4K?", el sistema puede incluir `currentProductId` o slug en el contexto.

Una pagina de producto no debe ser solo una ficha. En el diseño de PC Selector, es tambien una unidad contextual para el asistente. Esto justifica que `AiAssistant` envie `pathname` y `params` en cada pregunta.

## Relacion con el asistente

El catalogo no esta duplicado en el prompt. El asistente usa herramientas como `search_catalog` para consultar productos reales. Esta decision evita que el modelo invente stock o precios. Si el usuario pregunta por GPUs NVIDIA, la herramienta consulta la base y devuelve resultados estructurados.

El LLM puede redactar la explicacion, pero no debe inventar la lista. La tienda y el asistente comparten la misma fuente: Prisma.

## Relacion con checkout

Ver un producto en catalogo no garantiza que el cliente pueda manipular el precio. El checkout vuelve a consultar la base de datos y reconstruye line items con precios servidor. Esta repeticion es deliberada. El catalogo informa; el checkout autoriza.

## Decisiones descartadas

Una alternativa era filtrar completamente en cliente cargando todos los productos. Habria hecho la UI mas inmediata y evitado navegaciones, pero tambien enviaria mas datos y duplicaria logica. Para 1.0, query string + Server Component es mas transparente.

Otra alternativa era usar una solucion de busqueda externa. No merece la pena con el tamaño actual. PostgreSQL y Prisma bastan para busqueda simple. Cuando el catalogo crezca, se podra evaluar full-text search o buscadores especializados.

## Mejoras futuras

La tienda puede evolucionar con filtros mas ricos: socket, DDR4/DDR5, capacidad, TDP, VRAM, eficiencia, formato de placa. Para hacerlo bien, esos filtros deben apoyarse en specs estructuradas, no en texto libre.

Tambien se puede añadir paginacion, skeletons, estados de carga cliente, orden por popularidad y facets con conteos. La arquitectura actual permite esas mejoras, pero conviene introducirlas cuando el volumen de catalogo las justifique.
