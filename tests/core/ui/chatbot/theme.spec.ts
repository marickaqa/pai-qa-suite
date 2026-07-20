import { test, expect, type Page } from '@playwright/test'

/**
 * ## theme.spec.ts
 *
 * Dark/light theme toggle. Button is identified by the moon icon's path data
 * (d="M21 12.79...") — the sun icon uses circle[r="3"]. Clicking flips the
 * `dark` class on <html>. Theme persists across sessions, so tests read the
 * current state, toggle, assert the flip, and restore.
 */

test.describe('Core - Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveClass(/./, { timeout: 15000 })
  })

  const isDark = async (page: Page) =>
    ((await page.locator('html').getAttribute('class')) || '').includes('dark')

  // The theme toggle: a button containing either the moon path or the sun
  // circle. Matches whichever icon is currently shown.
  const themeButton = (page: Page) =>
    page.locator('button:has(svg path[d*="M21 12.79"]), button:has(svg circle[r="3"]), button:has(svg circle[r="5"])').first()

  test('should start with a theme class on html', async ({ page }) => {
    const cls = await page.locator('html').getAttribute('class')
    expect(cls === null ? '' : cls).not.toBe('')
  })

  test('should flip the theme when the toggle is clicked', async ({ page }) => {
    const btn = themeButton(page)
    await expect(btn).toBeVisible({ timeout: 10000 })

    const before = await isDark(page)
    await btn.click()
    await expect
      .poll(async () => await isDark(page), { timeout: 8000, intervals: [150] })
      .toBe(!before)

    // restore
    await themeButton(page).click()
    await expect.poll(async () => await isDark(page), { timeout: 8000 }).toBe(before)
  })

  test('should toggle back and forth correctly', async ({ page }) => {
    const start = await isDark(page)
    await themeButton(page).click()
    await expect.poll(async () => await isDark(page), { timeout: 8000 }).toBe(!start)
    await themeButton(page).click()
    await expect.poll(async () => await isDark(page), { timeout: 8000 }).toBe(start)
  })
})