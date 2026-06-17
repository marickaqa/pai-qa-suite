import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Core — Login', () => {

  test('should show the login form', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.API_EMAIL || '')
    await page.fill('#password', process.env.API_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })
    expect(page.url()).not.toContain('login')
  })

  test('should show error with wrong password', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.API_EMAIL || '')
    await page.fill('#password', 'WrongPassword999!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    expect(page.url()).not.toContain('dashboard')
    const error = page.locator('[role="alert"], [class*="error"], [class*="alert"]')
    await expect(error).toBeVisible()
  })

  test('should not login with empty email', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', '')
    await page.fill('#password', process.env.API_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    expect(page.url()).not.toContain('dashboard')
  })

  test('should not login with empty password', async ({ page }) => {
    await page.goto('/')
    await page.fill('#email', process.env.API_EMAIL || '')
    await page.fill('#password', '')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    expect(page.url()).not.toContain('dashboard')
  })

  test('should show password toggle icon', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[name="password"]').locator('../..').locator('svg').first()).toBeVisible()
  })

  test('should show password in plain text when toggle is clicked', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
    await page.locator('input[name="password"]').locator('../..').locator('svg').last().click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
  })

  test('should hide password again when toggle is clicked twice', async ({ page }) => {
    await page.goto('/')
    await page.locator('input[name="password"]').locator('../..').locator('svg').last().click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
    await page.locator('input[name="password"]').locator('../..').locator('svg').last().click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
  })

})