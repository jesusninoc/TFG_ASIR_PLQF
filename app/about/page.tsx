import type { Metadata } from "next";
import { CompanyPage } from "@/components/company-page";

export const metadata: Metadata = {
  title: "Acerca de | PC Selector",
  description: "Conoce PC Selector, la tienda de componentes con builder inteligente y asistencia IA.",
};

export default function AboutPage() {
  return (
    <CompanyPage
      eyebrow="Acerca de"
      title="Hardware elegido con criterio."
      intro="PC Selector nace para que comprar componentes no sea una apuesta ni una tarde perdida comparando pestañas. Unimos catálogo, compatibilidad y asistencia inteligente para ayudarte a montar equipos equilibrados, con stock real y explicaciones que puedas usar antes de decidir."
      sections={[
        {
          title: "Qué hacemos",
          body: (
            <>
              <p>
                Somos una tienda especializada en componentes de PC, creada para acompañarte desde la primera idea hasta una configuración lista para comprar. Nuestro objetivo es que puedas comparar piezas, validar compatibilidad y convertir necesidades sueltas en un equipo claro, equilibrado y coherente.
              </p>
              <p>
                La experiencia está pensada para reducir fricción en los momentos donde normalmente aparecen las dudas. Puedes navegar por catálogo, revisar productos concretos, montar una build desde cero o pedir ayuda al asistente cuando no tengas claro qué elegir, qué cambiar o qué merece la pena mantener.
              </p>
              <p>
                Damos prioridad a recomendaciones prácticas y accionables: componentes disponibles, precios visibles, explicaciones comprensibles y un camino directo desde la selección hasta el checkout. Queremos que entiendas por qué cada pieza encaja, no solo que termines con una lista cerrada.
              </p>
            </>
          ),
        },
        {
          title: "Por qué existe Chipi",
          body: (
            <>
              <p>
                Chipi, nuestro asistente de hardware, entiende la página que estás viendo, puede revisar tu carrito y consulta la base de conocimiento de la tienda. Está pensado para explicar decisiones técnicas en lenguaje claro, conectando rendimiento, compatibilidad y presupuesto sin abrumarte con jerga innecesaria.
              </p>
              <p>
                Su trabajo no es venderte siempre lo más caro, sino ayudarte a entender qué encaja con tu uso real y qué mejoras notarás de verdad. Si buscas gaming, edición, oficina o una estación de trabajo, Chipi puede adaptar la conversación y pedir solo los datos importantes.
              </p>
              <p>
                También sirve como segunda opinión cuando ya tienes una build medio decidida. Puede detectar incompatibilidades, sugerir alternativas con stock y resumir por qué un componente tiene sentido dentro de una configuración completa, especialmente cuando dos opciones parecen iguales sobre el papel.
              </p>
            </>
          ),
        },
        {
          title: "Nuestro enfoque",
          body: (
            <>
              <p>
                Creemos que una buena recomendación empieza por entender el contexto completo: presupuesto, uso principal, monitor, expectativas de rendimiento y margen para futuras mejoras. No es lo mismo montar un PC silencioso para trabajar que una torre orientada a juegos competitivos o creación de contenido.
              </p>
              <p>
                Por eso combinamos reglas de compatibilidad, catálogo actualizado y explicación humana en cada recomendación importante. Preferimos mostrar ventajas, límites y alternativas antes que dar una respuesta cerrada sin matices, porque una buena compra también depende de saber a qué estás renunciando.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Recomendaciones basadas en uso, presupuesto y compatibilidad.</li>
                <li>Catálogo conectado al stock actual de la tienda.</li>
                <li>Explicaciones transparentes sobre ventajas, límites y alternativas.</li>
                <li>Proceso de compra integrado con pagos seguros mediante Stripe.</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
