import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const ATTRIBUTES_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/attributes`

test.describe('Core — SaaS Attributes', () => {
  test.use({ storageState: SAAS_SESSION })

 test.beforeEach(async ({ page }) => {
    await page.goto(ATTRIBUTES_URL)
    await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible({ timeout: 15000 })
    // clean up any stale open forms by deleting them
    const deleteTypeBtns = page.getByRole('button', { name: 'Delete type' })
    while (await deleteTypeBtns.count() > 0) {
      await deleteTypeBtns.first().click()
      await page.waitForTimeout(300)
    }
  })

  test('should show Attributes heading and description', async ({ page }) => {
    await expect(page.getByText('Custom attributes the bot detects and tags on conversations.')).toBeVisible()
  })

  test('should show empty state when no attributes exist', async ({ page }) => {
    await expect(page.getByText('No attributes yet')).toBeVisible()
    await expect(page.getByText('Add an attribute for the bot to detect and tag on conversations.')).toBeVisible()
  })

  test('should show Add attribute button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add attribute' })).toBeVisible()
  })

  test('should show attribute form when Add attribute is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await expect(page.locator('input[placeholder="e.g. sentiment"]').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add value' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible()
  })

  test('should show Delete type button in attribute form', async ({ page }) => {
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await expect(page.getByRole('button', { name: 'Delete type' })).toBeVisible()
  })

  test('should show value and description inputs when Add value is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await page.getByRole('button', { name: 'Add value' }).click()
    await expect(page.locator('input[placeholder="e.g. positive"]').first()).toBeVisible()
    await expect(page.locator('input[placeholder="Describe when the bot should tag this value"]').first()).toBeVisible()
  })

  test('should hide form when Discard is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await expect(page.locator('input[placeholder="e.g. sentiment"]').first()).toBeVisible()
    await page.getByRole('button', { name: 'Discard' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('input[placeholder="e.g. sentiment"]')).not.toBeVisible()
  })

 test('should create and delete an attribute', async ({ page }) => {
    const attrName = `qa-attr-${Date.now()}`
    await page.getByRole('button', { name: 'Add attribute' }).click()
    await page.locator('input[placeholder="e.g. sentiment"]').first().fill(attrName)
    await page.getByRole('button', { name: 'Add value' }).first().click()
    await page.locator('input[placeholder="e.g. positive"]').first().fill('positive')
    await page.locator('input[placeholder="Describe when the bot should tag this value"]').first().fill('When the user is happy')
    const saveResponse = page.waitForResponse(r => r.url().includes('/attribute') && r.request().method() === 'POST')
    await page.getByRole('button', { name: 'Save' }).first().click()
    await saveResponse
    await expect(page.locator(`input[value="${attrName}"]`)).toBeVisible({ timeout: 10000 })
    // cleanup
    await page.getByRole('button', { name: 'Delete type' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator(`input[value="${attrName}"]`)).not.toBeVisible()
  })
})