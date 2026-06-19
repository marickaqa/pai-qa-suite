import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const TENANT_2_ID = '9fb1dfa1-e120-4c93-8c4c-2e88f171dbed'

async function getCookie(email: string, password: string): Promise<string> {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email, password
  }, { withCredentials: true })
  const cookies = res.headers['set-cookie']
  return cookies ? cookies.join('; ') : ''
}

async function run() {
  console.log('🔐 Signing in as admin...')
  const cookie = await getCookie(
    process.env.SUBTITLES_ADMIN_EMAIL || '',
    process.env.SUBTITLES_ADMIN_PASSWORD || ''
  )
  const headers = {
    'Cookie': cookie,
    'Content-Type': 'application/json',
    'Origin': 'https://subtitles-dev.paicloud.ai'
  }

  console.log('🗑️ Deleting second tenant...')
  await axios.delete(`${API}/tenants/${TENANT_2_ID}`, { headers })
  console.log('✅ Second tenant deleted')
}

run().catch(err => {
  console.error('❌ Failed:', err.response?.data || err.message)
  process.exit(1)
})