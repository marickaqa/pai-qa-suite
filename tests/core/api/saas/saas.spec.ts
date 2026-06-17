import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getSaasToken, createChatbot, deleteChatbot, getChatbot, listChatbots } from '../../../utils/saasClient'

let token: string
let createdChatbotId: string
const TEST_SLUG = 'qa-core-test-' + Date.now()

beforeAll(async () => {
  token = await getSaasToken()
})

afterAll(async () => {
  if (createdChatbotId) {
    try {
      await deleteChatbot(token, createdChatbotId)
    } catch { /* best effort */ }
  }
})

describe('Core — SaaS Chatbot API', () => {

  it('should authenticate with SaaS credentials', async () => {
    expect(token).toBeTruthy()
    expect(token.length).toBeGreaterThan(20)
  })

  it('should list chatbots', async () => {
    const chatbots = await listChatbots(token)
    expect(Array.isArray(chatbots)).toBe(true)
    expect(chatbots.length).toBeGreaterThan(0)
    const bot = chatbots[0]
    expect(bot).toHaveProperty('id')
    expect(bot).toHaveProperty('name')
    expect(bot).toHaveProperty('slug')
  })

  it('should create a chatbot', async () => {
    const bot = await createChatbot(token, 'QA Core Test Bot', TEST_SLUG, 'support')
    createdChatbotId = bot.id
    expect(bot.id).toBeTruthy()
    expect(bot.name).toBe('QA Core Test Bot')
    expect(bot.slug).toBe(TEST_SLUG)
  })

  it('should get a chatbot by id', async () => {
    expect(createdChatbotId).toBeTruthy()
    const bot = await getChatbot(token, createdChatbotId)
    expect(bot.id).toBe(createdChatbotId)
  })

  it('should delete a chatbot and return 200 or 204', async () => {
    expect(createdChatbotId).toBeTruthy()
    let status: number = 0
    try {
      await deleteChatbot(token, createdChatbotId)
      status = 200
    } catch (error: any) {
      status = error.response?.status
    }
    expect([200, 204]).toContain(status)
    createdChatbotId = ''
  })

})