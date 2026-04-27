# 10 - Frontend y sistema de diseño

## Objetivo visual

El frontend de PC Selector 1.0 busca claridad operacional. No es una landing decorativa ni una app de entretenimiento. Es una herramienta de compra de hardware. Por eso el diseño favorece grillas, jerarquia limpia, texto legible, botones compactos, paneles laterales y feedback contextual.

La marca visual se apoya en tokens definidos en `app/globals.css`: colores de texto, fondos, bordes, acento, radios y botones. Tailwind se usa para componer rapidamente sin perder consistencia.

## Layout global

`app/layout.tsx` monta header, footer, contenido, proveedor de carrito y asistente. Esta estructura garantiza que navegacion, carrito y Chipi esten presentes de forma global.

El header es una pieza funcional: enlaces principales, control de carrito y control del asistente. No debe crecer hasta convertirse en panel de gestion. El footer recoge enlaces corporativos, categorias y rutas legales.

## Home

La home presenta el producto y rutas hacia categorias. Su papel es orientar, no explicar todo. Debe mostrar rapidamente que PC Selector vende componentes y ofrece builder/asistente.

La decision de no convertir la home en una landing extensa responde al tipo de producto: el usuario quiere entrar a comprar, construir o preguntar. El hero debe invitar a accion.

## Tienda

La tienda usa una sidebar de filtros y grilla de productos. La sidebar queda fija en escritorio para facilitar iteracion. La grilla usa tarjetas con imagen, nombre, marca, tipo, descripcion breve, precio y boton de carrito.

El diseño de tarjeta prioriza comparacion: nombre y precio arriba, metadatos debajo, descripcion limitada. Imagen contenida, no dramatizada. En ecommerce tecnico, el exceso visual puede dificultar comparar.

## Builder

El builder usa una estructura de pasos. Cada paso tiene titulo, subtitulo, tarjetas de productos y estado de compatibilidad. La barra de pasos convierte una tarea compleja en una secuencia.

La UI no explica todas las reglas con parrafos. Prefiere mostrar compatibilidad mediante orden, badges y mensajes breves. Esto reduce carga cognitiva.

## Asistente

Chipi se presenta como panel lateral en desktop y overlay en mobile. Esta decision evita que el chat compita con la pagina principal. El usuario puede mantener contexto visual mientras conversa.

Los mensajes se renderizan como burbujas sencillas. Las respuestas estructuradas usan `BuildCard` o `ComponentCard`, no texto plano. Esto permite acciones: cargar build, ver producto, añadir al carrito.

## Paginas corporativas

`CompanyPage` centraliza about, privacy, contact y terms. Usa un hero tipografico y secciones de texto. Los parrafos se ampliaron para dar mas cuerpo editorial y evitar paginas legales demasiado escuetas.

Centralizar el layout reduce repeticion y mantiene consistencia. El contenido vive en cada pagina porque es copy especifico, no datos compartidos.

## Botones e interacciones

El sistema usa clases como `btn-primary`, `btn-secondary`, `input-base`. Estas utilidades dan consistencia sin obligar a crear componentes para cada boton. En 1.0 es una decision equilibrada.

Los controles icon-only del header se prueban para evitar regresiones. El icono de IA abre Chipi mediante evento global; el carrito se gestiona desde estado compartido.

## Responsive

La UI considera desktop y mobile, especialmente en asistente y grillas. El builder y la tienda pueden mejorar en mobile, pero la base existe. El asistente cambia a overlay para evitar un sidebar estrecho inutilizable.

## Accesibilidad

Hay labels en filtros, `aria-label` en botones icon-only y roles basicos en mensajes de carga. La accesibilidad 1.0 es razonable pero no exhaustiva. Futuras versiones deberian auditar foco, navegacion por teclado, contraste y anuncios de estado.

## Por que Tailwind

Tailwind permite construir interfaces densas sin saltar constantemente entre TSX y CSS. El riesgo es acumular clases largas. PC Selector lo mitiga con tokens globales y utilidades comunes.

Un sistema de componentes mas formal podria aparecer despues: `Button`, `Input`, `ProductGrid`, `Sidebar`, `Panel`. En 1.0, abstraer antes de estabilizar patrones podria generar rigidez.

## Riesgos

Algunos componentes son grandes, especialmente `pc-builder.tsx` y `ai-assistant.tsx`. Desde una perspectiva de diseño de frontend, convendra extraer subcomponentes y hooks si se añaden mas estados.

Otro riesgo es que los labels de tipos tecnicos no esten plenamente localizados. El dominio mezcla enums internos y texto usuario. Una capa de presentacion de labels seria una mejora limpia.

## Principio de evolucion

Cada mejora visual debe proteger la tarea principal. En PC Selector, belleza no significa ornamento; significa que el usuario entienda mejor que esta comprando y por que.
