import { test, expect } from '@playwright/test'

test.describe('Core — Theme Toggle', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('should start in dark mode', async ({ page }) => {
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('should switch to light mode when toggle is clicked', async ({ page }) => {
    const htmlBefore = await page.locator('html').getAttribute('class')
    expect(htmlBefore).toContain('dark')

    const themeButton = page.locator('button').filter({
      has: page.locator('svg circle[cx="12"][cy="12"][r="5"]')
    }).first()
    await themeButton.click()
    await page.waitForTimeout(500)

    const htmlAfter = await page.locator('html').getAttribute('class')
    expect(htmlAfter).not.toContain('dark')
  })

  test('should switch back to dark mode when toggle is clicked again', async ({ page }) => {
    const sunButton = page.locator('button').filter({
      has: page.locator('svg circle[cx="12"][cy="12"][r="5"]')
    }).first()
    await sunButton.click()
    await page.waitForTimeout(500)

    const moonButton = page.locator('button').filter({
      has: page.locator('svg path[d*="M21 12.79"]')
    }).first()
    await moonButton.click()
    await page.waitForTimeout(500)

    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

})