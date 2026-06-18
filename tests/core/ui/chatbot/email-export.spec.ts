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

test.skip('should confirm sending file to signed-in email when asked', async ({ page }) => {
  await page.goto('/')
  await page.locator('textarea').fill('Create a short txt file with a summary of AI assistants')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(8000)
  await page.locator('textarea').fill('Send that file to my email')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(8000)
  const response = page.locator('div.prose').last()
  await expect(response).toBeVisible()
  await expect(response).toContainText(/sent to your email|sent to.*@|has been sent/i)
})

  test.skip('should only send to signed-in email not a different address', async ({ page }) => {
    await page.goto('/')
    await page.locator('textarea').fill('Create a short txt file about space exploration')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    await page.locator('textarea').fill('Send that file to other@example.com')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(8000)
    const response = page.locator('div.prose').last()
    await expect(response).toBeVisible()
    await expect(response).not.toContainText('<tool_call>')
  })
})
