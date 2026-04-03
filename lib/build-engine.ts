/**
 * lib/build-engine.ts
 * Motor modular de generación de builds.
 * Consulta stock real desde la BD, aplica filtros y devuelve hasta 3 builds
 * compatibles (tiers: budget / mid / premium).
 *
 * La lógica de compatibilidad la delega en evaluateBuildCompatibility().
 * No tiene ninguna dependencia de IA — es puro TypeScript + Prisma.
 */

import { prisma } from "@/lib/prisma";
import { dbProductsToTypes } from "@/lib/db-to-types";
import { evaluateBuildCompatibility } from "@/lib/compatibility";
import type {
  BuildFilters,
  BuildResult,
  BuildTier,
  PcBuildSelection,
  UseCase,
} from "@/lib/types";
import type {
  CpuProduct,
  MotherboardProduct,
  MemoryProduct,
  StorageProduct,
  GpuProduct,
  PsuProduct,
  CaseProduct,
} from "@/lib/types";

// ─── Budget weight tables ──────────────────────────────────────────────────────
// Fraction of total budget allocated to each component group by use case.
// gpu: 0 means no dedicated GPU is targeted for that use case.

interface BudgetWeights {
  cpu: number;
  gpu: number;      // 0 → skip dedicated GPU
  ram: number;
  storage: number;
  psu: number;
  mb: number;
  case: number;
}

const USE_CASE_WEIGHTS: Record<UseCase, BudgetWeights> = {
  gaming:           { cpu: 0.28, gpu: 0.38, ram: 0.08, storage: 0.07, mb: 0.09, psu: 0.06, case: 0.04 },
  workstation_gpu:  { cpu: 0.25, gpu: 0.32, ram: 0.18, storage: 0.09, mb: 0.08, psu: 0.05, case: 0.03 },
  workstation_cpu:  { cpu: 0.38, gpu: 0,    ram: 0.28, storage: 0.12, mb: 0.10, psu: 0.07, case: 0.05 },
  office:           { cpu: 0.30, gpu: 0,    ram: 0.22, storage: 0.18, mb: 0.14, psu: 0.10, case: 0.06 },
};

// Tier multipliers: fraction of total budget the tier targets
const TIER_MULTIPLIERS: Record<BuildTier, number> = {
  budget:  0.50,
  mid:     0.75,
  premium: 0.95,
};

// ─── Prisma include helper ────────────────────────────────────────────────────

const FULL_INCLUDE = {
  cpuSpec: true, motherboardSpec: true, memorySpec: true,
  storageSpec: true, gpuSpec: true, psuSpec: true, caseSpec: true,
} as const;

// ─── Brand filter helpers ─────────────────────────────────────────────────────

function brandContainsFilter(brands: string[] | undefined) {
  if (!brands || brands.length === 0) return undefined;
  return { OR: brands.map((b) => ({ brand: { contains: b, mode: "insensitive" as const } })) };
}

