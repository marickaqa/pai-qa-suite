import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const BRANDING_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/style-config`

test.describe('Core — SaaS Branding', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show Branding heading and description', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Branding' })).toBeVisible({ timeout: 30000 })
    await expect(page.getByText('Look and feel of the chatbot.')).toBeVisible()
  })

  test('should show favicon upload slot', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Favicon', { exact: true }).first()).toBeVisible()
  })

  test('should show all 6 logo upload slots with correct labels', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    const expectedLabels = ['Light theme', 'Icon light', 'Vertical light', 'Dark theme', 'Icon dark', 'Vertical dark']
    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })

  test('should show 7 upload buttons and 7 remove buttons', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Upload' })).toHaveCount(7)
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(7)
  })

  test('should have 7 file inputs accepting image formats', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    const fileInputs = page.locator('input[type="file"]')
    await expect(fileInputs).toHaveCount(7)

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
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
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
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    const saveBtn = page.getByRole('button', { name: 'Save changes' })
    await expect(saveBtn).toBeVisible()
    await expect(saveBtn).toBeEnabled()
  })

  test('should update hex input when a new value is typed', async ({ page }) => {
    await page.goto(BRANDING_URL)
    await page.waitForLoadState('networkidle')
    const input = page.locator('input[type="text"]').first()
    await input.fill('#123456')
    await expect(input).toHaveValue('#123456')
  })

})
