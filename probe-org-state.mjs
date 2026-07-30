import { chromium } from 'playwright'
import fs from 'fs'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SESSION = 'reports/saas-session.json'

// 1) What's persisted in the saved session file?
const state = JSON.parse(fs.readFileSync(SESSION, 'utf8'))
console.log('--- cookies:', state.cookies.map(c => c.name).join(', '))
let sawOrgInLS = false
for (const o of state.origins || [])
  for (const kv of o.localStorage || [])
    if (/org|tenant|workspace/i.test(kv.name + kv.value)) {
      sawOrgInLS = true
      console.log('--- LS', kv.name, '=', kv.value.slice(0, 140))
    }
if (!sawOrgInLS) console.log('--- LS: no org/tenant key found in localStorage')

// 2) What org does a FRESH context boot into, and does it flip over time?
const browser = await chromium.launch()
const page = await (await browser.newContext({ storageState: SESSION })).newPage()
await page.goto(SAAS_URL + '/dashboard/overview')
const trigger = page.locator('button:has(svg.lucide-chevrons-up-down)')
await trigger.waitFor({ state: 'visible', timeout: 30000 })
for (let i = 0; i < 10; i++) {
  console.log(`t+${i}s org =`, (await trigger.textContent())?.trim())
  await page.waitForTimeout(1000)
}

// 3) Is the active org hiding in sessionStorage (which storageState does NOT save)?
const ss = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)))
console.log('--- sessionStorage:', ss)

await browser.close()