# PC Selector

Tienda de componentes PC con builder inteligente, asistente IA multi-agente y pagos reales con Stripe.

El asistente ("Chipi") soporta:
- Generación de builds personalizadas (PC completas)
- Búsqueda de componentes por tipo, marca y rango de precio
- Respuestas técnicas sobre productos específicos
- Consulta de estado de pedidos
- Escalado a agente humano

---


---

## Stack

- **Next.js 16** (App Router, React 19)
- **Prisma 6** + **Supabase** (PostgreSQL gestionado)
- **Stripe** (Payment Intents + Checkout Sessions + Webhooks via Node.js SDK)
- **Vercel** (hosting recomendado)
- **Tailwind CSS v4** · **TypeScript**

---

## Arquitectura del Asistente IA (Multi-Agent)

El asistente utiliza una arquitectura de **múltiples agentes especializados** orquestados por un `CoordinatorAgent`:

1. **Clasificador de intenciones** (Híbrido LLM + reglas): Determina si el usuario quiere generar un PC, buscar componentes, preguntar sobre un producto, consultar su pedido o ver su carrito. Puede usar un modelo ligero separado (`NIM_CLASSIFIER_MODEL`) o fallback a reglas.
2. **Agentes especializados**:
   - `BuildAgent`: Genera configuraciones completas usando el motor determinista (`build-engine.ts`).
   - `CatalogAgent`: Busca componentes en el catálogo con tool-calling iterativo.
   - `TechnicalAgent`: Responde preguntas técnicas sobre un producto específico (ej. "¿Es buena esta gráfica para 4K?").
   - `ContextAgent`: Enriquece el contexto (información del carrito y página actual).
   - `OrderAgent`: Consulta estado de pedidos por email.
3. **Motor determinista** (`build-engine.ts` + `compatibility.ts`): Genera builds con garantías matemáticas de stock, compatibilidad y presupuesto.
4. **Resiliencia**: timeouts globales, retry con backoff exponencial, circuit breaker y logging estructurado con correlation IDs.

El clasificador intenta extraer `productId` cuando el usuario se refiere a "esta gráfica" mientras ve una página de producto, para que `TechnicalAgent` pueda analizar ese producto concreto.

---

## Cómo funcionan los webhooks de Stripe

> **No se necesita Stripe CLI en producción.**

El Stripe CLI es solo una herramienta de desarrollo local que actúa como proxy para reenviar eventos de Stripe a tu máquina. En Vercel (o cualquier hosting con URL pública), Stripe llama directamente al endpoint `/api/stripe/webhook` de tu app.

La autenticación se hace con el **Node.js SDK** (`stripe.webhooks.constructEvent`), que verifica la firma criptográfica de cada request usando `STRIPE_WEBHOOK_SECRET`. Esto es todo lo que necesitas en producción.

| Entorno | Cómo llegan los eventos | STRIPE_WEBHOOK_SECRET |
|---|---|---|
| **Producción** (Vercel) | Stripe → tu endpoint directamente | Signing secret del Dashboard |
| **Desarrollo local** | Stripe CLI → localhost | whsec_ que imprime la CLI |

---

## Configuración local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Este proyecto usa **tres archivos** de entorno según el componente:

| Archivo | Quién lo lee | Para qué |
|---|---|---|
| `.env` | Prisma CLI, Docker Compose, Next.js | Variables de BD, Stripe, y configuración del asistente (Ollama, timeouts, multi-agent) |
| `.env.local` | Solo Next.js | Sobreescritura puntual (opcional, tiene prioridad sobre `.env`) |

> **¿Por qué no solo `.env.local`?**  
> `prisma migrate`, `prisma db seed` y `docker-compose` **no leen `.env.local`** — eso es exclusivo de Next.js. Sin `.env`, los comandos de Prisma fallan con `P1012: Environment variable not found`.

Variables principales:

