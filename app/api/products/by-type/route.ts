/**
 * app/api/products/by-type/route.ts
 * Devuelve todos los productos agrupados por tipo de componente.
 * Usado por el PC Builder en el cliente.
 * GET /api/products/by-type
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dbProductsToTypes } from "@/lib/db-to-types";

export async function GET() {
  try {
    const raw = await prisma.product.findMany({
      orderBy: { priceCents: "asc" },
      include: {
        cpuSpec: true, motherboardSpec: true, memorySpec: true,
        storageSpec: true, gpuSpec: true, psuSpec: true, caseSpec: true,
      },
    });

    const all = dbProductsToTypes(raw);

    const byType = {
      cpu:         all.filter((p) => p.type === "cpu"),
      motherboard: all.filter((p) => p.type === "motherboard"),
      memory:      all.filter((p) => p.type === "memory"),
      storage:     all.filter((p) => p.type === "storage"),
      gpu:         all.filter((p) => p.type === "gpu"),
      psu:         all.filter((p) => p.type === "psu"),
      case:        all.filter((p) => p.type === "case"),
    };

    return NextResponse.json(byType);
  } catch (err) {
    console.error("[products/by-type] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
