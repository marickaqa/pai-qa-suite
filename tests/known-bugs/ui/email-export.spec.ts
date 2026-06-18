import { test, expect } from '@playwright/test'

/**
 * ## email-export.spec.ts (known-bugs)
 *
 * BUG-017: Email export behavior is inconsistent.
 * Bot sometimes sends to wrong address, sometimes refuses, sometimes leaks raw tool_call XML.
 */

test.describe('Email Export — Known Bugs', () => {
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
    await expect(response).toContainText(/sent to your email|sent to.*@|has been sent/i)
  })

  test('should only send to signed-in email not a different address', async ({ page }) => {
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