| Variable | Descripción |
|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Conexión a Supabase/PostgreSQL |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Claves de Stripe |
| `OLLAMA_HOST` | URL del servidor Ollama (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | Modelo de Ollama para el parser de intenciones (default: `mistral`) |
| `USE_MULTI_AGENT` | Activa arquitectura multi‑agente (`true`/`false`) |
| `USE_LLM_CLASSIFIER` | Usa LLM para clasificación con fallback a reglas (`true`/`false`) |
| `NIM_MODEL` | Modelo principal para agentes (si usas NVIDIA NIM) |
| `NIM_CLASSIFIER_MODEL` | Modelo separado para clasificación |
| `AGENT_TIMEOUT_GLOBAL` | Timeout total de petición (ms) |
| `AGENT_TIMEOUT_LLM`, `AGENT_TIMEOUT_TOOL`, `AGENT_TIMEOUT_ITERATION` | Timeouts específicos |
| `NIM_RETRY_MAX_ATTEMPTS`, `NIM_RETRY_BASE_DELAY`, `NIM_RETRY_MAX_DELAY` | Configuración de retry |
| `CIRCUIT_BREAKER_ENABLED` | Activa circuit breaker para llamadas LLM |

Crea tu `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores reales. No toques `.env.local` salvo que necesites sobreescribir algo solo para Next.js (raro en desarrollo local).

### 3. Base de datos y Stripe CLI con Docker

El `docker-compose.yml` levanta dos servicios a la vez:
- **postgres** — PostgreSQL 16
- **stripe-cli** — reenvía eventos de Stripe a tu servidor local

**Primer arranque — autenticación de Stripe:**

```bash
# Asegúrate de exportar tu clave antes de ejecutar docker-compose
export STRIPE_SECRET_KEY="sk_test_..."

# Levanta solo la CLI para hacer el login interactivo
docker-compose run --rm stripe-cli login
```

Abrirá una URL en el navegador. Autorizala con tu cuenta de Stripe.
Las credenciales quedan guardadas en el volumen `stripe_config` y no tendrás que repetir este paso.

**Arranque normal (a partir de ahora):**

```bash
docker-compose up -d
```

Al arrancar, la CLI imprime el webhook signing secret:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx
```
Cópialo en `.env.local` como `STRIPE_WEBHOOK_SECRET`.

En `.env.local` usa las variables de Docker local:
```
DATABASE_URL="postgresql://pcselector:pcselector@localhost:5432/pcselector?schema=public"
DATABASE_URL_UNPOOLED="postgresql://pcselector:pcselector@localhost:5432/pcselector?schema=public"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # el que imprimió la CLI al arrancar
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Supabase en local:** si prefieres apuntar a Supabase también en desarrollo,
> comenta las variables de Docker en `.env.local` y usa las dos strings de Supabase
> (ver `.env.example` para el formato exacto).

**Ver los eventos en tiempo real:**
```bash
docker-compose logs -f stripe-cli
```

### 4. Crear tablas y poblar el catálogo

```bash
# Crea las tablas (usa DATABASE_URL_UNPOOLED automáticamente)
npx prisma migrate dev --name init

# Inserta todos los productos en la BD
npm run db:seed
```

### 5. Arrancar Next.js

```bash
npm run dev
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run db:migrate` | Nueva migración en desarrollo |
| `npm run db:migrate:prod` | Aplica migraciones en producción |
| `npm run db:seed` | Puebla la BD con el catálogo |
| `npm run db:studio` | Abre Prisma Studio |

---

## Despliegue en producción (Vercel + Supabase)

### 1. Configura Supabase

1. Crea el proyecto en [supabase.com](https://supabase.com)
2. Anota las dos connection strings (Settings → Database)

### 2. Despliega en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com)
2. En **Settings → Environment Variables**, añade todas las variables:

```
DATABASE_URL              → string con pgbouncer (puerto 6543)
DATABASE_URL_UNPOOLED     → string directa (puerto 5432)
STRIPE_SECRET_KEY         → sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → pk_live_...
STRIPE_WEBHOOK_SECRET     → whsec_... (del paso 3)
NEXT_PUBLIC_APP_URL       → https://tu-app.vercel.app
```

3. En **Settings → General → Build Command**, configura:
```
prisma migrate deploy && next build
```
Esto aplica las migraciones automáticamente en cada deploy.

### 3. Registra el webhook en Stripe

1. Dashboard de Stripe → **Developers → Webhooks → Add endpoint**
2. URL del endpoint: `https://tu-app.vercel.app/api/stripe/webhook`
3. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copia el **Signing secret** (`whsec_...`) → ponlo en Vercel como `STRIPE_WEBHOOK_SECRET`

### 4. Poblar la BD (una sola vez)

Una vez desplegado y con las migraciones aplicadas, ejecuta el seed apuntando a Supabase:

```bash
# Con las variables de prod en tu entorno local, o desde Vercel CLI
DATABASE_URL_UNPOOLED="postgresql://..." npm run db:seed
```

---

## Arquitectura de la BD

```
Supabase (PostgreSQL)
│
├── Puerto 6543 (PgBouncer pooler)
│   └── DATABASE_URL → Prisma en runtime (Next.js API routes, Server Components)
│
└── Puerto 5432 (conexión directa)
    └── DATABASE_URL_UNPOOLED → prisma migrate deploy (solo en build/deploy)
```

---

## Estructura del proyecto

```
app/
  api/
    assistant/route.ts             ← Asistente IA (multi-agent coordinator)
    checkout/route.ts              ← Stripe Checkout Sessions
    products/
      route.ts                    ← GET catálogo con filtros
      by-type/route.ts            ← GET productos por tipo (PC Builder)
    stripe/
      payment-intent/route.ts     ← Stripe Payment Intents
      webhook/route.ts            ← Webhook (Node.js SDK, sin Stripe CLI)
    orders/
      confirm/route.ts            ← Consulta estado de pedido
  checkout/
    page.tsx                      ← Pago con Stripe Elements
    success/page.tsx              ← Confirmación con datos reales
  builder/                        ← PC Builder con compatibilidad en tiempo real
  shop/                           ← Tienda (datos desde Supabase)
  product/[slug]/                 ← Páginas de producto
  page.tsx                        ← Home

lib/
  agent/
    coordinator/
      coordinator.ts              ← Orquestador principal
      llm-classifier.ts           ← Clasificador LLM (JSON output)
      router.ts                   ← Clasificador basado en reglas (fallback)
    base-agent.ts                 ← BaseAgent y NimLLMAdapter (timeouts, retry, circuit breaker)
    agent-config.ts               ← Configuración de agentes
    timeout-manager.ts            ← Utilidades de timeout
    circuit-breaker.ts            ← Patrón circuit breaker
    build-agent/
      build-agent.ts              ← Agente para generación de builds
    catalog-agent/
      catalog-agent.ts            ← Agente de búsqueda de componentes
    faq-agent/
      faq-agent.ts                ← Agente técnico (análisis de productos)
    context-agent/
      context-agent.ts            ← Agente de enriquecimiento de contexto
    order-agent/
      order-agent.ts              ← Agente de estado de pedidos
    tools/
      catalog-tools.ts            ← Tool definition: search_catalog
      build-tools.ts              ← Tool definition: generate_build
  build-engine.ts                 ← Motor determinista de builds
  catalog.ts                      ← Datos estáticos del catálogo (solo para seed)
  compatibility.ts                ← Validador de compatibilidad física
  db-to-types.ts                  ← Conversor Prisma → tipos del dominio
  prisma.ts                       ← Cliente Prisma singleton
  stripe.ts                       ← Cliente Stripe + verificación de webhooks (SDK)
  stripe-appearance.ts            ← Configuración deUI de Stripe
  types.ts                        ← Tipos TypeScript compartidos
  form-factors.ts                 ← Utilidades de factor de forma
  builder-transfer.ts             ← Normalización de selecciones del builder

components/
  pc-builder.tsx                  ← Builder client (carga productos vía API)
  ai-assistant.tsx                ← Chat flotante del asistente
  store-provider.tsx              ← Carrito en localStorage
  add-to-cart-button.tsx
  build-card.tsx
  component-card.tsx
  site-header.tsx
  site-footer.tsx

prisma/
  schema.prisma                   ← Schema con url + directUrl para Supabase
  seed.ts                         ← Seed inicial del catálogo (usa lib/catalog.ts)
```
