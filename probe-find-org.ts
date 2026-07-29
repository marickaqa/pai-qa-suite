/**
 * Find an org's ID by slug or name. qa-saas is a platform admin, so it has
 * access to the org list endpoint that the Admin Panel > Organizations page
 * uses. This is read-only — just prints matches.
 *
 * Usage:  npx tsx probe-find-org.ts <slug-or-name-fragment>
 *   e.g.  npx tsx probe-find-org.ts blank
 */
import { getSaasToken, authHeaders } from './utils/saasClient'
import axios from 'axios'

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'
const needle = (process.argv[2] || '').toLowerCase()
if (!needle) {
  console.error('usage: npx tsx probe-find-org.ts <slug-or-name-fragment>')
  process.exit(1)
}

async function main() {
  const token = await getSaasToken()
  console.log(`searching for org matching "${needle}"...`)

  const r = await axios.get(`${BASE_URL}/organization`, { headers: authHeaders(token) })
  console.log(`  status ${r.status}, ${r.data?.length ?? 0} orgs total`)

  const matches = (r.data || []).filter((o: any) =>
    (o.name || '').toLowerCase().includes(needle) ||
    (o.slug || '').toLowerCase().includes(needle)
  )
  console.log(`\n${matches.length} matches:`)
  for (const o of matches) {
    console.log(`  id:   ${o.id}`)
    console.log(`  name: ${o.name}`)
    console.log(`  slug: ${o.slug}`)
    console.log('')
  }
}

main().catch(e => {
  console.error(`FAILED status ${e.response?.status}`)
  console.error(e.response?.data ?? e.message)
  process.exit(1)
})
