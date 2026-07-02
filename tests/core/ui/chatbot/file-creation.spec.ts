import { test, expect } from '@playwright/test'

/**
 * ## file-creation.spec.ts
 *
 * Tests file creation triggered by natural language commands.
 * The chatbot creates PDF or TXT files when asked.
 * No UI button — the user types a command like "create a txt file about X".
 *
 * Uses the saved session from `reports/session.json`.
 */

test.describe('File Creation', () => {
  test.use({ storageState: 'reports/session.json' })

  test('should create a TXT file when asked', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea[placeholder="Type a message..."]').fill('Create a txt file with 3 fun facts about the moon')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(response).toContainText(/\.txt/i)
  })

  test('should create a PDF file when asked', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea[placeholder="Type a message..."]').fill('Create a pdf file with a short summary of the solar system')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(response).toContainText(/\.pdf/i)
  })

  test('should show a download link or attachment for created TXT file', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea[placeholder="Type a message..."]').fill('Create a txt file with a short poem about the ocean')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(page.locator('a[href*=".txt"], a[download], button[aria-label*="download"]').first()).toBeVisible()
  })

  test('should show a download link or attachment for created PDF file', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea[placeholder="Type a message..."]').fill('Create a pdf file with a short poem about the mountains')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(page.locator('a[href*=".pdf"], a[download], button[aria-label*="download"]').first()).toBeVisible()
  })
})
