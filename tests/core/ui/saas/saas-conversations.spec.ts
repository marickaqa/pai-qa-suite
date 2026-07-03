import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CONVERSATIONS_URL = `${SAAS_URL}/dashboard/conversations`

test.describe('Core — SaaS Conversations', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should navigate to conversations page', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
  })

  test('should show chatbot filter list in sidebar', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('noctocode-test').first()).toBeVisible()
  })

  test('should show conversation count next to All chats', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/All chats/).first()).toBeVisible()
    // count is shown as a number adjacent to All chats label
    const count = await page.getByText(/^\d+$/).first().textContent()
    expect(Number(count)).toBeGreaterThanOrEqual(0)
  })

  test('should show empty state when no conversations exist', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('No conversations yet')).toBeVisible()
  })

  test('should show no conversation selected state in detail panel', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('No conversation selected')).toBeVisible()
    await expect(page.getByText('Select a conversation from the list')).toBeVisible()
  })

  test('should show search input', async ({ page }) => {
    await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    const searchInputs = page.locator('input[type="search"], input[placeholder*="earch" i]')
    const count = await searchInputs.count()
    expect(count).toBeGreaterThan(0)
  })

})