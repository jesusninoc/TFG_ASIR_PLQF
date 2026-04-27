# 06 - PC Builder

## Funcion del builder

El PC Builder es la herramienta donde el usuario convierte catalogo en configuracion. A diferencia de la tienda, que muestra productos independientes, el builder trabaja con relaciones: CPU con placa, placa con memoria, placa con almacenamiento, placa con caja, CPU/GPU con fuente.

`components/pc-builder.tsx` es un Client Component porque necesita estado local, interaccion por pasos, feedback inmediato y lectura de selecciones sugeridas por IA. Esta decision es natural: un builder manual es una aplicacion dentro de la tienda.

## Pasos

El builder define siete pasos:

1. Procesador.
2. Placa base.
3. Memoria RAM.
4. Almacenamiento.
5. Tarjeta grafica.
6. Fuente de poder.
7. Torre.

GPU y torre aparecen como opcionales en la UI. La opcionalidad responde a casos de uso: un equipo de oficina puede no necesitar GPU dedicada; una configuracion parcial puede no requerir elegir torre al principio. Aun asi, el motor de builds completos suele intentar seleccionar todas las categorias cuando genera una build comprable.

## Carga de productos

El builder llama a `/api/products/by-type`. Esto evita incrustar productos en HTML de la pagina y permite recargar datos si cambian. El resultado se guarda en `productsByType`.

El estado de carga y error se maneja en cliente. Si falla la API, el builder puede mostrar error sin romper toda la aplicacion. Esta separacion es importante porque el builder es una funcionalidad interactiva, no una pagina estatica.

## Compatibilidad progresiva

La funcion `isCompatible` del builder aplica reglas contextuales antes de que se seleccione toda la build. Por ejemplo:

- Una placa se considera compatible si su socket coincide con la CPU seleccionada.
- Una RAM se considera compatible si su tipo coincide con la placa.
- Un almacenamiento NVMe requiere slots M.2.
- Una caja debe soportar el factor de forma de la placa.

Esto no sustituye a `evaluateBuildCompatibility`; lo complementa. La UI usa compatibilidad progresiva para orientar. El validador formal calcula el informe completo y precio.

## Feedback al usuario

El builder no debe castigar al usuario por no haber completado todos los pasos. Una build parcial puede ser "compatible" en lo que ya se puede comprobar. Por eso `evaluateBuildCompatibility` solo emite checks cuando los componentes necesarios estan presentes.

Este diseño permite aprender mientras se construye. Si el usuario elige CPU AM5, vera primero placas AM5. Si elige una placa DDR5, la memoria DDR5 cobra prioridad. La herramienta enseña reglas sin convertirlas en texto explicativo permanente.

## Transferencia desde IA

Uno de los flujos mas importantes es pasar de Chipi al builder. Cuando el asistente genera una build, el usuario puede cargarla. El sistema no intenta serializar productos completos ni pasar estado por query string. Usa claves en `localStorage`:

- `AI_SUGGESTED_FULL_BUILD_KEY`
- `AI_SUGGESTED_PARTIAL_SELECTION_KEY`

El asistente guarda ids normalizados, emite `AI_BUILDER_LOAD_EVENT` y navega a `/builder`. El builder lee esos ids, busca los productos correspondientes en `productsByType`, reconstruye la seleccion y limpia las claves.

Esta estrategia tiene varias ventajas. Primero, mantiene URLs limpias. Segundo, evita exponer listas grandes de ids en query string. Tercero, desacopla el asistente de la estructura interna del estado React del builder. Cuarto, permite cargar selecciones parciales.

## Normalizacion

`builder-transfer.ts` normaliza ids de builds y selecciones parciales. Esta capa es necesaria porque las respuestas del asistente pueden venir con claves variadas o incompletas. La normalizacion evita que el builder tenga que defenderse de todas las formas posibles.

En arquitectura, esta es una frontera entre IA y UI. Las fronteras con IA siempre deben normalizar. Nunca conviene dejar que un objeto generado por modelo manipule directamente estado de aplicacion.

## Añadir al carrito

El builder usa `useStore` para añadir productos. Cuando una build esta seleccionada, puede incorporar componentes al carrito. El carrito sigue siendo cliente, pero el checkout validara de nuevo. Esto permite una experiencia rapida sin sacrificar seguridad economica.

## Decisiones descartadas

Una alternativa era hacer el builder servidor, con cada paso como navegacion. Eso habria simplificado la fuente de datos, pero destruiria la fluidez. Otra alternativa era filtrar cada paso en servidor segun seleccion actual. Seria mas escalable para catalogos enormes, pero mas complejo para 1.0.

El diseño actual carga todos los productos agrupados. Es razonable mientras el catalogo sea pequeño o medio. Si el catalogo crece, el builder deberia cambiar a carga incremental por paso.

## Riesgos

El builder actual no valida todas las restricciones fisicas imaginables. Tampoco modela cantidades multiples, disipadores, dimensiones de GPU o airflow. Estos riesgos estan documentados y deben resolverse con datos nuevos, no con inferencias aproximadas.

Otro riesgo es que `pc-builder.tsx` es un archivo grande. A medida que crezca, convendra extraer pasos, tarjetas, hooks de seleccion y helpers de compatibilidad. En 1.0 se mantiene junto para velocidad y claridad local, pero no deberia crecer indefinidamente.

## Criterio futuro

Cada nueva regla del builder debe responder a dos preguntas:

1. Tenemos datos estructurados para validarla?
2. Debe ser bloqueo duro, advertencia o simple ordenacion?

No toda restriccion merece bloquear una compra. Algunas, como RAM mas rapida que la soportada oficialmente, pueden ser advertencias. Otras, como socket incompatible, deben bloquearse.
