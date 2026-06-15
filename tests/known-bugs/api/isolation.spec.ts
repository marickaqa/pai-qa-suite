import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, authHeaders } from '../../../utils/saasClient'
import axios from 'axios'
import { KNOWN_BUGS } from '../../../config/known-bugs'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_2_ID = '95b6dffa-cb6f-4773-84b2-dfe9bb363ebb'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe(`Known Bug ${KNOWN_BUGS.ISOLATION_DOCUMENT_BOUNDARY.id} — Document isolation`, () => {

  it('should deny accessing documents across organization boundary', async () => {
    const botId = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    let status: number = 0
    try {
      await axios.get(
        `${BASE_URL}/chatbot/${botId}/document`,
        { headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID } }
      )
      status = 200
    } catch (error: any) {
      status = error.response?.status || 0
    }
    // BUG-012: currently returns 200 instead of 403
    expect(status).toBe(403)
  })

})