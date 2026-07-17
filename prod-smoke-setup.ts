import { chromium } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const SMOKE_SAAS_URL = process.env.SMOKE_SAAS_URL || 'https://chat.paicloud.ai'
const SESSION = 'reports/prod-smoke-session.json'

// Dev hostnames where a dry-run is allowed without ALLOW_PROD.
const DEV_HOST_MARKERS = ['-dev.', 'noctocode.dev', 'localhost']

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required env var: ${name}. The prod smoke tier uses dedicated ` +
      `SMOKE_SAAS_EMAIL / SMOKE_SAAS_PASSWORD credentials — set them in .env.`
    )
  }
  return value
}

async function globalSetup() {
  const host = new URL(SMOKE_SAAS_URL).hostname.toLowerCase()
  const isDevTarget = DEV_HOST_MARKERS.some(marker => host.includes(marker))

  if (!isDevTarget && process.env.ALLOW_PROD !== '1') {
    throw new Error(
      [
        `PROD SMOKE: target ${SMOKE_SAAS_URL} is production, but ALLOW_PROD is not set.`,
        'This tier is read-only by design, but targeting prod must still be a',
        'deliberate act. Run with ALLOW_PROD=1 to proceed, e.g.:',
        '  $env:ALLOW_PROD="1"; npm run test:prod-smoke; Remove-Item Env:\\ALLOW_PROD',
      ].join('\n')
    )
  }

  const email = requireEnv('SMOKE_SAAS_EMAIL')
  const password = requireEnv('SMOKE_SAAS_PASSWORD')

  console.log(`Prod smoke target: ${SMOKE_SAAS_URL}${isDevTarget ? ' (dev dry-run)' : ''}`)

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto(SMOKE_SAAS_URL + '/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 60000 })
    await context.storageState({ path: SESSION })
    console.log('Prod smoke session generated')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`Prod smoke login failed: ${message}`)
    try {
      await page.screenshot({ path: 'reports/prod-smoke-login-failure.png' })
      console.error('Screenshot saved to reports/prod-smoke-login-failure.png (local only, gitignored)')
    } catch { /* page may be closed */ }
    throw e
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }
}

export default globalSetup
