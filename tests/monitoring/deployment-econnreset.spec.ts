import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../utils/saasClient'
import axios from 'axios'

// These tests are in monitoring tier — POST /chatbot/{id}/deploy consistently
// drops TCP connection in CI (ECONNRESET). Works locally. Tracked separately.

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe('Monitoring — Chatbot Deploy Endpoint', () => {

  it('should successfully deploy a chat type bot', async () => {
    const response = await axios.post(
      `${BASE_URL}/chatbot/${CHAT_BOT_ID}/deploy`,
      {},
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('message')
    expect(response.data).toHaveProperty('domain')
    expect(response.data.domain).toBeTruthy()
  })

  it('should return a valid domain after deployment', async () => {
    const response = await axios.post(
      `${BASE_URL}/chatbot/${CHAT_BOT_ID}/deploy`,
      {},
      { headers: authHeaders(token) }
    )
    expect(response.data.domain).toMatch(/\.(org|com|dev|ai)$/)
  })

})