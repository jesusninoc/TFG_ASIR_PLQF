import { OpenAI } from "openai";
import { CircuitBreaker } from "@/lib/agent/circuit-breaker";
import type { ToolCall, ToolDefinition } from "@/lib/agent/types";

export interface LLMInterface {
  complete(params: LLMCompleteParams): Promise<LLMResponse>;
  completeWithTools(
    params: LLMCompleteParams & { tools: ToolDefinition[] }
  ): Promise<ToolCallingResponse>;
}

export interface LLMCompleteParams {
  system?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  temperature?: number;
  max_tokens?: number;
  responseFormat?: { type: "json" | "text" };
}

export interface LLMResponse {
  content: string;
  finishReason?: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface ToolCallingResponse extends LLMResponse {
  toolCalls?: ToolCall[];
}

export class NimLLMAdapter implements LLMInterface {
  private client: OpenAI;
  private readonly timeoutMs: number;
  private readonly retryConfig: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number };
  private circuitBreaker: CircuitBreaker | null;
  private readonly model: string;

  constructor(apiKey?: string, baseURL?: string, timeoutMs: number = 30000, model?: string) {
    const finalApiKey = apiKey || process.env.NIM_API_KEY;
    if (!finalApiKey) {
      throw new Error("NIM_API_KEY no esta configurada. Define la variable de entorno NIM_API_KEY.");
    }
    this.client = new OpenAI({
      apiKey: finalApiKey,
      baseURL: baseURL || process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1",
    });
    this.timeoutMs = timeoutMs;
    this.model = model || process.env.NIM_MODEL || "stepfun-ai/step-3.5-flash";
    const rawAttempts = parseInt(process.env.NIM_RETRY_MAX_ATTEMPTS || "3", 10);
    const rawBaseDelay = parseInt(process.env.NIM_RETRY_BASE_DELAY || "1000", 10);
    const rawMaxDelay = parseInt(process.env.NIM_RETRY_MAX_DELAY || "10000", 10);
    this.retryConfig = {
      maxAttempts: Number.isNaN(rawAttempts) ? 3 : Math.max(1, rawAttempts),
      baseDelayMs: Number.isNaN(rawBaseDelay) ? 1000 : Math.max(0, rawBaseDelay),
      maxDelayMs: Number.isNaN(rawMaxDelay) ? 10000 : Math.max(100, rawMaxDelay),
    };
    if (process.env.CIRCUIT_BREAKER_ENABLED === "true") {
      this.circuitBreaker = new CircuitBreaker(
        parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || "5", 10),
        parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || "30000", 10),
        1,
        console
      );
    } else {
      this.circuitBreaker = null;
    }
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.name === "TimeoutError") return false;
    }
    if (typeof error === "object" && error !== null) {
      const err = error as { status?: number; code?: string };
      if (err.status && err.status >= 500) return true;
      if (
        err.code &&
        (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET")
      ) {
        return true;
      }
      if (err.status === 429) return true;
    }
    return false;
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        const errorForRetry = err instanceof Error ? err : new Error(String(err));
        if (!this.isRetryableError(errorForRetry)) {
          throw errorForRetry;
        }
        if (attempt >= this.retryConfig.maxAttempts - 1) {
          break;
        }
        const exponentialDelay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const delay = Math.min(exponentialDelay + jitter, this.retryConfig.maxDelayMs);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async complete(params: LLMCompleteParams): Promise<LLMResponse> {
    const operation = () =>
      this.executeWithRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
          if (params.system) {
            messages.push({ role: "system", content: params.system });
          }
          messages.push(...(params.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]));

          const request: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
            model: this.model,
            messages,
            temperature: params.temperature ?? 0.1,
            max_tokens: params.max_tokens ?? 1024,
            stream: false,
          };
          if (params.responseFormat) {
            request.response_format =
              params.responseFormat.type === "json"
                ? { type: "json_object" as const }
                : { type: "text" as const };
          }

          const response = (await this.client.chat.completions.create(request, {
            signal: controller.signal,
          })) as OpenAI.Chat.Completions.ChatCompletion;

          const choice = response.choices?.[0];
          if (!choice) {
            throw new Error("Empty response from LLM");
          }
          return {
            content: choice.message.content || "",
            finishReason: choice.finish_reason,
            usage: {
              promptTokens: response.usage?.prompt_tokens || 0,
              completionTokens: response.usage?.completion_tokens || 0,
            },
          };
        } finally {
          clearTimeout(timeoutId);
        }
      });
    return this.circuitBreaker ? this.circuitBreaker.execute(operation) : operation();
  }

  async completeWithTools(
    params: LLMCompleteParams & { tools: ToolDefinition[] }
  ): Promise<ToolCallingResponse> {
    const operation = () =>
      this.executeWithRetry(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          const openaiTools = params.tools.map((tool) => ({
            type: "function" as const,
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          }));

          const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
          if (params.system) {
            messages.push({ role: "system", content: params.system });
          }
          messages.push(...(params.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[]));

          const request: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
            model: this.model,
            messages,
            temperature: params.temperature ?? 0.1,
            max_tokens: params.max_tokens ?? 1024,
            tools: openaiTools,
            tool_choice: "auto",
            stream: false,
          };
          const response = (await this.client.chat.completions.create(request, {
            signal: controller.signal,
          })) as OpenAI.Chat.Completions.ChatCompletion;

          const choice = response.choices?.[0];
          if (!choice) {
            throw new Error("Empty response from LLM");
          }

          const toolCalls: ToolCall[] = [];
          if (choice.message.tool_calls) {
            for (const toolCall of choice.message.tool_calls) {
              if (toolCall.type === "function") {
                const functionCall = toolCall as {
                  id: string;
                  function: { name: string; arguments: string };
                };
                toolCalls.push({
                  id: functionCall.id,
                  name: functionCall.function.name,
                  arguments: JSON.parse(functionCall.function.arguments || "{}") as Record<string, unknown>,
                });
              }
            }
          }

          return {
            content: choice.message.content || "",
            finishReason: choice.finish_reason,
            toolCalls,
            usage: {
              promptTokens: response.usage?.prompt_tokens || 0,
              completionTokens: response.usage?.completion_tokens || 0,
            },
          };
        } finally {
          clearTimeout(timeoutId);
        }
      });
    return this.circuitBreaker ? this.circuitBreaker.execute(operation) : operation();
  }
}
