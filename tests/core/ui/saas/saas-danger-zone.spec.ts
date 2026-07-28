import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-danger-zone.spec.ts
 *
 * Danger zone page (/agent/{id}/danger-zone) on the Telaris support bot.
 * Relocated from saas-support-bot.spec.ts (being retired).
 *
 * Visibility-only: Archive and Delete are irreversible on a real agent, so they
 * are asserted present and NEVER clicked. Button labels are matched by verb
 * (/archive/i, /delete/i) so they survive the chatbot/agent/support-bot rename.
 */

test.describe('SaaS Danger Zone', () => {
  test.use({ storageState: 'reports/saas-session.json' })

  const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
  const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
  const DANGER_URL = `${SAAS_URL}/agent/${AGENT_ID}/danger-zone`
  const READY = 45000

  async function gotoDanger(page: Page, anchor: () => Promise<void>) {
    await page.goto(DANGER_URL)
    await anchor()
  }

  test('should show danger zone page with Archive and Delete buttons', async ({ page }) => {
    await gotoDanger(page, async () => {
      await expect(page.getByRole('button', { name: /archive/i })).toBeVisible({ timeout: READY })
    })
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible()
  })

  test('should show archive description text', async ({ page }) => {
    await gotoDanger(page, async () => {
      await expect(page.getByText(/becomes inactive and stops responding/i)).toBeVisible({ timeout: READY })
    })
  })

  test('should show delete warning text', async ({ page }) => {
    await gotoDanger(page, async () => {
      await expect(page.getByText(/cannot be undone/i)).toBeVisible({ timeout: READY })
    })
  })
})
