import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const ADMIN_EMAIL = process.env.SUBTITLES_ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.SUBTITLES_ADMIN_PASSWORD || ''

async function getAdminCookie(): Promise<string> {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }, { withCredentials: true })
  const cookies = res.headers['set-cookie']
  return cookies ? cookies.join('; ') : ''
}

async function run() {
  console.log('🔐 Signing in as admin...')
  const cookie = await getAdminCookie()
  const headers = {
    'Cookie': cookie,
    'Content-Type': 'application/json',
    'Origin': 'https://subtitles-dev.paicloud.ai'
  }

  // Look up existing user
  console.log('🔍 Looking up existing no-tenant user...')
  const lookupRes = await axios.get(`${API}/users/lookup?email=qa-notenant2@noctocode.com`, { headers })
  console.log('Lookup response:', JSON.stringify(lookupRes.data, null, 2))
  const userId = lookupRes.data.data.id
  console.log(`User ID: ${userId}`)

  // Verify email
  await axios.post(`${API}/auth/admin/update-user`, {
    userId,
    data: { emailVerified: true }
  }, { headers })
  console.log('✅ Email verified')
  console.log('\n📋 Update your .env:')
  console.log(`SUBTITLES_NO_TENANT_EMAIL=qa-notenant2@noctocode.com`)
  console.log(`SUBTITLES_NO_TENANT_PASSWORD=QAtest1234!`)
}

run().catch(err => {
  console.error('❌ Setup failed:', err.response?.data || err.message)
  process.exit(1)
})