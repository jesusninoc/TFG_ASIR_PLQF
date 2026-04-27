/**
 * Agent runtime configuration
 * Reads from environment variables with sensible defaults
 */

import { DEFAULT_TIMEOUT_CONFIG, TimeoutConfig } from "./timeout-manager";

export interface AgentConfig {
  timeouts: TimeoutConfig;
  model?: string;
}

function getEnvInt(key: string, defaultValue: number): number {
  const val = parseInt(process.env[key] || defaultValue.toString(), 10);
  return Number.isFinite(val) ? val : defaultValue;
}

export function getDefaultAgentConfig(): AgentConfig {
  return {
    timeouts: {
      globalTimeoutMs: getEnvInt("AGENT_TIMEOUT_GLOBAL", DEFAULT_TIMEOUT_CONFIG.globalTimeoutMs),
      llmTimeoutMs: getEnvInt("AGENT_TIMEOUT_LLM", DEFAULT_TIMEOUT_CONFIG.llmTimeoutMs),
      toolTimeoutMs: getEnvInt("AGENT_TIMEOUT_TOOL", DEFAULT_TIMEOUT_CONFIG.toolTimeoutMs),
      agentIterationTimeoutMs: getEnvInt(
        "AGENT_TIMEOUT_ITERATION",
        DEFAULT_TIMEOUT_CONFIG.agentIterationTimeoutMs
      ),
    },
    model: process.env.NIM_MODEL,
  };
}
