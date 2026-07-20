import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-style-config.spec.ts
 *
 * Tests the Branding / style-config page for the chat bot agent.
 * Uses reports/saas-session.json.
 *
 * NOTE: no networkidle / waitForTimeout. gotoBranding() waits for the page
 * to render before assertions. Slot counts are asserted for internal
 * consistency (upload == remove == file inputs) rather than a hard-coded
 * number, so adding/removing a logo slot doesn't break the suite. Keep it so.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const BRANDING_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/style-config`

test.describe('Core — SaaS Branding', () => {
  test.use({ storageState: SAAS_SESSION })

  async function gotoBranding(page: Page) {
    await page.goto(BRANDING_URL)
    await expect(
      page.getByRole('heading', { name: 'Branding' }),
      'branding page did not render'
    ).toBeVisible({ timeout: 45000 })
  }

  test('should show Branding heading and description', async ({ page }) => {
    await gotoBranding(page)
    await expect(page.getByText('Look and feel of the chatbot.')).toBeVisible()
  })

  test('should show favicon upload slot', async ({ page }) => {
    await gotoBranding(page)
    await expect(page.getByText('Favicon', { exact: true }).first()).toBeVisible({ timeout: 15000 })
  })

  test('should show all logo upload slots with correct labels', async ({ page }) => {
    await gotoBranding(page)
    const expectedLabels = ['Light theme', 'Icon light', 'Vertical light', 'Dark theme', 'Icon dark', 'Vertical dark']
    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 15000 })
    }
  })

  test('should show matching upload and remove buttons for each slot', async ({ page }) => {
    await gotoBranding(page)
    const uploadButtons = page.getByRole('button', { name: 'Upload' })
    const removeButtons = page.getByRole('button', { name: 'Remove' })
    // wait for the slots to render, then assert internal consistency rather
    // than a hard-coded count (survives adding/removing a logo slot)
    await expect(uploadButtons.first()).toBeVisible({ timeout: 15000 })
    const uploadCount = await uploadButtons.count()
    expect(uploadCount).toBeGreaterThan(0)
    await expect(removeButtons).toHaveCount(uploadCount)
  })

  test('should have file inputs accepting image formats', async ({ page }) => {
    await gotoBranding(page)
    const fileInputs = page.locator('input[type="file"]')
    // one file input per upload slot — assert there are some, then check formats
    const uploadCount = await page.getByRole('button', { name: 'Upload' }).count()
    await expect(fileInputs).toHaveCount(uploadCount)

    // favicon slot accepts ico formats
    const faviconAccept = await fileInputs.first().getAttribute('accept')
    expect(faviconAccept).toContain('image/png')
    expect(faviconAccept).toContain('image/svg+xml')
    expect(faviconAccept).toContain('.ico')

    // logo slots accept standard image formats
    const logoAccept = await fileInputs.nth(1).getAttribute('accept')
    expect(logoAccept).toContain('image/png')
    expect(logoAccept).toContain('image/jpeg')
    expect(logoAccept).toContain('image/svg+xml')
    expect(logoAccept).toContain('image/webp')
  })

  test('should show Light theme and Dark theme color sections with hex inputs', async ({ page }) => {
    await gotoBranding(page)
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Primary colour').first()).toBeVisible()
    await expect(page.getByText('Secondary colour').first()).toBeVisible()
    const values = await page.locator('input[type="text"]').evaluateAll(els =>
      els.filter(el => (el as HTMLInputElement).value?.startsWith('#')).map(el => (el as HTMLInputElement).value)
    )
    expect(values.length).toBeGreaterThanOrEqual(4)
    for (const v of values) {
      expect(v).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  test('should show Save changes button', async ({ page }) => {
    await gotoBranding(page)
    const saveBtn = page.getByRole('button', { name: 'Save changes' })
    await expect(saveBtn).toBeVisible({ timeout: 15000 })
    await expect(saveBtn).toBeEnabled()
  })

  test('should update hex input when a new value is typed', async ({ page }) => {
    await gotoBranding(page)
    const input = page.locator('input[type="text"]').first()
    await input.fill('#123456')
    await expect(input).toHaveValue('#123456')
  })

})