import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-workspace-team.spec.ts
 *
 * Workspace (org-level) Team page at /dashboard/team. Distinct from the
 * per-agent team (/agent/{id}/team): this manages who has access to the whole
 * workspace, invites by EMAIL, and uses a 4-permission set
 * (Admin / Chatbots / Members / Billing).
 *
 * The Invite dialog SENDS A REAL EMAIL on submit — and email invitations are
 * explicitly out of scope for automation. So the dialog is open-and-Cancel
 * only: assert its structure, never click "Send invite". Change role / Remove
 * mutate real access and are visibility-only.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const TEAM_URL = `${SAAS_URL}/dashboard/team`

const PERMISSIONS = ['Admin', 'Chatbots', 'Members', 'Billing']

async function gotoTeam(page: Page) {
  await page.goto(TEAM_URL)
  await expect(
    page.getByRole('heading', { name: 'Team management' }),
    'workspace team page did not render'
  ).toBeVisible({ timeout: 45000 })
}

async function openInviteDialog(page: Page) {
  await page.getByRole('button', { name: 'Invite member' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  await expect(dialog.getByRole('heading', { name: 'Invite member' })).toBeVisible()
  return dialog
}

test.describe('Core — SaaS Workspace Team', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show the Team management heading and member count', async ({ page }) => {
    await gotoTeam(page)
    await expect(page.getByText(/\d+ members?/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Invite member' }).first()).toBeVisible()
  })

  test('should show the 4-permission legend', async ({ page }) => {
    await gotoTeam(page)
    for (const perm of PERMISSIONS) {
      await expect(page.getByText(perm, { exact: true }).first()).toBeVisible()
    }
    await expect(page.getByText('Full access to all features')).toBeVisible()
    await expect(page.getByText('Access billing and subscription')).toBeVisible()
  })

  test('should show the members table with columns', async ({ page }) => {
    await gotoTeam(page)
    await expect(page.getByText('People with access to this workspace.')).toBeVisible()
    for (const col of [/^member$/i, /^permissions$/i, /^joined$/i]) {
      await expect(page.getByText(col).first()).toBeVisible()
    }
  })

  test('should show Change role and Remove actions on member rows', async ({ page }) => {
    await gotoTeam(page)
    await expect(page.getByRole('button', { name: 'Change role' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeVisible()
  })

  test('should show the Pending Invitations section', async ({ page }) => {
    await gotoTeam(page)
    // Target the heading by role: "Pending Invitations" is a substring of the
    // empty-state "No pending invitations", so a plain getByText matches both.
    await expect(page.getByRole('heading', { name: 'Pending Invitations' })).toBeVisible()
    await expect(page.getByText(/People who have been invited but haven't joined yet/i)).toBeVisible()
  })

  test('should open the Invite dialog with an email field and 4 permissions', async ({ page }) => {
    await gotoTeam(page)
    const dialog = await openInviteDialog(page)

    // Email invite (not member search) — the input is type=email.
    const email = dialog.locator('input[name="email"]')
    await expect(email).toBeVisible()
    await expect(email).toHaveAttribute('type', 'email')

    // 4 permission options, asserted by label text + checkbox count (base-ui
    // checkboxes don't expose the label as an accessible name).
    for (const perm of PERMISSIONS) {
      await expect(dialog.getByText(perm, { exact: true })).toBeVisible()
    }
    await expect(dialog.getByRole('checkbox')).toHaveCount(4)

    // Send invite exists but is NEVER clicked (would email a real person).
    await expect(dialog.getByRole('button', { name: 'Send invite' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('should accept a typed email without sending (Cancel)', async ({ page }) => {
    await gotoTeam(page)
    const dialog = await openInviteDialog(page)
    const email = dialog.locator('input[name="email"]')
    await email.fill('qa-invite-noreply@example.com')
    await expect(email).toHaveValue('qa-invite-noreply@example.com')
    // Cancel — no invite sent.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })
})