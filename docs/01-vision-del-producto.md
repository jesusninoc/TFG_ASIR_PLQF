# 01 - Vision del producto

## Resumen

PC Selector 1.0 es una tienda de componentes de PC con un builder manual, un asistente conversacional y un flujo de compra real. La propuesta no consiste solamente en mostrar productos; consiste en reducir la incertidumbre de comprar hardware. El usuario puede explorar el catalogo, filtrar productos, montar una configuracion, consultar compatibilidad, pedir ayuda a Chipi y terminar en un checkout con Stripe.

El producto nace de una observacion sencilla: comprar componentes de PC exige tomar decisiones tecnicas que muchas personas solo toman unas pocas veces en su vida. Una CPU no se evalua de forma aislada. Depende de socket, placa, memoria, presupuesto, uso real, fuente, caja, stock y expectativas de futuro. Una tienda tradicional puede listar todos esos datos, pero no siempre los convierte en una decision entendible. PC Selector intenta cerrar esa distancia.

## Problema que resuelve

El usuario que compra componentes suele enfrentarse a tres incertidumbres. La primera es tecnica: si las piezas son compatibles. La segunda es economica: si el presupuesto esta bien repartido. La tercera es cognitiva: si entiende por que una opcion es mejor que otra para su caso. La mayoria de tiendas resuelve solo una parte del problema, normalmente disponibilidad y precio. PC Selector busca resolver las tres.

La compatibilidad de hardware no admite respuestas vagas. Un socket incorrecto no es "menos optimo"; es inutilizable. DDR4 y DDR5 no se mezclan. Una fuente insuficiente no es una recomendacion discutible; es un riesgo. Por eso el sistema no delega esas decisiones al asistente IA. Las valida con codigo.

La distribucion del presupuesto tambien requiere disciplina. En gaming, gastar demasiado en CPU y poco en GPU puede producir una build desequilibrada. En oficina, gastar en GPU dedicada puede no aportar valor. En workstation, RAM y almacenamiento pueden ser mas importantes que en un equipo gaming medio. El motor de builds codifica esas diferencias en tablas de pesos, tiers y validaciones finales.

La tercera incertidumbre es la explicacion. Aqui la IA si aporta valor: puede traducir restricciones tecnicas en lenguaje humano, preguntar por el dato que falta, resumir alternativas y adaptar el tono al contexto. Chipi no sustituye al motor; lo hace conversable.

## Alcance de la version 1.0

La version 1.0 incluye:

- Home comercial y acceso a categorias principales.
- Tienda `/shop` con filtros por busqueda, tipo, marca, rango de precio y orden.
- Pagina de producto con informacion, precio e incorporacion al carrito.
- Carrito persistente en el navegador.
- PC Builder manual con pasos guiados y compatibilidad progresiva.
- Asistente IA global, accesible desde el header, con contexto de pagina y carrito.
- Generacion de builds mediante motor determinista.
- Checkout con Stripe Checkout Session.
- Webhook de Stripe para actualizar pedidos.
- Paginas corporativas: about, contact, privacy y terms.
- Documentacion tecnica de producto 1.0.

Tambien incluye un conjunto de pruebas de bajo coste que protegen contratos importantes: presencia de paginas corporativas, controles de header, estructura del asistente, schemas, herramientas y partes del motor.

## Fuera de alcance consciente

PC Selector 1.0 no intenta ser un marketplace completo. No implementa cuentas de usuario, historial autenticado, panel de administracion, gestion avanzada de inventario, devoluciones automaticas ni integracion con proveedores reales. Tampoco intenta resolver todas las restricciones posibles del hardware moderno: no modela disipadores, alturas de GPU, clearance de caja, carriles PCIe, slots RAM disponibles o compatibilidad de BIOS.

Estas ausencias no son olvidos. Son decisiones de alcance. La version 1.0 se concentra en demostrar el nucleo: catalogo real, compra real, compatibilidad basica, build asistida y explicacion conversacional. Las restricciones adicionales requieren datos adicionales. Añadir validaciones sin datos fiables seria peor que no añadirlas, porque daria una sensacion falsa de seguridad.

## Tesis del producto

La tesis central es que una tienda de hardware puede ser mas fiable si separa tres responsabilidades:

- La interfaz ayuda a explorar y comprar.
- El motor determinista decide compatibilidad y presupuesto.
- El asistente IA traduce intenciones, explica resultados y consulta herramientas.

Esta separacion evita el error mas tentador: dejar que el LLM "lo haga todo". Un modelo de lenguaje puede sonar convincente mientras inventa stock, precios o compatibilidades. PC Selector acepta la IA como capa de conversacion, no como autoridad absoluta sobre decisiones tecnicas.

## Valor de Chipi

Chipi es importante porque cambia la forma de interactuar con una tienda. En vez de obligar al usuario a saber que filtro aplicar, permite preguntas como "quiero algo para jugar en 1440p", "esta grafica me sirve?", "que cambiarias de mi carrito?" o "montame una configuracion con este presupuesto". El sistema convierte lenguaje natural en llamadas a herramientas y respuestas estructuradas.

El asistente no es un chatbot decorativo. Vive conectado a la pagina actual, al carrito y al catalogo. Puede recomendar productos, generar builds, navegar a rutas internas, consultar FAQ y recuperar estado de pedidos. Aun asi, la arquitectura le impone limites: si no hay datos, pregunta; si necesita stock, usa herramientas; si genera builds, delega en el motor.

## Criterio de exito de la version 1.0

La version 1.0 se considera correcta si un usuario puede completar este recorrido:

1. Entrar en la tienda y explorar componentes.
2. Filtrar por tipo, marca o precio sin perder el contexto del asistente.
3. Preguntar a Chipi por una recomendacion.
4. Recibir una build compatible basada en stock.
5. Cargar esa build en el builder manual.
6. Ajustar componentes con feedback de compatibilidad.
7. Añadir componentes al carrito.
8. Pasar por checkout.
9. Registrar el pedido y actualizarlo con Stripe.

Ese flujo representa la promesa esencial: del lenguaje natural a una compra tecnicamente defendible.

## Por que documentarlo como memoria

Una documentacion puramente descriptiva diria "usamos Next.js, Prisma y Stripe". Una memoria de decisiones explica por que. En PC Selector, las decisiones importan porque el sistema combina capas con diferentes criterios de correccion. La UI puede tolerar cambios esteticos. El motor no puede tolerar builds incompatibles. El checkout no puede confiar en precios enviados por el cliente. El asistente no puede inventar datos.

Documentar esas fronteras protege el futuro del proyecto. Cuando se añadan usuarios, administracion, mas categorias o modelos de IA mejores, la pregunta no sera "podemos hacerlo?", sino "en que capa debe vivir esta responsabilidad?". Esa pregunta es el verdadero mecanismo de calidad de PC Selector.
