# 03 - Decisiones tecnologicas

## Criterio general

La tecnologia de PC Selector 1.0 se ha elegido con un criterio pragmatico: minimizar piezas innecesarias sin renunciar a seguridad, tipado, rendimiento y capacidad de evolucion. El producto necesita renderizar tienda, ejecutar logica de servidor, cobrar con Stripe, consultar PostgreSQL, hablar con un modelo compatible con OpenAI y mantener una UI interactiva. Next.js, React, Prisma, TypeScript y Stripe forman una combinacion razonable para ese equilibrio.

No se eligio una arquitectura de microservicios porque el dominio 1.0 no lo exige. Separar catalogo, asistente, pagos y builder en servicios independientes habria añadido despliegues, observabilidad distribuida y contratos HTTP internos antes de tener una necesidad real. En 1.0, un monolito modular ofrece mejor velocidad y mas claridad.

## Next.js 16 y App Router

Next.js permite combinar render servidor, rutas API y componentes cliente en un mismo proyecto. Para PC Selector esto es especialmente util porque la tienda y el producto pueden renderizar con datos frescos desde Prisma, mientras que el builder y el asistente pueden vivir como experiencias cliente.

App Router aporta una organizacion por rutas que coincide con el producto: `app/shop`, `app/product/[slug]`, `app/builder`, `app/checkout` y `app/api`. Esta estructura hace que el mapa funcional sea visible en el sistema de archivos. Para un proyecto 1.0, esa transparencia vale mas que una arquitectura excesivamente abstracta.

La alternativa habria sido separar backend y frontend. Un backend Express/Fastify y un frontend Vite o React puro darian control fino, pero obligarian a duplicar configuracion, despliegues, CORS y contratos. Next.js evita esa friccion en una etapa donde el producto aun esta consolidando dominio.

## React 19

React es la base natural de la UI en Next.js. En PC Selector se usa para componentes interactivos como `SiteHeader`, `StoreProvider`, `AiAssistant`, `PcBuilder` y botones de carrito. La decision importante no es "usar React", sino usarlo donde aporta valor. Las paginas de datos no necesitan convertirse en aplicaciones cliente completas.

React tambien facilita componer tarjetas, builders, mensajes y layouts sin inventar una capa UI propia. La contrapartida es que el estado local puede perderse en navegaciones si no se persiste. El bug del chat al aplicar filtros es un ejemplo: el problema no era React, sino asumir que un estado de conversacion importante podia vivir solo en memoria. La solucion fue `sessionStorage`.

## TypeScript

TypeScript es imprescindible en este producto porque el dominio tiene muchos contratos: productos con specs discriminadas, builds parciales, respuestas del asistente, herramientas, payloads de checkout y schemas de validacion. Sin tipos, los errores entre capas aparecerian tarde.

El tipado no sustituye la validacion runtime. Un payload HTTP puede tener cualquier forma. Por eso TypeScript se combina con Zod en fronteras externas. TypeScript protege al desarrollador dentro del repositorio; Zod protege al sistema cuando entran datos desde navegador, Stripe o el modelo.

## Prisma

Prisma se eligio como ORM por tres razones. La primera es que el schema actua como documentacion viva del modelo. La segunda es que genera un cliente tipado que reduce errores en consultas. La tercera es que integra migraciones y seed en un flujo conocido para equipos JavaScript/TypeScript.

El dominio de PC Selector tiene relaciones claras: un `Product` puede tener una spec de CPU, placa, memoria, almacenamiento, GPU, PSU o caja. Prisma expresa esto de forma legible. Tambien permite consultas con `include` para traer specs relacionadas sin escribir SQL manual.

La alternativa seria SQL directo. SQL daria control maximo y posiblemente mas rendimiento en casos extremos, pero aumentaria repeticion y reduciria seguridad de tipos. Para 1.0, Prisma ofrece una relacion coste/beneficio mejor.

## PostgreSQL y Supabase

PostgreSQL es una eleccion conservadora y robusta para productos, pedidos y FAQ. El modelo relacional encaja bien con el dominio: productos, specs, carritos, items y pedidos. Supabase aparece como opcion de PostgreSQL gestionado porque reduce carga operativa y ofrece cadenas de conexion aptas para runtime y migraciones.

