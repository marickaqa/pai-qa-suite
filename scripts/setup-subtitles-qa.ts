import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = process.env.SUBTITLES_API_URL || 'https://subtitles-api-dev.paicloud.ai/api'

// All credentials come from .env — never hardcode or print them.
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
const QA_EMAIL = requireEnv('SUBTITLES_QA_EMAIL')
const QA_PASSWORD = requireEnv('SUBTITLES_QA_PASSWORD')
const NO_TENANT_EMAIL = requireEnv('SUBTITLES_NO_TENANT_EMAIL')
const NO_TENANT_PASSWORD = requireEnv('SUBTITLES_NO_TENANT_PASSWORD')
const TENANT_ID = requireEnv('SUBTITLES_QA_TENANT_ID')

async function getAdminCookie(): Promise<string> {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }, { withCredentials: true })
  const cookies = res.headers['set-cookie']
  return cookies ? cookies.join('; ') : ''
}

async function setup() {
  console.log('🔐 Signing in as admin...')
  const cookie = await getAdminCookie()
  const headers = {
    'Cookie': cookie,
    'Content-Type': 'application/json',
    'Origin': 'https://subtitles-dev.paicloud.ai'
  }

  console.log(`✅ Using existing tenant: ${TENANT_ID}`)

  // 1. Create QA test user
  console.log('👤 Creating QA test user...')
  const userRes = await axios.post(`${API}/auth/admin/create-user`, {
    email: QA_EMAIL,
    password: QA_PASSWORD,
    name: 'QA Automation',
    role: 'user',
  }, { headers })
  const userId = userRes.data.user.id
  console.log(`✅ User created: ${userId}`)

  // 2. Add QA user to QA tenant
  console.log('🔗 Adding QA user to QA tenant...')
  await axios.post(`${API}/tenants/${TENANT_ID}/members`, {
    email: QA_EMAIL,
    name: 'QA Automation',
    tenantRole: 'admin',
  }, { headers })
  console.log('✅ User added to tenant')

  // 3. Create no-tenant user
  console.log('👤 Creating no-tenant user...')
  const noTenantRes = await axios.post(`${API}/auth/admin/create-user`, {
    email: NO_TENANT_EMAIL,
    password: NO_TENANT_PASSWORD,
    name: 'QA No Tenant',
    role: 'user',
  }, { headers })
  console.log(`✅ No-tenant user created: ${noTenantRes.data.user.id}`)

  console.log('\n📋 Done. Users match the SUBTITLES_* values already in your .env — nothing to copy.')
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.response?.data || err.message)
  process.exit(1)
})
