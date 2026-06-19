import { test, expect } from '@playwright/test'

/**
 * ## subtitles-settings.spec.ts
 *
 * Tests the Settings page tabs and theme toggle.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Settings', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'
    const SETTINGS_URL = `${BASE_URL}/settings`

    // --- Settings page ---

    test('should show settings page with all tabs', async ({ page }) => {
        await page.goto(SETTINGS_URL)
        await expect(page.getByRole('heading', { name: 'Settings' }).last()).toBeVisible()
        await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'FTP Access' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Defaults' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Password' })).toBeVisible()
    })

    // --- Profile tab ---

    test('should show profile tab with user info', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}`)
        await expect(page.getByText('QA Automation')).toBeVisible()
        await expect(page.getByText('qa-subtitles@noctocode.com').first()).toBeVisible()
        await expect(page.getByText('Verified').first()).toBeVisible()
    })

    test('should show profile form fields', async ({ page }) => {
        await page.goto(SETTINGS_URL)
        await expect(page.getByText('DISPLAY NAME')).toBeVisible()
        await expect(page.getByText('EMAIL ADDRESS')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
    })

    // --- Billing tab ---

    test('should show billing tab with GPU usage', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}#billing`)
        await expect(page.getByText('GPU usage')).toBeVisible()
        await expect(page.getByText('TOTAL GPU')).toBeVisible()
        await expect(page.getByText('TOTAL AUDIO')).toBeVisible()
        await expect(page.getByText('TOTAL TOKENS')).toBeVisible()
    })

    test('should show transcription and translation breakdown', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}#billing`)
        await expect(page.getByText('Transcription')).toBeVisible()
        await expect(page.getByText('Translation')).toBeVisible()
    })

    // --- Defaults tab ---

    test('should show defaults tab with translation languages', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}#defaults`)
        await expect(page.getByText('Default translation languages')).toBeVisible()
        await expect(page.getByText('Add language')).toBeVisible()
    })

    test('should show FTP account defaults section', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}#defaults`)
        await expect(page.getByText('FTP account default languages')).toBeVisible()
        await expect(page.getByRole('link', { name: /Manage FTP accounts/i })).toBeVisible()
    })

    // --- Password tab ---

    test('should show password tab with form fields', async ({ page }) => {
        await page.goto(`${SETTINGS_URL}#password`)
        await expect(page.getByText('Current password', { exact: true })).toBeVisible()
        await expect(page.getByText('New password', { exact: true })).toBeVisible()
        await expect(page.getByText('Confirm new password', { exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Update password' })).toBeVisible()
    })

    // --- Theme toggle ---

    test('should toggle theme when moon/sun button is clicked', async ({ page }) => {
        await page.goto(SETTINGS_URL)
        const html = page.locator('html')
        const before = await html.getAttribute('class')
        await page.locator('button:has(.lucide-moon), button:has(.lucide-sun)').click()
        await page.waitForTimeout(500)
        const after = await html.getAttribute('class')
        expect(before).not.toBe(after)
    })

    // --- Organization switching ---

    test.skip('should show organization switcher in profile menu', async ({ page }) => {
        await page.goto(SETTINGS_URL)
        await page.locator('button').filter({ hasText: 'QA' }).last().click()
        await page.waitForTimeout(300)
        await expect(page.getByText('SWITCH ORGANIZATION')).toBeVisible()
        await expect(page.getByText('qa-automation')).toBeVisible()
        await expect(page.getByText('qa-automation-2')).toBeVisible()
    })

    test.skip('should switch to second organization', async ({ page }) => {
        await page.goto(SETTINGS_URL)
        await page.locator('button').filter({ hasText: 'QA' }).last().click()
        await page.waitForTimeout(300)
        await page.getByText('qa-automation-2').click()
        await page.waitForTimeout(1000)
        await expect(page.getByText('qa-automation-2')).toBeVisible()
    })
})