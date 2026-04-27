# 04 - Modelo de datos

## Papel del modelo

El modelo de datos de PC Selector 1.0 define la verdad persistente del sistema. La UI puede mostrar productos, el asistente puede hablar de ellos, el builder puede seleccionarlos y Stripe puede cobrarlos, pero todos esos flujos dependen de una fuente comun: la base de datos representada por `prisma/schema.prisma`.

El schema no es solo almacenamiento. Es una declaracion de dominio. Indica que un producto pertenece a un tipo de componente, que cada tipo tiene especificaciones tecnicas distintas, que los pedidos conservan precio en el momento de compra y que el carrito persistente de base existe aunque el carrito principal de 1.0 viva en cliente.

## Producto como entidad central

`Product` es la entidad principal. Contiene campos comunes a cualquier componente: `slug`, `name`, `brand`, `description`, `image`, `stock`, `priceCents`, `componentType`, `createdAt` y `updatedAt`. Esta base comun permite que tienda, carrito y checkout trabajen con productos sin conocer todos los detalles tecnicos.

La decision de usar `priceCents` como entero evita errores de coma flotante y alinea el sistema con Stripe, que tambien opera en unidades minimas de moneda. Un producto de 129 euros se guarda como `12900`, no como `129.00`.

`stock` se guarda en el producto porque la disponibilidad afecta a catalogo, motor de builds y checkout. El motor filtra productos con stock mayor que cero. El checkout vuelve a consultar stock antes de crear la sesion de pago. Esta redundancia de verificacion es intencionada: ver algo en pantalla no autoriza a comprarlo si se agoto antes de pagar.

## Specs por tipo

Cada componente tiene una tabla de especificaciones opcional:

- `CpuSpec`: socket, nucleos, hilos y TDP.
- `MotherboardSpec`: socket, factor de forma, tipo de memoria, memoria maxima, M.2 y SATA.
- `MemorySpec`: DDR4/DDR5, frecuencia, capacidad y modulos.
- `StorageSpec`: interfaz y capacidad.
- `GpuSpec`: VRAM y TDP.
- `PsuSpec`: vatios y eficiencia.
- `CaseSpec`: factores de forma soportados.

Se podria haber modelado todo en una sola tabla con columnas nullable. Esa alternativa simplifica consultas simples, pero degrada el significado: una GPU tendria columnas de socket vacias, una fuente tendria VRAM nula, y el schema permitiria combinaciones absurdas. Separar specs por tipo hace que el modelo exprese mejor el dominio.

La contrapartida es que las consultas necesitan `include` y un adaptador. PC Selector acepta ese coste porque `db-to-types.ts` centraliza la conversion a tipos de dominio.

## Enums

Los enums `ComponentType`, `MemoryType`, `StorageInterface`, `FormFactor`, `PsuEfficiency` y `OrderStatus` reducen ambiguedad. No se aceptan strings libres para categorias criticas. Esta decision evita errores como `gpu`, `GPU`, `GraphicsCard` o `tarjeta` representando lo mismo.

Tambien hace explicita una limitacion: el sistema solo conoce las categorias enumeradas. Añadir coolers, ventiladores, monitores o perifericos no es insertar productos sin mas; exige ampliar enum, specs, tipos, seed, adaptador, builder, motor, compatibilidad y documentacion.

## Pedidos

`Order` guarda `stripePaymentIntentId`, `stripeSessionId`, `status`, `totalCents`, `currency`, `customerEmail` y timestamps. `OrderItem` guarda `productId`, `quantity` y `priceCents`.

El campo `priceCents` en `OrderItem` es fundamental. No se debe recalcular el precio historico de un pedido leyendo el precio actual del producto. Si una GPU costaba 499 euros al comprar y una semana despues cuesta 459, el pedido debe conservar el precio de compra. Esta es una decision contable y de soporte.

`stripeSessionId` y `stripePaymentIntentId` son unicos para poder hacer upsert o localizar pedidos a partir de eventos de Stripe. Los eventos de pago son asincronos; el sistema necesita correlacionarlos con pedidos existentes.

## Carrito

El schema incluye `Cart` y `CartItem`, pero la experiencia principal de 1.0 usa `localStorage` mediante `StoreProvider`. Esto puede parecer redundante, pero deja una ruta evolutiva clara: en una version con usuarios autenticados, el carrito puede migrar a persistencia servidor.

La decision de cliente en 1.0 responde a simplicidad y velocidad. Un carrito anonimo no necesita cuenta. El riesgo se controla en checkout: aunque el cliente guarde items y cantidades, el servidor valida ids, stock y precios antes de cobrar.

## FAQ

`FaqEntry` contiene pregunta y respuesta. Es una pieza pequeña pero importante para el asistente. Permite que algunas respuestas frecuentes sean recuperables como datos, no como conocimiento inventado por el modelo. En 1.0 el sistema es basico, pero crea la base para una FAQ mas rica o busqueda semantica posterior.

## Seed

`prisma/seed.ts` puebla productos desde `lib/catalog.ts`. El catalogo estatico cumple dos funciones: datos iniciales y fixture de desarrollo. Esto permite levantar el proyecto con una base reproducible.

La existencia de seed es importante para pruebas manuales y demos. Sin seed, el motor de builds podria fallar no por logica, sino por ausencia de datos. En una tienda real, el catalogo vendria de un ERP o proveedor; en 1.0, seed ofrece control y repetibilidad.

## Adaptador `db-to-types`

Prisma devuelve productos con relaciones opcionales. La UI y el motor necesitan tipos discriminados mas comodos. `lib/db-to-types.ts` hace esa traduccion. Esta capa evita que cada consumidor repita comprobaciones sobre `cpuSpec`, `gpuSpec` o `caseSpec`.

El adaptador tambien actua como frontera de calidad. Si un producto marcado como CPU no tiene `cpuSpec`, la conversion puede decidir como tratarlo. La documentacion futura deberia formalizar esos casos como errores de integridad.

## Migraciones

Las migraciones viven en `prisma/migrations`. En 1.0 solo hay una migracion inicial. La regla operativa es simple: el schema es fuente de verdad de desarrollo, las migraciones son fuente de verdad historica de base de datos.

En produccion, `prisma migrate deploy` debe ejecutarse antes de `next build` o como parte del despliegue controlado. En desarrollo, `prisma migrate dev` permite evolucionar el schema y mantener la base alineada.

## Riesgos y evolucion

El mayor riesgo del modelo 1.0 es que algunas compatibilidades importantes no tienen datos suficientes. No se puede validar altura de disipador si no hay disipadores. No se puede validar largo de GPU si las cajas no guardan clearance. No se puede advertir de BIOS si no hay version minima.

La solucion correcta no es meter reglas aproximadas en prompts. La solucion es enriquecer el schema con datos verificables y extender el motor. El modelo actual esta preparado para crecer, pero exige disciplina: toda nueva categoria debe atravesar todo el sistema.
