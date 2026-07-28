/**
 * Follow-up probe: figure out what POST /chatbot now actually requires.
 * The first probe showed the old body { name, slug, type, active } gets a
 * 400 "Request validation failed" — this tries a few likely candidates to
 * narrow down what's missing.
 *
 * Runs cleanup on anything that gets created.
 */
import { getSaasToken, authHeaders } from './utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'
const ORG_ID = '48e242fb-42de-4d46-9e43-1bf36873df37'

async function tryCreate(label: string, body: Record<string, any>) {
  console.log(`\n--- ${label} ---`)
  console.log('body:', JSON.stringify(body))
  try {
    const token = await getSaasToken()
    const r = await axios.post(`${BASE_URL}/chatbot`, body, { headers: authHeaders(token) })
    console.log(`OK status ${r.status}, response keys: ${Object.keys(r.data).join(', ')}`)
    console.log(JSON.stringify(r.data, null, 2).slice(0, 500))
    if (r.data?.id) {
      await axios.delete(`${BASE_URL}/chatbot/${r.data.id}`, { headers: authHeaders(token) })
      console.log(`cleaned up ${r.data.id}`)
    }
    return true
  } catch (e: any) {
    console.log(`FAILED status ${e.response?.status}`)
    console.log('response:', JSON.stringify(e.response?.data, null, 2))
    return false
  }
}

async function main() {
  const stamp = Date.now()

  // Candidate 1: add organizationId in the body (most likely from UI DOM)
  await tryCreate('with organizationId', {
    name: 'QA Probe Bot', slug: `qa-probe-a-${stamp}`, type: 'support', active: false,
    organizationId: ORG_ID,
  })

  // Candidate 2: minimal — maybe active isn't accepted anymore
  await tryCreate('minimal (no active)', {
    name: 'QA Probe Bot', slug: `qa-probe-b-${stamp}`, type: 'support',
    organizationId: ORG_ID,
  })

  // Candidate 3: match the new wizard — maybe type is now 'SUPPORT' or 'supportbot'
  await tryCreate('type: SUPPORT (uppercase)', {
    name: 'QA Probe Bot', slug: `qa-probe-c-${stamp}`, type: 'SUPPORT',
    organizationId: ORG_ID,
  })
  await tryCreate('type: supportbot', {
    name: 'QA Probe Bot', slug: `qa-probe-d-${stamp}`, type: 'supportbot',
    organizationId: ORG_ID,
  })
}

main().catch(e => { console.error(e); process.exit(1) })
