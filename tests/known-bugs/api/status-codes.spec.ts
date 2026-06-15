import { describe, it, expect, beforeAll } from 'vitest'
import { getSaasToken, getChatbot } from '../../../utils/saasClient'
import { KNOWN_BUGS } from '../../../config/known-bugs'

let token: string

beforeAll(async () => {
  token = await getSaasToken()
})

describe(`Known Bug ${KNOWN_BUGS.GET_NONEXISTENT_RETURNS_400.id} — GET non-existent returns 400`, () => {

  it('GET /chatbot/{id} should return 404 for non-existent resource', async () => {
    let status: number = 0
    try {
      await getChatbot(token, '00000000-0000-0000-0000-000000000000')
      status = 200
    } catch (error: any) {
      status = error.response?.status
    }

    // BUG-002: currently returns 400 instead of 404
    expect(status).toBe(404)
  })

})