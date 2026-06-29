import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_2_ID = '95b6dffa-cb6f-4773-84b2-dfe9bb363ebb'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe('Core — Multi-Tenant Data Isolation', () => {

  // BUG-023: GET /organization/{id} returns 401 with valid SaaS token — moved to known-bugs

  it('should deny access to another organization chatbots', async () => {
    let status: number = 0
    try {
      await axios.get(`${BASE_URL}/chatbot`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID }
      })
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(403)
  })

  it('should deny access to another organization members', async () => {
    let status: number = 0
    try {
      await axios.get(`${BASE_URL}/organization-members`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID }
      })
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(403)
  })

  it('should deny creating resources in another organization', async () => {
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/chatbot`,
        { name: 'isolation-test-bot', slug: 'isolation-test-' + Date.now(), type: 'support', active: false },
        { headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID } }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(403)
  })

  it('should deny inviting members to another organization', async () => {
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/organization-members/invite`,
        { email: 'isolation-test@noctocode.dev', permissions: ['members'] },
        { headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID } }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(403)
  })

  it('should deny access to another organization chatbot documents', async () => {
    const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
    let status: number = 0
    try {
      await axios.get(`${BASE_URL}/chatbot/${CHAT_BOT_ID}/document`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID }
      })
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(403)
  })

})
