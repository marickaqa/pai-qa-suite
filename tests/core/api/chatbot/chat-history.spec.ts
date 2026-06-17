import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

let token: string
let createdChatId: string

async function getChatToken(): Promise<string> {
  const response = await axios.post(`${BASE_URL}/auth/signin`, {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  return response.data.token
}

beforeAll(async () => {
  token = await getChatToken()
  // Create a chat to work with
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

  it('should delete a chat', async () => {
    // Create a disposable chat to delete
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

    // Verify it's gone
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
