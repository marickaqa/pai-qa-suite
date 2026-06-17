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
const EXISTING_TENANT_ID = '2cf9b9b7-9e54-4d0f-b7be-0880411e8f05'

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

  const tenantId = EXISTING_TENANT_ID
  console.log(`✅ Using existing tenant: ${tenantId}`)

  // 1. Create QA test user
  console.log('👤 Creating QA test user...')
  const userRes = await axios.post(`${API}/auth/admin/create-user`, {
    email: process.env.SUBTITLES_QA_EMAIL || 'qa-subtitles@noctocode.com',
    password: process.env.SUBTITLES_QA_PASSWORD || 'QAtest1234!',
    name: 'QA Automation',
    role: 'user',
  }, { headers })
  const userId = userRes.data.user.id
  console.log(`✅ User created: ${userId}`)

  // 2. Add QA user to QA tenant
  console.log('🔗 Adding QA user to QA tenant...')
  await axios.post(`${API}/tenants/${tenantId}/members`, {
    email: process.env.SUBTITLES_QA_EMAIL || 'qa-subtitles@noctocode.com',
    name: 'QA Automation',
    tenantRole: 'admin',
  }, { headers })
  console.log('✅ User added to tenant')

  // 3. Create no-tenant user
  console.log('👤 Creating no-tenant user...')
  const noTenantRes = await axios.post(`${API}/auth/admin/create-user`, {
    email: process.env.SUBTITLES_NO_TENANT_EMAIL || 'qa-notenant@noctocode.com',
    password: process.env.SUBTITLES_NO_TENANT_PASSWORD || 'QAtest1234!',
    name: 'QA No Tenant',
    role: 'user',
  }, { headers })
  console.log(`✅ No-tenant user created: ${noTenantRes.data.user.id}`)

  console.log('\n📋 Add these to your .env:')
  console.log(`SUBTITLES_API_URL=https://subtitles-api-dev.paicloud.ai/api`)
  console.log(`SUBTITLES_URL=https://subtitles-dev.paicloud.ai`)
  console.log(`SUBTITLES_ADMIN_EMAIL=${ADMIN_EMAIL}`)
  console.log(`SUBTITLES_ADMIN_PASSWORD=${ADMIN_PASSWORD}`)
  console.log(`SUBTITLES_QA_EMAIL=qa-subtitles@noctocode.com`)
  console.log(`SUBTITLES_QA_PASSWORD=QAtest1234!`)
  console.log(`SUBTITLES_QA_TENANT_ID=${tenantId}`)
  console.log(`SUBTITLES_NO_TENANT_EMAIL=qa-notenant@noctocode.com`)
  console.log(`SUBTITLES_NO_TENANT_PASSWORD=QAtest1234!`)
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.response?.data || err.message)
  process.exit(1)
})