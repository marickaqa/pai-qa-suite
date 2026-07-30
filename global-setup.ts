import { chromium, expect, FullConfig, Page } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'
import { assertNotProd } from './utils/prodGuard'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const CHAT_SESSION = 'reports/session.json'
const SAAS_SESSION = 'reports/saas-session.json'
const SUBTITLES_SESSION = 'reports/subtitles-session.json'

// CHAT_URL has no fallback: a stale hardcoded default is itself a silent-failure
// risk (it already went stale once, during the pc-*-dev -> egle.chat migration).
// Missing env should fail loudly here rather than quietly hit the wrong domain.
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set in .env — see env.example`)
  }
  return value
}
const CHAT_URL = requireEnv('CHAT_URL')
const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SUBTITLES_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

// On failure, capture a screenshot for local debugging.
// reports/ is fully gitignored, so these can never end up in the repo.
async function captureFailure(page: Page, name: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`❌ ${name} session generation failed: ${message}`)
  try {
    await page.screenshot({ path: `reports/${name}-login-failure.png` })
    console.error(`   Screenshot saved to reports/${name}-login-failure.png (local only, gitignored)`)
  } catch {
    // page may already be closed — nothing more we can do
  }
}

async function globalSetup(config: FullConfig) {
  assertNotProd()

  const browser = await chromium.launch()

  // Chatbot session
  const chatContext = await browser.newContext()
  const chatPage = await chatContext.newPage()
  try {
    await chatPage.goto(CHAT_URL)
    await chatPage.fill('#email', process.env.API_EMAIL || '')
    await chatPage.fill('#password', process.env.API_PASSWORD || '')
    await chatPage.click('button[type="submit"]')
    await chatPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 35000 })
    await chatContext.storageState({ path: CHAT_SESSION })
    console.log('✅ Chatbot session generated')
  } catch (e: unknown) {
    await captureFailure(chatPage, 'chatbot', e)
    throw e
  } finally {
    await chatPage.close()
    await chatContext.close()
  }

  // Custom chatbot session (only if CHATBOT_URL is set and different from CHAT_URL)
  const CUSTOM_URL = process.env.CHATBOT_URL
  if (CUSTOM_URL && CUSTOM_URL !== CHAT_URL) {
    const customContext = await browser.newContext()
    const customPage = await customContext.newPage()
    try {
      await customPage.goto(CUSTOM_URL)
      await customPage.fill('#email', process.env.API_EMAIL || '')
      await customPage.fill('#password', process.env.API_PASSWORD || '')
      await customPage.click('button[type="submit"]')
      await customPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 35000 })
      await customContext.storageState({ path: 'reports/custom-session.json' })
      console.log('✅ Custom chatbot session generated')
    } catch (e: unknown) {
      await captureFailure(customPage, 'custom-chatbot', e)
    } finally {
      await customPage.close()
      await customContext.close()
    }
  } else {
    // fall back to copying the main chatbot session
    const fs = await import('fs')
    if (fs.existsSync('reports/session.json')) {
      fs.copyFileSync('reports/session.json', 'reports/custom-session.json')
    }
  }

  // SaaS session — logged in as qa-saas and switched into the noctocode.dev org,
  // which holds the real fixtures (support bots, conversations, agent 77d5b55e).
  // Left on its default org (Trump Media) the account has no support bots and no
  // conversations, so the data-dependent SaaS specs would have nothing to test.
  const saasContext = await browser.newContext()
  const saasPage = await saasContext.newPage()
  try {
    await saasPage.goto(SAAS_URL + '/login')
    // Condition-based wait instead of networkidle (which can hang on the SPA).
    await saasPage.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 30000 })
    await saasPage.fill('input[name="email"]', process.env.SAAS_EMAIL || '')
    await saasPage.fill('input[name="password"]', process.env.SAAS_PASSWORD || '')
    await saasPage.click('button[type="submit"]')
    await saasPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 60000 })

    const orgTrigger = saasPage.locator('button:has(svg.lucide-chevrons-up-down)')
    await orgTrigger.waitFor({ state: 'visible', timeout: 30000 })
    const activeOrg = (await orgTrigger.textContent()) || ''
    if (!activeOrg.includes('noctocode.dev')) {
      await orgTrigger.click()
      // The open dropdown holds TWO noctocode.dev buttons: the sidebar trigger
      // itself (rounded-[10px]) and the menu item (rounded-md). The old
      // hasNotText('@') filter matched both -> strict-mode ambiguity, which is
      // why this switch was intermittently landing on the wrong element. Target
      // the menu item specifically.
      await saasPage.getByRole('menuitem', { name: /noctocode\.dev/i })
        .or(saasPage.locator('button.rounded-md').filter({ hasText: /noctocode\.dev/i }))
        .first()
        .click()
      await expect(orgTrigger).toContainText('noctocode.dev', { timeout: 15000 })
    }

    // The active org is server-side state keyed to the token, and the SPA
    // cold-boots on the account default (Acme Corp) before reconciling. A hard
    // reload forces a fresh server read: if the switch persisted for this token
    // it comes back as noctocode.dev. We assert AFTER the reload so a switch
    // that didn't stick fails setup loudly instead of saving a session that
    // boots every spec on the wrong org.
    await saasPage.reload()
    await orgTrigger.waitFor({ state: 'visible', timeout: 30000 })
    await expect(
      orgTrigger,
      'SaaS session did not persist noctocode.dev after reload — aborting setup'
    ).toContainText('noctocode.dev', { timeout: 30000 })

    await saasContext.storageState({ path: SAAS_SESSION })
    console.log('✅ SaaS session generated (org: noctocode.dev)')
  } catch (e: unknown) {
    await captureFailure(saasPage, 'saas', e)
    throw e
  } finally {
    await saasPage.close()
    await saasContext.close()
  }

  // Subtitles session
  const subtitlesContext = await browser.newContext()
  const subtitlesPage = await subtitlesContext.newPage()
  try {
    await subtitlesPage.goto(SUBTITLES_URL + '/login')
    await subtitlesPage.fill('input[name="email"]', process.env.SUBTITLES_QA_EMAIL || '')
    await subtitlesPage.fill('input[name="password"]', process.env.SUBTITLES_QA_PASSWORD || '')
    await subtitlesPage.click('button[type="submit"]')
    await subtitlesPage.waitForTimeout(5000)
    // Handle org selector
    if (subtitlesPage.url().includes('select-tenant')) {
      await subtitlesPage.locator('button:has(span[title="qa-automation"])').click()
      await subtitlesPage.waitForURL((url: URL) => url.toString().includes('/overview'), { timeout: 15000 })
      await subtitlesPage.waitForTimeout(3000)
    }
    await subtitlesContext.storageState({ path: SUBTITLES_SESSION })
    console.log('✅ Subtitles session generated')
  } catch (e: unknown) {
    await captureFailure(subtitlesPage, 'subtitles', e)
  } finally {
    await subtitlesPage.close()
    await subtitlesContext.close()
  }

  await browser.close()
}

export default globalSetup