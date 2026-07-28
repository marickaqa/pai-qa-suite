import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-api-usage.spec.ts
 *
 * API & Usage page (per-agent API key) on the Telaris support bot.
 *
 * Read-only coverage only. The "Generate API key" flow is currently broken —
 * clicking it raises an "Invalid origin" popup (looks like an origin/CORS check
 * failing on the generate endpoint), reported to dev but not yet fixed. It is
 * parked as test.fixme with a truthful reason rather than a silent skip or a
 * red core test; flip it back to `test` once the endpoint is fixed.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
const API_USAGE_URL = `${SAAS_URL}/agent/${AGENT_ID}/api-usage`

async function gotoApiUsage(page: Page) {
  await page.goto(API_USAGE_URL)
  await expect(
    page.getByRole('heading', { name: 'API key' }),
    'API & Usage page did not render'
  ).toBeVisible({ timeout: 45000 })
}

test.describe('Core — SaaS API & Usage', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show the API key heading and description', async ({ page }) => {
    await gotoApiUsage(page)
    await expect(page.getByText('Use this key to access the agent via API.')).toBeVisible()
  })

  test('should show the Generate API key button', async ({ page }) => {
    await gotoApiUsage(page)
    await expect(page.getByRole('button', { name: 'Generate API key' })).toBeVisible({ timeout: 15000 })
  })

  // FIXME: clicking "Generate API key" currently raises an "Invalid origin"
  // popup (appears to be an origin/CORS check failing on the generate endpoint).
  // Reported to dev, not yet fixed. Re-enable (test.fixme -> test) once fixed.
  // When live, assert a key is created WITHOUT ever reading/logging its value
  // (it's a secret) — e.g. assert the empty state disappears / a key row appears.
  test.fixme('should generate an API key for the agent', async ({ page }) => {
    await gotoApiUsage(page)
    await expect(page.getByText('No API key yet for this agent.')).toBeVisible()
    await page.getByRole('button', { name: 'Generate API key' }).click()
    // Assert creation by the empty-state clearing — never surface the key value.
    await expect(page.getByText('No API key yet for this agent.')).not.toBeVisible({ timeout: 15000 })
  })
})
