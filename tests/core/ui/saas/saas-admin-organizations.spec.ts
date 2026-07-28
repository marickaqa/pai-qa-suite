import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-admin-organizations.spec.ts
 *
 * Admin Panel > Organizations (/dashboard/admin/organizations).
 * Requires the admin session (qa-saas is now a platform admin).
 *
 * HIGHEST-STAKES SURFACE IN THE SUITE. The live org list includes noctocode.dev
 * and Trump Media — the orgs the whole SaaS suite depends on. So deletion is
 * fenced hard:
 *   - We ONLY ever create + delete our own qa-org-* organisations.
 *   - Every delete is scoped to a row whose name starts with "qa-org-";
 *     a guard refuses to click delete on any other row.
 *   - afterEach sweeps leftover qa-org-* orgs even if a test crashed.
 * A real org is never deleted, edited, or touched.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const ORGS_URL = `${SAAS_URL}/dashboard/admin/organizations`
const QA_PREFIX = 'qa-org-'

const rowByName = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name })

async function gotoOrgs(page: Page) {
  await page.goto(ORGS_URL)
  await expect(
    page.getByRole('heading', { name: 'Organizations' }).first(),
    'organizations page did not render'
  ).toBeVisible({ timeout: 45000 })
}

// Delete a single qa-org-* row. Refuses to act on anything that isn't ours.
async function deleteQaOrgRow(page: Page, row: ReturnType<typeof rowByName>) {
  const text = (await row.textContent()) || ''
  if (!text.includes(QA_PREFIX)) {
    throw new Error(`Refusing to delete a non-qa org row: "${text.slice(0, 60)}"`)
  }
  await row.locator('button:has(svg.lucide-trash-2)').click()
  // Deleting an org must confirm. Confirm if a dialog appears.
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: /delete|remove|confirm/i }).click()
  }
}

test.describe('Core — SaaS Admin: Organizations', () => {
  test.use({ storageState: SAAS_SESSION })

  // Safety net: remove any qa-org-* left behind by a crashed test.
  test.afterEach(async ({ page }) => {
    await gotoOrgs(page)
    let leftovers = rowByName(page, QA_PREFIX)
    let remaining = await leftovers.count()
    while (remaining > 0) {
      await deleteQaOrgRow(page, leftovers.first())
      await expect(leftovers).toHaveCount(remaining - 1, { timeout: 10000 })
      remaining = await leftovers.count()
    }
  })

  test('should show the Organizations heading, count and description', async ({ page }) => {
    await gotoOrgs(page)
    await expect(page.getByText(/\d+ organizations?/i).first()).toBeVisible()
    await expect(page.getByText('All platform organizations')).toBeVisible()
  })

  test('should show the New organization button', async ({ page }) => {
    await gotoOrgs(page)
    await expect(page.getByRole('button', { name: /new organization/i })).toBeVisible()
  })

  test('should show the table columns', async ({ page }) => {
    await gotoOrgs(page)
    for (const col of [/^name$/i, /^slug$/i, /^created$/i]) {
      await expect(page.getByText(col).first()).toBeVisible()
    }
  })

  test('should show org rows with edit and delete actions', async ({ page }) => {
    await gotoOrgs(page)
    await expect(page.locator('button:has(svg.lucide-pencil)').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('button:has(svg.lucide-trash-2)').first()).toBeVisible()
  })

  test('should create an organization and then delete it (verified teardown)', async ({ page }) => {
    await gotoOrgs(page)
    const stamp = Date.now()
    const name = `${QA_PREFIX}${stamp}`
    const slug = `qa-org-${stamp}`

    await page.getByRole('button', { name: /new organization/i }).click()
    // Fields by role (label + input may share ids). Placeholders: "Acme Corp" / "acme-corp".
    const nameInput = page.getByRole('textbox', { name: 'Acme Corp' })
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill(name)
    await page.getByRole('textbox', { name: 'acme-corp' }).fill(slug)
    // Submit — the create dialog's primary button.
    await page.getByRole('button', { name: /create|save|add/i }).last().click()

    // The new org appears...
    await expect(rowByName(page, name).first()).toBeVisible({ timeout: 15000 })
    // ...then delete it (guarded) and verify it's gone.
    await deleteQaOrgRow(page, rowByName(page, name).first())
    await expect(rowByName(page, name)).toHaveCount(0, { timeout: 10000 })
  })
})
