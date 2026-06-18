import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const TENANT_ID = process.env.SUBTITLES_QA_TENANT_ID || '2cf9b9b7-9e54-4d0f-b7be-0880411e8f05'

async function getCookie(email: string, password: string): Promise<string> {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email,
    password,
  }, { withCredentials: true })
  const cookies = res.headers['set-cookie']
  return cookies ? cookies.join('; ') : ''
}

async function run() {
  // Sign in as QA user and get pending invites
  console.log('🔐 Signing in as QA user...')
  const qaCookie = await getCookie(
    process.env.SUBTITLES_QA_EMAIL || '',
    process.env.SUBTITLES_QA_PASSWORD || ''
  )
  const qaHeaders = {
    'Cookie': qaCookie,
    'Content-Type': 'application/json',
    'Origin': 'https://subtitles-dev.paicloud.ai'
  }

  console.log('📋 Getting pending invites...')
  const inviteListRes = await axios.get(`${API}/users/me/invites`, { headers: qaHeaders })
  console.log('Invites:', JSON.stringify(inviteListRes.data, null, 2))

  // Accept each pending invite
  const invites = inviteListRes.data?.data || inviteListRes.data || []
  if (Array.isArray(invites) && invites.length > 0) {
    for (const invite of invites) {
      console.log(`✅ Accepting invite ${invite.id}...`)
      await axios.post(`${API}/users/me/invites/${invite.id}/accept`, {}, { headers: qaHeaders })
      console.log('✅ Invite accepted')
    }
  } else {
    console.log('No pending invites found')
  }
}

run().catch(err => {
  console.error('❌ Failed:', err.response?.data || err.message)
  process.exit(1)
})