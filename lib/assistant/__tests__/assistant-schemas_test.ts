import test from "node:test";
import assert from "node:assert/strict";
import {
  AssistantFinalResponseSchema,
  normalizeAssistantResponse,
} from "../assistant-schemas";

test("accepts a minimal final response", () => {
  const parsed = AssistantFinalResponseSchema.parse({
    answer: "¡Hola! ¿En qué puedo ayudarte?",
    references: [],
    messageType: "unknown",
  });

  assert.equal(parsed.answer, "¡Hola! ¿En qué puedo ayudarte?");
  assert.deepEqual(parsed.references, []);
  assert.equal(parsed.messageType, "unknown");
});

test("normalizes invalid final model output into a safe response", () => {
  const normalized = normalizeAssistantResponse("Texto libre del modelo");

  assert.equal(normalized.answer, "Texto libre del modelo");
  assert.deepEqual(normalized.references, []);
  assert.equal(normalized.messageType, "unknown");
});

test("normalizes empty model output into a friendly fallback", () => {
  const normalized = normalizeAssistantResponse("");

  assert.equal(
    normalized.answer,
    "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?"
  );
  assert.equal(normalized.messageType, "unknown");
});

test("normalizes blank object answers into a friendly fallback", () => {
  const normalized = normalizeAssistantResponse({
    answer: "   ",
    references: [],
    messageType: "unknown",
  });

  assert.equal(
    normalized.answer,
    "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?"
  );
  assert.equal(normalized.messageType, "unknown");
});

test("does not pass through invalid catalog results", () => {
  const normalized = normalizeAssistantResponse({
    answer: "Encontré una opción.",
    references: [],
    messageType: "catalog",
    catalogResults: [{ id: "cpu-1", name: "CPU incompleta" }],
  });

  assert.equal(
    normalized.answer,
    "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?"
  );
  assert.equal("catalogResults" in normalized, false);
});
