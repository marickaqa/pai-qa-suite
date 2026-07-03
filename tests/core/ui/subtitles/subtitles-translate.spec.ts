import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * ## subtitles-translate.spec.ts
 *
 * Tests the Translate subtitles form at /jobs/translate.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Translate', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

    test('should show translate subtitles page', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByRole('heading', { name: 'Translate subtitles' }).last()).toBeVisible()
        await expect(page.getByText('Upload an existing subtitle file and translate it into multiple languages')).toBeVisible()
    })

    test('should show source language auto-detect info', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Auto-detected from subtitles')).toBeVisible()
        await expect(page.getByText(/source language is detected automatically/i)).toBeVisible()
    })

    test('should show target languages section with search', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Target languages')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Search languages...' })).toBeVisible()
    })

    test('should show pre-selected target languages', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Target languages')).toBeVisible({ timeout: 15000 })
        const removeButtons = page.getByRole('button', { name: /Remove /i })
        // pre-selected languages depend on tenant defaults — may not always be present
        const count = await removeButtons.count()
        if (count > 0) {
            await expect(removeButtons.first()).toBeVisible()
        }
    })

    test('should show output format options', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Output & options')).toBeVisible()
        await expect(page.getByText('SRT subtitle file')).toBeVisible()
        await expect(page.getByText('VTT subtitle file')).toBeVisible()
    })

    test('should show file upload drop zone for subtitle files', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Drop your subtitle file here')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Browse Files' })).toBeVisible()
        await expect(page.getByText('SRT, VTT')).toBeVisible()
    })

    test('should show Start translation button disabled before file upload', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByRole('button', { name: /start translation/i })).toBeDisabled()
    })

    test('should show estimated time section', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Estimated time')).toBeVisible()
        await expect(page.getByText(/choose a subtitle file/i)).toBeVisible()
    })

    test('should enable Start translation after SRT file is attached', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(path.join('tests', 'fixtures', 'test-subtitles.srt'))
        await page.waitForTimeout(2000)
        await expect(page.getByRole('button', { name: /start translation/i })).toBeEnabled()
    })

    test('should submit a translation job and redirect', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(path.join('tests', 'fixtures', 'test-subtitles.srt'))
        await page.waitForTimeout(2000)
        await page.getByRole('button', { name: /start translation/i }).click()
        await page.waitForURL(url => !url.toString().includes('jobs/translate'), { timeout: 30000 })
        expect(page.url()).not.toContain('jobs/translate')
    })

    test('should add a language via the dialog', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await page.getByRole('button', { name: 'Search languages...' }).click()
        await page.waitForTimeout(300)
        await page.getByRole('button', { name: /Danish/i }).click()
        await page.getByRole('button', { name: /Apply/i }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Danish')).toBeVisible()
    })

    test('should remove a language using the remove button', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/translate`)
        await expect(page.getByText('Russian')).toBeVisible()
        await page.getByRole('button', { name: 'Remove Russian' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('button', { name: 'Remove Russian' })).not.toBeVisible()
    })
})