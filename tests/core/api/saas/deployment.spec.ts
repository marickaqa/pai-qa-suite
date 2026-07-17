import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56' // noctocode-test — type: chat
const SUPPORT_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552' // marija test — type: support

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe('Core — Chatbot Deployment API', () => {

  it('should reject deployment of support type bot', async () => {
    let status: number = 0
    let message: string = ''
    try {
      await axios.post(
        `${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/deploy`,
        {},
        { headers: authHeaders(token) }
      )
    } catch (error: any) {
      status = error.response?.status
      message = error.response?.data?.message || ''
    }
    expect(status).toBe(400)
    expect(message.toLowerCase()).toContain('chat')
  })

  it('should reject deployment with invalid bot ID', async () => {
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/chatbot/00000000-0000-0000-0000-000000000000/deploy`,
        {},
        { headers: authHeaders(token) }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect([400, 403, 404]).toContain(status)
  })

  it('should list members for a chatbot', async () => {
    const response = await axios.get(
      `${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/members`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('members')
    expect(Array.isArray(response.data.members)).toBe(true)
    expect(response.data).toHaveProperty('page')
    expect(response.data).toHaveProperty('limit')
  })

  it('should return 400 for non-existent bot members', async () => {
    let status: number = 0
    try {
      await axios.get(
        `${BASE_URL}/chatbot/00000000-0000-0000-0000-000000000000/members`,
        { headers: authHeaders(token) }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect([400, 403, 404]).toContain(status)
  })

})