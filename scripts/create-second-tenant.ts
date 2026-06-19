import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'

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

  // Create second tenant
  console.log('🏢 Creating second tenant...')
  const tenantRes = await axios.post(`${API}/tenants`, {
    name: 'qa-automation-2',
    slug: 'qa-automation-2'
  }, { headers })
  const tenantId = tenantRes.data.data.id
  console.log(`✅ Tenant created: ${tenantId}`)

  // Add QA user to second tenant
  console.log('🔗 Adding QA user to second tenant...')
  await axios.post(`${API}/tenants/${tenantId}/members`, {
    email: process.env.SUBTITLES_QA_EMAIL,
    name: 'QA Automation',
    tenantRole: 'admin',
  }, { headers })
  console.log('✅ QA user invited to second tenant')
  console.log(`\nTENANT_2_ID=${tenantId}`)
  console.log('Now accept the invite by running fix-subtitles-tenant.ts with the new invite.')
}

run().catch(err => {
  console.error('❌ Failed:', err.response?.data || err.message)
  process.exit(1)
})