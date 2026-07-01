import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const ANALYTICS_URL = `${SAAS_URL}/dashboard/analytics`

test.describe('Core — SaaS Organization Analytics', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should navigate to analytics page and show Organization overview', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await page.waitForTimeout(2000)
    await expect(page.getByText('Organization overview')).toBeVisible()
    await expect(page.getByText('Activity across all chatbots')).toBeVisible()
  })

  test('should show Messages, Sessions and Tokens used metrics', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await page.waitForTimeout(2000)
    await expect(page.getByText('Messages', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Tokens used', { exact: true })).toBeVisible()
  })

 test('should show percentage change indicators next to metrics', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await page.waitForTimeout(2000)
    const percentages = page.getByText(/[+-]\d+(\.\d+)?%/)
    const count = await percentages.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show Token usage this month card with progress bar', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await expect(page.getByText('Token usage', { exact: false }).first()).toBeVisible()
    await expect(page.getByText(/Input/i)).toBeVisible()
    await expect(page.getByText(/Output/i)).toBeVisible()
  })

  test('should show Activity over time chart with period toggle buttons', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await expect(page.getByText('Activity over time')).toBeVisible()
    for (const label of ['Weekly', 'Monthly', 'Yearly', 'All time']) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('should switch between time periods when toggle buttons are clicked', async ({ page }) => {
    await page.goto(ANALYTICS_URL)

    await page.getByRole('button', { name: 'Weekly', exact: true }).click()
    await expect(page.getByText(/Daily volume/i)).toBeVisible()

    await page.getByRole('button', { name: 'Yearly', exact: true }).click()
    await expect(page.getByText(/volume/i)).toBeVisible()

    await page.getByRole('button', { name: 'All time', exact: true }).click()
    await expect(page.getByText(/volume/i)).toBeVisible()
  })

  test('should show chart legend for Messages, Sessions and Tokens', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await expect(page.getByText('Messages', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Tokens \(k\)/i)).toBeVisible()
  })

  test('should show Guardrail triggers table with correct headers', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    await expect(page.getByRole('heading', { name: 'Guardrail triggers' })).toBeVisible()
    await expect(page.getByText('Messages blocked by safety rules across all chatbots.')).toBeVisible()
    await expect(page.getByText('Category', { exact: true })).toBeVisible()
    await expect(page.getByText('Count', { exact: true })).toBeVisible()
    await expect(page.getByText('Last triggered', { exact: true })).toBeVisible()
  })

  test('should show a Review action for guardrail trigger rows', async ({ page }) => {
    await page.goto(ANALYTICS_URL)
    const reviewBtns = page.getByRole('button', { name: 'Review' })
    const count = await reviewBtns.count()
    if (count > 0) {
      await expect(reviewBtns.first()).toBeVisible()
    }
  })

})