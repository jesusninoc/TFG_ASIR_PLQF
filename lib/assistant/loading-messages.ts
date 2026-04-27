const GENERAL_LOADING_MESSAGES = [
  "Leyendo tu pregunta...",
  "Revisando el contexto de la tienda...",
  "Preparando la respuesta...",
];

const BUILD_LOADING_MESSAGES = [
  "Construyendo una configuración compatible...",
  "Comprobando presupuesto, stock y compatibilidad...",
  "Preparando las mejores opciones...",
];

const CART_LOADING_MESSAGES = [
  "Revisando tu carrito...",
  "Comprobando compatibilidad entre componentes...",
  "Calculando el encaje de tu selección...",
];

const FAQ_LOADING_MESSAGES = [
  "Buscando en la base de conocimiento...",
  "Revisando la información de tienda...",
  "Preparando una respuesta clara...",
];

const CATALOG_LOADING_MESSAGES = [
  "Consultando el catálogo...",
  "Revisando precios y stock...",
  "Filtrando componentes relevantes...",
];

const ORDER_LOADING_MESSAGES = [
  "Buscando información del pedido...",
  "Revisando el estado de compra...",
  "Preparando el resumen del pedido...",
];

const BUILD_TERMS = [
  "pc",
  "build",
  "configuracion",
  "configuración",
  "montar",
  "gaming",
  "presupuesto",
  "ordenador",
];

const CART_TERMS = ["carrito", "cesta", "llevo", "compatible", "compatibilidad", "encaja"];
const FAQ_TERMS = ["faq", "garantia", "garantía", "devolucion", "devolución", "envio", "envío", "politica", "política"];
const CATALOG_TERMS = ["catalogo", "catálogo", "stock", "precio", "producto", "componentes", "gpu", "cpu", "ram", "ssd"];
const ORDER_TERMS = ["pedido", "orden", "tracking", "seguimiento", "compra"];

export function getAssistantLoadingMessages(question: string): string[] {
  const normalized = question.trim().toLowerCase();

  if (containsAny(normalized, ORDER_TERMS)) {
    return ORDER_LOADING_MESSAGES;
  }

  if (containsAny(normalized, CART_TERMS)) {
    return CART_LOADING_MESSAGES;
  }

  if (containsAny(normalized, FAQ_TERMS)) {
    return FAQ_LOADING_MESSAGES;
  }

  if (containsAny(normalized, BUILD_TERMS)) {
    return BUILD_LOADING_MESSAGES;
  }

  if (containsAny(normalized, CATALOG_TERMS)) {
    return CATALOG_LOADING_MESSAGES;
  }

  return GENERAL_LOADING_MESSAGES;
}

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}
