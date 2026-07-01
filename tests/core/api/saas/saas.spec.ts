import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getSaasToken, createChatbot, deleteChatbot, getChatbot, listChatbots } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'

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

  it('should limit results when limit param is set', async () => {
    const response = await axios.get(`${BASE_URL}/chatbot/list?page=0&limit=1`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_ID }
    })
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBe(1)
  })

  it('should return different results for different pages', async () => {
    const [p0, p1] = await Promise.all([
      axios.get(`${BASE_URL}/chatbot/list?page=0&limit=2`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_ID }
      }),
      axios.get(`${BASE_URL}/chatbot/list?page=1&limit=2`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_ID }
      }),
    ])
    expect(Array.isArray(p0.data)).toBe(true)
    expect(Array.isArray(p1.data)).toBe(true)
    const p0Ids = p0.data.map((b: any) => b.id)
    const p1Ids = p1.data.map((b: any) => b.id)
    const overlap = p0Ids.filter((id: string) => p1Ids.includes(id))
    expect(overlap.length).toBe(0)
  })

  it('should return empty array for out-of-range page', async () => {
    const response = await axios.get(`${BASE_URL}/chatbot/list?page=99&limit=2`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_ID }
    })
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBe(0)
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