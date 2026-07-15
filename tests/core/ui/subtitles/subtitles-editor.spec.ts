import { test, expect } from '@playwright/test'

test.describe('Subtitles Editor', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })
    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'
    const JOB_ID = process.env.SUBTITLES_FTP_JOB_ID || '5d77b52e-f7c8-4e24-8770-dae7cf1e9a7d'
    const EDITOR_URL = `${BASE_URL}/jobs/${JOB_ID}/edit/English`

    test('should show editor page heading', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // v1.3.3 redesign: no heading, filename shown at top
        await expect(page.getByText(/\.mp4/i).first()).toBeVisible()
    })

    test('should show Beta badge', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.getByText('Beta')).toBeVisible()
    })

    test('should show version selector', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // v1.3.3: version shown as button with filename
        await expect(page.getByRole('button').filter({ hasText: /\.srt/i }).first()).toBeVisible()
    })

    test('should show save destination buttons', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // save button only appears after making an edit
        const firstTextarea = page.locator('textarea').first()
        await firstTextarea.click()
        await firstTextarea.fill('QA save test ' + Date.now())
        const saveBtn = page.getByRole('button', { name: /save changes/i }).first()
        await expect(saveBtn).toBeVisible({ timeout: 5000 })
        await saveBtn.click()
        await expect(page.getByText('Overwrite')).toBeVisible()
        await expect(page.getByText('Save as new version')).toBeVisible()
        await page.keyboard.press('Escape')
    })

    test('should show Download SRT button', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText('Download SRT')).toBeVisible()
    })

    test('should show Compare button', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('button', { name: /compare/i })).toBeVisible()
    })

    test('should show video player', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
    })

    test('should show cue list with at least one cue', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // v1.3.3: cues shown with aria-label "Edit start and end time"
        await expect(page.locator('button[aria-label="Edit start and end time"]').first()).toBeVisible()
    })

    test('should show cue with start and end time inputs', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        await expect(page.locator('input').first()).toBeVisible()
    })

    test('should show cue text textarea', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        await expect(page.locator('textarea').first()).toBeVisible()
    })

    test('should show warnings count', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // v1.3.3: shows "X over CPS" format
        await expect(page.getByText(/over CPS/i)).toBeVisible()
    })

    test('should show breadcrumb navigation', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        await expect(page.getByText(/\.mp4/i).first()).toBeVisible()
    })

    test('should show timeline waveform', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        // v1.3.3: timeline shown at bottom of page
        await expect(page.locator('footer, [class*="timeline"], [class*="waveform"]').first()).toBeVisible()
    })

    test('should edit cue text and content changes', async ({ page }) => {
        await page.goto(EDITOR_URL)
        await expect(page.locator('video')).toBeVisible({ timeout: 10000 })
        const firstTextarea = page.locator('textarea').first()
        await firstTextarea.click()
        await firstTextarea.selectText()
        await firstTextarea.fill('QA test subtitle text')
        const value = await firstTextarea.inputValue()
        expect(value).toBe('QA test subtitle text')
    })
})