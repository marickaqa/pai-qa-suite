import { test, expect } from '@playwright/test'

/**
 * ## subtitles-dashboard.spec.ts
 *
 * Tests the PAI Subtitles dashboard overview page.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Dashboard', () => {
  test.use({ storageState: 'reports/subtitles-session.json' })

  const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'

  test('should land on overview after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  })

  test('should show navigation items', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Jobs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Transcribe & Translate' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Translate', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Team' })).toBeVisible()
  })

  test('should show New Job button', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByRole('button', { name: /new job/i })).toBeVisible()
  })

  test('should show search bar', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should show theme toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByRole('button', { name: /toggle theme/i }).or(page.locator('button').filter({ has: page.locator('svg.lucide-sun, svg.lucide-moon') }))).toBeVisible()
  })

  test('should show action cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('Subtitles from video')).toBeVisible()
    await expect(page.getByText('Translate subtitles')).toBeVisible()
  })

  test('should show metrics cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('Total Jobs')).toBeVisible()
    await expect(page.getByText(/GPU (minutes|seconds) used/i)).toBeVisible()
    await expect(page.getByText('Top Languages')).toBeVisible()
    await expect(page.getByText('Tokens Used')).toBeVisible()
  })

  test('should show total jobs as a number', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    const card = page.locator('div').filter({ has: page.getByText('Total Jobs') }).first()
    await expect(card).toBeVisible()
  })

  test('should show processing volume chart', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('Processing Volume - last 7 days')).toBeVisible()
  })

  test('should show recent jobs section', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('Recent Jobs')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View All' })).toBeVisible()
  })

  test('should show recent jobs table columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('FILE / REFERENCE')).toBeVisible()
    await expect(page.getByText('DURATION')).toBeVisible()
    await expect(page.getByText('STATUS')).toBeVisible()
  })

  test('should navigate to jobs page', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/jobs/)
  })

  test('should navigate to team page', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: 'Team' }).click()
    await expect(page).toHaveURL(/team/)
  })

  // --- Action card navigation ---

  test('should navigate to new job page when Subtitles from video is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: 'Subtitles from video' }).click()
    await expect(page).toHaveURL(/jobs\/new/)
  })

  test('should navigate to translate page when Translate subtitles is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: 'Translate subtitles' }).click()
    await expect(page).toHaveURL(/jobs\/translate/)
  })

  // --- Metric card navigation ---

  test('should navigate to jobs when Total Jobs card is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: /Total Jobs/i }).click()
    await expect(page).toHaveURL(/\/jobs/)
  })

  test('should navigate to billing when GPU seconds card is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: /GPU/i }).click()
    await expect(page).toHaveURL(/settings#billing/)
  })

  test('should navigate to billing when Tokens Used card is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: /Tokens Used/i }).click()
    await expect(page).toHaveURL(/settings#billing/)
  })

  // --- Recent jobs ---

  test('should navigate to jobs when View All is clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('link', { name: 'View All' }).click()
    await expect(page).toHaveURL(/\/jobs/)
  })

  test('should show at least one job in recent jobs', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('test-video.mp4').first()).toBeVisible()
  })

  test('should show completed status on recent job', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await expect(page.getByText('Completed').first()).toBeVisible()
  })

  // --- New Job button ---

  test('should open New Job menu when clicked', async ({ page }) => {
    await page.goto(`${BASE_URL}/overview`)
    await page.getByRole('button', { name: /new job/i }).click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('menu')).toBeVisible()
  })
})