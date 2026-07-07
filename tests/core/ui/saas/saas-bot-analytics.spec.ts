import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const BOT_ANALYTICS_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/analytics`

test.describe('Core — SaaS Bot Analytics', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show Bot overview heading and description', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Activity for this chatbot')).toBeVisible()
  })

  test('should show Messages Sessions and Tokens used metrics', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Messages', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Tokens used', { exact: true })).toBeVisible()
  })

  test('should show percentage change indicators', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    const percentages = page.getByText(/[+-]\d+(\.\d+)?%/)
    const count = await percentages.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show Token usage this month card', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Token usage', { exact: false }).first()).toBeVisible()
    await expect(page.getByText(/Input/i)).toBeVisible()
    await expect(page.getByText(/Output/i)).toBeVisible()
  })

  test('should show Activity over time chart with period toggle buttons', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Activity over time')).toBeVisible()
    for (const label of ['Weekly', 'Monthly', 'Yearly', 'All time']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('should show Guardrail triggers table with correct headers', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Guardrail triggers' })).toBeVisible()
    await expect(page.getByText('Messages blocked by safety rules for this chatbot.')).toBeVisible()
    await expect(page.getByText('Category', { exact: true })).toBeVisible()
    await expect(page.getByText('Count', { exact: true })).toBeVisible()
    await expect(page.getByText('Last triggered', { exact: true })).toBeVisible()
  })

  test('should show Top questions section', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Top questions')).toBeVisible()
    await expect(page.getByText('Most-asked queries this period.')).toBeVisible()
  })

  test('should show top question rows with Review buttons', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Top questions')).toBeVisible()
    const reviewBtns = page.getByRole('button', { name: 'Review' })
    const count = await reviewBtns.count()
    if (count > 0) {
      await expect(reviewBtns.first()).toBeVisible()
    }
  })

  test('should show Coming soon placeholder', async ({ page }) => {
    await page.goto(BOT_ANALYTICS_URL, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Bot overview')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Coming soon')).toBeVisible()
  })

})