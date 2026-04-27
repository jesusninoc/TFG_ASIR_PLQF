import test from "node:test";
import assert from "node:assert/strict";
import { getAssistantLoadingMessages } from "../loading-messages";

test("uses build-focused loading messages for PC configuration requests", () => {
  const messages = getAssistantLoadingMessages("Quiero un PC gaming por 1500 euros");

  assert.equal(messages.includes("Construyendo una configuración compatible..."), true);
  assert.equal(messages.includes("Comprobando presupuesto, stock y compatibilidad..."), true);
});

test("uses FAQ-focused loading messages for policy questions", () => {
  const messages = getAssistantLoadingMessages("¿Cómo funciona la garantía y las devoluciones?");

  assert.equal(messages.includes("Buscando en la base de conocimiento..."), true);
  assert.equal(messages.includes("Revisando la información de tienda..."), true);
});

test("uses cart-focused loading messages for cart questions", () => {
  const messages = getAssistantLoadingMessages("¿Lo que llevo en el carrito es compatible?");

  assert.equal(messages.includes("Revisando tu carrito..."), true);
  assert.equal(messages.includes("Comprobando compatibilidad entre componentes..."), true);
});
