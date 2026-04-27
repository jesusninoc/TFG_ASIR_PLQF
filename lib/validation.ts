import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2000),
});

export const AssistantRequestSchema = z.object({
  question: z.string().min(1).max(2000).refine(
    (val) => !/<script|<iframe|javascript:/i.test(val),
    { message: 'Invalid input detected' }
  ),
  history: z.array(MessageSchema).max(50).default([]),
  messages: z.array(MessageSchema).max(50).optional(),
  context: z.object({
    currentPage: z.string().max(500).default("/"),
    currentProductId: z.string().optional(),
    cart: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        priceCents: z.number(),
        name: z.string(),
        type: z.string(),
      })
    ).optional(),
  }).optional(),
  personality: z.unknown().optional().transform(() => 'educational' as const),
}).transform((value) => ({
  ...value,
  history: value.history.length > 0 ? value.history : value.messages ?? [],
}));

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.unknown().optional(),
  }),
});

export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;
