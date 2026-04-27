import test from "node:test";
import assert from "node:assert/strict";
import { getDefaultAgentConfig } from "../agent-config";
import { DEFAULT_TIMEOUT_CONFIG } from "../timeout-manager";

test("uses shared timeout defaults when env vars are not set", () => {
  const previous = {
    AGENT_TIMEOUT_GLOBAL: process.env.AGENT_TIMEOUT_GLOBAL,
    AGENT_TIMEOUT_LLM: process.env.AGENT_TIMEOUT_LLM,
    AGENT_TIMEOUT_TOOL: process.env.AGENT_TIMEOUT_TOOL,
    AGENT_TIMEOUT_ITERATION: process.env.AGENT_TIMEOUT_ITERATION,
  };

  delete process.env.AGENT_TIMEOUT_GLOBAL;
  delete process.env.AGENT_TIMEOUT_LLM;
  delete process.env.AGENT_TIMEOUT_TOOL;
  delete process.env.AGENT_TIMEOUT_ITERATION;

  try {
    assert.deepEqual(getDefaultAgentConfig().timeouts, DEFAULT_TIMEOUT_CONFIG);
  } finally {
    restoreEnv("AGENT_TIMEOUT_GLOBAL", previous.AGENT_TIMEOUT_GLOBAL);
    restoreEnv("AGENT_TIMEOUT_LLM", previous.AGENT_TIMEOUT_LLM);
    restoreEnv("AGENT_TIMEOUT_TOOL", previous.AGENT_TIMEOUT_TOOL);
    restoreEnv("AGENT_TIMEOUT_ITERATION", previous.AGENT_TIMEOUT_ITERATION);
  }
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
