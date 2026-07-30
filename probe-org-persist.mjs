import { chromium } from 'playwright'
const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const browser = await chromium.launch()
const ctx = await browser.newContext({ storageState: 'reports/saas-session.json' })
const page = await ctx.newPage()
const trigger = page.locator('button:has(svg.lucide-chevrons-up-down)')

await page.goto(SAAS_URL + '/dashboard/overview')
await trigger.waitFor({ state: 'visible', timeout: 30000 })
console.log('boot org:', (await trigger.textContent())?.trim())

page.on('request', r => { if (r.method() !== 'GET') console.log('  ->', r.method(), r.url()) })
await trigger.click()
await page.getByRole('menuitem', { name: /noctocode\.dev/i })
  .or(page.locator('button.rounded-md').filter({ hasText: /noctocode\.dev/i }))
  .first()
  .click()
await page.waitForTimeout(2000)
console.log('after switch:', (await trigger.textContent())?.trim())

await page.reload()
await trigger.waitFor({ state: 'visible', timeout: 30000 })
await page.waitForTimeout(3000)
console.log('after reload:', (await trigger.textContent())?.trim())

await browser.close()