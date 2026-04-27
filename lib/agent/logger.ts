/**
 * Unified logger implementation for all agents
 * Provides consistent structured logging with agent name prefix
 */

import type { AgentLogger } from "./types";

export class UnifiedLogger implements AgentLogger {
  private readonly prefix: string;

  constructor(agentName: string) {
    this.prefix = `[${agentName}]`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(this.prefix, message, meta ?? "");
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.prefix, message, meta ?? "");
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error(this.prefix, message, error?.stack ?? "", meta ?? "");
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(this.prefix, message, meta ?? "");
  }
}
