import { test, expect } from '@playwright/test'

/**
 * ## subtitles-editor.spec.ts
 *
 * Tests the live subtitle editor at /jobs/{id}/edit/{language}.
 * Only available for FTP-ingested jobs.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Editor', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'
    const JOB_ID = process.env.SUBTITLES_FTP_JOB_ID || '5d77b52e-f7c8-4e24-8770-dae7cf1e9a7d'
    const EDITOR_URL = `${BASE_URL}/jobs/${JOB_ID}/edit/English`

    test('should show editor page heading', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Edit English subtitles')).toBeVisible()
    })

    test('should show Beta badge', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Beta')).toBeVisible()
    })

    test('should show version selector', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Version', { exact: true })).toBeVisible()
        await expect(page.locator('select, [role="combobox"]').first()).toBeVisible()
    })

    test('should show save destination buttons', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByRole('button', { name: 'Overwrite' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'New', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    })

    test('should show Download and Expand buttons', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Download')).toBeVisible()
        await expect(page.getByText('Expand')).toBeVisible()
    })

    test('should show Compare with dropdown', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Compare with')).toBeVisible()
        await expect(page.locator('select').first()).toBeVisible()
    })

    test('should show video player', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible()
    })

    test('should show cue list with at least one cue', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByRole('button', { name: '#1', exact: true })).toBeVisible()
    })

    test('should show cue with start and end time inputs', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('input').first()).toBeVisible()
    })

    test('should show cue text textarea', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('textarea').first()).toBeVisible()
    })

    test('should show warnings count', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText(/\d+ warnings?/i)).toBeVisible()
    })

    test('should show breadcrumb navigation', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Jobs')).toBeVisible()
        await expect(page.getByText('test-video.mp4')).toBeVisible()
    })

    test('should show timeline waveform', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('footer .relative.h-24')).toBeVisible()
    })

    test('should edit cue text and content changes', async ({ page }) => {
        await page.goto(EDITOR_URL)
        const firstTextarea = page.locator('textarea').first()
        await firstTextarea.click()
        await firstTextarea.selectText()
        await firstTextarea.fill('QA test subtitle text')
        const value = await firstTextarea.inputValue()
        expect(value).toBe('QA test subtitle text')
    })
})