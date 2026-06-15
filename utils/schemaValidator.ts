import { z } from 'zod'

const ChatResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  responseTime: z.number(),
})

export type ChatResponse = z.infer<typeof ChatResponseSchema>

export function validateChatResponse(response: unknown): ChatResponse {
  return ChatResponseSchema.parse(response)
}