import test from "node:test";
import assert from "node:assert/strict";
import { AssistantOrchestrator } from "../assistant-orchestrator";
import type { LLMCompleteParams, LLMInterface, LLMResponse, ToolCallingResponse } from "../llm";
import type { AgentContext, ToolCall, ToolResult } from "@/lib/agent/types";
import type { ToolExecutor } from "@/lib/agent/tool-executor";
import type { PersonalityType } from "@/lib/types";

class FakeLLM implements LLMInterface {
  readonly systems: string[] = [];
  readonly messageBatches: Array<LLMCompleteParams["messages"]> = [];

  constructor(private readonly responses: ToolCallingResponse[]) {}

  async complete(): Promise<LLMResponse> {
    throw new Error("complete should not be called");
  }

  async completeWithTools(params: LLMCompleteParams): Promise<ToolCallingResponse> {
    this.systems.push(params.system ?? "");
    this.messageBatches.push(params.messages ?? []);
    const response = this.responses.shift();
    if (!response) {
      throw new Error("No fake LLM response queued");
    }
    return response;
  }
}

class FakeToolExecutor {
  readonly calls: ToolCall[] = [];

  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    this.calls.push({ id: `${name}-${this.calls.length + 1}`, name, arguments: args });
    if (name === "generate_build") {
      return {
        success: true,
        data: {
          answer: "Se han generado 1 builds compatibles.",
          builds: [
            {
              tier: "premium",
              answer: "Build premium.",
              totalPriceCents: 253300,
              buildIds: { cpu: "cpu-7950x3d" },
              componentRecommendations: [
                {
                  id: "cpu-7950x3d",
                  name: "AMD Ryzen 9 7950X3D",
                  image: "/cpu.png",
                  priceCents: 69900,
                  componentType: "cpu",
                  brand: "AMD",
                  keySpecs: ["16C/32T"],
                  reasoning: "Seleccionado para gaming.",
                  productLink: "/product/amd-ryzen-9-7950x3d",
                },
              ],
            },
          ],
        },
      };
    }

    return {
      success: true,
      data: { tool: name, args },
    };
  }
}

const context: AgentContext = { currentPage: "/" };
const legacyPersonality = "gamer" as unknown as PersonalityType;

test("executes multiple tool rounds before returning final response", async () => {
  const toolExecutor = new FakeToolExecutor();
  const llm = new FakeLLM([
    {
      content: "",
      toolCalls: [{ id: "call-1", name: "search_catalog", arguments: { query: "gaming pc" } }],
    },
    {
      content: "",
      toolCalls: [{ id: "call-2", name: "generate_build", arguments: { tier: "mid" } }],
    },
    {
      content: JSON.stringify({
        answer: "Te propongo una configuración equilibrada.",
        references: [],
        messageType: "build",
      }),
    },
  ]);

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: toolExecutor as unknown as ToolExecutor,
  });

  const response = await orchestrator.handleRequest({
    question: "Quiero un PC gaming equilibrado",
    history: [],
    context,
    personality: "educational",
  });

  assert.equal(response.answer, "Te propongo una configuración equilibrada.");
  assert.equal(response.messageType, "build");
  assert.deepEqual(
    toolExecutor.calls.map((call) => call.name),
    ["search_catalog", "generate_build"]
  );
});

test("answers greetings without calling tools", async () => {
  const toolExecutor = new FakeToolExecutor();
  const llm = new FakeLLM([
    {
      content: JSON.stringify({
        answer: "¡Hola! ¿En qué puedo ayudarte?",
        references: [],
        messageType: "unknown",
      }),
    },
  ]);

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: toolExecutor as unknown as ToolExecutor,
  });

  const response = await orchestrator.handleRequest({
    question: "Hola",
    history: [],
    context,
    personality: "educational",
  });

  assert.equal(response.answer, "¡Hola! ¿En qué puedo ayudarte?");
  assert.deepEqual(toolExecutor.calls, []);
});

