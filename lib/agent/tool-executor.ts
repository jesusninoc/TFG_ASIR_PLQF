/**
 * Centralized tool execution with timeout isolation, retry, and metrics.
 */

import type { AgentContext, ToolResult } from "./types";
import { withTimeout } from "./timeout-manager";
import { getDefaultRetryConfig, withRetry } from "./retry";
import { UnifiedLogger } from "./logger";
import { getMetricsCollector } from "./metrics";
import { executeGenerateBuild } from "./tools/build-tools";
import { executeSearchCatalog } from "./tools/catalog-tools";
import {
  executeGetCartContents,
  executeGetCurrentPageContext,
  executeGetOrderStatus,
  executeLookupFaq,
  executeNavigateToPage,
} from "./tools/basic-tools";

type ToolHandler = (params: Record<string, unknown>, context?: AgentContext) => Promise<ToolResult> | ToolResult;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  generate_build: executeGenerateBuild,
  search_catalog: executeSearchCatalog,
  lookup_faq: executeLookupFaq,
  get_order_status: executeGetOrderStatus,
  get_cart_contents: (_params, context) => executeGetCartContents(context ?? { currentPage: "/" }),
  get_current_page_context: (_params, context) => executeGetCurrentPageContext(context ?? { currentPage: "/" }),
  navigate_to_page: executeNavigateToPage,
};

export function getRegisteredToolNames(): string[] {
  return Object.keys(TOOL_HANDLERS);
}

export interface ToolExecutionMetrics {
  durationMs: number;
  success: boolean;
  attempts: number;
  error?: string;
}

export class ToolExecutionError extends Error {
  constructor(toolName: string, cause: Error) {
    super(`Tool execution failed in ${toolName}: ${cause.message}`);
    this.name = "ToolExecutionError";
  }
}

export class ToolExecutor {
  private readonly logger = new UnifiedLogger("ToolExecutor");

  constructor(
    private readonly timeoutMs: number = 10000,
    private readonly maxAttempts: number = getDefaultRetryConfig().maxAttempts
  ) {}

  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context?: AgentContext
  ): Promise<ToolResult> {
    const handler = TOOL_HANDLERS[toolName];
    if (!handler) {
      return { success: false, error: `Herramienta desconocida: ${toolName}` };
    }

    const start = Date.now();
    let attempts = 0;

    try {
      const retryConfig = { ...getDefaultRetryConfig(), maxAttempts: this.maxAttempts };
      const result = await withRetry(
        async () => {
          attempts++;
          return withTimeout(
            Promise.resolve(handler(params, context)),
            { timeoutMs: this.timeoutMs, operation: toolName }
          );
        },
        retryConfig,
        (attempt, error) => {
          this.logger.warn("Tool attempt failed; retrying", {
            tool: toolName,
            attempt: attempt + 1,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      );

      this.recordMetrics(toolName, {
        durationMs: Date.now() - start,
        success: result.success,
        attempts,
        error: result.error,
      });

      return result;
    } catch (error) {
      const wrapped = new ToolExecutionError(
        toolName,
        error instanceof Error ? error : new Error(String(error))
      );

      this.recordMetrics(toolName, {
        durationMs: Date.now() - start,
        success: false,
        attempts,
        error: wrapped.message,
      });

      this.logger.error("Tool execution failed", wrapped, { tool: toolName });
      return { success: false, error: wrapped.message };
    }
  }

  private recordMetrics(toolName: string, metrics: ToolExecutionMetrics): void {
    const collector = getMetricsCollector();
    collector.recordDuration("tool_execution_ms", metrics.durationMs, {
      tool: toolName,
      status: metrics.success ? "success" : "error",
    });
    collector.gaugeSet("tool_attempts", metrics.attempts, { tool: toolName });
    collector.increment(metrics.success ? "tool_call_total" : "tool_call_error_total", {
      tool: toolName,
    });
  }
}
