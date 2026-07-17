import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = process.env.SUBTITLES_API_URL || 'https://subtitles-api-dev.paicloud.ai/api'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`❌ Missing required env var: ${name} — set it in .env before running this script.`)
    process.exit(1)
  }
  return value
}

const ADMIN_EMAIL = requireEnv('SUBTITLES_ADMIN_EMAIL')
const ADMIN_PASSWORD = requireEnv('SUBTITLES_ADMIN_PASSWORD')
const NO_TENANT_EMAIL = requireEnv('SUBTITLES_NO_TENANT_EMAIL')

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
  console.log(`🔍 Looking up user ${NO_TENANT_EMAIL}...`)
  const lookupRes = await axios.get(`${API}/users/lookup?email=${encodeURIComponent(NO_TENANT_EMAIL)}`, { headers })
  const userId = lookupRes.data.data.id
  console.log(`User ID: ${userId}`)

  // Verify email
  await axios.post(`${API}/auth/admin/update-user`, {
    userId,
    data: { emailVerified: true }
  }, { headers })
  console.log('✅ Email verified')
  console.log('\n📋 Done. Credentials stay in .env — nothing printed here on purpose.')
}

run().catch(err => {
  console.error('❌ Setup failed:', err.response?.data || err.message)
  process.exit(1)
})
