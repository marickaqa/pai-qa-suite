import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-legal.spec.ts
 *
 * Legal page (per-agent widget legal links) on the Telaris support bot.
 * Three URL inputs — Data usage, Privacy policy, Terms and conditions — plus a
 * "Save legal links" button.
 *
 * We NEVER click Save: it rewrites the bot's real widget legal links, whose
 * effect (the first-message consent line, and the widget "..." menu showing
 * Privacy/Terms only when set) surfaces in the embedded widget on the dummy
 * site. That conditional widget behaviour is a separate, DEFERRED spec — it
 * inherently requires mutating these URLs. Here we cover the form read-only,
 * and a typing round-trip that is discarded by reloading.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
const LEGAL_URL = `${SAAS_URL}/agent/${AGENT_ID}/legal`

const urlInputs = ['dataUsageUrl', 'privacyPolicyUrl', 'termsAndConditionsUrl']

async function gotoLegal(page: Page) {
  await page.goto(LEGAL_URL)
  await expect(
    page.getByRole('heading', { name: 'Legal' }),
    'legal page did not render'
  ).toBeVisible({ timeout: 45000 })
}

test.describe('Core — SaaS Legal', () => {
  test.use({ storageState: SAAS_SESSION })

 test('should show the Legal heading and description', async ({ page }) => {
    await gotoLegal(page)
    await expect(page.getByText(/Add links to your policies/i)).toBeVisible()
  })

  test('should show all three legal URL inputs as url-typed fields', async ({ page }) => {
    await gotoLegal(page)
    for (const name of urlInputs) {
      const input = page.locator(`input[name="${name}"]`)
      await expect(input).toBeVisible({ timeout: 15000 })
      await expect(input).toHaveAttribute('type', 'url')
    }
  })

  test('should show the Save legal links button', async ({ page }) => {
    await gotoLegal(page)
    await expect(page.getByRole('button', { name: 'Save legal links' })).toBeVisible({ timeout: 15000 })
  })

  test('should accept a typed URL in a field (discarded on reload)', async ({ page }) => {
    await gotoLegal(page)
    const input = page.locator('input[name="dataUsageUrl"]')
    await expect(input).toBeVisible({ timeout: 15000 })
    const original = await input.inputValue()

    // Type a new value and confirm the field holds it — Save is NOT clicked.
    await input.fill('https://example.com/qa-data-usage')
    await expect(input).toHaveValue('https://example.com/qa-data-usage')

    // Reload discards the unsaved edit, restoring the persisted value.
    await gotoLegal(page)
    await expect(page.locator('input[name="dataUsageUrl"]')).toHaveValue(original)
  })
})