import type { Metadata } from "next";
import Link from "next/link";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = {
  title: "Contacto | PC Selector",
  description: "Contacta con PC Selector para ayuda con pedidos, compatibilidad, garantías o soporte de compra.",
};

export default function ContactPage() {
  return (
    <CompanyPage
      eyebrow="Contacto"
      title="Hablemos de tu próximo PC."
      intro="Si necesitas ayuda con una compra, un pedido o una configuración, estamos aquí para orientarte antes y después de pasar por caja. Cuanta más información compartas sobre tu uso, presupuesto y dudas, más precisa podrá ser nuestra respuesta."
      sections={[
        {
          title: "Atención al cliente",
          body: (
            <div className="space-y-3">
              <p>
                Para consultas generales, dudas sobre productos o seguimiento de pedidos, escríbenos a{" "}
                <a className="font-semibold text-[var(--accent)]" href="mailto:soporte@pcselector.example">
                  soporte@pcselector.example
                </a>
                . Este canal es el mejor punto de entrada si necesitas comparar componentes, revisar una configuración concreta o resolver una incidencia después de comprar.
              </p>
              <p>
                Nuestro horario de atención es de lunes a viernes, de 9:00 a 18:00, hora peninsular española. Si escribes fuera de ese tramo, recibiremos igualmente tu mensaje y lo revisaremos en el siguiente bloque disponible de soporte.
              </p>
              <p>
                Intentamos responder con contexto útil desde el primer mensaje, evitando cadenas largas de preguntas cuando no hacen falta. Si nos indicas qué estás intentando montar, qué presupuesto manejas y qué componentes ya tienes en mente, podremos orientarte con más precisión.
              </p>
            </div>
          ),
        },
        {
          title: "Antes de comprar",
          body: (
            <>
              <p>
                Puedes usar el <Link href="/builder" className="font-semibold text-[var(--accent)]">PC Builder</Link> o abrir el asistente IA para revisar compatibilidad, presupuesto y alternativas antes de tomar una decisión. Si tienes una configuración empezada, incluye los componentes en tu mensaje para acelerar la respuesta y evitar recomendaciones repetidas.
              </p>
              <p>
                Si estás comparando dos productos, cuéntanos el uso que les vas a dar y qué te preocupa de cada opción. No siempre gana el componente con mejores especificaciones: consumo, plataforma, memoria, caja, fuente, ruido y posibilidades de actualización también importan.
              </p>
              <p>
                Para compras profesionales o equipos críticos, podemos ayudarte a preparar una lista más conservadora y fácil de mantener. En esos casos priorizamos estabilidad, garantía, disponibilidad, facilidad de sustitución y margen para resolver incidencias sin depender de piezas difíciles de encontrar.
              </p>
            </>
          ),
        },
        {
          title: "Pedidos y soporte",
          body: (
            <>
              <p>
                Para revisar un pedido necesitaremos identificar la compra de forma segura y sin pedir más datos de los necesarios. Lo más rápido es que nos indiques el email utilizado, la fecha aproximada y cualquier referencia que aparezca en la confirmación.
              </p>
              <p>
                En incidencias de compatibilidad o producto, los nombres exactos ayudan mucho porque muchos componentes tienen variantes muy parecidas. Si puedes, incluye enlaces internos de la tienda o capturas donde se vea el modelo completo, la capacidad, la revisión o cualquier detalle relevante.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Incluye el email de compra si preguntas por un pedido.</li>
                <li>Adjunta capturas o nombres exactos de producto si consultas compatibilidad.</li>
                <li>Para incidencias de pago, no envíes datos completos de tarjeta; Stripe gestiona el pago de forma segura.</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
