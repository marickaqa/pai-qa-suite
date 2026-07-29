import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'

// 'Blank org' — a dedicated dev org kept EMPTY and, critically, kept OFF
// qa-saas's membership list. The previous fixture (Trump Media) silently
// became meaningless when qa-saas was added to it. DO NOT add qa-saas as
// a member of 'blank org' — the whole point is that qa-saas ISN'T in it,
// so the API's responses when scoped to it are meaningful. If ever needed,
// re-verify with probe-isolation.ts.
const OTHER_ORG_ID = '270794fc-2c87-4aec-b801-c37e804fb852'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

/**
 * Reads scoped to an org the caller isn't in currently return 200 with an
 * empty result (rather than 403). Confirmed via probe-isolation.ts. That is
 * an isolation-correct outcome — no other org's data comes back — so we
 * assert THAT specifically. Any non-empty list would be a leak and must fail.
 *
 * Writes are rejected with 400 (rather than 403), which is a "wrong status
 * but correct behaviour" oddity worth raising with dev separately. The tests
 * accept any non-2xx as isolation-correct while noting the status.
 */
describe('Core — Multi-Tenant Data Isolation', () => {

  it('should return no chatbots when scoped to another organization', async () => {
    const r = await axios.get(`${BASE_URL}/chatbot/list`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': OTHER_ORG_ID }
    })
    expect(r.status).toBe(200)
    expect(Array.isArray(r.data)).toBe(true)
    // The key check: NO chatbots must come back from an org we don't belong to.
    // A single leaked bot would fail this — that's the real isolation signal.
    expect(r.data.length, `expected empty list, got ${r.data.length} bots`).toBe(0)
  })

  it('should return no members when scoped to another organization', async () => {
    const r = await axios.get(`${BASE_URL}/organization-members`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': OTHER_ORG_ID }
    })
    expect(r.status).toBe(200)
    expect(Array.isArray(r.data?.members)).toBe(true)
    expect(r.data.members.length, `expected 0 members, got ${r.data.members.length}`).toBe(0)
  })

  it('should reject creating resources in another organization', async () => {
    let succeeded = false
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/chatbot`,
        { name: 'isolation-test-bot', slug: 'isolation-test-' + Date.now(), type: 'support', active: false },
        { headers: { Authorization: `Bearer ${token}`, 'x-organization-id': OTHER_ORG_ID } }
      )
      succeeded = true
    } catch (error: any) {
      status = error.response?.status ?? 0
    }
    // The critical assertion: the create MUST have failed. A successful create
    // in an org we don't belong to would be a serious leak.
    expect(succeeded, 'create should NOT have succeeded in another org').toBe(false)
    // Currently rejected as 400 rather than 403 — status hygiene note for dev,
    // not a security bug. Accept any non-2xx rejection.
    expect(status).toBeGreaterThanOrEqual(400)
  })

  it('should reject inviting members to another organization', async () => {
    let succeeded = false
    let status: number = 0
    try {
      await axios.post(
        `${BASE_URL}/organization-members/invite`,
        { email: 'isolation-test@noctocode.dev', permissions: ['members'] },
        { headers: { Authorization: `Bearer ${token}`, 'x-organization-id': OTHER_ORG_ID } }
      )
      succeeded = true
    } catch (error: any) {
      status = error.response?.status ?? 0
    }
    expect(succeeded, 'invite should NOT have succeeded in another org').toBe(false)
    expect(status).toBeGreaterThanOrEqual(400)
  })

  it('should return no documents for a chatbot when scoped to another organization', async () => {
    const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
    // The chatbot belongs to noctocode.dev; scoped to blank-org, the request
    // should either be rejected or return an empty document list — never leak
    // the real documents.
    let status: number = 0
    let leaked = false
    try {
      const r = await axios.get(`${BASE_URL}/chatbot/${CHAT_BOT_ID}/document`, {
        headers: { Authorization: `Bearer ${token}`, 'x-organization-id': OTHER_ORG_ID }
      })
      status = r.status
      const docs = r.data?.documents ?? []
      leaked = Array.isArray(docs) && docs.length > 0
    } catch (error: any) {
      status = error.response?.status ?? 0
    }
    // Either the API rejects (>= 400) or returns an empty document set.
    // The one thing that must NOT happen: an actual document list coming back.
    expect(leaked, 'documents from another org must not leak').toBe(false)
    expect(status === 200 || status >= 400).toBe(true)
  })

})
