import type { AgentResponse, PersonalityType } from "@/lib/types";
import type { BuildMessage } from "@/lib/types";
import { GUIDE_PERSONALITY_PROMPT } from "@/lib/agent/personalities";
import { NimLLMAdapter, type LLMInterface } from "./llm";
import type { AgentConfig } from "@/lib/agent/agent-config";
import { getDefaultAgentConfig } from "@/lib/agent/agent-config";
import type { AgentContext, AgentLogger, Message, ToolCall, ToolResult } from "@/lib/agent/types";
import { ToolExecutor } from "@/lib/agent/tool-executor";
import { UnifiedLogger } from "@/lib/agent/logger";
import { TimeoutError, withTimeout } from "@/lib/agent/timeout-manager";
import { ASSISTANT_TOOLS } from "./tool-registry";
import { normalizeAssistantResponse } from "./assistant-schemas";

const DEFAULT_MAX_TOOL_ROUNDS = 4;
const MAX_TOOL_CALLS_PER_ROUND = 4;

const SYSTEM_PROMPT = [
  "Chipi, asistente general de tienda PC. ES siempre. Estilo Guía.",
  "Ayuda con pantalla/página actual, carrito, FAQ, catálogo, compatibilidad, pedidos y builds.",
  "Usa tools cuando respondan con datos reales: página, carrito, FAQ, precio, stock, producto, pedido, compat/build.",
  "No inventes. Si falta dato clave -> 1 pregunta breve.",
  "Solo genera builds cuando pidan configurar un PC o den uso+presupuesto.",
  "JSON final solo: answer,references,messageType + opcionales builds/components/builderPayload/navigation.",
].join("\n");

export interface AssistantOrchestratorOptions {
  llm?: LLMInterface;
  toolExecutor?: ToolExecutor;
  logger?: AgentLogger;
  config?: AgentConfig;
  maxToolRounds?: number;
}

export interface AssistantRequest {
  question: string;
  history: Message[];
  context: AgentContext;
  personality: PersonalityType;
}

export class AssistantOrchestrator {
  private readonly llm: LLMInterface;
  private readonly toolExecutor: ToolExecutor;
  private readonly logger: AgentLogger;
  private readonly config: AgentConfig;
  private readonly maxToolRounds: number;

  constructor(options: AssistantOrchestratorOptions = {}) {
    this.config = options.config ?? getDefaultAgentConfig();
    this.logger = options.logger ?? new UnifiedLogger("assistant-orchestrator");
    this.llm = options.llm ?? new NimLLMAdapter(
      undefined,
      undefined,
      this.config.timeouts.llmTimeoutMs,
      this.config.model
    );
    this.toolExecutor = options.toolExecutor ?? new ToolExecutor(this.config.timeouts.toolTimeoutMs);
    this.maxToolRounds = options.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;
  }

  async handleRequest(request: AssistantRequest): Promise<AgentResponse> {
    try {
      return await withTimeout(
        this.runToolLoop(request),
        {
          timeoutMs: this.config.timeouts.globalTimeoutMs,
          operation: "assistant-orchestrator",
        }
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.warn("Assistant request timed out", { timeoutMs: this.config.timeouts.globalTimeoutMs });
        return {
          answer: "Estoy tardando más de lo esperado. Prueba a reformular la pregunta o vuelve a intentarlo en unos segundos.",
          references: [],
          messageType: "unknown",
        };
      }

      this.logger.error(
        "Assistant request failed",
        error instanceof Error ? error : new Error(String(error))
      );

      if (error instanceof Error && error.message === "Empty response from LLM") {
        return {
          answer: "El modelo no devolvió una respuesta válida esta vez. Puedes intentarlo de nuevo o probar con un modelo NIM más estable para tool-calling.",
          references: [],
          messageType: "unknown",
        };
      }

      return {
        answer: "No pude preparar una respuesta completa. ¿Puedes reformular tu pregunta?",
        references: [],
        messageType: "unknown",
      };
    }
  }

  private async runToolLoop(request: AssistantRequest): Promise<AgentResponse> {
    const messages = this.buildInitialMessages(request);
    const generatedBuilds: BuildMessage[] = [];

    for (let round = 0; round < this.maxToolRounds; round++) {
      const completion = await this.llm.completeWithTools({
        system: this.buildSystemPrompt(),
        messages,
        tools: ASSISTANT_TOOLS,
        temperature: 0.2,
        max_tokens: 1400,
      });

      const toolCalls = completion.toolCalls ?? [];
      if (toolCalls.length === 0) {
        return this.attachGeneratedBuilds(
          normalizeAssistantResponse(completion.content),
          generatedBuilds
        );
      }

      messages.push({ role: "assistant", content: completion.content || JSON.stringify({ toolCalls }) });
      const toolResults = await this.executeToolCalls(toolCalls, request.context, generatedBuilds);
      messages.push({
        role: "user",
        content: JSON.stringify({ toolResults }),
      });
    }

    return {
      answer: "Para ayudarte bien necesito acotar un poco más la petición. ¿Puedes darme más detalles sobre presupuesto, uso principal o preferencias?",
      references: [],
      messageType: "clarify",
      clarifyQuestion: "¿Qué presupuesto, uso principal y preferencias quieres que tenga en cuenta?",
    };
  }

  private buildInitialMessages(request: AssistantRequest): Message[] {
    return [
      ...request.history.slice(-8),
      {
        role: "user",
        content: JSON.stringify({
          question: request.question,
          personality: "educational",
          context: request.context,
        }),
      },
    ];
  }

  private buildSystemPrompt(): string {
    return `${SYSTEM_PROMPT}\n${GUIDE_PERSONALITY_PROMPT}`;
  }

  private async executeToolCalls(
    toolCalls: ToolCall[],
    context: AgentContext,
    generatedBuilds: BuildMessage[]
  ): Promise<Array<{ id: string; name: string; arguments: Record<string, unknown>; result: ToolResult }>> {
    const results: Array<{ id: string; name: string; arguments: Record<string, unknown>; result: ToolResult }> = [];

    for (const call of toolCalls.slice(0, MAX_TOOL_CALLS_PER_ROUND)) {
      try {
        const result = await this.toolExecutor.execute(call.name, call.arguments, context);
        this.collectGeneratedBuilds(call.name, result, generatedBuilds);
        results.push({ id: call.id, name: call.name, arguments: call.arguments, result });
      } catch (error) {
        this.logger.warn("Tool call failed", {
          tool: call.name,
          error: error instanceof Error ? error.message : String(error),
        });
        results.push({
          id: call.id,
          name: call.name,
          arguments: call.arguments,
          result: {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    return results;
  }

  private collectGeneratedBuilds(
    toolName: string,
    result: ToolResult,
    generatedBuilds: BuildMessage[]
  ): void {
    if (toolName !== "generate_build" || !result.success) {
      return;
    }

    const data = result.data as { builds?: unknown } | undefined;
    if (!Array.isArray(data?.builds)) {
      return;
    }

    generatedBuilds.splice(0, generatedBuilds.length, ...(data.builds as BuildMessage[]));
  }

  private attachGeneratedBuilds(response: AgentResponse, generatedBuilds: BuildMessage[]): AgentResponse {
    if (response.builds?.length || generatedBuilds.length === 0) {
      return response;
    }

    return {
      ...response,
      messageType: "build",
      builds: generatedBuilds,
    };
  }
}
