import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasApiToken } from '@utils/tokenCache'
import { authHeaders } from '@utils/saasClient'
import { KNOWN_BUGS } from '../../../config/known-bugs'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_1_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'

let token: string

beforeAll(async () => {
  token = await getSaasApiToken()
})

const bug = KNOWN_BUGS.GET_ORGANIZATION_BY_ID_UNAUTHORIZED

describe(`${bug.id} — ${bug.description}`, () => {

  it('GET /organization/{id} should return 200 with valid SaaS token', async () => {
    const response = await axios.get(
      `${BASE_URL}/organization/${ORG_1_ID}`,
      { headers: authHeaders(token) }
    )
    expect(response.status).toBe(200)
    expect(response.data.id).toBe(ORG_1_ID)
  })

})