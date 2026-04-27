import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildCard } from "../build-card";
import type { BuildMessage } from "@/lib/types";

test("renders build components as product links", () => {
  const build: BuildMessage = {
    tier: "budget",
    answer: "Build generada.",
    totalPriceCents: 99400,
    buildIds: {
      cpu: "cpu-1",
      memory: "ram-1",
    },
    componentRecommendations: [
      {
        id: "cpu-1",
        name: "AMD Ryzen 7 7700X",
        image: "/cpu.png",
        priceCents: 31900,
        componentType: "cpu",
        brand: "AMD",
        keySpecs: ["8 nucleos", "16 hilos"],
        reasoning: "Buen rendimiento para ofimatica.",
        productLink: "/product/amd-ryzen-7-7700x",
      },
      {
        id: "ram-1",
        name: "Corsair Vengeance 64GB DDR5",
        image: "/ram.png",
        priceCents: 15000,
        componentType: "memory",
        brand: "Corsair",
        keySpecs: ["64 GB", "DDR5"],
        reasoning: "Memoria amplia para multitarea.",
        productLink: "/product/corsair-vengeance-64gb-ddr5",
      },
    ],
  };

  const html = renderToStaticMarkup(<BuildCard build={build} onLoad={() => {}} />);

  assert.match(html, /href="\/product\/amd-ryzen-7-7700x"/);
  assert.match(html, /AMD Ryzen 7 7700X/);
  assert.match(html, /CPU/);
  assert.match(html, /href="\/product\/corsair-vengeance-64gb-ddr5"/);
  assert.match(html, /Corsair Vengeance 64GB DDR5/);
  assert.match(html, /RAM/);
  assert.doesNotMatch(html, /Build generada\./);
});
