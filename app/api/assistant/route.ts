import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAssistantResponse } from "@/lib/rag";

const bodySchema = z.object({
  question: z.string().min(2),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
  }

  const response = generateAssistantResponse(parsed.data.question);
  return NextResponse.json(response);
}