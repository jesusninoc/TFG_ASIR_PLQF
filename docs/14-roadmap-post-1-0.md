# 14 - Roadmap posterior a 1.0

## Proposito

Este documento recoge mejoras posteriores a PC Selector 1.0. No es una lista de deseos desordenada; es una guia para evolucionar sin romper las decisiones correctas de la version inicial.

El criterio principal es preservar la separacion entre experiencia, dominio, IA y pagos. Cada mejora debe entrar en la capa adecuada.

## Catalogo

Mejoras razonables:

- Paginacion.
- Facets con conteo.
- Filtros por specs: socket, DDR, VRAM, TDP, capacidad.
- Busqueda full-text.
- Labels localizados para enums.
- Panel de administracion.
- Importacion desde proveedor.

La prioridad deberia ser filtros por specs, porque aumentan valor tecnico y reducen dependencia del asistente.

## Builder

Evoluciones:

- Carga incremental por paso.
- Warnings no bloqueantes.
- Soporte de disipadores.
- Dimensiones de caja y GPU.
- Slots RAM y numero de modulos.
- Guardado de builds.
- Compartir build por URL.

Guardar builds requerira decidir si son anonimas, asociadas a usuario o serializadas en URL.

## Motor

El motor puede incorporar:

- Mas casos de uso.
- Benchmarks externos.
- Scoring por rendimiento/precio.
- Optimizacion combinatoria controlada.
- Explicaciones generadas desde trazas del motor.
- Presupuesto con rangos.

La regla sigue siendo: decisiones criticas en codigo, no en prompt.

## Asistente

Mejoras:

- Memoria de preferencias por usuario.
- Evaluaciones automaticas de calidad.
- Allowlist estricta de navegacion.
- Comparativas entre productos.
- Resumen del carrito con advertencias.
- Explicaciones visuales de compatibilidad.
- Modo soporte postventa.

La memoria debe ser opt-in y documentada por privacidad.

## Pagos y pedidos

Evoluciones:

- Decremento transaccional de stock.
- Reservas temporales.
- Emails de confirmacion.
- Direcciones de envio.
- Facturas.
- Reembolsos.
- Panel de pedidos.
- Estados logisticos.

Stock es prioridad antes de volumen real. Sin decremento, el sistema puede sobrevender.

## Seguridad

Pendientes:

- Rate limit distribuido.
- CSRF segun rutas necesarias.
- Allowlist de rutas internas para IA.
- Logs sin datos sensibles.
- Auditoria de sanitizer.
- Revision de dependencias.

## Testing

Siguiente nivel:

- Playwright para flujos criticos.
- DB temporal para integracion.
- Tests del motor con fixtures.
- Stripe webhook tests con payloads firmados.
- Evaluaciones del asistente.

## Producto

Mejoras de experiencia:

- Comparador de componentes.
- Historial de builds.
- Recomendaciones por monitor/resolucion.
- Modo principiante/avanzado.
- Explicacion de coste marginal entre tiers.

## Documentacion

La documentacion 1.0 debe crecer con el producto. Cada cambio de arquitectura debe actualizar el capitulo correspondiente. Si se añade una categoria, deben actualizarse modelo, builder, motor, compatibilidad, asistente, tests y roadmap.

## Criterio final

PC Selector debe evolucionar como sistema de decision asistida, no como chatbot pegado a una tienda. Esa frase deberia guiar cada version futura.
