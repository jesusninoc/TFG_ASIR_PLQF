import test from "node:test";
import assert from "node:assert/strict";
import { ASSISTANT_TOOLS, getAssistantToolNames } from "../tool-registry";
import { getRegisteredToolNames } from "@/lib/agent/tool-executor";

test("assistant tool names are unique", () => {
  const names = getAssistantToolNames();
  assert.equal(new Set(names).size, names.length);
});

test("all assistant tools have executor handlers", () => {
  const executorNames = new Set(getRegisteredToolNames());

  for (const name of getAssistantToolNames()) {
    assert.equal(executorNames.has(name), true, `${name} is missing an executor`);
  }
});

test("all executor handlers are exposed as assistant tools", () => {
  const assistantNames = new Set(getAssistantToolNames());

  for (const name of getRegisteredToolNames()) {
    assert.equal(assistantNames.has(name), true, `${name} is missing from assistant tools`);
  }
});

test("registry exposes at least catalog and build tools", () => {
  const names = getAssistantToolNames();

  assert.equal(names.includes("search_catalog"), true);
  assert.equal(names.includes("generate_build"), true);
  assert.equal(ASSISTANT_TOOLS.length >= 6, true);
});
