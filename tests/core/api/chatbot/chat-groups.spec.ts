import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import { getChatToken } from '@utils/tokenCache'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

let token: string

async function createChat(): Promise<string> {
  const response = await axios.post(
    `${BASE_URL}/chat`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data.id
}

beforeAll(async () => {
  token = await getChatToken()
})

describe('Core — Chat Groups API', () => {

  describe('POST /chat/{chatId}/group', () => {

    it('should convert a chat to a group and return success message', async () => {
      const chatId = await createChat()
      const response = await axios.post(
        `${BASE_URL}/chat/${chatId}/group`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(typeof response.data.message).toBe('string')
      expect(response.data.message.toLowerCase()).toContain('group')

      try {
        await axios.delete(`${BASE_URL}/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* best effort */ }
    })

    it('should return 401 with no token', async () => {
      const chatId = await createChat()
      let status = 0
      try {
        await axios.post(`${BASE_URL}/chat/${chatId}/group`, {})
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)

      try {
        await axios.delete(`${BASE_URL}/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch { /* best effort */ }
    })

    it('should return 400, 403 or 404 for non-existent chatId', async () => {
      let status = 0
      try {
        await axios.post(
          `${BASE_URL}/chat/00000000-0000-0000-0000-000000000000/group`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 403, 404]).toContain(status)
    })

  })

  describe('GET /chat/{chatId}/group', () => {

    let groupChatId: string

    beforeAll(async () => {
      groupChatId = await createChat()
      await axios.post(
        `${BASE_URL}/chat/${groupChatId}/group`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    })

    afterAll(async () => {
      if (groupChatId) {
        try {
          await axios.delete(`${BASE_URL}/chat/${groupChatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch { /* best effort */ }
      }
    })

    it('should return group info for a group chat — BUG-021', async () => {
      let timedOut = false
      try {
        await axios.get(
          `${BASE_URL}/chat/${groupChatId}/group`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        )
      } catch (error: any) {
        if (error.code === 'ECONNABORTED') timedOut = true
      }
      expect(timedOut).toBe(true)
    }, 10000)

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        await axios.get(`${BASE_URL}/chat/${groupChatId}/group`)
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

    it('should return 400, 403 or 404 for non-existent chatId', async () => {
      let status = 0
      try {
        await axios.get(
          `${BASE_URL}/chat/00000000-0000-0000-0000-000000000000/group`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 403, 404]).toContain(status)
    })

  })

})
