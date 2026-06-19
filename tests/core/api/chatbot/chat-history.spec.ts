import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import { getChatToken } from '@utils/tokenCache'

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

let token: string
let createdChatId: string

beforeAll(async () => {
  token = await getChatToken()
  const response = await axios.post(
    `${BASE_URL}/chat`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  createdChatId = response.data.id
})

afterAll(async () => {
  if (createdChatId) {
    try {
      await axios.delete(
        `${BASE_URL}/chat/${createdChatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch { /* best effort */ }
  }
})

describe('Core — Chat History API', () => {

  it('should list all chats for the user', async () => {
    const response = await axios.get(
      `${BASE_URL}/chat`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(200)
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('should get a specific chat by id', async () => {
    expect(createdChatId).toBeTruthy()
    const response = await axios.get(
      `${BASE_URL}/chat/${createdChatId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(200)
    expect(response.data.id).toBe(createdChatId)
  })

  it('should search chats', async () => {
    const response = await axios.get(
      `${BASE_URL}/chat/search?q=test`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(200)
  })

  it('should get authenticated user profile', async () => {
    const response = await axios.get(
      `${BASE_URL}/auth/get`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('user')
    expect(response.data.user).toHaveProperty('id')
    expect(response.data.user).toHaveProperty('email')
    expect(response.data.user.email).toBe(process.env.API_EMAIL)
  })

  it('should return 401 with no token on GET /chat', async () => {
    let status = 0
    try {
      await axios.get(`${BASE_URL}/chat`)
    } catch (error: any) {
      status = error.response?.status
    }
    expect(status).toBe(401)
  })

  it('should return 400 or 404 for non-existent chat id', async () => {
    let status = 0
    try {
      await axios.get(
        `${BASE_URL}/chat/00000000-0000-0000-0000-000000000000`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect([400, 404]).toContain(status)
  })

  it('should delete a chat', async () => {
    const created = await axios.post(
      `${BASE_URL}/chat`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const disposableId = created.data.id
    expect(disposableId).toBeTruthy()

    const deleteResponse = await axios.delete(
      `${BASE_URL}/chat/${disposableId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    expect([200, 204]).toContain(deleteResponse.status)

    let status: number = 0
    try {
      await axios.get(
        `${BASE_URL}/chat/${disposableId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error: any) {
      status = error.response?.status
    }
    expect([400, 404]).toContain(status)
  })

})