# 11 - Seguridad, validacion y resiliencia

## Enfoque

PC Selector 1.0 no es una aplicacion bancaria, pero maneja pagos, pedidos, datos de contacto y contenido generado por IA. La seguridad se aborda por capas: validacion de entrada, sanitizacion de salida, no confianza en cliente, firmas de webhook, rate limiting, timeouts y manejo controlado de errores.

## Validacion con Zod

Zod aparece en fronteras externas. `AssistantRequestSchema` limita pregunta, historial y contexto. `bodySchema` de checkout limita items y cantidades. `WebhookEventSchema` comprueba estructura minima de eventos Stripe.

La validacion runtime complementa TypeScript. El compilador no protege contra payloads HTTP maliciosos o errores de Stripe. Zod convierte supuestos en checks reales.

## No confiar en el cliente

El principio mas importante es que el cliente no decide precios. El carrito puede guardar productos en `localStorage`, pero `/api/checkout` recalcula desde base de datos. Tampoco decide estado de pedido. Stripe lo confirma por webhook firmado.

Este principio tambien aplica al asistente. El cliente envia contexto de pagina y carrito, pero las herramientas pueden consultar datos reales cuando importan.

## Sanitizacion de Markdown

El asistente puede devolver Markdown. Para renderizarlo se usa HTML sanitizado. `sanitizeMarkdown` elimina patrones peligrosos antes de `dangerouslySetInnerHTML`.

Esto protege contra dos fuentes: entradas del usuario que el modelo podria reflejar y salidas inesperadas del modelo. No se asume que el LLM sea una entidad confiable.

## Rate limit

`app/api/assistant/route.ts` usa rate limit por IP para evitar abuso del asistente. Las llamadas a LLM y herramientas pueden ser costosas. Limitar frecuencia protege coste y estabilidad.

La implementacion actual es simple e in-memory. Es suficiente para desarrollo o despliegues pequeños, pero en produccion distribuida podria necesitar Redis o almacenamiento compartido.

## Timeouts

`withTimeout` evita que una operacion bloquee indefinidamente. El orquestador del asistente usa timeout global. `ToolExecutor` usa timeout por herramienta. Esta defensa es esencial cuando hay servicios externos: LLM, red, base de datos o Stripe.

Un sistema sin timeouts falla mal: acumula promesas pendientes, degrada UX y complica depuracion.

## Retry y circuit breaker

La capa `lib/agent` incluye retry, circuit breaker, metricas y logger. Aunque no todas las rutas los explotan con la misma intensidad, representan la direccion correcta: operaciones externas deben ser tolerantes a fallos transitorios y dejar de insistir si el proveedor esta caido.

El circuit breaker evita saturar un servicio que ya falla. El retry con backoff evita convertir un pico temporal en error visible inmediato.

## Webhooks firmados

Stripe firma eventos. El endpoint lee body crudo y verifica con `STRIPE_WEBHOOK_SECRET`. Sin esa verificacion, cualquiera podria llamar al endpoint y marcar pedidos como pagados.

La decision de forzar runtime Node.js y usar `req.text()` responde al requisito criptografico de Stripe. Parsear JSON antes de verificar rompe la firma.

## Logs

El sistema usa `console` en rutas y `UnifiedLogger` en agente. La documentacion futura deberia unificar logging para produccion: correlation ids por request, niveles, integracion con plataforma y redaccion de datos sensibles.

## Errores del asistente

El asistente no debe exponer stack traces al usuario. Si hay timeout, devuelve mensaje de reintento. Si el modelo da respuesta vacia, se informa de forma clara. Si una herramienta falla, se registra y se devuelve error estructurado al loop.

Este enfoque evita que un fallo parcial destruya toda la conversacion.

## Seguridad de datos

Las paginas de privacidad y terminos explican uso de datos. A nivel tecnico, no se almacenan tarjetas. Stripe gestiona pago. El chat se persiste en `sessionStorage`, no en base de datos. El carrito se guarda localmente.

En futuras versiones con cuentas, la superficie cambia: historiales, direcciones y preferencias requeriran politicas mas estrictas.

## Riesgos

El rate limit in-memory no escala horizontalmente. El sanitizer Markdown es basico. El webhook podria mejorar correlacion de productos. La navegacion del asistente deberia endurecerse con allowlist. Estos riesgos no invalidan 1.0, pero son prioridades claras.

## Principio de seguridad

Cada dato debe cruzar una frontera con validacion. Cliente a servidor: Zod. Stripe a servidor: firma. Modelo a UI: normalizacion y sanitizacion. Catalogo a dominio: adaptador. Esta repeticion es la diferencia entre una demo y un producto.
