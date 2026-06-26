import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const CHAT_SESSION = 'reports/session.json'
const SAAS_SESSION = 'reports/saas-session.json'
const SUBTITLES_SESSION = 'reports/subtitles-session.json'

const CHAT_URL = process.env.CHAT_URL || 'https://pc-fe-dev.noctocode.dev'
const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SUBTITLES_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch()

  // Chatbot session
  const chatContext = await browser.newContext()
  const chatPage = await chatContext.newPage()
  await chatPage.goto(CHAT_URL)
  await chatPage.fill('#email', process.env.API_EMAIL || '')
  await chatPage.fill('#password', process.env.API_PASSWORD || '')
  await chatPage.click('button[type="submit"]')
  await chatPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 35000 })
  await chatContext.storageState({ path: CHAT_SESSION })
  await chatPage.close()
  await chatContext.close()

 // SaaS session
  const saasContext = await browser.newContext()
  const saasPage = await saasContext.newPage()
  await saasPage.goto(SAAS_URL + '/login')
  await saasPage.waitForLoadState('networkidle')
  await saasPage.fill('input[name="email"]', process.env.SAAS_EMAIL || '')
  await saasPage.fill('input[name="password"]', process.env.SAAS_PASSWORD || '')
  await saasPage.click('button[type="submit"]')
  await saasPage.waitForTimeout(5000)
  console.log('SaaS URL after submit:', saasPage.url())
  await saasPage.screenshot({ path: 'reports/saas-login-debug.png' })
  await saasPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 60000 })
  await saasContext.storageState({ path: SAAS_SESSION })
  await saasPage.close()
  await saasContext.close()

  // Subtitles session
  try {
    const subtitlesContext = await browser.newContext()
    const subtitlesPage = await subtitlesContext.newPage()
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
    await subtitlesPage.close()
    await subtitlesContext.close()
    console.log('✅ Subtitles session generated')
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('❌ Subtitles session generation failed:', message)
  }

  await browser.close()
}

export default globalSetup