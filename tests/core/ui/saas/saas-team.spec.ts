import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-team.spec.ts
 *
 * Per-agent Team page on the Telaris support bot. Replaces the thin team block
 * that lived in saas-support-bot (columns + a few role descriptions); this
 * covers the full 7-permission model and the Add-member dialog.
 *
 * Team actions are DESTRUCTIVE to real access: adding, removing, and changing
 * roles all mutate who can reach marija test. So every test is read-only —
 * the Add-member dialog is opened and its structure asserted, then CANCELLED;
 * no member is added, removed, or re-roled. The member-search filter is
 * client-side, so exercising it mutates nothing.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
const TEAM_URL = `${SAAS_URL}/agent/${AGENT_ID}/team`

const PERMISSIONS = ['Admin', 'Analytics', 'Chats', 'Members', 'Guidance', 'Knowledge', 'Style']

async function gotoTeam(page: Page) {
  await page.goto(TEAM_URL)
  await expect(
    page.getByRole('heading', { name: 'Agent team' }),
    'team page did not render'
  ).toBeVisible({ timeout: 45000 })
}

async function openAddMemberDialog(page: Page) {
  await page.getByRole('button', { name: 'Add member' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10000 })
  return dialog
}

test.describe('Core — SaaS Team', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show the Agent team heading and member count', async ({ page }) => {
    await gotoTeam(page)
    await expect(page.getByText(/\d+ members?/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add member' }).first()).toBeVisible()
  })

  test('should show the 7-permission legend', async ({ page }) => {
    await gotoTeam(page)
    for (const perm of PERMISSIONS) {
      await expect(page.getByText(perm, { exact: true }).first()).toBeVisible()
    }
    // a couple of the descriptions, to confirm it's the legend not just badges
    await expect(page.getByText('Full access to manage this agent')).toBeVisible()
    await expect(page.getByText('Access and manage knowledge base')).toBeVisible()
  })

  test('should show the members table with correct columns', async ({ page }) => {
    await gotoTeam(page)
    // Headers display uppercase but are likely CSS text-transform, so the DOM
    // text is "Member"/"Permissions"/"Joined" — match case-insensitively.
    await expect(page.getByText(/^member$/i).first()).toBeVisible()
    await expect(page.getByText(/^permissions$/i).first()).toBeVisible()
    await expect(page.getByText(/^joined$/i).first()).toBeVisible()
  })

  test('should show Change role and Remove actions on member rows', async ({ page }) => {
    await gotoTeam(page)
    // Present for other members (not the current user's own row). Read-only.
    await expect(page.getByRole('button', { name: 'Change role' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeVisible()
  })

  test('should open the Add member dialog with all 7 permission checkboxes', async ({ page }) => {
    await gotoTeam(page)
    const dialog = await openAddMemberDialog(page)
    for (const perm of PERMISSIONS) {
      await expect(dialog.getByRole('checkbox', { name: perm })).toBeVisible()
    }
    // Submit is disabled until a member is selected.
    await expect(dialog.getByRole('button', { name: 'Add member' })).toBeDisabled()
    // Never submit — Cancel closes without mutating access.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('should filter the member list as the search is typed (read-only)', async ({ page }) => {
    await gotoTeam(page)
    const dialog = await openAddMemberDialog(page)
    const search = dialog.getByPlaceholder(/search by name or email/i)
    await expect(search).toBeVisible()

    // Member options are buttons in the results list; count before filtering.
    const options = dialog.locator('button').filter({ hasText: '@' })
    const before = await options.count()

    // A query unlikely to match everyone should narrow (or empty) the list.
    await search.fill('zzz-no-such-member-xyz')
    await expect(options).toHaveCount(0, { timeout: 10000 })

    // Clearing restores results, proving it's live filtering, not a one-way prune.
    await search.fill('')
    await expect(options.first()).toBeVisible({ timeout: 10000 })
    expect(await options.count()).toBeGreaterThanOrEqual(Math.min(before, 1))

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).not.toBeVisible()
  })
})