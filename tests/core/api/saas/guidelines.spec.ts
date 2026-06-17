import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders, getChatbot, updateChatbot } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const TEST_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe('Core — Guidelines & Config API', () => {

  it('should list prompt templates', async () => {
    const response = await axios.get(
      `${BASE_URL}/prompt-templates`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
    expect(response.data.length).toBeGreaterThan(0)

    const template = response.data[0]
    expect(template).toHaveProperty('id')
    expect(template).toHaveProperty('name')
    expect(template).toHaveProperty('content')
    expect(template).toHaveProperty('type')
    expect(template).toHaveProperty('chatbotType')
    expect(template).toHaveProperty('section')
  })

  it('should return prompt templates with valid sections', async () => {
    const response = await axios.get(
      `${BASE_URL}/prompt-templates`,
      { headers: authHeaders(token) }
    )
    const validSections = [
      'communication_style', 'context_and_clarification',
      'content_and_sources', 'span', 'conditional', 'other'
    ]
    const sections = response.data.map((t: any) => t.section).filter(Boolean)
    sections.forEach((section: string) => {
      expect(validSections).toContain(section)
    })
  })

  it('should filter prompt templates by chatbotType', async () => {
    const response = await axios.get(
      `${BASE_URL}/prompt-templates`,
      { headers: authHeaders(token) }
    )
    expect(response.data.length).toBeGreaterThan(0)
    response.data.forEach((t: any) => {
      expect(['support', 'chat']).toContain(t.chatbotType)
    })
  })

  it('should get chatbot with config', async () => {
    const bot = await getChatbot(token, TEST_BOT_ID)
    expect(bot).toHaveProperty('config')
    expect(bot.config).toHaveProperty('options')
    expect(bot.config.options).toHaveProperty('tools')
    expect(bot.config.options).toHaveProperty('features')
  })

  it('should show web search is enabled in bot config', async () => {
    const bot = await getChatbot(token, TEST_BOT_ID)
    expect(typeof bot.config.options.tools.webSearch).toBe('boolean')
  })

  it('should show incognito feature is enabled in bot config', async () => {
    const bot = await getChatbot(token, TEST_BOT_ID)
    expect(typeof bot.config.options.features.incognito).toBe('boolean')
  })

  it('should update and restore bot web search setting', async () => {
    const bot = await getChatbot(token, TEST_BOT_ID)
    const originalValue = bot.config.options.tools.webSearch

    await updateChatbot(token, TEST_BOT_ID, {
      config: {
        ...bot.config,
        options: {
          ...bot.config.options,
          tools: { ...bot.config.options.tools, webSearch: !originalValue }
        }
      }
    })

    const updated = await getChatbot(token, TEST_BOT_ID)
    expect(updated.config.options.tools.webSearch).toBe(!originalValue)

    // Restore original value
    await updateChatbot(token, TEST_BOT_ID, {
      config: {
        ...bot.config,
        options: {
          ...bot.config.options,
          tools: { ...bot.config.options.tools, webSearch: originalValue }
        }
      }
    })
  })

})
