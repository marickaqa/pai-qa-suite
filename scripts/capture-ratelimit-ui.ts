/**
 * Manual demo: capture the user-facing result of the /auth/signin rate limit.
 *
 * Burns the ~10/min sign-in limit via direct API calls, then immediately
 * drives the real chatbot login form and screenshots what the user sees.
 * Produces reports/ratelimit-ui.png (gitignored) to attach to the bug report.
 *
 * Run:  npx tsx scripts/capture-ratelimit-ui.ts
 */
import axios from 'axios'
import { chromium } from 'playwright'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const CHAT_URL = process.env.CHAT_URL || 'https://pc-fe-dev.noctocode.dev'
const EMAIL = process.env.API_EMAIL || ''
const PASSWORD = process.env.API_PASSWORD || ''

async function burnLimit() {
  console.log('Burning the sign-in rate limit via API...')
  let tripped = false
  for (let i = 1; i <= 12; i++) {
    const r = await axios.post(`${API}/auth/signin`, { email: EMAIL, password: PASSWORD },
      { validateStatus: () => true })
    console.log(`  signin #${i} -> ${r.status}`)
    if (r.status >= 500) tripped = true
  }
  if (!tripped) console.log('  (warning: limit not tripped — may already be cooling down)')
}

async function captureLoginUI() {
  const browser = await chromium.launch()
  // fresh context so no cached session skips the signin call
  const context = await browser.newContext()
  const page = await context.newPage()

  // capture the network response the UI receives
  page.on('response', async (res) => {
    if (res.url().includes('/auth/signin')) {
      console.log(`  UI signin call -> ${res.status()}` +
        (res.headers()['retry-after'] ? ` retry-after=${res.headers()['retry-after']}` : ''))
    }
  })

  console.log('Opening login page and attempting login while limited...')
  await page.goto(`${CHAT_URL}`)
  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type="submit"]')

  // give the UI a moment to render whatever error/state it shows
  await page.waitForTimeout(4000)

  const shot = path.resolve(__dirname, '../reports/ratelimit-ui.png')
  await page.screenshot({ path: shot, fullPage: true })
  console.log(`\nScreenshot saved: reports/ratelimit-ui.png`)

  // also dump any visible error text we can find, for the report
  const bodyText = await page.locator('body').innerText().catch(() => '')
  const errorHints = bodyText.split('\n').filter(l =>
    /error|wrong|fail|try again|too many|invalid|something/i.test(l)).slice(0, 5)
  if (errorHints.length) {
    console.log('Visible message(s) on screen:')
    errorHints.forEach(l => console.log(`  "${l.trim()}"`))
  } else {
    console.log('No obvious error text found — check the screenshot for the actual state.')
  }

  await browser.close()
}

async function run() {
  await burnLimit()
  await captureLoginUI()
}
run().catch(e => { console.error(e); process.exit(1) })
