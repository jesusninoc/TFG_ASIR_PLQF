import type { Metadata } from "next";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = {
  title: "Privacidad | PC Selector",
  description: "Política de privacidad de PC Selector: datos, carrito, pedidos, asistente IA y pagos.",
};

export default function PrivacyPage() {
  return (
    <CompanyPage
      eyebrow="Privacidad"
      title="Tus datos, explicados claro."
      intro="Esta página resume cómo PC Selector trata la información necesaria para mostrar productos, gestionar pedidos, mantener el carrito y ofrecer asistencia de hardware. Queremos que sepas qué datos intervienen, para qué se usan y qué opciones tienes si necesitas revisarlos."
      sections={[
        {
          title: "Datos que podemos tratar",
          body: (
            <>
              <p>
                Tratamos los datos necesarios para que la tienda funcione de forma fiable: mostrar productos, recordar el carrito, tramitar pedidos, responder consultas y mantener la seguridad del servicio. La finalidad es que puedas navegar, comprar y pedir ayuda sin repetir información en cada paso.
              </p>
              <p>
                También podemos usar información de navegación dentro de PC Selector para entender qué producto estás viendo o qué tienes en el carrito cuando pides ayuda al asistente. Ese contexto permite respuestas más útiles, menos genéricas y mejor conectadas con la configuración que estás construyendo.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Datos de contacto necesarios para gestionar pedidos o responder consultas.</li>
                <li>Contenido del carrito, productos vistos y contexto de navegación dentro de la tienda.</li>
                <li>Mensajes enviados al asistente IA para poder responder y mejorar la experiencia.</li>
                <li>Información técnica básica como logs de errores, rendimiento y seguridad.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Pagos y pedidos",
          body: (
            <>
              <p>
                Los pagos se procesan mediante Stripe, un proveedor especializado en cobros online. PC Selector no almacena números completos de tarjeta ni credenciales bancarias sensibles; esa información se introduce y gestiona directamente dentro de la infraestructura segura del proveedor de pagos.
              </p>
              <p>
                Conservamos los datos de pedido necesarios para confirmar compras, gestionar incidencias, cumplir obligaciones fiscales y ofrecer soporte postventa. Esto puede incluir productos comprados, importes, estado del pedido, datos de contacto y la información mínima que nos permita identificar correctamente la operación.
              </p>
              <p>
                Si se produce un pago fallido o una revisión antifraude, podremos conservar registros técnicos mínimos para diagnosticar el problema y proteger tanto al cliente como a la tienda. Estos registros ayudan a detectar errores, evitar duplicidades y responder con más precisión si contactas con soporte.
              </p>
            </>
          ),
        },
        {
          title: "Uso del asistente IA",
          body: (
            <>
              <p>
                Chipi puede recibir tu pregunta, historial reciente de conversación, página actual y contenido del carrito para darte una respuesta contextual. Esa información se usa para entender mejor la consulta, evitar pedirte datos que la tienda ya conoce y relacionar la respuesta con productos concretos.
              </p>
              <p>
                El asistente está pensado para consultas de hardware, catálogo, compatibilidad, pedidos y dudas generales de tienda. No deberías compartir contraseñas, documentos sensibles, claves privadas ni datos completos de pago en el chat, aunque estés tratando una incidencia relacionada con una compra.
              </p>
              <p>
                Podemos revisar respuestas agregadas o registros técnicos para mejorar la calidad del servicio, corregir errores y reforzar límites de seguridad del asistente. Cuando analizamos ese funcionamiento, buscamos patrones de mejora del sistema y no conversaciones privadas fuera de su contexto de soporte.
              </p>
            </>
          ),
        },
        {
          title: "Tus opciones",
          body: (
            <>
              <p>
                Puedes solicitar acceso, rectificación o eliminación de datos escribiendo a soporte@pcselector.example. Intentaremos responder de forma clara, pedir solo la información necesaria para identificarte y gestionar la solicitud dentro de los plazos razonables para este tipo de casos.
              </p>
              <p>
                Algunas solicitudes pueden estar limitadas por obligaciones legales, antifraude o de conservación de pedidos. Por ejemplo, una factura o registro de compra puede tener que mantenerse durante un periodo determinado, incluso aunque eliminemos otros datos que ya no sean necesarios.
              </p>
              <p>
                Si solo quieres limpiar el carrito o empezar de cero una conversación con Chipi, puedes hacerlo desde la interfaz sin necesidad de contactar con soporte. Esas acciones están pensadas para darte control inmediato sobre la experiencia cotidiana dentro de la tienda.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
