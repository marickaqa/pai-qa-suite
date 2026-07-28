import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-widget.spec.ts
 *
 * Widget page (/agent/{id}/widget) on the Telaris support bot — distinct from
 * /style-config (Branding). Covers the widget config fields, the branding
 * section, live preview, theme + launcher-position toggles, starter questions,
 * Save, and the embed code.
 *
 * Relocated from saas-support-bot.spec.ts (which is being retired). All
 * assertions are visibility-only — nothing is saved.
 *
 * gotoAgentPage() waits for a page-specific anchor before asserting, so a slow
 * dev load surfaces as a clear "did not render" rather than a flake.
 */

test.describe('SaaS Widget', () => {
  test.use({ storageState: 'reports/saas-session.json' })

  const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
  const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
  const WIDGET_URL = `${SAAS_URL}/agent/${AGENT_ID}/widget`
  const READY = 45000

  async function gotoWidget(page: Page, anchor: () => Promise<void>) {
    await page.goto(WIDGET_URL)
    await anchor()
  }

  test('should show widget page with all config fields', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByText('Header text')).toBeVisible({ timeout: READY })
    })
    await expect(page.getByText('Theme', { exact: true })).toBeVisible()
    await expect(page.getByText('Primary colour')).toBeVisible()
    await expect(page.getByText('Launcher position')).toBeVisible()
    await expect(page.getByText('Side spacing')).toBeVisible()
    await expect(page.getByText('Bottom spacing')).toBeVisible()
    await expect(page.getByText('Starter questions')).toBeVisible()
  })

  test('should show branding section with widget logo upload slots', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByRole('heading', { name: 'Branding' })).toBeVisible({ timeout: READY })
    })
    await expect(page.getByText('Widget logos')).toBeVisible()
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
  })

  test('should show live preview iframe', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByText('Live preview')).toBeVisible({ timeout: READY })
    })
  })

  test('should show theme toggle buttons', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByRole('button', { name: 'System' })).toBeVisible({ timeout: READY })
    })
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
  })

  test('should show launcher position toggle buttons', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByRole('button', { name: 'Left', exact: true })).toBeVisible({ timeout: READY })
    })
    await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeVisible()
  })

  test('should show Add question button for starter questions', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByRole('button', { name: /add question/i })).toBeVisible({ timeout: READY })
    })
  })

  test('should show Save widget button', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByRole('button', { name: 'Save widget' })).toBeVisible({ timeout: READY })
    })
  })

  test('should show embed code section', async ({ page }) => {
    await gotoWidget(page, async () => {
      await expect(page.getByText('Embed code')).toBeVisible({ timeout: READY })
    })
    await expect(page.getByRole('button', { name: 'HTML' })).toBeVisible({ timeout: 15000 })
  })
})
