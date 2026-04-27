# PC Selector 1.0 - Documentacion tecnica y memoria de decisiones

Esta carpeta recoge la documentacion de producto, arquitectura y operacion de **PC Selector 1.0**. La intencion no es solo describir que hace cada modulo, sino explicar por que el sistema ha sido construido asi: que problemas intenta resolver, que alternativas fueron razonables, que riesgos se aceptaron y que decisiones se tomaron para convertir una tienda de componentes en una experiencia asistida por IA.

PC Selector 1.0 combina cuatro dominios que normalmente se documentan por separado: comercio electronico, compatibilidad de hardware, recomendacion asistida por lenguaje natural y pagos reales. La documentacion se organiza como una memoria tecnica porque el valor del producto no esta solo en sus pantallas, sino en la forma en que limita la incertidumbre del usuario. Un comprador no necesita saber como funciona un socket AM5, pero el sistema si debe saberlo, validarlo y explicarlo.

## Indice 1.0 recomendado

| Capitulo | Documento | Proposito |
|---|---|---|
| 01 | [Vision del producto](./01-vision-del-producto.md) | Define el problema, el alcance de la version 1.0 y los principios de producto. |
| 02 | [Arquitectura general](./02-arquitectura-general.md) | Describe las capas del sistema, los flujos principales y las fronteras entre UI, datos, IA y pagos. |
| 03 | [Decisiones tecnologicas](./03-decisiones-tecnologicas.md) | Justifica Next.js, React, Prisma, PostgreSQL, Stripe, Zod, Tailwind, TypeScript y el cliente OpenAI-compatible. |
| 04 | [Modelo de datos](./04-modelo-de-datos.md) | Explica el schema Prisma, productos, specs, carrito, pedidos, FAQ, seed y migraciones. |
| 05 | [Catalogo y tienda](./05-catalogo-y-tienda.md) | Documenta `/shop`, filtros, busqueda, productos, APIs y la relacion con la base de datos. |
| 06 | [PC Builder](./06-pc-builder.md) | Detalla el builder manual, pasos, compatibilidad progresiva y carga de builds sugeridas por IA. |
| 07 | [Asistente IA](./07-asistente-ia.md) | Explica Chipi, el orquestador, herramientas, contexto, memoria de sesion, errores y contrato de respuesta. |
| 08 | [Motor de builds](./08-motor-de-builds.md) | Analiza el motor determinista, presupuesto, tiers, pesos, `pickBest` y validacion final. |
| 09 | [Checkout y pagos](./09-checkout-y-pagos.md) | Describe carrito, Stripe Checkout, idempotencia, webhooks, pedidos y verificacion de precio. |
| 10 | [Frontend y sistema de diseño](./10-frontend-y-sistema-de-diseno.md) | Recoge layout, header, footer, paginas corporativas, estilo visual y decisiones de interaccion. |
| 11 | [Seguridad, validacion y resiliencia](./11-seguridad-validacion-y-resiliencia.md) | Agrupa Zod, sanitizer, rate limit, retry, circuit breaker, logs, timeouts y webhooks firmados. |
| 12 | [Testing y calidad](./12-testing-y-calidad.md) | Explica la estrategia de pruebas, lint, typecheck, smoke tests y huecos conocidos. |
| 13 | [Operacion y despliegue](./13-operacion-y-despliegue.md) | Documenta variables de entorno, desarrollo local, Prisma, Vercel, Supabase y Stripe. |
| 14 | [Roadmap posterior a 1.0](./14-roadmap-post-1-0.md) | Enumera limitaciones conscientes, mejoras futuras y criterios para evolucionar sin romper la arquitectura. |

## Como leer esta documentacion

Para entender el producto como un todo, empieza por los capitulos 01, 02 y 03. Esos tres documentos explican la tesis de PC Selector: una tienda de hardware no debe delegar decisiones criticas al modelo de lenguaje, pero si puede usar lenguaje natural para hacer que esas decisiones sean accesibles. Despues, el orden natural es datos, catalogo, builder, asistente y pagos.

Para trabajar en una incidencia concreta, entra por el capitulo del subsistema afectado. Si el bug esta en filtros de tienda, empieza por `05-catalogo-y-tienda.md`; si el problema aparece al cargar una build desde el chat, lee `06-pc-builder.md` y `07-asistente-ia.md`; si el fallo aparece al cobrar, `09-checkout-y-pagos.md` y `11-seguridad-validacion-y-resiliencia.md` son la pareja correcta.

## Principio editorial de la version 1.0

Cada documento intenta responder a cuatro preguntas:

1. Que hace esta parte del sistema.
2. Por que existe y que problema resuelve.
3. Por que se eligio esta solucion frente a otras.
4. Que riesgos quedan abiertos para futuras versiones.

El tono es deliberadamente analitico. PC Selector 1.0 no se presenta como una coleccion de componentes React, sino como un sistema de decision asistida en un dominio donde equivocarse tiene coste material: dinero, devoluciones, incompatibilidades y perdida de confianza.

## Escala documental

La serie numerada funciona como canon tecnico de la version 1.0. Esta primera edicion fija estructura, responsabilidades, decisiones y criterios de evolucion. El objetivo editorial marcado para la memoria completa es que cada capitulo pueda crecer hasta una extension equivalente a 10-20 paginas DIN A4, incorporando ejemplos, trazas, alternativas descartadas, riesgos, criterios de prueba y anexos operativos.

Mientras esa expansion se completa por iteraciones, los documentos historicos conservados en esta carpeta sirven como material complementario para algunos capitulos, especialmente motor determinista, compatibilidad, gestion de presupuesto y separacion entre IA y reglas. La regla de lectura sigue siendo la misma: ante una contradiccion, prevalece la serie numerada 1.0.

## Documentos historicos

Los documentos anteriores que no siguen la numeracion 1.0 se conservan como material de referencia. Algunos explican decisiones que siguen vigentes, como el motor determinista y la separacion entre IA y reglas; otros describen una arquitectura multi-agente previa que ha sido simplificada hacia un orquestador flexible con herramientas. Cuando haya conflicto, prevalece siempre la serie numerada 1.0.
