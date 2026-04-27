import type { Metadata } from "next";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = {
  title: "Términos y condiciones | PC Selector",
  description: "Términos de uso y condiciones de compra de PC Selector.",
};

export default function TermsPage() {
  return (
    <CompanyPage
      eyebrow="Términos y condiciones"
      title="Reglas claras para comprar mejor."
      intro="Estos términos resumen las condiciones de uso de PC Selector, la compra de componentes y el uso del builder y del asistente IA. La idea es que las reglas sean comprensibles antes de comprar, especialmente cuando intervienen stock, pagos, compatibilidad y recomendaciones técnicas."
      sections={[
        {
          title: "Uso de la tienda",
          body: (
            <>
              <p>
                PC Selector permite explorar componentes, crear configuraciones, revisar compatibilidad y tramitar compras dentro de una experiencia guiada. La tienda está diseñada para uso personal o profesional legítimo, siempre dentro de un comportamiento razonable, respetuoso y alineado con el funcionamiento normal del servicio.
              </p>
              <p>
                No está permitido manipular precios, stock, pagos, formularios, sistemas de seguridad o cualquier parte técnica del servicio. Tampoco se permite usar automatizaciones abusivas, scraping agresivo o patrones de uso que degraden la experiencia de otros usuarios o comprometan la estabilidad de la tienda.
              </p>
              <p>
                Podemos limitar, suspender o bloquear el acceso si detectamos uso fraudulento, intentos de explotación técnica o actividad que ponga en riesgo la tienda, los clientes o los proveedores de pago. Esta medida se aplicaría para proteger el servicio y resolver la incidencia con la menor fricción posible.
              </p>
            </>
          ),
        },
        {
          title: "Precios, stock y disponibilidad",
          body: (
            <>
              <p>
                Mostramos precios y disponibilidad con la información actual del catálogo y procuramos que cada ficha sea lo más clara posible. Aun así, el stock puede cambiar durante el proceso de compra, especialmente en componentes con alta demanda, unidades limitadas o reposiciones irregulares.
              </p>
              <p>
                Si un producto deja de estar disponible después de iniciar el pedido, podremos proponerte una alternativa compatible, esperar reposición cuando sea posible o cancelar esa parte de la compra. En todos los casos intentaremos explicarte el impacto sobre precio, rendimiento y compatibilidad.
              </p>
              <p>
                En caso de error evidente de precio, descripción o disponibilidad, nos reservamos la posibilidad de corregir la información y contactar contigo antes de confirmar el envío. El objetivo es evitar pedidos basados en datos manifiestamente incorrectos y darte una opción clara antes de continuar.
              </p>
            </>
          ),
        },
        {
          title: "Pagos, pedidos y facturación",
          body: (
            <>
              <p>
                Los pagos se procesan a través de Stripe, que gestiona la parte sensible de la transacción. Un pedido se considera confirmado cuando el pago ha sido autorizado y registrado correctamente por el sistema, y cuando los datos mínimos de la compra permiten preparar la operación.
              </p>
              <p>
                Podremos revisar pedidos ante señales de fraude, errores técnicos, inconsistencias en la información de compra o incidencias con la autorización del pago. Esa revisión puede retrasar la confirmación mientras comprobamos que la operación es legítima y que no existe un cargo duplicado o fallido.
              </p>
              <p>
                La factura o justificante de compra se emitirá con los datos facilitados durante el proceso. Es responsabilidad del cliente revisar que la información de contacto y facturación sea correcta antes de finalizar el pedido, especialmente si compra para una empresa o necesita datos fiscales concretos.
              </p>
            </>
          ),
        },
        {
          title: "Devoluciones y garantía",
          body: (
            <>
              <p>
                Las devoluciones y garantías se gestionan conforme a la normativa aplicable y a las condiciones específicas del fabricante o distribuidor. Cada caso puede depender del tipo de producto, su estado, los accesorios incluidos, el embalaje disponible y el tiempo transcurrido desde la compra.
              </p>
              <p>
                El producto debe conservarse en buen estado y con sus accesorios cuando corresponda, para que podamos revisar la incidencia correctamente. En componentes electrónicos, una manipulación incorrecta, daño físico, instalación negligente o uso fuera de especificación puede afectar a la cobertura.
              </p>
              <p>
                Si tienes una incidencia, contacta con soporte antes de enviar nada para evitar envíos innecesarios o incompletos. Te indicaremos los pasos, la información necesaria y las alternativas disponibles según el caso, incluyendo pruebas básicas que puedan acelerar el diagnóstico.
              </p>
            </>
          ),
        },
        {
          title: "Asistente IA y recomendaciones",
          body: (
            <>
              <p>
                Chipi ayuda a interpretar información técnica, carrito, stock y compatibilidad, pero sus respuestas son orientativas y dependen del contexto disponible en cada conversación. La decisión final de compra corresponde al usuario, que debe valorar sus necesidades, presupuesto y preferencias.
              </p>
              <p>
                El asistente puede equivocarse, omitir matices o necesitar datos adicionales cuando la consulta es incompleta o el caso tiene restricciones especiales. Por eso recomendamos revisar siempre las fichas de producto, requisitos del fabricante y necesidades concretas de tu caso antes de confirmar una compra.
              </p>
              <p>
                Para entornos críticos, profesionales o con requisitos muy estrictos, conviene validar la configuración con documentación oficial o soporte especializado antes de comprar. Esto es especialmente importante si dependes de certificaciones, software concreto, disponibilidad continua o compatibilidad con hardware ya instalado.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
