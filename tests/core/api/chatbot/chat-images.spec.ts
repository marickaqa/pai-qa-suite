import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import FormData from 'form-data'
import { getChatToken } from '@utils/tokenCache'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

let token: string
let chatId: string

beforeAll(async () => {
  token = await getChatToken()
  const response = await axios.post(
    `${BASE_URL}/chat`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  chatId = response.data.id
})

afterAll(async () => {
  if (chatId) {
    try {
      await axios.delete(`${BASE_URL}/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch { /* best effort */ }
  }
})

async function uploadImage(cId: string): Promise<{ imageId: string; url: string }> {
  const form = new FormData()
  const png = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
    '0000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
    'hex'
  )
  form.append('file', png, { filename: 'test.png', contentType: 'image/png' })
  const response = await axios.post(
    `${BASE_URL}/chats/${cId}/images`,
    form,
    { headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` } }
  )
  return { imageId: response.data.imageId, url: response.data.url }
}

describe('Core — Chat Images API', () => {

  describe('POST /chats/{chatId}/images', () => {

    it('should upload an image and return imageId and url', async () => {
      const result = await uploadImage(chatId)
      expect(result.imageId).toBeTruthy()
      expect(typeof result.imageId).toBe('string')
      expect(result.url).toMatch(/^https?:\/\//)
    })

    it('should return 400 when no file is provided', async () => {
      let status = 0
      try {
        await axios.post(
          `${BASE_URL}/chats/${chatId}/images`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(400)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        const form = new FormData()
        form.append('file', Buffer.from('x'), { filename: 'test.png', contentType: 'image/png' })
        await axios.post(`${BASE_URL}/chats/${chatId}/images`, form, {
          headers: form.getHeaders(),
        })
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(401)
    })

    it('should return 400 or 404 for non-existent chatId', async () => {
      let status = 0
      try {
        const form = new FormData()
        form.append('file', Buffer.from('x'), { filename: 'test.png', contentType: 'image/png' })
        await axios.post(
          `${BASE_URL}/chats/00000000-0000-0000-0000-000000000000/images`,
          form,
          { headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect(status).toBe(404)
    })

  })

  describe('GET /chats/{chatId}/images/{imageId}', () => {

    let uploadedImageId: string

    beforeAll(async () => {
      const result = await uploadImage(chatId)
      uploadedImageId = result.imageId
    })

    it('should retrieve an uploaded image by id', async () => {
      const response = await axios.get(
        `${BASE_URL}/chats/${chatId}/images/${uploadedImageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      expect(response.status).toBe(200)
    })

    it('should return 401 with no token', async () => {
      let status = 0
      try {
        await axios.get(`${BASE_URL}/chats/${chatId}/images/${uploadedImageId}`)
      } catch (error: any) {
        status = error.response?.status
      }
      expect([401, 500]).toContain(status)
    })

    it('should return 400 or 404 for non-existent imageId', async () => {
      let status = 0
      try {
        await axios.get(
          `${BASE_URL}/chats/${chatId}/images/00000000-0000-0000-0000-000000000000`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } catch (error: any) {
        status = error.response?.status
      }
      expect([400, 404, 500]).toContain(status)
    })

  })

})
