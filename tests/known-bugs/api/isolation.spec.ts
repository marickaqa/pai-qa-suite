import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasApiToken } from '@utils/tokenCache'
import { authHeaders } from '@utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_1_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'
const ORG_2_ID = '95b6dffa-cb6f-4773-84b2-dfe9bb363ebb'

let token: string

beforeAll(async () => {
  token = await getSaasApiToken()
})

describe('Core — Multi-Tenant Data Isolation', () => {
  it('should allow access to own organization', async () => {
    const response = await axios.get(
      `${BASE_URL}/organization/${ORG_1_ID}`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data.id).toBe(ORG_1_ID)
  })

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
        { name: 'isolation-test-bot', slug: 'isolation-test-' + Date.now(), type: 'support' },
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
})