test("returns a helpful fallback when the model response is empty", async () => {
  const toolExecutor = new FakeToolExecutor();
  const llm: LLMInterface = {
    async complete(): Promise<LLMResponse> {
      throw new Error("complete should not be called");
    },
    async completeWithTools(): Promise<ToolCallingResponse> {
      throw new Error("Empty response from LLM");
    },
  };

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: toolExecutor as unknown as ToolExecutor,
  });

  const response = await orchestrator.handleRequest({
    question: "Tengo 1500 euros de presupuesto",
    history: [],
    context,
    personality: "educational",
  });

  assert.equal(response.messageType, "unknown");
  assert.match(response.answer, /modelo no devolvió una respuesta válida/i);
});

test("preserves generated builds when final model response omits build payload", async () => {
  const toolExecutor = new FakeToolExecutor();
  const llm = new FakeLLM([
    {
      content: "",
      toolCalls: [{ id: "call-1", name: "generate_build", arguments: { budgetCents: 300000 } }],
    },
    {
      content: JSON.stringify({
        answer: "Con tu presupuesto de 3000 euros, he generado una configuración premium.",
        references: [
          {
            id: "cpu-7950x3d",
            name: "AMD Ryzen 9 7950X3D",
            productLink: "/product/amd-ryzen-9-7950x3d",
          },
        ],
        messageType: "build",
      }),
    },
  ]);

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: toolExecutor as unknown as ToolExecutor,
  });

  const response = await orchestrator.handleRequest({
    question: "Podrias darme un pc gaming con 3000 euros de presupuesto?",
    history: [],
    context,
    personality: "educational",
  });

  assert.equal(response.messageType, "build");
  assert.equal(response.builds?.length, 1);
  assert.equal(response.builds?.[0]?.componentRecommendations?.[0]?.name, "AMD Ryzen 9 7950X3D");
});

test("sends compact general guide instructions regardless of requested personality", async () => {
  const llm = new FakeLLM([
    {
      content: JSON.stringify({
        answer: "Listo.",
        references: [],
        messageType: "unknown",
      }),
    },
  ]);

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: new FakeToolExecutor() as unknown as ToolExecutor,
  });

  await orchestrator.handleRequest({
    question: "Hola",
    history: [],
    context,
    personality: legacyPersonality,
  });

  const system = llm.systems[0] ?? "";
  assert.match(system, /ES siempre/);
  assert.match(system, /JSON final/);
  assert.match(system, /No inventes/);
  assert.match(system, /Guía/);
  assert.match(system, /pantalla|página/i);
  assert.match(system, /carrito/i);
  assert.match(system, /FAQ/i);
  assert.doesNotMatch(system, /Gamer/);
  assert.doesNotMatch(system, /Comercial/);
  assert.doesNotMatch(system, /Técnico/);
  assert.ok(system.length < 1000, `system prompt too long: ${system.length}`);
});

test("includes page and cart context in the user payload", async () => {
  const llm = new FakeLLM([
    {
      content: JSON.stringify({
        answer: "Tienes una GPU en el carrito y estás viendo una CPU.",
        references: [],
        messageType: "unknown",
      }),
    },
  ]);

  const orchestrator = new AssistantOrchestrator({
    llm,
    toolExecutor: new FakeToolExecutor() as unknown as ToolExecutor,
  });

  await orchestrator.handleRequest({
    question: "¿Esto encaja con lo que estoy viendo?",
    history: [],
    context: {
      currentPage: "/product/amd-ryzen-7-7800x3d",
      currentProductId: "amd-ryzen-7-7800x3d",
      cart: [
        {
          productId: "gpu-4070",
          name: "RTX 4070",
          priceCents: 62900,
          quantity: 1,
          type: "gpu",
        },
      ],
    },
    personality: legacyPersonality,
  });

  const firstBatch = llm.messageBatches[0] ?? [];
  const finalUserMessage = firstBatch.at(-1);
  assert.equal(finalUserMessage?.role, "user");

  const payload = JSON.parse(finalUserMessage?.content ?? "{}");
  assert.equal(payload.context.currentPage, "/product/amd-ryzen-7-7800x3d");
  assert.equal(payload.context.currentProductId, "amd-ryzen-7-7800x3d");
  assert.equal(payload.context.cart[0].name, "RTX 4070");
  assert.equal(payload.personality, "educational");
});
