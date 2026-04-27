import test from "node:test";
import assert from "node:assert/strict";
import { NimLLMAdapter } from "../llm";
import type { ToolDefinition } from "@/lib/agent/types";

test("completeWithTools reports an empty provider response clearly", async () => {
  const adapter = new NimLLMAdapter("dummy-key", "https://example.test", 1000, "dummy-model");
  const adapterWithMockClient = adapter as unknown as {
    client: {
      chat: {
        completions: {
          create: () => Promise<unknown>;
        };
      };
    };
    completeWithTools: NimLLMAdapter["completeWithTools"];
  };

  adapterWithMockClient.client = {
    chat: {
      completions: {
        create: async () => ({}),
      },
    },
  };

  const tools: ToolDefinition[] = [];

  await assert.rejects(
    () => adapterWithMockClient.completeWithTools({ messages: [], tools }),
    /Empty response from LLM/
  );
});
