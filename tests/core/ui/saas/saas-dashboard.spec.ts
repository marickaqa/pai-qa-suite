import { test, expect, type Page } from '@playwright/test'
import { gotoSaasOrgScoped } from '@utils/saasOrg'

/**
 * ## saas-dashboard.spec.ts
 *
 * Tests the SaaS overview page at chat-dev.paicloud.ai/dashboard/overview.
 *
 * IMPORTANT — assertions are org-agnostic. The suite session may be pointed at
 * any organization (currently Trump Media for qa-saas), so we never hardcode
 * agent counts or metric values. Instead we assert *internal consistency*:
 * the TOTAL AGENTS number equals the "X Support · Y Chatbot" breakdown, which
 * in turn equals the number of agent rows actually listed. This is exactly the
 * invariant the product owner asked for, expressed independently of the data.
 *
 * Cross-page reconciliation (overview month stats vs the analytics page) lives
 * in the analytics spec, since analytics is the source of truth for those.
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const OVERVIEW = '/dashboard/overview'

const totalAgentsCard = (page: Page) =>
    page.locator('div.rounded-3xl').filter({ hasText: 'TOTAL AGENTS' })
const supportCard = (page: Page) =>
    page.locator('div.rounded-3xl').filter({ hasText: 'Embeddable widgets grounded on your docs.' })
const chatbotCard = (page: Page) =>
    page.locator('div.rounded-3xl').filter({ hasText: 'Open-ended assistants with tools and memory.' })
const orgTrigger = (page: Page) =>
    page.locator('button:has(svg.lucide-chevrons-up-down)')

// Read the total and the Support/Chatbot breakdown off the TOTAL AGENTS card.
async function readAgentCounts(page: Page) {
    const card = totalAgentsCard(page)
    await expect(card).toBeVisible()
    const totalText = (await card.locator('span.tabular-nums').first().textContent())?.trim() ?? ''
    const breakdownText = (await card.getByText(/\d+\s*Support/i).textContent())?.trim() ?? ''
    const m = breakdownText.match(/(\d+)\s*Support.*?(\d+)\s*Chatbot/i)
    expect(m, `could not parse breakdown, got: "${breakdownText}"`).not.toBeNull()
    return {
        total: Number(totalText),
        support: Number(m![1]),
        chatbot: Number(m![2]),
        totalText,
    }
}

test.describe('Core — SaaS Dashboard', () => {
    // --- Unauthenticated ---

    test.describe('unauthenticated', () => {
        test.use({ storageState: { cookies: [], origins: [] } })

        test('should redirect unauthenticated users to login', async ({ page }) => {
  await page.goto(SAAS_URL + OVERVIEW)   // NOT gotoSaasOrgScoped — no session, no picker
  await page.waitForURL(/login/, { timeout: 20000 })
  expect(page.url()).toContain('login')
})
    })

    // --- Authenticated (inherits the project's saved SaaS session) ---

    test.describe('authenticated', () => {
        test('should land on the overview page', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            expect(page.url()).toContain('/dashboard/')
        })

        test('should show the four key metric cards', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            await expect(page.getByText('TOTAL AGENTS')).toBeVisible()
            await expect(page.getByText('MESSAGES THIS MONTH')).toBeVisible()
            await expect(page.getByText('SESSIONS THIS MONTH')).toBeVisible()
            await expect(page.getByText('TOKEN USAGE')).toBeVisible()
        })

        test('should keep TOTAL AGENTS consistent with the Support/Chatbot breakdown', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            const { total, support, chatbot, totalText } = await readAgentCounts(page)
            expect(totalText).toMatch(/^\d+$/)
            expect(support + chatbot).toBe(total)
        })

        test('should list exactly as many agents as the counts claim', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            const { total, support, chatbot } = await readAgentCounts(page)

            const listedSupport = await supportCard(page).locator('a[href^="/agent/"]').count()
            const listedChatbot = await chatbotCard(page).locator('a[href^="/agent/"]').count()

            expect(listedSupport).toBe(support)
            expect(listedChatbot).toBe(chatbot)
            expect(listedSupport + listedChatbot).toBe(total)
        })

        test('should show Support bots and Chatbots sections', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            await expect(page.getByText('Embeddable widgets grounded on your docs.')).toBeVisible()
            await expect(page.getByText('Open-ended assistants with tools and memory.')).toBeVisible()
            // Chatbots ships as Coming soon.
            await expect(chatbotCard(page).getByText('Coming soon')).toBeVisible()
        })

        test('should show the organization picker in the sidebar', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            await expect(orgTrigger(page)).toBeVisible()
            await expect(orgTrigger(page)).toContainText(/noctocode\.dev/i)
        })

        test('should show the primary navigation and coming-soon items', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            // qa-saas is a platform admin, so Admin Panel is visible in the nav.
            for (const item of ['Overview', 'Analytics', 'Support bots', 'Conversations', 'Team', 'Settings', 'Admin Panel']) {
                await expect(page.getByText(item, { exact: true }).first()).toBeVisible()
            }
            // Several nav items plus the Chatbots section render as "Coming soon".
            expect(await page.getByText('Coming soon').count()).toBeGreaterThanOrEqual(4)
        })

        test('should toggle the Support bots nav dropdown when clicked', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            const navBtn = page.locator('button:has(svg.lucide-headphones)').filter({ hasText: 'Support bots' })
            await expect(navBtn).toBeVisible()

            // The dropdown is disabled when the active org has no support bots
            // (true for the qa-saas session's Trump Media org). That inert state
            // is correct behaviour, so we assert it; the open/close toggle can
            // only be exercised when the org actually has bots to list.
            if (await navBtn.isDisabled()) {
                await expect(navBtn).toBeDisabled()
                return
            }
            // No aria-expanded — state lives in a chevron-rotation class inside
            // the button, so we assert the markup toggles on click.
            const before = await navBtn.innerHTML()
            await navBtn.click()
            await expect.poll(() => navBtn.innerHTML()).not.toBe(before)
        })

        test('should show the New button', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            await expect(page.getByRole('button', { name: /new/i }).first()).toBeVisible()
        })

        test('should show the theme toggle button', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            // NOTE: assumes the toggle's aria-label is still "Toggle theme".
            // If this fails, send me the button's DOM.
            await expect(page.getByRole('button', { name: 'Toggle theme' })).toBeVisible()
        })

        test('should toggle the theme and restore it', async ({ page }) => {
            await gotoSaasOrgScoped(page, SAAS_URL + OVERVIEW)
            const html = page.locator('html')
            const before = (await html.getAttribute('class')) ?? ''
            const toggle = page.getByRole('button', { name: 'Toggle theme' })

            await toggle.click()
            await expect(html).not.toHaveClass(before) // condition-based: wait for the change
            await toggle.click()
            await expect(html).toHaveClass(before)     // restore original theme (no pollution)
        })
    })
})