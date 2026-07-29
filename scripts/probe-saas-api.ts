/**
 * Quick probe to see the current shape of key SaaS API responses.
 * Runs against whatever API_BASE_URL is set (should be chat-api-dev.paicloud.ai).
 *
 * Usage:  npx tsx probe-saas-api.ts   (from repo root)
 * Paste the output back so we can fix the API specs against real data.
 */
import { getSaasToken, authHeaders } from '../utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'
const ORG_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'

function label(name: string) {
  console.log(`\n=== ${name} ===`)
}
function show(data: any) {
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2).slice(0, 800))
}

async function main() {
  const token = await getSaasToken()
  console.log(`BASE_URL = ${BASE_URL}`)
  console.log(`token acquired: ${token.slice(0, 12)}... (len ${token.length})`)

  // 1. Create a support-type chatbot — the failing path
  label('POST /chatbot (type: support)')
  try {
    const slug = `qa-probe-${Date.now()}`
    const r = await axios.post(`${BASE_URL}/chatbot`,
      { name: 'QA Probe Bot', slug, type: 'support', active: false },
      { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
    show(r.data)
    if (r.data?.id) {
      // Clean up immediately
      await axios.delete(`${BASE_URL}/chatbot/${r.data.id}`, { headers: authHeaders(token) })
      console.log(`cleaned up ${r.data.id}`)
    }
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`)
    show(e.response?.data ?? e.message)
  }

  // 2. Chatbot list shape
  label('GET /chatbot/list')
  try {
    const r = await axios.get(`${BASE_URL}/chatbot/list`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, isArray: ${Array.isArray(r.data)}`)
    if (Array.isArray(r.data) && r.data[0]) {
      console.log(`first item keys: ${Object.keys(r.data[0]).join(', ')}`)
    } else {
      console.log(`data keys: ${Object.keys(r.data).join(', ')}`)
    }
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  // 3. Organization by id
  label(`GET /organization/${ORG_ID}`)
  try {
    const r = await axios.get(`${BASE_URL}/organization/${ORG_ID}`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  // 4. Org members
  label('GET /organization-members')
  try {
    const r = await axios.get(`${BASE_URL}/organization-members`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
    if (r.data.members?.[0]) console.log(`member keys: ${Object.keys(r.data.members[0]).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  // 5. Prompt templates
  label('GET /prompt-templates')
  try {
    const r = await axios.get(`${BASE_URL}/prompt-templates`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, isArray: ${Array.isArray(r.data)}, len: ${r.data?.length}`)
    if (r.data?.[0]) console.log(`template keys: ${Object.keys(r.data[0]).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  // 6. Documents / folders on the support bot
  const SUPPORT_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
  label(`GET /chatbot/${SUPPORT_BOT_ID}/document`)
  try {
    const r = await axios.get(`${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/document`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  label(`GET /chatbot/${SUPPORT_BOT_ID}/folder`)
  try {
    const r = await axios.get(`${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/folder`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }

  // 7. Deployment (support-type bot should be rejected)
  label(`POST /chatbot/${SUPPORT_BOT_ID}/deploy (expect 4xx)`)
  try {
    const r = await axios.post(`${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/deploy`, {}, { headers: authHeaders(token) })
    console.log(`UNEXPECTED status ${r.status}`); show(r.data)
  } catch (e: any) {
    console.log(`got status ${e.response?.status} — message: ${e.response?.data?.message ?? 'n/a'}`)
  }

  // 8. Chatbot members
  label(`GET /chatbot/${SUPPORT_BOT_ID}/members`)
  try {
    const r = await axios.get(`${BASE_URL}/chatbot/${SUPPORT_BOT_ID}/members`, { headers: authHeaders(token) })
    console.log(`status ${r.status}, keys: ${Object.keys(r.data).join(', ')}`)
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`); show(e.response?.data ?? e.message)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
