# PC Selector

Tienda de componentes de PC con:

- Landing principal minimalista + catálogo destacado.
- PC Builder con chequeo de compatibilidad (socket, RAM, almacenamiento, potencia).
- Carrito global y checkout con Stripe (o modo simulado sin clave).
- Asistente AI tipo RAG sobre productos y FAQ para recomendaciones por presupuesto.
- Modelado de datos para PostgreSQL con Prisma.

## 1) Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

## 2) Configurar entorno

```bash
copy .env.example .env
```

Opcional: añade `STRIPE_SECRET_KEY` en `.env` para usar checkout real.

## 3) Instalar dependencias

```bash
npm install
```

## 4) Prisma

```bash
npx prisma generate
npx prisma db push
```

## 5) Ejecutar app

```bash
npm run dev
```

Abre http://localhost:3000.

## Estructura destacada

- `app/page.tsx`: home premium minimalista.
- `app/builder/page.tsx`: PC Builder.
- `app/api/assistant/route.ts`: endpoint del asistente.
- `app/api/checkout/route.ts`: endpoint de Stripe/simulación.
- `lib/compatibility.ts`: motor de validación de piezas.
- `prisma/schema.prisma`: modelo de datos PostgreSQL.
- `docker-compose.yml`: base de datos local.
