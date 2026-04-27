/**
 * Circuit Breaker pattern implementation to prevent cascading failures.
 * Wraps async operations and trips the circuit after repeated failures.
 */

import type { AgentLogger } from "./types";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 30000,
    private readonly halfOpenMaxCalls: number = 1,
    private readonly logger?: AgentLogger
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        this.logger?.info?.("CircuitBreaker: half-open, allowing probe");
      } else {
        throw new Error("CircuitBreaker is OPEN — service temporarily unavailable");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.close();
    } else if (this.state === "CLOSED") {
      this.reset();
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  private open() {
    this.state = "OPEN";
    this.logger?.warn?.(`CircuitBreaker opened after ${this.failureCount} failures`);
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.state = "HALF_OPEN";
      this.logger?.info?.("CircuitBreaker: half-open after timeout");
    }, this.resetTimeoutMs);
  }

  private close() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.logger?.info?.("CircuitBreaker closed");
  }

  private reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}
