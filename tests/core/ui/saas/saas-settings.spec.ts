import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-settings.spec.ts
 *
 * Workspace Settings page at /dashboard/settings — org name/slug display and
 * workspace API keys.
 *
 * The "Create key" submit currently fails with the same "Invalid origin" popup
 * as the per-agent API key generate flow (origin/CORS check on the create
 * endpoint), reported to dev. So the create-key round-trip is parked as
 * test.fixme; read-only structure and the dialog form are covered live.
 *
 * When the create flow is fixed and re-enabled, assert creation by the empty
 * state clearing / a key row appearing — NEVER read or log the key value
 * (it is a secret).
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const SETTINGS_URL = `${SAAS_URL}/dashboard/settings`

async function gotoSettings(page: Page) {
  await page.goto(SETTINGS_URL)
  await expect(
    page.getByRole('heading', { name: 'Settings' }),
    'settings page did not render'
  ).toBeVisible({ timeout: 45000 })
}

test.describe('Core — SaaS Settings', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show the Settings heading and description', async ({ page }) => {
    await gotoSettings(page)
    await expect(page.getByText('Manage your organization and API keys.')).toBeVisible()
  })

  test('should show the Organization section with name and slug', async ({ page }) => {
    await gotoSettings(page)
    await expect(page.getByText('Details for the current organization.')).toBeVisible()
    await expect(page.getByText('Organization Name')).toBeVisible()
    await expect(page.getByText('Organization Slug')).toBeVisible()
    // Scope to main: the sidebar org picker also shows "noctocode.dev".
    await expect(page.getByRole('main').getByText('noctocode.dev', { exact: true })).toBeVisible()
    await expect(page.getByRole('main').getByText('NOCTOCODE', { exact: true })).toBeVisible()
  })

  test('should show the API keys section with the Create key button', async ({ page }) => {
    await gotoSettings(page)
    await expect(page.getByRole('heading', { name: 'API keys' })).toBeVisible()
    await expect(page.getByText(/Keys only work for the organization they were created in/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create key' }).first()).toBeVisible()
  })

  test('should open the Create API key dialog with a disabled submit until named', async ({ page }) => {
    await gotoSettings(page)
    await page.getByRole('button', { name: 'Create key' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByRole('heading', { name: 'Create API key' })).toBeVisible()

    const nameInput = dialog.locator('input[placeholder="Production integration"]')
    await expect(nameInput).toBeVisible()
    // Submit disabled until the key is named.
    const submit = dialog.getByRole('button', { name: 'Create key' })
    await expect(submit).toBeDisabled()
    await nameInput.fill('qa-key-name')
    await expect(submit).toBeEnabled()

    // Do NOT submit — cancel out (and creation is broken anyway; see fixme).
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })

  // FIXME: submitting "Create key" raises an "Invalid origin" popup (same
  // origin/CORS failure as the per-agent API key generate flow), reported to
  // dev, not yet fixed. Re-enable once fixed. When live, assert creation by the
  // "No API keys" empty state clearing / a key row appearing — NEVER read the
  // key value (it is a secret).
  test.fixme('should create a workspace API key', async ({ page }) => {
    await gotoSettings(page)
    await expect(page.getByText('No API keys')).toBeVisible()
    await page.getByRole('button', { name: 'Create key' }).first().click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input[placeholder="Production integration"]').fill(`qa-key-${Date.now()}`)
    await dialog.getByRole('button', { name: 'Create key' }).click()
    await expect(page.getByText('No API keys')).not.toBeVisible({ timeout: 15000 })
  })
})