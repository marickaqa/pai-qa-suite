import { test, expect, type Page } from '@playwright/test'

/**
 * ## theme.spec.ts
 *
 * Tests the dark/light theme toggle on the chatbot.
 *
 * NOTE: previously located the toggle by its icon's exact SVG path
 * (circle[r="5"] / a specific moon path) — that broke the moment the icon
 * changed. We now find the toggle by a stable strategy and, crucially,
 * verify via the <html class="dark"> flip, which is the real behaviour and
 * is independent of whatever icon the button renders. No networkidle / sleeps.
 */

test.describe('Core — Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toBeVisible()
  })

  // Find the theme toggle without depending on icon internals.
  // Try accessible name first, then fall back to a header icon-button.
  const getThemeButton = (page: Page) => {
    const byName = page.getByRole('button', { name: /theme|dark|light|appearance/i })
    return byName
  }

  // Toggle whatever control changes the theme, and return the resulting
  // html class. Uses the accessible-name button if present; otherwise clicks
  // header icon-buttons until the dark class flips.
  async function toggleTheme(page: Page): Promise<void> {
    const named = getThemeButton(page)
    if (await named.count() > 0) {
      await named.first().click()
      return
    }
    // fallback: try each header icon button until the theme class changes
    const before = await page.locator('html').getAttribute('class')
    const iconButtons = page.locator('header button:has(svg), nav button:has(svg)')
    const n = await iconButtons.count()
    for (let i = 0; i < n; i++) {
      await iconButtons.nth(i).click()
      const after = await page.locator('html').getAttribute('class')
      if ((before?.includes('dark') ?? false) !== (after?.includes('dark') ?? false)) return
      // undo if this wasn't the theme button
      await iconButtons.nth(i).click()
    }
    throw new Error('could not find a control that toggles the theme')
  }

  test('should start in dark mode', async ({ page }) => {
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('should switch to light mode when toggle is clicked', async ({ page }) => {
    expect(await page.locator('html').getAttribute('class')).toContain('dark')
    await toggleTheme(page)
    // the real assertion: the dark class is removed
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 10000 })
  })

  test('should switch back to dark mode when toggle is clicked again', async ({ page }) => {
    // go to light...
    await toggleTheme(page)
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 10000 })
    // ...and back to dark
    await toggleTheme(page)
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 10000 })
  })
})