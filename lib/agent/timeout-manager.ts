/**
 * Timeout management for agent system
 */

export interface TimeoutConfig {
  /** Global request timeout in milliseconds (default: 30000) */
  globalTimeoutMs: number;
  /** LLM API call timeout in milliseconds (default: 30000) */
  llmTimeoutMs: number;
  /** Tool execution timeout in milliseconds (default: 10000) */
  toolTimeoutMs: number;
  /** Agent iteration timeout in milliseconds (default: 25000) */
  agentIterationTimeoutMs: number;
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  globalTimeoutMs: 300000,
  llmTimeoutMs: 300000,
  toolTimeoutMs: 100000,
  agentIterationTimeoutMs: 250000,
};

export class TimeoutError extends Error {
  constructor(
    message: string,
    public operation: string,
    public timeoutMs: number
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Wrap a promise with a timeout that throws TimeoutError if it doesn't resolve in time
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  options: {
    timeoutMs: number;
    operation: string;
    abortSignal?: AbortSignal;
  }
): Promise<T> {
  const { timeoutMs, operation, abortSignal } = options;

  if (abortSignal?.aborted) {
    throw new TimeoutError(`Operation cancelled: ${operation}`, operation, timeoutMs);
  }

  let timeoutId!: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms: ${operation}`, operation, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Creates an AbortController with a timeout that auto-aborts
 */
export function createAbortControllerWithTimeout(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}
