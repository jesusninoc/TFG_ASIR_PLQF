import type { ToolDefinition } from "@/lib/agent/types";
import { generateBuildTool } from "@/lib/agent/tools/build-tools";
import { searchCatalogTool } from "@/lib/agent/tools/catalog-tools";
import {
  getCartContentsTool,
  getCurrentPageContextTool,
  getOrderStatusTool,
  lookupFaqTool,
  navigateToPageTool,
} from "@/lib/agent/tools/basic-tools";

export const ASSISTANT_TOOLS: ToolDefinition[] = [
  searchCatalogTool,
  generateBuildTool,
  lookupFaqTool,
  getOrderStatusTool,
  getCartContentsTool,
  getCurrentPageContextTool,
  navigateToPageTool,
];

export function getAssistantToolNames(): string[] {
  return ASSISTANT_TOOLS.map((tool) => tool.name);
}
