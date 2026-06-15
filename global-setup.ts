import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const CHAT_SESSION = 'reports/session.json'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_URL = process.env.CHAT_URL || 'https://pc-fe-dev.noctocode.dev'
const SAAS_URL = process.env.SAAS_URL || 'https://chat.paicloud.ai'

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
  await saasPage.fill('input[name="email"]', process.env.SAAS_EMAIL || '')
  await saasPage.fill('input[name="password"]', process.env.SAAS_PASSWORD || '')
  await saasPage.click('button[type="submit"]')
  await saasPage.waitForURL((url: URL) => !url.toString().includes('login'), { timeout: 35000 })
  await saasContext.storageState({ path: SAAS_SESSION })
  await saasPage.close()
  await saasContext.close()

  await browser.close()
}

export default globalSetup