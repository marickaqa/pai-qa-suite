import { chromium } from '@playwright/test'
import fs from 'fs'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
// A redesigned agent-scoped page — the kind that fails #3/#8/#9.
const TARGET = `${SAAS_URL}/dashboard/analytics`

const session = JSON.parse(fs.readFileSync('reports/saas-session.json', 'utf8'))
const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: session })
const page = await ctx.newPage()

// Hard-nav straight to the scoped page WITHOUT settling org first — reproduce
// the exact bad state, then check whether the picker is present and clickable.
await page.goto(TARGET)
await page.waitForTimeout(3000) // let it paint

const trigger = page.locator('button:has(svg.lucide-chevrons-up-down)')
const count = await trigger.count()
let label = '(not found)'
let clickable = false
if (count > 0) {
  label = (await trigger.first().textContent())?.trim() ?? '(empty)'
  try {
    await trigger.first().click({ trial: true, timeout: 3000 })
    clickable = true
  } catch { clickable = false }
}

console.log('PROBE_RESULT:', JSON.stringify({ count, label, clickable }, null, 2))
await browser.close()