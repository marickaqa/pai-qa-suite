import { test, expect, type Page } from '@playwright/test'

/**
 * ## subtitles-no-tenant.spec.ts (known-bugs)
 *
 * BUG-018: No-tenant state redirect is unreliable in CI.
 * The app sometimes redirects to /overview instead of /select-tenant.
 */

test.describe('Subtitles No Tenant — Known Bugs', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

  const signIn = async (page: Page, email: string, password: string) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
  }

  test('should show no-tenant state for user without a tenant', async ({ page }) => {
    await signIn(page, process.env.SUBTITLES_NO_TENANT_EMAIL || '', process.env.SUBTITLES_NO_TENANT_PASSWORD || '')
    await page.waitForTimeout(8000)
    await page.goto(`${BASE_URL}/select-tenant`)
    await page.waitForTimeout(3000)
    await expect(page.getByText('No organizations assigned to your account.')).toBeVisible({ timeout: 10000 })
  })
})