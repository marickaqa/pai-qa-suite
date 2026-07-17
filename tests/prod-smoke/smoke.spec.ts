import { test, expect, Page } from '@playwright/test'

// ============================================================
// Prod smoke — read-only post-deploy checks.
//
// Rules for this file:
//   - NO resource creation or deletion. Ever.
//   - The single widget message below is the only write-adjacent
//     action (it records one conversation in the QA org's analytics).
//   - Selectors are ported from tests/core/ui/saas/saas-dashboard.spec.ts
//     and tests/core/ui/chatbot/widget.spec.ts — keep them in sync.
// ============================================================

const SMOKE_SAAS_URL = process.env.SMOKE_SAAS_URL || 'https://chat.paicloud.ai'
// Page that embeds the PRODUCTION support bot widget. Until a prod embed
// page exists, the widget tests skip with a visible reason.
const SMOKE_WIDGET_URL = process.env.SMOKE_WIDGET_URL || ''

const checkNoToolCallLeak = (text: string) => {
  expect(text).not.toContain('<tool_call>')
  expect(text).not.toContain('<function=')
  expect(text).not.toContain('</tool_call>')
  expect(text).not.toContain('<tool_result>')
}

test.describe('Prod smoke — SaaS platform', () => {

  test('login page is reachable', async ({ page }) => {
    const response = await page.request.get(SMOKE_SAAS_URL + '/login')
    expect(response.status()).toBe(200)
  })

  test('unauthenticated users are redirected to login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto(SMOKE_SAAS_URL + '/dashboard/overview')
    await page.waitForURL((url: URL) => url.toString().includes('login'), { timeout: 15000 })
    expect(page.url()).toContain('login')
    await context.close()
  })

  test('dashboard loads for authenticated user', async ({ page }) => {
    await page.goto(SMOKE_SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('TOTAL AGENTS')).toBeVisible({ timeout: 20000 })
    expect(page.url()).toContain('/dashboard/')
  })

  test('dashboard shows key metrics', async ({ page }) => {
    await page.goto(SMOKE_SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('TOTAL AGENTS')).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('MESSAGES THIS MONTH')).toBeVisible()
    await expect(page.getByText('SESSIONS THIS MONTH')).toBeVisible()
    await expect(page.getByText('TOKEN USAGE')).toBeVisible()
  })

  test('support bots section renders', async ({ page }) => {
    await page.goto(SMOKE_SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('Support bots')).toBeVisible({ timeout: 20000 })
  })
})

test.describe('Prod smoke — support bot widget', () => {

  test.skip(!SMOKE_WIDGET_URL,
    'Set SMOKE_WIDGET_URL in .env to a page embedding the PROD widget to enable these checks.')

  async function openWidget(page: Page) {
    await page.goto(SMOKE_WIDGET_URL)
    await expect(page.locator('button.pai-launcher')).toBeVisible({ timeout: 20000 })
    await page.locator('button.pai-launcher').click()
    await expect(page.locator('textarea.pai-input')).toBeVisible({ timeout: 10000 })
  }

  test('widget loads and opens', async ({ page }) => {
    await openWidget(page)
    await expect(page.locator('.pai-greeting-body').first()).toBeVisible({ timeout: 10000 })
  })

  test('widget answers a message with no tool-call leak', async ({ page }) => {
    await openWidget(page)
    const input = page.locator('textarea.pai-input')
    const before = await page.locator('body').innerText()

    await input.fill('Hello, what can you help me with?')
    await page.locator('button.pai-send').click()

    // Wait for the input to clear (message accepted)...
    await expect(input).toHaveValue('', { timeout: 15000 })
    // ...then for the page text to grow beyond the pre-send state (a reply arrived).
    await expect
      .poll(async () => (await page.locator('body').innerText()).length, {
        timeout: 45000,
        message: 'no widget response detected within 45s',
      })
      .toBeGreaterThan(before.length + 20)

    const after = await page.locator('body').innerText()
    checkNoToolCallLeak(after) // BUG-019 regression check, now against prod
  })
})
