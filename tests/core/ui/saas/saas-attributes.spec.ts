import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-attributes.spec.ts
 *
 * Attributes CRUD on the noctocode-test chatbot agent.
 *
 * Cleanup discipline: we NEVER delete attributes we didn't create. Teardown
 * removes only qa-* attributes (matched by the name input's value), so the
 * suite is safe to run against an agent that already has real attributes and
 * leaves nothing behind. Tests do not assume the agent starts empty.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const ATTRIBUTES_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/attributes`

// Attribute cards whose type/name input value starts with "qa-".
const qaCards = (page: Page) =>
  page.locator('div.rounded-xl').filter({
    has: page.locator('input[placeholder="e.g. sentiment"][value^="qa-"]'),
  })

// Every existing attribute renders a type/name input on load (no form open).
const nameInputs = (page: Page) => page.locator('input[placeholder="e.g. sentiment"]')

test.describe('Core — SaaS Attributes', () => {
  test.use({ storageState: SAAS_SESSION })

  test.beforeEach(async ({ page }) => {
    await page.goto(ATTRIBUTES_URL)
    await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible({ timeout: 15000 })
  })

  // Safety net: sweep only qa-* attributes, even if a test crashed mid-create.
  // Unsaved forms are discarded by the navigation; saved qa-* cards are deleted.
  test.afterEach(async ({ page }) => {
    await page.goto(ATTRIBUTES_URL)
    await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible({ timeout: 15000 })
    let remaining = await qaCards(page).count()
    while (remaining > 0) {
      await qaCards(page).first().getByRole('button', { name: 'Delete type' }).click()
      await expect(qaCards(page)).toHaveCount(remaining - 1, { timeout: 10000 })
      remaining = await qaCards(page).count()
    }
  })

  test('should show Attributes heading and description', async ({ page }) => {
    await expect(page.getByText('Custom attributes the bot detects and tags on conversations.')).toBeVisible()
  })

  test('should show either the empty state or an existing attribute list', async ({ page }) => {
    if (await nameInputs(page).count() === 0) {
      await expect(page.getByText('No attributes yet')).toBeVisible()
      await expect(page.getByText('Add an attribute for the bot to detect and tag on conversations.')).toBeVisible()
    } else {
      await expect(nameInputs(page).first()).toBeVisible()
    }
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
    await expect(page.getByRole('button', { name: 'Delete type' }).first()).toBeVisible()
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

    // Delete THIS attribute's card specifically (not .first()).
    const ownCard = page.locator('div.rounded-xl').filter({ has: page.locator(`input[value="${attrName}"]`) })
    await ownCard.getByRole('button', { name: 'Delete type' }).click()
    await expect(page.locator(`input[value="${attrName}"]`)).not.toBeVisible({ timeout: 10000 })
  })
})