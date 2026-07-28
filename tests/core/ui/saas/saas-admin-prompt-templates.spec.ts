import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-admin-prompt-templates.spec.ts
 *
 * Admin Panel > Prompt Templates (/dashboard/admin/prompt-templates).
 * Requires an admin session — qa-saas is now a platform admin, so the standard
 * saas-session.json can see this page.
 *
 * This is a HIGH-STAKES surface (platform-wide templates). CRUD is limited to
 * creating and deleting our own qa-* templates, with verified teardown AND an
 * afterEach safety net that sweeps any leftover qa-* template even if a test
 * dies mid-flow. We never touch a non-qa template.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const TEMPLATES_URL = `${SAAS_URL}/dashboard/admin/prompt-templates`

// A template row is the table row containing the given name.
const rowByName = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name })

// The trash/delete icon button in a row (icon-only, no accessible name).
const deleteBtnIn = (row: ReturnType<typeof rowByName>) =>
  row.locator('button:has(svg.lucide-trash-2)')

async function gotoTemplates(page: Page) {
  await page.goto(TEMPLATES_URL)
  await expect(
    page.getByRole('heading', { name: 'Prompt Templates' }).first(),
    'prompt templates page did not render'
  ).toBeVisible({ timeout: 45000 })
}

async function deleteTemplate(page: Page, name: string) {
  const row = rowByName(page, name).first()
  await deleteBtnIn(row).click()
  // Delete likely confirms via a dialog. If a dialog appears, confirm it;
  // otherwise the row is removed directly.
  const dialog = page.getByRole('dialog')
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.getByRole('button', { name: /delete|remove|confirm/i }).click()
  }
  await expect(rowByName(page, name)).toHaveCount(0, { timeout: 10000 })
}

test.describe('Core — SaaS Admin: Prompt Templates', () => {
  test.use({ storageState: SAAS_SESSION })

  // Safety net: remove any qa-* templates left behind by a crashed test.
  test.afterEach(async ({ page }) => {
    await gotoTemplates(page)
    let leftovers = rowByName(page, 'qa-template-')
    let remaining = await leftovers.count()
    while (remaining > 0) {
      const row = leftovers.first()
      await deleteBtnIn(row).click()
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.getByRole('button', { name: /delete|remove|confirm/i }).click()
      }
      await expect(leftovers).toHaveCount(remaining - 1, { timeout: 10000 })
      remaining = await leftovers.count()
    }
  })

  test('should show the Prompt Templates heading, count and description', async ({ page }) => {
    await gotoTemplates(page)
    await expect(page.getByText(/\d+ templates?/i).first()).toBeVisible()
    await expect(page.getByText('All platform prompt templates')).toBeVisible()
  })

  test('should show the New template button and filter controls', async ({ page }) => {
    await gotoTemplates(page)
    await expect(page.getByRole('button', { name: /new template/i })).toBeVisible()
    await expect(page.getByText('All sections')).toBeVisible()
    await expect(page.getByText('All agent types')).toBeVisible()
  })

  test('should show the table columns', async ({ page }) => {
    await gotoTemplates(page)
    for (const col of [/^name$/i, /^type$/i, /^agent type$/i, /^section$/i, /^created$/i]) {
      await expect(page.getByText(col).first()).toBeVisible()
    }
  })

  test('should show template rows with edit and delete actions', async ({ page }) => {
    await gotoTemplates(page)
    await expect(page.locator('button:has(svg.lucide-pencil)').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('button:has(svg.lucide-trash-2)').first()).toBeVisible()
  })

  test('should create a template and then delete it (verified teardown)', async ({ page }) => {
    await gotoTemplates(page)
    const name = `qa-template-${Date.now()}`

    await page.getByRole('button', { name: /new template/i }).click()
    // NOTE: both the <label> and <input> share id="pt-name" (a product bug), so
    // #pt-name is ambiguous — target the fields by their input role instead.
    const nameInput = page.getByRole('textbox', { name: 'Friendly tone' })
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill(name)
    await page.getByRole('textbox', { name: 'Always respond in a warm and friendly manner.' }).fill('QA test template. Safe to delete.')
    // Type / Agent type / Section keep their defaults (Static / Support / None).
    await page.getByRole('button', { name: 'Create' }).click()

    // The new template appears in the list...
    await expect(rowByName(page, name).first()).toBeVisible({ timeout: 15000 })
    // ...then we delete it and verify it's gone.
    await deleteTemplate(page, name)
  })
})