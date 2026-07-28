import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-auth.spec.ts
 *
 * Tests the PAI SaaS authentication flows at chat-dev.paicloud.ai.
 * Covers sign in, sign up, the no-org empty state, OAuth button presence,
 * logout, and the organization picker.
 *
 * Google/Apple OAuth flows are deferred — not automatable without a real
 * provider session. We assert the buttons *render* and point at the right
 * endpoints; we do not exercise the flow.
 *
 * Session handling:
 *  - Unauthenticated tests use a fresh, empty context.
 *  - Authenticated tests inherit the project's saved SaaS session.
 *  - Logout logs in FRESH in its own empty context so it can only ever
 *    invalidate its own throwaway token, never the shared session file.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const emailInput = (page: Page) => page.locator('input[name="email"]')
const passwordInput = (page: Page) => page.locator('input[name="password"]')
const signInButton = (page: Page) =>
    page.getByRole('button', { name: /sign in|log in|login/i })
const orgTrigger = (page: Page) =>
    page.locator('button:has(svg.lucide-chevrons-up-down)')

test.describe('SaaS Auth', () => {
    // --- Unauthenticated (login / signup pages) ---

    test.describe('unauthenticated', () => {
        test.use({ storageState: { cookies: [], origins: [] } })

        // Sign In

        test('should show sign in form', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await expect(emailInput(page)).toBeVisible()
            await expect(passwordInput(page)).toBeVisible()
            await expect(signInButton(page)).toBeVisible()
        })

        test('should show Create an account link on login page', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible()
        })

        test('should show Forgot password link on login page', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await expect(page.getByText(/forgot password/i)).toBeVisible()
        })

        test('should render Google and Apple OAuth buttons', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            const google = page.getByRole('link', { name: 'Google' })
            const apple = page.getByRole('link', { name: 'Apple' })
            await expect(google).toBeVisible()
            await expect(google).toHaveAttribute('href', '/api/auth/google')
            await expect(apple).toBeVisible()
            await expect(apple).toHaveAttribute('href', '/api/auth/apple')
        })

        test('should sign in with valid credentials', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await emailInput(page).fill(process.env.SAAS_EMAIL || '')
            await passwordInput(page).fill(process.env.SAAS_PASSWORD || '')
            await signInButton(page).click()
            await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })
            expect(page.url()).not.toContain('login')
        })

        test('should show error with wrong password', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await emailInput(page).fill(process.env.SAAS_EMAIL || '')
            await passwordInput(page).fill('WrongPassword999!')
            await signInButton(page).click()
            // Assert the actual error renders, not just that we stayed on /login.
            await expect(page.getByText(/invalid email or password/i)).toBeVisible()
            expect(page.url()).toContain('login')
        })

        test('should not sign in with empty email', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await emailInput(page).fill('')
            await passwordInput(page).fill(process.env.SAAS_PASSWORD || '')
            await signInButton(page).click()
            // Missing credentials must not authenticate. Native `required`
            // validation or an inline error may fire — either way we stay on
            // the form and never reach an authenticated route.
            await expect(page).toHaveURL(/login/)
            await expect(emailInput(page)).toBeVisible()
        })

        test('should not sign in with empty password', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await emailInput(page).fill(process.env.SAAS_EMAIL || '')
            await passwordInput(page).fill('')
            await signInButton(page).click()
            await expect(page).toHaveURL(/login/)
            await expect(passwordInput(page)).toBeVisible()
        })

        // Sign Up

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
            await expect(page).toHaveURL(/signup/)
        })

        // Submitting an already-registered email returns the SAME neutral
        // "check your email" confirmation as a fresh signup — it deliberately
        // does NOT reveal that the account exists (anti-enumeration). This guards
        // that property: a regression re-introducing an "email already exists"
        // error would be an enumeration leak.
        // NOTE: the UI is correct here, but the API still leaks existence via
        // status code (BUG-020, tracked in the known-bugs tier).
        test('should not reveal whether an email is already registered', async ({ page }) => {
            await page.goto(`${SAAS_URL}/signup`)
            await emailInput(page).fill(process.env.SAAS_EMAIL || '')
            await passwordInput(page).fill('Password123!')
            await page.getByRole('button', { name: /sign up|create account/i }).click()
            // Neutral confirmation shown even for an existing email...
            await expect(page.getByText(/check your email/i)).toBeVisible()
            await expect(page.getByText(/sent a verification link/i)).toBeVisible()
            // ...and no existence-revealing error copy anywhere.
            await expect(page.getByText(/already (exists|registered|taken|in use)/i)).toHaveCount(0)
        })

        // No-org state

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
            await signInButton(page).click()
            await expect(page.getByRole('heading', { name: /not in any organization/i })).toBeVisible()
        })
    })

    // --- Authenticated (inherits the project's saved SaaS session) ---

    test.describe('authenticated', () => {
        test('should show the organization picker with the current org', async ({ page }) => {
            await page.goto(SAAS_URL)
            await expect(orgTrigger(page)).toBeVisible()
            // global-setup switches the session into noctocode.dev; this also
            // guards that the repoint stays in effect. (toContainText auto-retries
            // through the brief hydration flicker to another org.)
            await expect(orgTrigger(page)).toContainText('noctocode.dev')
        })

        test('should switch active organization via the picker', async ({ page }) => {
            await page.goto(SAAS_URL)
            const trigger = orgTrigger(page)
            await expect(trigger).toContainText('noctocode.dev')

            try {
                await trigger.click()
                await page.getByRole('button', { name: /Trump Media/i }).click()
                await expect(trigger).toContainText('Trump Media')
            } finally {
                // Teardown: always restore the default org (noctocode.dev) so a
                // failure mid-switch can't strand the shared session on the wrong org.
                const current = (await trigger.textContent()) || ''
                if (!current.includes('noctocode.dev')) {
                    await trigger.click()
                    await page.getByRole('button', { name: /noctocode\.dev/i }).filter({ hasNotText: '@' }).click()
                    await expect(trigger).toContainText('noctocode.dev')
                }
            }
        })

        test('should keep the session when logout is cancelled', async ({ page }) => {
            await page.goto(SAAS_URL)
            await page.getByRole('button', { name: 'Log out' }).click()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await dialog.getByRole('button', { name: 'Cancel' }).click()
            await expect(dialog).toBeHidden()
            // Still authenticated: the logout control is still present.
            await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
        })
    })

    // --- Logout (fresh throwaway session; never touches the shared file) ---

    test.describe('logout', () => {
        test.use({ storageState: { cookies: [], origins: [] } })

        test('should log out and return to the login page', async ({ page }) => {
            await page.goto(`${SAAS_URL}/login`)
            await emailInput(page).fill(process.env.SAAS_EMAIL || '')
            await passwordInput(page).fill(process.env.SAAS_PASSWORD || '')
            await signInButton(page).click()
            await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })

            // Logout is a confirmation-dialog flow: the sidebar icon opens a
            // Radix dialog; the red "Logout" button inside it does the deed.
            await page.getByRole('button', { name: 'Log out' }).click()
            const dialog = page.getByRole('dialog')
            await expect(dialog).toBeVisible()
            await dialog.getByRole('button', { name: 'Logout' }).click()
            // Once logged out the authed sidebar (and its logout control) is gone,
            // whether "home" resolves to /login or a landing page.
            await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0, { timeout: 20000 })
        })
    })
})