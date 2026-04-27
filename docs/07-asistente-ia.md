# 07 - Asistente IA

## Identidad de Chipi

Chipi es el asistente conversacional de PC Selector. Su funcion no es sustituir al catalogo, al builder o al checkout, sino conectarlos mediante lenguaje natural. Un usuario puede preguntar por productos, pedir una build, revisar su carrito, consultar compatibilidad o solicitar navegacion.

El asistente se monta globalmente en `app/layout.tsx`, dentro de `StoreProvider`. Esto le permite acceder al carrito y estar disponible en cualquier pagina. Se abre desde el header mediante un evento de navegador definido en `assistant-events.ts`.

## Estado y persistencia

`AiAssistant` mantiene `open`, `messages`, `input`, `loading` y mensajes de carga. La conversacion se persiste en `sessionStorage` con una clave especifica. Esta decision se incorporo para resolver un bug real: al aplicar filtros en `/shop`, la navegacion podia reconstruir el componente y borrar el historial.

Se eligio `sessionStorage`, no `localStorage`, porque la conversacion debe sobrevivir a navegaciones dentro de la pestaña, pero no necesariamente convertirse en historial permanente entre sesiones. Es un compromiso razonable entre continuidad y privacidad.

El boton "Nueva conversacion" elimina la clave de mensajes y restablece el saludo inicial.

## Payload al servidor

Al enviar una pregunta, el asistente construye:

- `question`: texto actual.
- `history`: ultimos mensajes resumidos.
- `context`: pagina actual, slug si existe y carrito.

El historial se limita y se compacta para no enviar tarjetas completas o mensajes enormes. Si un mensaje de asistente contiene build, se resume como `[build tier]`. Si contiene componentes, se resume por cantidad. Esto reduce tokens y evita que el modelo reciba estructuras UI innecesarias.

## API `/api/assistant`

La API valida el payload con `AssistantRequestSchema`. Limita longitud, acepta `history` y compatibilidad con `messages`, normaliza personalidad a `educational` y aplica rate limit. Despues crea `AssistantOrchestrator`.

La API es una frontera de confianza. El cliente puede enviar texto arbitrario. El servidor debe validar antes de pasar datos al modelo o herramientas.

## Orquestador

`AssistantOrchestrator` implementa un bucle de herramientas. Construye mensajes iniciales, llama al LLM con `ASSISTANT_TOOLS`, ejecuta tool calls, devuelve resultados al modelo y repite hasta un maximo de rondas. Si el modelo no llama herramientas, se normaliza su contenido final.

Este diseño sustituye una arquitectura multi-agente mas rigida. En lugar de clasificar primero y delegar en agentes separados, el orquestador ofrece herramientas a un modelo con instrucciones claras. La ventaja es flexibilidad: una misma pregunta puede requerir catalogo, carrito y compatibilidad en varias rondas.

La contrapartida es que el prompt y los schemas deben ser estrictos. Por eso el system prompt exige JSON final y uso de tools cuando hacen falta datos reales.

## Herramientas

`ASSISTANT_TOOLS` incluye:

- `search_catalog`
- `generate_build`
- `lookup_faq`
- `get_order_status`
- `get_cart_contents`
- `get_current_page_context`
- `navigate_to_page`

El modelo decide pedir una herramienta, pero `ToolExecutor` ejecuta. Esta division importa: el LLM no accede directamente a Prisma ni al carrito. Solicita una accion declarada, con argumentos, y el executor aplica validacion, timeouts, retry y errores.

## Generacion de builds

Cuando el usuario pide configurar un PC, el asistente puede llamar `generate_build`. La herramienta delega en `generateBuilds`. El modelo no selecciona componentes uno a uno. Esta decision protege presupuesto, stock y compatibilidad.

El orquestador recoge builds generadas en `generatedBuilds` y, si la respuesta final no las incluye, las adjunta. Esto evita perder resultados estructurados si el modelo responde solo con texto.

## Normalizacion de respuesta

`normalizeAssistantResponse` convierte la salida del modelo en `AgentResponse`. En el cliente, `normalizeAgentResponse` tambien intenta rescatar JSON embebido si el modelo lo devolvio dentro de `answer`. Esta doble defensa existe porque los modelos no siempre obedecen formatos con precision perfecta.

La UI soporta tres salidas principales:

- Texto Markdown sanitizado.
- Tarjetas de builds.
- Tarjetas de componentes.

## Sanitizacion

El Markdown del asistente se convierte a HTML con `sanitizeMarkdown`. Esto es necesario porque se usa `dangerouslySetInnerHTML`. El sanitizer elimina scripts, iframes, handlers y `javascript:`. No se asume que el modelo sea seguro.

## Navegacion

El asistente puede sugerir navegacion. Si la respuesta incluye `navigation`, el cliente hace `router.push(path)` y cierra el panel. Para builders, puede guardar ids de build en `localStorage` antes de navegar.

Esta capacidad debe tratarse con cuidado. Solo deberia navegar a rutas internas conocidas. En futuras versiones conviene endurecer `navigate_to_page` con allowlist estricta.

## Errores y timeouts

El orquestador envuelve la ejecucion en `withTimeout`. Si excede el tiempo global, responde con un mensaje claro. Si el modelo devuelve respuesta vacia, se informa al usuario de forma recuperable. Los tool calls fallidos se registran y se devuelven como resultados de error al modelo, en lugar de romper todo el flujo.

## Por que no dejar que el modelo conteste sin herramientas

En un ecommerce, responder sin datos reales es peligroso. El modelo podria inventar stock, precio o pedido. Por eso el prompt ordena usar tools para datos de pagina, carrito, FAQ, precio, stock, producto, pedido y builds. El LLM redacta; las herramientas verifican.

## Evolucion

El asistente puede crecer con memoria de usuario, cuentas, preferencias persistentes, comparativas profundas y explicaciones mas visuales. Cada mejora debe mantener la frontera: los datos reales vienen de herramientas, las decisiones criticas vienen de codigo y el modelo traduce entre usuario y sistema.
