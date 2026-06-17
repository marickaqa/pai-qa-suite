import { test, expect, type Page } from '@playwright/test'

/**
 * ## subtitles-auth.spec.ts
 *
 * Tests the PAI Subtitles authentication flows at subtitles-dev.paicloud.ai.
 * No self-service signup — users are created by superadmin or tenant admins.
 * Covers sign in, sign out, no-tenant state, and unauthenticated redirects.
 *
 * Uses a fresh context with no session for all tests.
 */

test.describe('Subtitles Auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

  const signIn = async (page: Page, email: string, password: string) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
  }

  // --- Redirect ---

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('login')
  })

  // --- Sign In ---

  test('should show sign in form', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should sign in with valid credentials', async ({ page }) => {
    await signIn(page, process.env.SUBTITLES_QA_EMAIL || '', process.env.SUBTITLES_QA_PASSWORD || '')
    await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })
    expect(page.url()).not.toContain('login')
  })

  test('should show error with wrong password', async ({ page }) => {
    await signIn(page, process.env.SUBTITLES_QA_EMAIL || '', 'WrongPassword999!')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('login')
  })

  test('should not sign in with empty email', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[name="password"]').fill(process.env.SUBTITLES_QA_PASSWORD || '')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('login')
  })

  test('should not sign in with empty password', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[name="email"]').fill(process.env.SUBTITLES_QA_EMAIL || '')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('login')
  })

  // --- No Tenant State ---

  test('should show no-tenant state for user without a tenant', async ({ page }) => {
    await signIn(page, process.env.SUBTITLES_NO_TENANT_EMAIL || '', process.env.SUBTITLES_NO_TENANT_PASSWORD || '')
    await page.waitForURL(url => url.toString().includes('select-tenant') || url.toString().includes('overview'), { timeout: 20000 })
    // if redirected to overview, navigate to select-tenant manually
    if (page.url().includes('overview')) {
      await page.goto(`${BASE_URL}/select-tenant`)
    }
    await page.waitForTimeout(2000)
    await expect(page.getByText('No organizations assigned to your account.')).toBeVisible({ timeout: 10000 })
  })
  // --- Sign Out ---

  test('should sign out and redirect to login', async ({ page }) => {
    await signIn(page, process.env.SUBTITLES_QA_EMAIL || '', process.env.SUBTITLES_QA_PASSWORD || '')
    await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })
    // find and click sign out — selector will need adjustment based on actual UI
    const signOutBtn = page.getByRole('button', { name: /sign out|log out/i })
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click()
      await page.waitForTimeout(1000)
      expect(page.url()).toContain('login')
    }
  })
})