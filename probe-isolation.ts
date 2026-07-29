import { getSaasToken, authHeaders } from './utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'
const ORG_2_ID = '270794fc-2c87-4aec-b801-c37e804fb852' // "blank org" — qa-saas is NOT a member

async function main() {
  const token = await getSaasToken()
  console.log(`BASE_URL = ${BASE_URL}`)
  console.log(`ORG_2_ID = ${ORG_2_ID}`)

  console.log(`\n--- GET /organization/${ORG_2_ID} (does the org exist?) ---`)
  try {
    const r = await axios.get(`${BASE_URL}/organization/${ORG_2_ID}`, { headers: authHeaders(token) })
    console.log(`  status ${r.status}`)
    console.log(`  name: ${JSON.stringify(r.data?.name)}`)
    console.log(`  slug: ${JSON.stringify(r.data?.slug)}`)
    console.log(`  -> org exists`)
  } catch (e: any) {
    console.log(`  status ${e.response?.status}, body: ${JSON.stringify(e.response?.data)}`)
    console.log(`  -> org may not exist (or access blocked)`)
  }

  console.log(`\n--- GET /chatbot/list with x-organization-id: ${ORG_2_ID} ---`)
  try {
    const r = await axios.get(`${BASE_URL}/chatbot/list`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID },
    })
    console.log(`  status ${r.status}`)
    console.log(`  isArray: ${Array.isArray(r.data)}, length: ${Array.isArray(r.data) ? r.data.length : 'n/a'}`)
    if (Array.isArray(r.data) && r.data.length > 0) {
      console.log(`  !!! GOT DATA BACK from an org qa-saas is not supposed to be in`)
      console.log(`  first 3 chatbot names: ${r.data.slice(0, 3).map((b: any) => b.name).join(', ')}`)
    } else {
      console.log(`  -> empty result`)
    }
  } catch (e: any) {
    console.log(`  status ${e.response?.status}, body: ${JSON.stringify(e.response?.data)}`)
    console.log(`  -> access denied (correct behaviour)`)
  }

  console.log(`\n--- GET /organization-members with x-organization-id: ${ORG_2_ID} ---`)
  try {
    const r = await axios.get(`${BASE_URL}/organization-members`, {
      headers: { Authorization: `Bearer ${token}`, 'x-organization-id': ORG_2_ID },
    })
    console.log(`  status ${r.status}`)
    console.log(`  member count: ${r.data?.members?.length ?? 'n/a'}`)
    if (r.data?.members?.length > 0) {
      console.log(`  !!! GOT MEMBER DATA back`)
      console.log(`  first 3 emails: ${r.data.members.slice(0, 3).map((m: any) => m.email).join(', ')}`)
    } else {
      console.log(`  -> empty members`)
    }
  } catch (e: any) {
    console.log(`  status ${e.response?.status}, body: ${JSON.stringify(e.response?.data)}`)
    console.log(`  -> access denied (correct behaviour)`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
