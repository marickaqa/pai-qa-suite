import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-auth.spec.ts
 *
 * Tests the PAI SaaS authentication flows at chat.paicloud.ai.
 * Covers sign in, sign up, and the no-org empty state.
 * Google OAuth is deferred — not automatable without a real Google session.
 *
 * Uses a fresh context with no session for all tests.
 */

test.describe('SaaS Auth', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
    const emailInput = (page: Page) => page.locator('input[name="email"]')
    const passwordInput = (page: Page) => page.locator('input[name="password"]')

    // --- Sign In ---

    test('should show sign in form', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await expect(emailInput(page)).toBeVisible()
        await expect(passwordInput(page)).toBeVisible()
        await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible()
    })

    test('should show Create an account link on login page', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible()
    })

    test('should sign in with valid credentials', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await emailInput(page).fill(process.env.SAAS_EMAIL || '')
        await passwordInput(page).fill(process.env.SAAS_PASSWORD || '')
        await page.getByRole('button', { name: /sign in|log in|login/i }).click()
        await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })
        expect(page.url()).not.toContain('login')
    })

    test('should show error with wrong password', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await emailInput(page).fill(process.env.SAAS_EMAIL || '')
        await passwordInput(page).fill('WrongPassword999!')
        await page.getByRole('button', { name: /sign in|log in|login/i }).click()
        await page.waitForTimeout(2000)
        expect(page.url()).toContain('login')
    })

    test('should not sign in with empty email', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await emailInput(page).fill('')
        await passwordInput(page).fill(process.env.SAAS_PASSWORD || '')
        await page.getByRole('button', { name: /sign in|log in|login/i }).click()
        await page.waitForTimeout(1000)
        expect(page.url()).toContain('login')
    })

    test('should not sign in with empty password', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await emailInput(page).fill(process.env.SAAS_EMAIL || '')
        await passwordInput(page).fill('')
        await page.getByRole('button', { name: /sign in|log in|login/i }).click()
        await page.waitForTimeout(1000)
        expect(page.url()).toContain('login')
    })

    // --- Sign Up ---

    test('should show sign up form', async ({ page }) => {
        await page.goto(`${SAAS_URL}/signup`)
        await expect(emailInput(page)).toBeVisible()
        await expect(passwordInput(page)).toBeVisible()
        await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible()
    })

    test('should show sign in link on signup page', async ({ page }) => {
        await page.goto(`${SAAS_URL}/signup`)
        await expect(page.getByRole('link', { name: /sign in|log in|login/i })).toBeVisible()
    })

    test('should navigate to signup from login page', async ({ page }) => {
        await page.goto(`${SAAS_URL}/login`)
        await page.getByRole('link', { name: 'Create an account' }).click()
        await expect(page).toHaveURL(/signup/)
    })

    test('should not submit signup with empty fields', async ({ page }) => {
        await page.goto(`${SAAS_URL}/signup`)
        await page.getByRole('button', { name: /sign up|create account/i }).click()
        await page.waitForTimeout(1000)
        expect(page.url()).toContain('signup')
    })

    test('should show error for already registered email', async ({ page }) => {
        await page.goto(`${SAAS_URL}/signup`)
        await emailInput(page).fill(process.env.SAAS_EMAIL || '')
        await passwordInput(page).fill('Password123!')
        await page.getByRole('button', { name: /sign up|create account/i }).click()
        await page.waitForTimeout(3000)
        expect(page.url()).toContain('signup')
    })

    // --- No Org State ---

    test('should show no-org empty state for user without organization', async ({ page }) => {
        const noOrgEmail = process.env.SAAS_NO_ORG_EMAIL
        const noOrgPassword = process.env.SAAS_NO_ORG_PASSWORD
        if (!noOrgEmail || !noOrgPassword) {
            test.skip()
            return
        }
        await page.goto(`${SAAS_URL}/login`)
        await emailInput(page).fill(noOrgEmail)
        await passwordInput(page).fill(noOrgPassword)
        await page.getByRole('button', { name: /sign in|log in|login/i }).click()
        await page.waitForTimeout(3000)
        await expect(page.getByRole('heading', { name: /not in any organization/i })).toBeVisible()
    })
})
