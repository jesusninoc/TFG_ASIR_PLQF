import { faqEntries, products, productsByType } from "@/lib/catalog";
import { evaluateBuildCompatibility, formatPrice } from "@/lib/compatibility";

function scoreMatch(source: string, query: string) {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  return queryWords.reduce(
    (score, word) => (source.toLowerCase().includes(word) ? score + 1 : score),
    0,
  );
}

function buildByBudget(budgetCents: number, preferredBrand?: string) {
  const cpus = productsByType.cpu.filter((cpu) =>
    preferredBrand
      ? cpu.brand.toLowerCase().includes(preferredBrand.toLowerCase())
      : true,
  );

  for (const cpu of cpus) {
    const compatibleMotherboards = productsByType.motherboard.filter(
      (motherboard) => motherboard.socket === cpu.socket,
    );

    for (const motherboard of compatibleMotherboards) {
      const compatibleMemory = productsByType.memory.filter(
        (memory) => memory.memoryType === motherboard.memoryType,
      );
      const compatibleStorage = productsByType.storage.filter((storage) =>
        storage.interface === "M2_NVME"
          ? motherboard.m2Slots > 0
          : motherboard.sataPorts > 0,
      );

      const gpu = productsByType.gpu[0];
      const psu = productsByType.psu[0];
      const pcCase = productsByType.case.find((item) =>
        item.supportedFormFactors.includes(motherboard.formFactor),
      );

      if (!compatibleMemory[0] || !compatibleStorage[0] || !gpu || !psu || !pcCase) {
        continue;
      }

      const build = {
        cpu,
        motherboard,
        memory: compatibleMemory[0],
        storage: compatibleStorage[0],
        gpu,
        psu,
        case: pcCase,
      };

      const report = evaluateBuildCompatibility(build);
      if (report.isCompatible && report.totalPriceCents <= budgetCents) {
        return {
          build,
          report,
        };
      }
    }
  }

  return null;
}

export function generateAssistantResponse(question: string) {
  const normalizedQuestion = question.trim();
  const budgetMatch = normalizedQuestion.match(/(\d{3,5})\s?(€|eur)?/i);
  const preferredBrandMatch = normalizedQuestion.match(/(amd|intel|nvidia)/i);

  if (budgetMatch) {
    const budgetCents = Number(budgetMatch[1]) * 100;
    const preferredBrand = preferredBrandMatch?.[1];
    const recommendation = buildByBudget(budgetCents, preferredBrand);

    if (recommendation) {
      const { build, report } = recommendation;
      return {
        answer: [
          `Te propongo una build compatible por ${formatPrice(report.totalPriceCents)} (presupuesto: ${formatPrice(budgetCents)}).`,
          `CPU: ${build.cpu.name}`,
          `Placa: ${build.motherboard.name}`,
          `RAM: ${build.memory.name}`,
          `Disco: ${build.storage.name}`,
          `GPU: ${build.gpu.name}`,
          `PSU: ${build.psu.name}`,
          `Torre: ${build.case.name}`,
          `Consumo estimado: ${report.estimatedPowerWatts}W`,
        ].join("\n"),
        references: [
          build.cpu.name,
          build.motherboard.name,
          build.memory.name,
          build.storage.name,
        ],
        buildIds: {
          cpu: build.cpu.id,
          motherboard: build.motherboard.id,
          memory: build.memory.id,
          storage: build.storage.id,
          gpu: build.gpu.id,
          psu: build.psu.id,
          case: build.case.id,
        },
      };
    }

    return {
      answer:
        "No he encontrado una build completa dentro de ese presupuesto. Sube presupuesto o quita preferencia de marca para una recomendación más flexible.",
      references: [],
    };
  }

  const rankedFaq = faqEntries
    .map((entry) => ({
      entry,
      score: scoreMatch(`${entry.question} ${entry.answer}`, normalizedQuestion),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter((entry) => entry.score > 0);

  const rankedProducts = products
    .map((product) => ({
      product,
      score: scoreMatch(
        `${product.name} ${product.brand} ${product.description}`,
        normalizedQuestion,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter((entry) => entry.score > 0);

  if (rankedFaq.length === 0 && rankedProducts.length === 0) {
    return {
      answer:
        "Puedo ayudarte a elegir componentes, revisar compatibilidad (socket, RAM, M.2/SATA), o proponer una build por presupuesto. Prueba: 'hazme un PC por 1500€'.",
      references: [],
    };
  }

  const faqSummary = rankedFaq
    .map((item) => `- ${item.entry.question}: ${item.entry.answer}`)
    .join("\n");

  const productSummary = rankedProducts
    .map(
      (item) =>
        `- ${item.product.name} (${formatPrice(item.product.priceCents)}): ${item.product.description}`,
    )
    .join("\n");

  return {
    answer: [
      "Esto es lo más relevante que encontré para tu consulta:",
      faqSummary ? `\nFAQ:\n${faqSummary}` : "",
      productSummary ? `\nProductos:\n${productSummary}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    references: rankedProducts.map((item) => item.product.name),
  };
}