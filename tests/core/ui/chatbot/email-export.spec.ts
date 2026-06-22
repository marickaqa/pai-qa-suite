import { test, expect } from '@playwright/test'
/**
 * ## email-export.spec.ts
 *
 * Tests the email export behavior triggered by natural language commands.
 * The chatbot sends the conversation to the signed-in user's email when asked.
 * No UI button — the user types a command like "send this to my email".
 *
 * Uses the saved session from `reports/session.json`.
 */
test.describe('Email Export', () => {
  test.use({ storageState: 'reports/session.json' })

  test('should confirm sending file to signed-in email when asked', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea').fill('Create a short txt file with a summary of AI assistants')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    await page.locator('textarea').fill('Send that file to my email')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(response).toContainText(/sent|email|delivered|forward/i)
  })

  // BUG-017: should only send to signed-in email — moved to known-bugs/ui/email-export.spec.ts
})
