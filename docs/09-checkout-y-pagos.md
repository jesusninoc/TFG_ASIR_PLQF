# 09 - Checkout y pagos

## Papel del checkout

El checkout es la frontera entre recomendacion y transaccion. Hasta este punto el usuario ha explorado, filtrado, preguntado al asistente o montado una build. En checkout, esas decisiones se convierten en una operacion economica real. Por eso el sistema cambia de criterio: la comodidad del cliente deja de ser suficiente y entra la seguridad de pagos.

PC Selector 1.0 usa Stripe Checkout Sessions. Esta decision evita manipular datos de tarjeta y delega la experiencia sensible de pago en un proveedor especializado.

## Carrito cliente

El carrito vive en `StoreProvider` y se persiste en `localStorage`. Guarda productos y cantidades. Esta decision permite carrito anonimo, inmediato y disponible en todo el sitio sin cuenta de usuario.

Pero el carrito cliente no es fuente de verdad economica. Puede ser manipulado desde DevTools. Por eso `/api/checkout` solo acepta ids y cantidades como intencion de compra. Despues consulta base de datos, reconstruye nombres, precios y stock.

## Validacion del payload

`app/api/checkout/route.ts` usa Zod. Limita items, cantidades y exige ids de producto. Esta validacion evita payloads vacios, cantidades negativas, arrays enormes o estructuras inesperadas.

La validacion no garantiza disponibilidad; solo forma. La disponibilidad se comprueba consultando productos con `stock: { gt: 0 }`.

## Recalculo de precios

El servidor consulta productos por ids y toma `priceCents` desde la base. Si falta algun producto o no tiene stock, responde error. Despues calcula `totalCents` sumando `priceCents * quantity`.

Esta decision es una regla de seguridad basica: nunca cobrar segun precio enviado por cliente. Aunque el frontend muestre un total, el servidor lo ignora como autoridad.

## Idempotencia

`checkoutSessionKey` genera una clave determinista a partir del contenido del carrito. Stripe recibe esa clave al crear la sesion. Esto reduce riesgos de sesiones duplicadas ante reintentos o doble click.

La idempotencia no es solo una optimizacion. En pagos, los reintentos son normales: red lenta, usuario impaciente, timeouts o errores intermedios. Sin idempotencia, el sistema puede crear estados duplicados dificiles de reconciliar.

## Creacion de sesion

El servidor crea primero la sesion de Stripe. Solo si Stripe responde correctamente, persiste un `Order` como `PENDING`. Esta secuencia evita crear pedidos locales sin sesion de pago asociada.

Luego actualiza metadata de Stripe con `orderId`. La metadata permite correlacion posterior. Aunque el webhook tambien puede buscar por `stripeSessionId`, guardar metadata ayuda a soporte y trazabilidad.

## Webhook

`app/api/stripe/webhook/route.ts` recibe eventos de Stripe. Fuerza runtime Node.js y lee `req.text()` para obtener body crudo. Esto es imprescindible: verificar firma Stripe requiere el payload exacto, no un JSON parseado y reserializado.

El endpoint verifica `stripe-signature` con `constructStripeEvent`. Si la firma falla, responde 400. Si el procesamiento interno falla, responde 500 para que Stripe reintente.

## Eventos gestionados

El webhook maneja:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`

En el flujo de Checkout Session, el evento completado actualiza pedido existente a `PAID` o crea uno si no existia. Tambien recupera line items y los asocia a productos de base de datos cuando puede.

## Estados de pedido

`OrderStatus` incluye `PENDING`, `PAID`, `FAILED` y `REFUNDED`. En 1.0, el flujo principal usa `PENDING` al crear sesion y `PAID` al completar. `FAILED` aparece para PaymentIntent fallido. `REFUNDED` queda preparado para evolucion futura.

## Riesgos

El webhook relaciona productos por nombre al reconstruir line items si debe crear pedido desde cero. Esto funciona en un catalogo controlado, pero no es ideal para gran escala. Mejor seria incluir ids de producto en metadata de cada line item o mantener siempre el pedido local previo.

El stock no se decrementa en el flujo documentado. Para una tienda real, el pago deberia reservar o descontar unidades de forma transaccional. En 1.0, stock actua como disponibilidad de recomendacion y checkout, no como inventario cerrado.

## Por que Stripe

Stripe reduce superficie regulatoria y ofrece SDK, Checkout alojado, firmas, dashboard y webhooks. Construir pagos propios no tendria sentido. La decision importante no es el nombre del proveedor, sino externalizar el manejo sensible de tarjeta y mantener verificacion servidor.

## Futuro

La evolucion natural incluye decremento de stock, reservas temporales, emails de confirmacion, facturacion, reembolsos, panel de pedidos, direccion de envio, impuestos y soporte multi-moneda. Cada mejora debe mantener el principio: el servidor decide importes y Stripe confirma pagos.
