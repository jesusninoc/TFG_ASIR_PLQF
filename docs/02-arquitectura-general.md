# 02 - Arquitectura general

## Vision de alto nivel

PC Selector 1.0 esta construido sobre Next.js App Router. La aplicacion combina Server Components para paginas de catalogo y producto, Client Components para interacciones persistentes, API routes para operaciones de negocio y una capa `lib/` donde vive la logica de dominio: compatibilidad, conversion de datos, asistente, herramientas, Stripe, validacion y acceso a Prisma.

La arquitectura puede entenderse como cinco capas:

1. Presentacion: `app/` y `components/`.
2. Estado cliente: carrito, chat, builder y transferencia de selecciones.
3. Dominio: tipos, compatibilidad, motor de builds, form factors y conversiones.
4. Integraciones: Prisma, Stripe, LLM y herramientas del asistente.
5. Persistencia: PostgreSQL via Prisma.

La separacion no es academica. Cada capa responde a un tipo de incertidumbre distinto. La presentacion resuelve experiencia. El dominio resuelve correccion. Las integraciones resuelven comunicacion con servicios externos. La persistencia resuelve verdad de datos. Mezclarlas seria comodo al principio, pero haria dificil auditar por que se recomienda o cobra algo.

## Mapa de rutas

Las rutas principales son:

- `/`: home y acceso a categorias.
- `/shop`: tienda filtrable por query string.
- `/product/[slug]`: detalle de producto.
- `/builder`: PC Builder manual.
- `/checkout`: flujo de compra.
- `/checkout/success`: confirmacion.
- `/checkout/simulated`: soporte de simulacion.
- `/about`, `/contact`, `/privacy`, `/terms`: paginas corporativas.
- `/api/products`: API de productos filtrables.
- `/api/products/by-type`: productos agrupados para el builder.
- `/api/assistant`: endpoint del asistente.
- `/api/checkout`: creacion de Stripe Checkout Session.
- `/api/orders/confirm`: confirmacion de pedidos.
- `/api/stripe/webhook`: recepcion de eventos Stripe.

La decision de usar rutas App Router permite que `/shop` y `/product` puedan consultar datos en servidor sin llevar consultas Prisma al cliente. El builder y el asistente, en cambio, son interactivos y viven como componentes cliente.

## Layout raiz

`app/layout.tsx` monta la estructura global: fuentes, estilos, `StoreProvider`, `SiteHeader`, contenido, `SiteFooter` y `AiAssistant`. Esto hace que el carrito y el asistente esten disponibles en todo el sitio.

El `StoreProvider` esta por encima del header, paginas y asistente porque todos pueden necesitar el carrito. El header muestra el contador y abre el carrito. El asistente puede leer el carrito para responder con contexto. El checkout consume los items. Esta ubicacion en el arbol evita pasar props manuales entre rutas.

## Server Components y Client Components

La aplicacion usa Server Components cuando el contenido depende de datos y no necesita estado local interactivo. `/shop` consulta Prisma directamente y renderiza productos filtrados. `/product/[slug]` obtiene un producto concreto y productos relacionados. Esto reduce JavaScript enviado al navegador y mantiene la consulta de datos cerca del render servidor.

Los Client Components aparecen donde hay interaccion continua: `store-provider.tsx`, `site-header.tsx`, `ai-assistant.tsx`, `pc-builder.tsx`, `add-to-cart-button.tsx`. Estos componentes usan `useState`, `useEffect`, eventos de navegador, `localStorage`, `sessionStorage` o fetch desde el cliente.

La frontera Server/Client es una de las decisiones mas importantes. No se debe convertir una pagina entera en cliente solo para resolver una interaccion pequeña. Tampoco se debe forzar un Server Component cuando el usuario espera feedback inmediato.

## Flujo de catalogo

El catalogo parte de la base de datos. Prisma devuelve productos con sus specs asociadas. `db-to-types.ts` convierte esos registros al modelo de dominio compartido por UI, builder y asistente. Ese adaptador es clave: evita que cada componente conozca la forma exacta del schema Prisma.

`/shop` recibe `searchParams`, construye un `where` de Prisma y renderiza la grilla. Los filtros se expresan como query string porque son compartibles, recargables e indexables. Esta decision explica por que aplicar filtros puede provocar navegacion. El bug de perdida de chat se resolvio persistiendo la conversacion en `sessionStorage`, no cambiando el catalogo a estado cliente innecesario.

## Flujo del builder

El builder llama a `/api/products/by-type` para obtener productos agrupados por categoria. Mantiene una seleccion parcial y recalcula compatibilidad conforme el usuario avanza. Las restricciones progresivas se aplican en dos niveles:

- En la UI se marca o prioriza compatibilidad contextual.
- En `evaluateBuildCompatibility` se calcula el informe formal.

Cuando Chipi genera una build, no intenta manipular directamente el estado React del builder. Guarda ids normalizados en `localStorage`, emite un evento y navega a `/builder`. El builder lee esos ids y reconstruye la seleccion a partir del catalogo real. Esto evita pasar objetos grandes por URL y reduce el acoplamiento entre asistente y builder.

## Flujo del asistente

`AiAssistant` recoge pregunta, historial y contexto. Envia un POST a `/api/assistant`. La API valida el payload con Zod, aplica rate limit y delega en `AssistantOrchestrator`.

El orquestador ofrece herramientas al modelo: buscar catalogo, generar build, consultar FAQ, leer carrito, leer pagina actual, consultar pedidos y navegar. El modelo no recibe autoridad ilimitada; decide que herramienta llamar y el executor la ejecuta con validacion, timeouts y control de errores.

La respuesta final se normaliza con `assistant-schemas.ts` antes de volver al cliente. En el frontend, esa respuesta puede renderizar texto, tarjetas de builds o tarjetas de componentes.

## Flujo de checkout

El carrito vive en cliente, pero el checkout no confia en precios del cliente. `/api/checkout` valida el payload, consulta productos en base de datos, verifica stock, recalcula precios y crea la sesion de Stripe. Solo despues de crear la sesion persiste el pedido como `PENDING`.

El webhook de Stripe lee el body crudo, verifica la firma y actualiza pedidos. Esta separacion protege el flujo frente a manipulaciones del cliente, dobles envios y eventos asincronos.

## Capas de dominio

`lib/types.ts` define el lenguaje comun. `compatibility.ts` valida reglas fisicas y calcula precio total. `build-engine.ts` genera builds con presupuesto y stock. `builder-transfer.ts` normaliza ids para pasar recomendaciones de IA al builder. `validation.ts` define schemas de entrada. `sanitizer.ts` limpia Markdown del asistente.

El dominio no deberia depender de React. Esta regla mantiene el motor y las validaciones testeables. Si una regla tecnica vive dentro de JSX, sera dificil reutilizarla en asistente, builder y pruebas.

## Principios arquitectonicos

El primer principio es que la base de datos es la fuente de verdad para productos, precios y stock. El segundo es que las reglas de compatibilidad deben expresarse como codigo auditable. El tercero es que el asistente debe usar herramientas cuando necesite datos reales. El cuarto es que el cliente puede mejorar experiencia, pero no decidir precios ni estados de pedido.

Estos principios explican casi todas las decisiones del sistema. Tambien marcan el camino futuro: cuando se añada una nueva categoria, debe entrar por schema, tipos, adaptador, motor, compatibilidad, UI y documentacion. No basta con enseñarsela al prompt.
