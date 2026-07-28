import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-conversations.spec.ts
 *
 * Conversations page at chat-dev.paicloud.ai/dashboard/conversations, tested
 * against the repointed SaaS org (noctocode.dev).
 *
 * The conversation list is empty until a support bot is selected, so the
 * list/detail tests open the "marija test" bot first — a disposable dev fixture
 * whose conversations include already-handed-off ones we can inspect read-only.
 *
 * Two hard rules to avoid irreversible state pollution:
 *   - Never click "Enable Handoff" — it is one-way (button vanishes, no undo).
 *   - Never click Send — filling the input proves the channel is live.
 * The handoff reply channel is verified on an ALREADY-handed-off conversation
 * (found by its "Handoff" badge).
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const CONVERSATIONS_URL = `${SAAS_URL}/dashboard/conversations`
const TEST_BOT = 'marija test'

// Conversation rows are buttons carrying a "Chat session" subtitle.
const rows = (page: Page) => page.locator('button').filter({ hasText: 'Chat session' })

// Selecting a bot loads its conversations (and opens the top one).
async function openBot(page: Page, name: string) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(rows(page).first()).toBeVisible({ timeout: 15000 })
}

test.describe('Core — SaaS Conversations', () => {
    test('should navigate to the conversations page', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
    })

    test('should show a numeric conversation count for All chats', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        const count = await page.getByText(/^\d+$/).first().textContent()
        expect(Number(count)).toBeGreaterThanOrEqual(0)
    })

    test('should show support-bot filter pills', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('button', { name: 'telaris', exact: true })).toBeVisible()
    })

    test('should select a support bot when its filter pill is clicked', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        const pill = page.getByRole('button', { name: 'telaris', exact: true })
        await pill.click()
        // Selected pills carry the teal accent (text-[#00DCC4]).
        await expect(pill).toHaveClass(/text-\[#00DCC4\]/)
    })

    test('should show conversation rows once a bot is selected', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        expect(await rows(page).count()).toBeGreaterThan(0)
    })

    test('should open the top conversation when a bot is selected', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        await openBot(page, TEST_BOT)
        // Detail panel populates: session header shows "Started ..." and the
        // composer's Send button is present.
        await expect(page.getByText(/Started/i).first()).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
    })

    test('should show the Enable Handoff control on a non-handed-off conversation', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
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
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
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
        const reply = page.getByPlaceholder(/^Reply\b/i)
        await expect(reply).toBeVisible({ timeout: 15000 })
        const send = page.getByRole('button', { name: 'Send' })
        await expect(send).toBeDisabled()
        await reply.fill('handoff reply channel check')
        await expect(send).toBeEnabled()
        // Deliberately never click Send — no message is posted.
    })

    test('should show the search input', async ({ page }) => {
        await page.goto(CONVERSATIONS_URL, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText('All chats')).toBeVisible({ timeout: 15000 })
        await expect(page.getByPlaceholder(/search chats/i)).toBeVisible()
    })
})