/**
 * app/api/assistant/route.ts
 * Endpoint del asistente IA — delega en rag.ts (parseIntent + buildEngine).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistantResponse } from "@/lib/rag";
import type { ConversationMessage } from "@/lib/types";

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const bodySchema = z.object({
  question: z.string().min(2).max(2000),
  messages: z.array(messageSchema).max(40).optional().default([]),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = bodySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
    }

    const { question, messages } = parsed.data;
    const response = await generateAssistantResponse(question, messages as ConversationMessage[]);
    return NextResponse.json(response);
  } catch (err) {
    console.error("[assistant] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
