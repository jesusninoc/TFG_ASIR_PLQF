import type { BuildIds, PartialSelection, PcBuildSelection } from "@/lib/types";

export const AI_SUGGESTED_FULL_BUILD_KEY = "ai_suggested_full_build";
export const AI_SUGGESTED_PARTIAL_SELECTION_KEY = "ai_suggested_partial_selection";
export const AI_BUILDER_LOAD_EVENT = "ai-builder-load";

const VALID_SELECTION_KEYS = new Set<keyof PcBuildSelection>([
  "cpu",
  "motherboard",
  "memory",
  "storage",
  "gpu",
  "psu",
  "case",
]);

const SELECTION_KEY_ALIASES: Record<string, keyof PcBuildSelection> = {
  ram: "memory",
};

export function normalizeSelectionIds(
  selection?: Record<string, string | undefined> | null,
): PartialSelection | undefined {
  if (!selection || typeof selection !== "object") {
    return undefined;
  }

  const normalized: PartialSelection = {};

  for (const [rawKey, rawValue] of Object.entries(selection)) {
    if (typeof rawValue !== "string" || rawValue.length === 0) {
      continue;
    }

    const aliasedKey = SELECTION_KEY_ALIASES[rawKey];
    const normalizedKey = aliasedKey ?? (
      VALID_SELECTION_KEYS.has(rawKey as keyof PcBuildSelection)
        ? rawKey as keyof PcBuildSelection
        : undefined
    );

    if (!normalizedKey) {
      continue;
    }

    normalized[normalizedKey] = rawValue;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function normalizeBuildIds(buildIds?: BuildIds | null): BuildIds | undefined {
  return normalizeSelectionIds(buildIds);
}
