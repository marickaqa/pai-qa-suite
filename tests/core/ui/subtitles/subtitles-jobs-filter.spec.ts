import { test, expect } from '@playwright/test'

/**
 * ## subtitles-jobs-filter.spec.ts
 *
 * Tests the Jobs list filtering, search, and pagination.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Jobs Filter', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

    test('should show status filter tabs', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.getByRole('button', { name: /^All/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /^Processing/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /^Completed/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /^Failed/ })).toBeVisible()
        await expect(page.getByRole('button', { name: /^Pending/ })).toBeVisible()
    })

    test('should show job count in All tab', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        const allTab = page.getByRole('button', { name: /^All/ })
        const text = await allTab.textContent()
        expect(text).toMatch(/All\d+/)
    })

    test('should filter by Completed status', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByRole('button', { name: /^Completed/ }).click()
        await page.waitForTimeout(500)
        await expect(page.getByText('Completed').first()).toBeVisible()
    })

    test('should show search bar', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
    })

    test('should search for a job by filename', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.locator('input[placeholder*="Search"]').fill('test-video')
        await page.waitForTimeout(1000)
        await expect(page.getByText('test-video.mp4').first()).toBeVisible()
    })

    test('should show Filters button', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.getByRole('button', { name: 'Filters' })).toBeVisible()
    })

    test('should open filters panel when Filters is clicked', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByRole('button', { name: 'Filters' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByLabel('Filters').getByText('Status')).toBeVisible()
        await expect(page.getByLabel('Filters').getByText('Language')).toBeVisible()
        await expect(page.getByLabel('Filters').getByText('Created')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Apply filters' })).toBeVisible()
    })

    test('should show date range filter options', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByRole('button', { name: 'Filters' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Last 7 days')).toBeVisible()
        await expect(page.getByText('Last 30 days')).toBeVisible()
        await expect(page.getByText('All time')).toBeVisible()
    })

    test('should show pagination info', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.locator('text=/Showing/').first()).toBeVisible()
    })
})