function brandExcludeFilter(brands: string[] | undefined) {
  if (!brands || brands.length === 0) return undefined;
  return brands.map((b) => ({ brand: { not: { contains: b, mode: "insensitive" as const } } }));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBuilds(filters: BuildFilters): Promise<BuildResult[]> {
  const useCase: UseCase = filters.useCase ?? "office";
  const weights = USE_CASE_WEIGHTS[useCase];
  const needsGpu = weights.gpu > 0 && filters.requireDedicatedGpu !== false;

  const { preferBrands, excludeBrands, minSpecs } = filters;

  // ── Fetch all in-stock components in parallel ──────────────────────────────
  const [cpusRaw, motherboardsRaw, memoriesRaw, storagesRaw, gpusRaw, psusRaw, casesRaw] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          componentType: "CPU",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.cpu),
          AND: [
            ...(brandExcludeFilter(excludeBrands?.cpu) ?? []),
            ...(minSpecs?.cpuCores ? [{ cpuSpec: { cores: { gte: minSpecs.cpuCores } } }] : []),
          ],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
      prisma.product.findMany({
        where: {
          componentType: "MOTHERBOARD",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.motherboard),
          AND: brandExcludeFilter(excludeBrands?.motherboard) ?? [],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
      prisma.product.findMany({
        where: {
          componentType: "MEMORY",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.ram),
          AND: [
            ...(brandExcludeFilter(excludeBrands?.ram) ?? []),
            ...(minSpecs?.memoryGb ? [{ memorySpec: { capacityGb: { gte: minSpecs.memoryGb } } }] : []),
          ],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
      prisma.product.findMany({
        where: {
          componentType: "STORAGE",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.storage),
          AND: [
            ...(brandExcludeFilter(excludeBrands?.storage) ?? []),
            ...(minSpecs?.storageGb ? [{ storageSpec: { capacityGb: { gte: minSpecs.storageGb } } }] : []),
          ],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
      needsGpu
        ? prisma.product.findMany({
            where: {
              componentType: "GPU",
              stock: { gt: 0 },
              ...brandContainsFilter(preferBrands?.gpu),
              AND: [
                ...(brandExcludeFilter(excludeBrands?.gpu) ?? []),
                ...(minSpecs?.gpuVramGb ? [{ gpuSpec: { vramGb: { gte: minSpecs.gpuVramGb } } }] : []),
              ],
            },
            include: FULL_INCLUDE,
            orderBy: { priceCents: "asc" },
          })
        : Promise.resolve([]),
      prisma.product.findMany({
        where: {
          componentType: "PSU",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.psu),
          AND: brandExcludeFilter(excludeBrands?.psu) ?? [],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
      prisma.product.findMany({
        where: {
          componentType: "CASE",
          stock: { gt: 0 },
          ...brandContainsFilter(preferBrands?.case),
          AND: brandExcludeFilter(excludeBrands?.case) ?? [],
        },
        include: FULL_INCLUDE,
        orderBy: { priceCents: "asc" },
      }),
    ]);

  const cpus         = dbProductsToTypes(cpusRaw)         as CpuProduct[];
  const motherboards = dbProductsToTypes(motherboardsRaw) as MotherboardProduct[];
  const memories     = dbProductsToTypes(memoriesRaw)     as MemoryProduct[];
  const storages     = dbProductsToTypes(storagesRaw)     as StorageProduct[];
  const gpus         = dbProductsToTypes(gpusRaw)         as GpuProduct[];
  const psus         = dbProductsToTypes(psusRaw)         as PsuProduct[];
  const cases        = dbProductsToTypes(casesRaw)        as CaseProduct[];

  // ── Generate one build per tier (independently — no shared CPU exclusion) ──
  // Tiers pick CPUs by price-proximity to their own budget target. If two tiers
  // land on the same CPU we keep only the higher tier (dedup below).
  const rawResults: BuildResult[] = [];

  for (const tier of ["budget", "mid", "premium"] as BuildTier[]) {
    const tierBudget = Math.floor(filters.budgetCents * TIER_MULTIPLIERS[tier]);
    const build = tryBuildForTier(
      tier,
      tierBudget,
      weights,
      cpus,
      motherboards,
      memories,
      storages,
      gpus,
      psus,
      cases,
      needsGpu,
    );
    if (build) rawResults.push(build);
  }

  // Dedup: if two tiers chose the same CPU, keep only the highest tier's build.
  // Reverse so premium is evaluated first (wins), then restore budget→mid→premium order.
  const seenCpuIds = new Set<string>();
  const results = rawResults
    .slice()
    .reverse()
    .filter((r) => {
      const cpuId = r.build.cpu?.id;
      if (!cpuId || seenCpuIds.has(cpuId)) return false;
      seenCpuIds.add(cpuId);
      return true;
    })
    .reverse();

  return results;
}

// ─── Tier build attempt ───────────────────────────────────────────────────────

function tryBuildForTier(
  tier: BuildTier,
  tierBudget: number,
  weights: BudgetWeights,
  cpus: CpuProduct[],
  motherboards: MotherboardProduct[],
  memories: MemoryProduct[],
  storages: StorageProduct[],
  gpus: GpuProduct[],
  psus: PsuProduct[],
  cases: CaseProduct[],
  needsGpu: boolean,
): BuildResult | null {
  // Soft weight-based targets guide pickBest toward the intended price point.
  const cpuBudget  = Math.floor(tierBudget * weights.cpu);
  const gpuBudget  = needsGpu ? Math.floor(tierBudget * weights.gpu) : 0;
  const ramBudget  = Math.floor(tierBudget * weights.ram);
  const diskBudget = Math.floor(tierBudget * weights.storage);
  const mbBudget   = Math.floor(tierBudget * weights.mb);
  const psuBudget  = Math.floor(tierBudget * weights.psu);
  const caseBudget = Math.floor(tierBudget * weights.case);

  // Precompute the cheapest possible price per category (unfiltered pools).
  // These underestimates are used to compute hard ceilings for each pick so
  // no single component can consume budget needed by the remaining ones.
  // The final totalPrice check remains the authoritative safety net.
  const minMB      = motherboards.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
  const minRAM     = memories.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
  const minStorage = storages.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
  const minGPU     = needsGpu ? gpus.reduce((m, p) => Math.min(m, p.priceCents), Infinity) : 0;
  const minCase    = cases.reduce((m, p) => Math.min(m, p.priceCents), Infinity);
  const minPSU     = psus.reduce((m, p) => Math.min(m, p.priceCents), Infinity);

  // --- CPU --------------------------------------------------------------------
  let remaining = tierBudget;
  const cpu = pickBest(
    cpus,
    cpuBudget,
    remaining - minMB - minRAM - minStorage - minGPU - minCase - minPSU,
  );
  if (!cpu) return null;
  remaining -= cpu.priceCents;

  // --- Motherboard (socket must match CPU) ------------------------------------
  const compatMbs = motherboards.filter((mb) => mb.socket === cpu.socket);
  const mb = pickBest(
    compatMbs,
    mbBudget,
    remaining - minRAM - minStorage - minGPU - minCase - minPSU,
  );
  if (!mb) return null;
  remaining -= mb.priceCents;

  // --- RAM (memory type must match motherboard) --------------------------------
  const compatRam = memories.filter((m) => m.memoryType === mb.memoryType);
  const ram = pickBest(
    compatRam,
    ramBudget,
    remaining - minStorage - minGPU - minCase - minPSU,
  );
  if (!ram) return null;
  remaining -= ram.priceCents;

  // --- Storage (prefer NVMe when board has M.2 slots) -------------------------
  const preferNvme = mb.m2Slots > 0;
  const compatStorage = storages.filter((s) =>
    preferNvme ? s.interface === "M2_NVME" : s.interface === "SATA",
  );
  const storage = pickBest(
    compatStorage.length > 0 ? compatStorage : storages,
    diskBudget,
    remaining - minGPU - minCase - minPSU,
  );
  if (!storage) return null;
  remaining -= storage.priceCents;

  // --- GPU (optional) ---------------------------------------------------------
  let gpu: GpuProduct | undefined;
  if (needsGpu) {
    gpu = pickBest(gpus, gpuBudget, remaining - minCase - minPSU);
    if (!gpu) return null;
    remaining -= gpu.priceCents;
  }

  // --- Case (form factor must be supported) -----------------------------------
  const compatCases = cases.filter((c) => c.supportedFormFactors.includes(mb.formFactor));
  const pcCase = pickBest(compatCases, caseBudget, remaining - minPSU);
  if (!pcCase) return null;
  remaining -= pcCase.priceCents;

  // --- PSU (wattage first priority, then price within remaining budget) --------
  const estimatedTdp = cpu.tdpWatts + (gpu?.tdpWatts ?? 0) + 60 + 10 + 10;
  const minPsuWattage = Math.ceil(estimatedTdp * 1.3);
  const compatPsus = psus.filter((p) => p.wattage >= minPsuWattage);
  // `remaining` is exactly the unspent budget — use it as PSU's hard ceiling.
  const psu = pickBest(compatPsus, psuBudget, remaining);
  if (!psu) return null;

  const build: PcBuildSelection = { cpu, motherboard: mb, memory: ram, storage, gpu, psu, case: pcCase };
  const report = evaluateBuildCompatibility(build);

  if (!report.isCompatible) return null;
  if (report.totalPriceCents > tierBudget) return null;

  return { tier, build, report, totalPriceCents: report.totalPriceCents };
}

// ─── Helper: pick the best product within budget ──────────────────────────────
// Strategy (in order):
//   1. Items at or below `targetCents` that also fit within `hardMax`:
//      pick the most expensive (closest to target from below = best quality within budget).
//   2. If nothing fits below target but items exist below hardMax:
//      pick the cheapest of those to minimise budget overrun.
//   3. If nothing fits within hardMax: return undefined (tier fails).
// This prevents `pickClosest` behaviour where an above-target item is chosen
// simply because it happens to be "closer" than a cheaper below-target option.

function pickBest<T extends { priceCents: number }>(
  items: T[],
  targetCents: number,
  hardMax: number,
): T | undefined {
  const pool = items.filter((i) => i.priceCents <= hardMax);
  if (pool.length === 0) return undefined;

  // Best value within target
  const affordable = pool.filter((i) => i.priceCents <= targetCents);
  if (affordable.length > 0) {
    return affordable.reduce((best, item) =>
      item.priceCents > best.priceCents ? item : best,
    );
  }

  // Nothing under target — pick cheapest over-target to minimise overrun
  return pool.reduce((best, item) =>
    item.priceCents < best.priceCents ? item : best,
  );
}
