import { describe, it, expect } from 'vitest'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const CHATBOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const CHATBOT_REFERER = 'https://pc-chatbot-0.duckdns.org/'

describe('Core — Chatbot Public Resolve API', () => {

  it('should resolve chatbot by x-chatbot-id header', async () => {
    const response = await axios.get(`${BASE_URL}/chatbot`, {
      headers: { 'x-chatbot-id': CHATBOT_ID }
    })
    expect(response.status).toBe(200)
    expect(response.data.id).toBe(CHATBOT_ID)
  })

  it('should resolve chatbot by Referer header', async () => {
    const response = await axios.get(`${BASE_URL}/chatbot`, {
      headers: { 'Referer': CHATBOT_REFERER }
    })
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('slug')
  })

  it('should return expected fields in response', async () => {
    const response = await axios.get(`${BASE_URL}/chatbot`, {
      headers: { 'x-chatbot-id': CHATBOT_ID }
    })
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('organizationId')
    expect(response.data).toHaveProperty('name')
    expect(response.data).toHaveProperty('slug')
    expect(response.data).toHaveProperty('type')
    expect(response.data).toHaveProperty('active')
    expect(response.data).toHaveProperty('chatbotConfig')
  })

  it('should not require authentication', async () => {
    // public endpoint — no Authorization header needed
    const response = await axios.get(`${BASE_URL}/chatbot`, {
      headers: { 'x-chatbot-id': CHATBOT_ID }
    })
    expect(response.status).toBe(200)
  })

  it('should fall back to default chatbot when x-chatbot-id is not found', async () => {
    // endpoint resolves by fallback when provided ID doesn't exist
    // returns a valid chatbot object rather than 404
    const response = await axios.get(`${BASE_URL}/chatbot`, {
      headers: { 'x-chatbot-id': '00000000-0000-0000-0000-000000000000' }
    })
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('id')
    expect(response.data).toHaveProperty('slug')
  })

})