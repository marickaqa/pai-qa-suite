import { test, expect } from '@playwright/test'

/**
 * ## forgot-password.spec.ts
 *
 * Tests the forgot password flow from the chatbot UI.
 * Accessed via "Forgot password" link on the login page → /forgot-password.
 *
 * Uses a fresh context with no session — no storageState.
 */

test.describe('Core — Forgot Password', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should show forgot password form', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForTimeout(500)
    await expect(page.getByText('Forgot password?')).toBeVisible()
    await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible()
  })

  test('should navigate to forgot password from login page', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.getByText('Forgot password').click()
    await page.waitForURL('**/forgot-password', { timeout: 10000 })
    await expect(page.getByText('Forgot password?')).toBeVisible()
  })

  test('should show confirmation screen after submitting email', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForTimeout(500)
    await page.locator('input[placeholder="Enter your email"]').fill('test@noctocode.dev')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText('Check your email')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Try again')).toBeVisible()
  })

  test('should navigate back to login when Sign in is clicked', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.waitForTimeout(500)
    await page.getByText('Sign in').click()
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 })
  })

})