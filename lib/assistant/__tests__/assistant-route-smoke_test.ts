import test from "node:test";
import assert from "node:assert/strict";
import { AssistantRequestSchema } from "@/lib/validation";

test("assistant route payload accepts history and current page context", () => {
  const parsed = AssistantRequestSchema.parse({
    question: "Hola!",
    history: [],
    context: {
      currentPage: "/",
      cart: [],
    },
    personality: "educational",
  });

  assert.equal(parsed.question, "Hola!");
  assert.equal(parsed.context?.currentPage, "/");
});

test("assistant route payload defaults to guide style and ignores legacy style values", () => {
  const parsed = AssistantRequestSchema.parse({
    question: "Hola!",
    history: [],
    context: {
      currentPage: "/shop",
      cart: [],
    },
    personality: "gamer",
  });

  assert.equal(parsed.personality, "educational");
});
