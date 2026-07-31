import { chromium } from '@playwright/test'
import fs from 'fs'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const session = JSON.parse(fs.readFileSync('reports/saas-session.json', 'utf8'))
const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: session })
const page = await ctx.newPage()

// Capture failed / slow network responses.
const bad = []
page.on('response', r => {
  if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`)
})

await page.goto(`${SAAS_URL}/dashboard/overview`)
await page.waitForTimeout(2000)
await page.goto(`${SAAS_URL}/dashboard/analytics`)
await page.waitForTimeout(8000)

// Is the loading text actually VISIBLE, or just present in the DOM?
const loadingLoc = page.getByText('Loading your workspace')
const loadingVisible = await loadingLoc.count() > 0 ? await loadingLoc.first().isVisible() : false
console.log('LOADING_VISIBLE:', loadingVisible)

// What sections DID render?
console.log('HAS_ORG_OVERVIEW_TEXT:', await page.getByText(/overview/i).count())
console.log('HAS_ACTIVITY_OVER_TIME:', await page.getByText('Activity over time').count())
console.log('HAS_GUARDRAIL:', await page.getByText('Guardrail triggers').count())

// Failed network calls (the likely smoking gun if it's a hung/broken API).
console.log('FAILED_RESPONSES:', JSON.stringify(bad, null, 2))

// First chunk of main content, to eyeball structure.
const mainText = (await page.locator('main').first().textContent().catch(() => '')) ?? ''
console.log('MAIN_TEXT:', mainText.slice(0, 400))

await browser.close()