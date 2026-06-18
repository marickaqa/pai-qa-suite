import { test, expect } from '@playwright/test'

/**
 * ## subtitles-jobs.spec.ts
 *
 * Tests the Jobs list page and job detail page.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Jobs', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

    test('should show jobs page with table', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible()
        await expect(page.getByText('FILE / REFERENCE')).toBeVisible()
        await expect(page.getByText('STATUS')).toBeVisible()
    })

    test('should show job rows with file name and status', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await expect(page.getByText('test-video.mp4').first()).toBeVisible()
        await expect(page.getByText('Completed').first()).toBeVisible()
    })

    test('should navigate to job detail when row is clicked', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByText('test-subtitles.srt').first().click()
        await expect(page).toHaveURL(/jobs\//)
        await expect(page.getByText('Completed').first()).toBeVisible()
    })

    test('should show job detail tabs', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByText('test-subtitles.srt').first().click()
        await expect(page.getByRole('tab', { name: 'Activity' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Confidence' })).toBeVisible()
        await expect(page.getByRole('tab', { name: 'Violations' })).toBeVisible()
    })

    test('should show output files with download buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByText('test-subtitles.srt').first().click()
        await expect(page.getByText('Output files', { exact: true })).toBeVisible()
        await expect(page.getByRole('link', { name: 'SRT' }).first()).toBeVisible()
        await expect(page.getByRole('link', { name: 'VTT' }).first()).toBeVisible()
    })

    test('should show job details panel', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByText('test-subtitles.srt').first().click()
        await expect(page.getByText('Job details', { exact: true })).toBeVisible()
        await expect(page.getByText('Created', { exact: true })).toBeVisible()
        await expect(page.getByText('File size')).toBeVisible()
        await expect(page.getByText('Tokens used')).toBeVisible()
    })

    test('should show Download all and Re-run buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs`)
        await page.getByText('test-subtitles.srt').first().click()
        await expect(page.getByRole('link', { name: /download all/i })).toBeVisible()
        await expect(page.getByRole('button', { name: /re-run/i })).toBeVisible()
    })
})