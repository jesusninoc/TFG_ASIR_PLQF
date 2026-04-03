/**
 * app/api/products/route.ts
 * Devuelve el catálogo de productos desde la BD con soporte de filtros.
 * Query params:
 *   type    → ComponentType (CPU, GPU, etc.)
 *   q       → búsqueda por nombre/descripción/marca
 *   brand   → filtro de marca
 *   min     → precio mínimo en euros
 *   max     → precio máximo en euros
 *   sort    → "price-asc" | "price-desc" | "name" (default: featured)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

  const VALID_TYPES = new Set(["CPU", "GPU", "MEMORY", "STORAGE", "MOTHERBOARD", "PSU", "CASE"]);
  const rawType = searchParams.get("type")?.toUpperCase();
  const type = rawType && VALID_TYPES.has(rawType) ? rawType : undefined;
  if (rawType && !type) {
    return NextResponse.json({ error: "Tipo de componente inválido" }, { status: 400 });
  }

  const q = searchParams.get("q")?.trim().slice(0, 200);
  const brand = searchParams.get("brand")?.trim().slice(0, 100);
  const rawMin = Number(searchParams.get("min") ?? 0);
  const rawMax = Number(searchParams.get("max") ?? 0);
  const min = Number.isFinite(rawMin) ? rawMin : 0;
  const max = Number.isFinite(rawMax) ? rawMax : 0;
  const sort = searchParams.get("sort") ?? "featured";

  const where: Prisma.ProductWhereInput = {};

  if (type) {
    where.componentType = type as Prisma.EnumComponentTypeFilter["equals"];
  }

  if (brand) {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ];
  }

  if (min > 0 || max > 0) {
    where.priceCents = {
      ...(min > 0 ? { gte: min * 100 } : {}),
      ...(max > 0 ? { lte: max * 100 } : {}),
    };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput;
  switch (sort) {
    case "price-asc":  orderBy = { priceCents: "asc" };  break;
    case "price-desc": orderBy = { priceCents: "desc" }; break;
    case "name":       orderBy = { name: "asc" };        break;
    default:           orderBy = { createdAt: "asc" };   break;
  }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: 200,
      include: {
        cpuSpec:         true,
        motherboardSpec: true,
        memorySpec:      true,
        storageSpec:     true,
        gpuSpec:         true,
        psuSpec:         true,
        caseSpec:        true,
      },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("[products] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
