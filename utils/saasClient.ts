import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const ORG_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'

let cachedToken: string | null = null

export async function getSaasToken(forceRefresh = false): Promise<string> {
  if (cachedToken && !forceRefresh) return cachedToken

  const response = await axios.post(`${BASE_URL}/auth-saas/signin`, {
    email: process.env.SAAS_EMAIL,
    password: process.env.SAAS_PASSWORD,
  })

  cachedToken = response.data.token
  return cachedToken as string
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'x-organization-id': ORG_ID,
  }
}

export async function listChatbots(token: string) {
  const response = await axios.get(`${BASE_URL}/chatbot/list`, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function getChatbot(token: string, id: string) {
  const response = await axios.get(`${BASE_URL}/chatbot/${id}`, {
    headers: authHeaders(token),
  })
  return response.data
}

export async function createChatbot(
  token: string,
  name: string,
  slug: string,
  type: string
) {
  const response = await axios.post(
    `${BASE_URL}/chatbot`,
    { name, slug, type, active: false },
    { headers: authHeaders(token) }
  )
  return response.data
}

export async function updateChatbot(
  token: string,
  id: string,
  data: Record<string, any>
) {
  const response = await axios.patch(
    `${BASE_URL}/chatbot/${id}`,
    data,
    { headers: authHeaders(token) }
  )
  return response.data
}

export async function deleteChatbot(token: string, id: string) {
  const response = await axios.delete(`${BASE_URL}/chatbot/${id}`, {
    headers: authHeaders(token),
  })
  return response.data
}