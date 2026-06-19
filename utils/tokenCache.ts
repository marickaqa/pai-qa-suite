import fs from 'fs'
import path from 'path'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const TOKEN_CACHE = path.resolve(__dirname, '../reports/api-token.json')

function readCache(): { chatToken: string; saasToken: string } | null {
  try {
    if (fs.existsSync(TOKEN_CACHE)) {
      return JSON.parse(fs.readFileSync(TOKEN_CACHE, 'utf-8'))
    }
  } catch { /* fall through */ }
  return null
}

export async function getChatToken(): Promise<string> {
  const cache = readCache()
  if (cache?.chatToken) return cache.chatToken
  const response = await axios.post(`${BASE_URL}/auth/signin`, {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  return response.data.token
}

export async function getSaasApiToken(): Promise<string> {
  const cache = readCache()
  if (cache?.saasToken) return cache.saasToken
  const response = await axios.post(`${BASE_URL}/auth-saas/signin`, {
    email: process.env.SAAS_EMAIL,
    password: process.env.SAAS_PASSWORD,
  })
  return response.data.token
}