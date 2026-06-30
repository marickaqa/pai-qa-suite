import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const STYLE_CONFIG_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/style-config`

test.describe('Core — SaaS Style Config', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show Style Config heading and description', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Style Config' })).toBeVisible()
    await expect(page.getByText('Upload logos and icons for the chatbot.')).toBeVisible()
  })

  test('should show all 6 logo upload slots with correct labels', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    const expectedLabels = ['Light theme', 'Icon light', 'Vertical light', 'Dark theme', 'Icon dark', 'Vertical dark']
    for (const label of expectedLabels) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }
  })

  test('should show 6 upload buttons and 6 remove buttons', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    await expect(page.getByRole('button', { name: 'Upload' })).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Remove' })).toHaveCount(6)
  })

  test('should have 6 file inputs accepting image formats', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    const fileInputs = page.locator('input[type="file"]')
    await expect(fileInputs).toHaveCount(6)
    const accept = await fileInputs.first().getAttribute('accept')
    expect(accept).toContain('image/png')
    expect(accept).toContain('image/jpeg')
    expect(accept).toContain('image/svg+xml')
    expect(accept).toContain('image/webp')
  })

  test('should show Light theme and Dark theme color sections with hex inputs', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Primary colour').first()).toBeVisible()
    await expect(page.getByText('Secondary colour').first()).toBeVisible()

    const hexInputs = page.locator('input[type="text"]').filter({ hasNotText: '' })
    const values = await page.locator('input[type="text"]').evaluateAll(els =>
      els.filter(el => (el as HTMLInputElement).value?.startsWith('#')).map(el => (el as HTMLInputElement).value)
    )
    expect(values.length).toBe(4)
    for (const v of values) {
      expect(v).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  test('should show Save changes button', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    const saveBtn = page.getByRole('button', { name: 'Save changes' })
    await expect(saveBtn).toBeVisible()
    await expect(saveBtn).toBeEnabled()
  })

 test('should update hex input when a new value is typed', async ({ page }) => {
    await page.goto(STYLE_CONFIG_URL)
    const input = page.locator('input[type="text"]').first()
    await input.fill('#123456')
    await expect(input).toHaveValue('#123456')
  })

})