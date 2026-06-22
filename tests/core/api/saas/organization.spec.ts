import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'
const TEST_INVITE_EMAIL = `qa-invite-${Date.now()}@noctocode.dev`

let token: string
let createdInviteId: string

beforeAll(async () => {
  token = await getSaasToken()
})

afterAll(async () => {
  if (createdInviteId) {
    try {
      await axios.delete(
        `${BASE_URL}/organization-members/invite/${createdInviteId}`,
        { headers: authHeaders(token) }
      )
    } catch { /* best effort */ }
  }
})

describe('Core — Organization Management API', () => {

  // BUG-023: GET /organization/{id} returns 401 with valid SaaS token — moved to known-bugs

  it('should list organization members', async () => {
    const response = await axios.get(
      `${BASE_URL}/organization-members`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('members')
    expect(Array.isArray(response.data.members)).toBe(true)
    expect(response.data.members.length).toBeGreaterThan(0)

    const member = response.data.members[0]
    expect(member).toHaveProperty('id')
    expect(member).toHaveProperty('email')
    expect(member).toHaveProperty('permissions')
  })

  it('should return pagination fields on members list', async () => {
    const response = await axios.get(
      `${BASE_URL}/organization-members`,
      { headers: authHeaders(token) }
    )
    expect(response.data).toHaveProperty('page')
    expect(response.data).toHaveProperty('limit')
    expect(typeof response.data.page).toBe('number')
    expect(typeof response.data.limit).toBe('number')
  })

  it('should list pending invitations', async () => {
    const response = await axios.get(
      `${BASE_URL}/organization-members/invite`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('invitations')
    expect(Array.isArray(response.data.invitations)).toBe(true)
  })

  it('should create a member invite', async () => {
    const response = await axios.post(
      `${BASE_URL}/organization-members/invite`,
      { email: TEST_INVITE_EMAIL, permissions: ['members'] },
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(201)
    expect(response.data).toHaveProperty('invitation')
    expect(response.data.invitation.email).toBe(TEST_INVITE_EMAIL)
    createdInviteId = response.data.invitation.id
  })

  it('should not allow duplicate invite for same email', async () => {
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/organization-members/invite`,
        { email: TEST_INVITE_EMAIL, permissions: ['members'] },
        { headers: authHeaders(token) }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBeGreaterThanOrEqual(400)
  })

  it('should delete the test invite', async () => {
    expect(createdInviteId).toBeTruthy()
    let deleted = false
    try {
      await axios.delete(
        `${BASE_URL}/organization-members/invite/${createdInviteId}`,
        { headers: authHeaders(token) }
      )
      deleted = true
    } catch (error: any) {
      deleted = false
    }

    const response = await axios.get(
      `${BASE_URL}/organization-members/invite`,
      { headers: authHeaders(token) }
    )
    const stillExists = response.data.invitations?.some((i: any) => i.id === createdInviteId)
    expect(stillExists).toBe(false)
    createdInviteId = ''
  })

})
