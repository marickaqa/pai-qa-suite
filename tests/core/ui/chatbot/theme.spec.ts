import { test, expect } from '@playwright/test'

test.describe('Core — Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  const getThemeButton = (page: any) =>
    page.locator('button:has(svg)').filter({
      has: page.locator('svg circle[r="5"], svg path[d*="M21 12.79"]')
    }).first()

  test('should start in dark mode', async ({ page }) => {
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('should switch to light mode when toggle is clicked', async ({ page }) => {
    const htmlBefore = await page.locator('html').getAttribute('class')
    expect(htmlBefore).toContain('dark')
    await expect(getThemeButton(page)).toBeVisible({ timeout: 10000 })
    await getThemeButton(page).click()
    await page.waitForTimeout(500)
    const htmlAfter = await page.locator('html').getAttribute('class')
    expect(htmlAfter).not.toContain('dark')
  })

  test('should switch back to dark mode when toggle is clicked again', async ({ page }) => {
    await expect(getThemeButton(page)).toBeVisible({ timeout: 10000 })
    await getThemeButton(page).click()
    await page.waitForTimeout(500)
    await expect(getThemeButton(page)).toBeVisible({ timeout: 10000 })
    await getThemeButton(page).click()
    await page.waitForTimeout(500)
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })
})