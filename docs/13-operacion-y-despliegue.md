# 13 - Operacion y despliegue

## Entornos

PC Selector 1.0 puede ejecutarse en local con Node, PostgreSQL y Stripe CLI, o desplegarse en Vercel con Supabase y Stripe. La aplicacion depende de variables de entorno para base de datos, Stripe, URL publica y modelo IA.

La distincion entre `.env` y `.env.local` importa. Prisma CLI y Docker no leen necesariamente lo mismo que Next.js. Por eso se recomienda mantener variables necesarias para Prisma en `.env`.

## Instalacion

El flujo basico:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

`postinstall` ejecuta `prisma generate`, por lo que el cliente Prisma queda generado tras instalar dependencias.

## Base de datos

El proyecto usa PostgreSQL. En local puede levantarse con Docker Compose. En produccion se recomienda Supabase u otro PostgreSQL gestionado.

Se necesitan dos cadenas:

- `DATABASE_URL`: runtime.
- `DATABASE_URL_UNPOOLED`: migraciones.

En Supabase, la primera puede usar pooling y la segunda conexion directa. En local pueden ser iguales.

## Stripe

Variables principales:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

En local, Stripe CLI puede reenviar eventos al webhook. En produccion, Stripe llama directamente a la URL publica. El signing secret local y el de produccion son distintos.

## IA

El asistente usa un cliente compatible con OpenAI. Variables como modelo, base URL y timeouts se configuran en entorno mediante `agent-config` y `llm`. La documentacion de despliegue debe registrar exactamente que proveedor se usa en produccion.

La aplicacion debe degradar de forma controlada si el LLM falla. El catalogo y checkout no dependen del modelo para funcionar.

## Build

Para produccion:

```bash
prisma migrate deploy && next build
```

Ejecutar migraciones antes del build evita que el codigo desplegado espere columnas o tablas inexistentes.

## Seed

`npm run db:seed` carga catalogo inicial. En produccion real, el seed no deberia ejecutarse automaticamente en cada deploy si ya hay datos vivos. En 1.0 sirve para preparar entornos controlados.

## Webhooks

En Stripe Dashboard se registra:

```text
https://tu-dominio.com/api/stripe/webhook
```

Eventos:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

El endpoint debe responder 2xx si procesa o ignora correctamente. Debe responder 500 si quiere que Stripe reintente por fallo interno.

## Observabilidad

La version 1.0 usa logs basicos. Para produccion seria recomendable:

- Logs estructurados por request.
- Correlation IDs.
- Alertas de webhook fallido.
- Metricas de latencia del asistente.
- Ratio de tool calls fallidas.
- Errores de checkout.

## Checklist de despliegue

1. Variables de entorno cargadas.
2. Prisma generate ejecutado.
3. Migraciones aplicadas.
4. Catalogo inicial presente.
5. Stripe webhook registrado.
6. `NEXT_PUBLIC_APP_URL` apunta a dominio real.
7. Lint y typecheck pasan.
8. Prueba manual de checkout en modo test.
9. Prueba manual del asistente.
10. Revision de paginas legales.

## Riesgos operativos

El rate limit in-memory no sirve para muchas instancias. El stock no se decrementa. Los logs no estan centralizados. Estos puntos son aceptables para 1.0 si el despliegue es controlado, pero deben resolverse antes de operar con volumen real.