El schema usa dos URL: `DATABASE_URL` y `DATABASE_URL_UNPOOLED`. Esta decision responde a un detalle operativo real. En entornos como Supabase, la aplicacion puede usar pooling, pero Prisma migrate necesita conexion directa. Documentarlo evita errores frecuentes en despliegue.

## Stripe

Stripe se eligio porque resuelve cobro, checkout alojado, firma de webhooks e idempotencia con una API madura. PC Selector no deberia gestionar tarjetas directamente. El checkout externo reduce superficie de cumplimiento y riesgo.

La decision clave es no confiar en el carrito cliente para precios. Aunque el usuario vea precios en React, `/api/checkout` recalcula importes desde base de datos. Stripe recibe importes derivados del servidor. Este patron es mas importante que el proveedor concreto: cualquier sistema de pago serio exigiria la misma frontera de confianza.

## Zod

Zod valida payloads en runtime. Aparece en el checkout, asistente, webhooks y carrito. Su valor es doble: documenta forma esperada y rechaza datos invalidos antes de que lleguen al dominio.

En la API del asistente, Zod limita longitud, evita patrones obvios de script y normaliza campos legacy como `messages` hacia `history`. En checkout, limita cantidades e items. En webhooks, valida estructura basica del evento despues de verificar firma.

## Tailwind CSS y CSS global

Tailwind permite expresar estilos cerca del markup sin crear una jerarquia grande de CSS. Para un producto de UI densa como tienda/builder, esto acelera iteracion. A la vez, `globals.css` define tokens: colores, bordes, fondos, botones e inputs. Esa mezcla evita tanto CSS global descontrolado como clases totalmente ad hoc.

La decision visual es sobria: PC Selector no intenta parecer una landing de marketing, sino una herramienta de compra. La UI usa grillas, paneles, botones compactos, jerarquia clara y tarjetas de producto. El objetivo no es decorar; es permitir comparacion.

## Cliente OpenAI-compatible

El paquete `openai` se usa como cliente compatible para modelos configurables. Esto permite apuntar a proveedores que implementan API similar, como NIM u otros endpoints. La arquitectura no ata el dominio a un proveedor especifico: el orquestador recibe una interfaz `LLMInterface`.

La razon es estrategica. El asistente no debe depender de un unico proveedor si el resto del sistema puede seguir funcionando. Si el LLM falla, se devuelve un mensaje claro; si una herramienta falla, se registra el error. La parte determinista del producto sigue siendo independiente.

## Lucide, Heroicons y Headless UI

Las librerias de iconos y UI se usan de forma limitada. Lucide aporta iconos consistentes para controles como carrito o asistente. Headless UI esta disponible para componentes accesibles sin imponer estilos. La decision general es no construir un design system pesado antes de necesitarlo.

## DOMPurify y sanitizacion

El asistente devuelve Markdown que se convierte a HTML. Renderizar HTML generado por un modelo sin sanitizar seria un riesgo. `sanitizer.ts` transforma Markdown basico y limpia scripts, iframes, handlers y `javascript:`. No es una licencia para aceptar cualquier HTML, sino una barrera defensiva adicional.

## Por que no una vector database en 1.0

Una base vectorial podria servir para FAQ o busqueda semantica, pero no resuelve compatibilidad ni stock. En 1.0, el catalogo es estructurado y pequeño. Las herramientas SQL son mas auditables. Añadir embeddings ahora aumentaria complejidad sin cambiar la promesa central.

## Por que no microservicios

El sistema tiene dominios distinguibles, pero no necesidades operativas separadas. Un monolito modular permite refactorizar rapido y mantener transacciones conceptuales cerca. Si en el futuro el asistente necesitara escalar de forma independiente, podria extraerse. En 1.0, extraerlo seria arquitectura preventiva.

## Conclusion

La pila elegida no es experimental. Es deliberadamente convencional en las partes criticas y flexible en la capa de IA. Esa combinacion refleja el producto: vender hardware exige fiabilidad; explicarlo puede beneficiarse de modelos de lenguaje. La tecnologia acompaña esa division.
