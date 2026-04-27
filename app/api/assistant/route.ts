/**
 * app/api/assistant/route.ts
 * Endpoint del asistente IA.
 */

import { NextResponse } from "next/server";
import { AssistantOrchestrator } from "@/lib/assistant/assistant-orchestrator";
import { UnifiedLogger } from "@/lib/agent/logger";
import { AssistantRequestSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AgentContext } from "@/lib/agent";

export async function POST(request: Request) {
  const logger = new UnifiedLogger("assistant-api");
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "127.0.0.1";
    const rate = checkRateLimit(`assistant:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rate.success) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Inténtalo de nuevo en un minuto." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } }
      );
    }

    const payload = await request.json();

    // Validate using shared schema
    const validation = AssistantRequestSchema.safeParse(payload);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: validation.error.issues },
        { status: 400 }
      );
    }
    const parsed = validation.data;

    // Resolve context: use provided context or construct default
    let resolvedContext: AgentContext;
    if (parsed.context) {
      resolvedContext = {
        currentPage: parsed.context.currentPage,
        currentProductId: parsed.context.currentProductId,
        cart: parsed.context.cart,
      };
    } else {
      resolvedContext = {
        currentPage: request.url ? new URL(request.url).pathname : "/",
      };
    }

    const assistant = new AssistantOrchestrator({ logger });
    const response = await assistant.handleRequest({
      question: parsed.question,
      history: parsed.history,
      context: resolvedContext,
      personality: "educational",
    });

    return NextResponse.json(response);
  } catch (err) {
    logger.error("Unhandled error in assistant route", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
