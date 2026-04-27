/**
 * Retry utility with exponential backoff and jitter
 * Shared between LLM adapter and tool executors
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export function isRetryableError(error: unknown): boolean {
  // Don't retry on abort (timeout) or explicit non-retryable errors
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") return false;
  }
  // Check for object with status/code
  if (typeof error === "object" && error !== null) {
    const err = error as { status?: number; code?: string };
    // Retry on 5xx server errors
    if (err.status && err.status >= 500) return true;
    // Retry on network errors (ECONNABORTED, ETIMEDOUT, ECONNRESET, etc.)
    if (err.code && (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET" || err.code === "ENOTFOUND" || err.code === "ECONNREFUSED")) {
      return true;
    }
    // Retry on rate limit (429) optionally
    if (err.status === 429) return true;
  }
  return false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  logFn?: (attempt: number, error: unknown) => void
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      // Ensure we have an Error for retry checks
      const errorForRetry = err instanceof Error ? err : new Error(String(err));
      if (!isRetryableError(errorForRetry)) {
        throw errorForRetry;
      }
      if (attempt >= config.maxAttempts - 1) {
        break;
      }
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, config.maxDelayMs);
      logFn?.(attempt, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw (lastError instanceof Error ? lastError : new Error(String(lastError))) ?? new Error("Operation failed after retries");
}

export function getDefaultRetryConfig(): RetryConfig {
  const rawAttempts = parseInt(process.env.NIM_RETRY_MAX_ATTEMPTS || "3", 10);
  const rawBaseDelay = parseInt(process.env.NIM_RETRY_BASE_DELAY || "1000", 10);
  const rawMaxDelay = parseInt(process.env.NIM_RETRY_MAX_DELAY || "10000", 10);
  return {
    maxAttempts: isNaN(rawAttempts) ? 3 : Math.max(1, rawAttempts),
    baseDelayMs: isNaN(rawBaseDelay) ? 1000 : Math.max(0, rawBaseDelay),
    maxDelayMs: isNaN(rawMaxDelay) ? 10000 : Math.max(100, rawMaxDelay),
  };
}
