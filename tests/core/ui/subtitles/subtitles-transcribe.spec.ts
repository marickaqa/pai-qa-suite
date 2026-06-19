import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * ## subtitles-transcribe.spec.ts
 *
 * Tests the Transcribe & Translate new job form at /jobs/new.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Transcribe & Translate', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

    test('should show new job page', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByRole('heading', { name: 'New job' }).last()).toBeVisible()
        await expect(page.getByText('Transcribe and translate in one pass')).toBeVisible()
    })

    test('should show source language auto-detect info', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Auto-detected from video')).toBeVisible()
        await expect(page.getByText(/source language is detected automatically/i)).toBeVisible()
    })

    test('should show target languages section with search', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Target languages')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Search languages...' })).toBeVisible()
    })

    test('should search and find a target language', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await page.getByRole('button', { name: 'Search languages...' }).click()
        await page.waitForTimeout(300)
        await page.locator('input[placeholder="Search languages…"]').fill('Italian')
        await page.waitForTimeout(500)
        await expect(page.getByRole('dialog').getByText('Italian')).toBeVisible()
    })

    test('should show pre-selected target languages', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('English')).toBeVisible()
        await expect(page.getByText('Spanish')).toBeVisible()
        await expect(page.getByText('French')).toBeVisible()
    })

    test('should show output format options', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Output & advanced')).toBeVisible()
        await expect(page.getByText('SRT subtitle file')).toBeVisible()
        await expect(page.getByText('VTT subtitle file')).toBeVisible()
    })

    test('should show file upload drop zone', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Drop your file here')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Browse Files' })).toBeVisible()
        await expect(page.getByText(/100MB max file size/i)).toBeVisible()
    })

    test('should show Start processing button disabled before file upload', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByRole('button', { name: /start processing/i })).toBeDisabled()
    })

    test('should show estimated time section', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Estimated time')).toBeVisible()
        await expect(page.getByText(/choose a video file to estimate/i)).toBeVisible()
    })


    test('should enable Start processing after file is attached', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await page.waitForTimeout(2000)
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(path.join('tests', 'fixtures', 'test-video.mp4'))
        await page.waitForTimeout(2000)
        await expect(page.getByRole('button', { name: /start processing/i })).toBeEnabled()
    })

    test('should show estimated time after file is attached', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await page.waitForTimeout(2000)
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(path.join('tests', 'fixtures', 'test-video.mp4'))
        await page.waitForTimeout(3000)
        await expect(page.getByText(/choose a video file to estimate/i)).not.toBeVisible()
    })

    test('should submit a job and redirect to jobs page', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await page.waitForTimeout(2000)
        const fileInput = page.locator('input[type="file"]')
        await fileInput.setInputFiles(path.join('tests', 'fixtures', 'test-video.mp4'))
        await page.waitForTimeout(2000)
        await page.getByRole('button', { name: /start processing/i }).click()
        await page.waitForURL(url => !url.toString().includes('jobs/new'), { timeout: 30000 })
        expect(page.url()).not.toContain('jobs/new')
    })

    test('should add a language via the dialog', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await page.getByRole('button', { name: 'Search languages...' }).click()
        await page.waitForTimeout(300)
        await page.getByRole('button', { name: /Danish/i }).click()
        await page.getByRole('button', { name: /Apply/i }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Danish')).toBeVisible()
    })

    test('should remove a language using the remove button', async ({ page }) => {
        await page.goto(`${BASE_URL}/jobs/new`)
        await expect(page.getByText('Russian')).toBeVisible()
        await page.getByRole('button', { name: 'Remove Russian' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('button', { name: 'Remove Russian' })).not.toBeVisible()
    })
})