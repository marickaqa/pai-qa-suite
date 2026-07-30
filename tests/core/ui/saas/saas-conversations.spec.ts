import { test, expect, type Page } from '@playwright/test'
import { gotoSaasOrgScoped } from '@utils/saasOrg'

/**
 * ## saas-conversations.spec.ts
 *
 * Conversations page at chat-dev.paicloud.ai/dashboard/conversations, tested
 * against the repointed SaaS org (noctocode.dev).
 *
 * Post-redesign gate: the old "All chats" heading is gone. The list is now
 * headed by a status-filter button (aria-label "Filter chats by status,
 * currently <Status>") whose badge carries the conversation count. We anchor
 * every test on that button instead.
 *
 * Nav: converted from raw page.goto to gotoSaasOrgScoped so this file settles
 * org at /dashboard/overview first, matching the rest of the SaaS suite and
 * closing the last raw-hard-nav gap exposed to the org-hydration flake.
 *
 * The conversation list is empty until a support bot is selected, so the
 * list/detail tests open the "marija test" bot first — a disposable dev fixture
 * whose conversations include already-handed-off ones we can inspect read-only.
 *
 * Two hard rules to avoid irreversible state pollution:
 *   - Never click "Enable Handoff" — it is one-way (button vanishes, no undo).
 *   - Never click Send — filling the input proves the channel is live.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const CONVERSATIONS_URL = `${SAAS_URL}/dashboard/conversations`
const TEST_BOT = 'marija test'

// Post-redesign list gate: the status-filter button. Matched on the stable part
// of its aria-label so it survives the current-status word (Active/Archived/…).
const statusFilter = (page: Page) =>
    page.getByRole('button', { name: /filter chats by status/i })

// Conversation rows are buttons carrying a "Chat session" subtitle.
const rows = (page: Page) => page.locator('button').filter({ hasText: 'Chat session' })

// Selecting a bot loads its conversations (and opens the top one).
// Selecting a bot loads its conversations (and opens the top one).
async function openBot(page: Page, name: string) {
    const pill = page.getByRole('button', { name, exact: true })
    await expect(pill).toBeVisible({ timeout: 15000 })
    await pill.click()
    await expect(rows(page).first()).toBeVisible({ timeout: 15000 })
}

test.describe('Core — SaaS Conversations', () => {
    test('should navigate to the conversations page', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
    })

    test('should show a numeric conversation count in the status filter', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        // The count badge lives inside the status-filter button now — scope to it
        // so we don't accidentally match a timestamp digit elsewhere on the page.
        const count = await statusFilter(page).getByText(/^\d+$/).first().textContent()
        expect(Number(count)).toBeGreaterThanOrEqual(0)
    })

    test('should show support-bot filter pills', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('button', { name: 'telaris', exact: true })).toBeVisible()
    })

    test('should select a support bot when its filter pill is clicked', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        const pill = page.getByRole('button', { name: 'telaris', exact: true })
        await pill.click()
        // Selected pills carry the teal accent (text-[#00DCC4]).
        await expect(pill).toHaveClass(/text-\[#00DCC4\]/)
    })

    test('should show conversation rows once a bot is selected', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        expect(await rows(page).count()).toBeGreaterThan(0)
    })

    test('should open the top conversation when a bot is selected', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        // Detail panel populates: session header shows "Started ...".
        await expect(page.getByText(/Started/i).first()).toBeVisible({ timeout: 15000 })
        // WATCH: post-redesign the composer/Send may only render on handed-off
        // conversations. If the top conversation is not handed off, this line is
        // the expected new failure — do not "fix" until confirmed in headed.
        await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
    })

    test('should show the Enable Handoff control on a non-handed-off conversation', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        // Enable Handoff appears only before handoff is enabled, so open a row
        // that is neither handed off nor deleted. NOT clicked (irreversible).
        const fresh = rows(page)
            .filter({ hasNotText: 'Handoff' })
            .filter({ hasNotText: 'Deleted' })
            .first()
        await fresh.click()
        await expect(page.getByRole('button', { name: /enable handoff/i })).toBeVisible({ timeout: 15000 })
    })

    test('should allow replying on an already-handed-off conversation', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        // Find a conversation already in handoff (its "Handoff" badge); exclude
        // deleted ones. We do NOT enable handoff ourselves.
        const handedOff = rows(page)
            .filter({ has: page.getByText('Handoff', { exact: true }) })
            .filter({ hasNotText: 'Deleted' })
            .first()
        await expect(handedOff).toBeVisible({ timeout: 15000 })
        await handedOff.click()

        // The reply composer is active: Send is disabled until text is entered.
        // WATCH: /^Reply\b/i placeholder is unverified post-redesign.
        const reply = page.getByPlaceholder(/^Reply\b/i)
        await expect(reply).toBeVisible({ timeout: 15000 })
        const send = page.getByRole('button', { name: 'Send' })
        await expect(send).toBeDisabled()
        await reply.fill('handoff reply channel check')
        await expect(send).toBeEnabled()
        // Deliberately never click Send — no message is posted.
    })

    test('should show the search input', async ({ page }) => {
        await gotoSaasOrgScoped(page, CONVERSATIONS_URL)
        await expect(statusFilter(page)).toBeVisible({ timeout: 15000 })
        await expect(page.getByPlaceholder(/search chats/i)).toBeVisible()
    })
})