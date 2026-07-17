import axios from 'axios'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { assertNotProd } from './utils/prodGuard'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const TOKEN_CACHE = path.resolve(__dirname, 'reports/api-token.json')

export async function setup() {
  assertNotProd()

  const chatAuth = await axios.post(`${BASE_URL}/auth/signin`, {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  const chatToken = chatAuth.data.token

  const saasAuth = await axios.post(`${BASE_URL}/auth-saas/signin`, {
    email: process.env.SAAS_EMAIL,
    password: process.env.SAAS_PASSWORD,
  })
  const saasToken = saasAuth.data.token

  fs.mkdirSync(path.dirname(TOKEN_CACHE), { recursive: true })
  fs.writeFileSync(TOKEN_CACHE, JSON.stringify({ chatToken, saasToken }))
  console.log('✅ API tokens cached')
}
