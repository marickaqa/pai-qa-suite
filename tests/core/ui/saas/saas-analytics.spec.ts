import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-analytics.spec.ts
 *
 * Tests the SaaS org analytics page at chat-dev.paicloud.ai/dashboard/analytics.
 *
 * The numeric checks are value-agnostic by design — they never hardcode a
 * figure, so they don't break when the underlying numbers move. They assert
 * relationships that only fail if two independently-computed views disagree:
 *   - token total == input + output   (exact integer math, single page)
 *   - overview month stats == analytics org-overview stats   (cross-page,
 *     parsed with tolerance to absorb abbreviation + live drift)
 */

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const ANALYTICS_URL = `${SAAS_URL}/dashboard/analytics`
const OVERVIEW_URL = `${SAAS_URL}/dashboard/overview`

// Parse "12.9k" / "22.8M" / "3,500" / "970" into a number.
function parseAbbrev(raw: string): number {
    const s = raw.trim().replace(/,/g, '')
    const m = s.match(/^([\d.]+)\s*([kKmMbB]?)$/)
    if (!m) return Number(s)
    const n = Number(m[1])
    const unit = m[2].toLowerCase()
    const mult = unit === 'k' ? 1e3 : unit === 'm' ? 1e6 : unit === 'b' ? 1e9 : 1
    return n * mult
}

// Overview metric card value, located via its label (e.g. "MESSAGES THIS MONTH").
async function readOverviewMetric(page: Page, label: string): Promise<string> {
    const card = page.locator('div.rounded-3xl').filter({ hasText: label })
    const value = card.locator('span').filter({ hasText: /^[\d.,]+\s*[kKmMbB]?$/ }).first()
    return ((await value.textContent()) ?? '').trim()
}

// Analytics org-overview row value, located via its label (e.g. "Messages").
async function readOrgRow(page: Page, label: string): Promise<string> {
    const row = page.locator('div.flex.items-center.gap-3')
        .filter({ has: page.getByText(label, { exact: true }) })
        .first()
    return ((await row.locator('span.font-semibold').first().textContent()) ?? '').trim()
}

test.describe('Core — SaaS Organization Analytics', () => {
    test('should navigate to analytics and show the org overview', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Organization overview')).toBeVisible({ timeout: 30000 })
        await expect(page.getByText(/Activity across all agents/i)).toBeVisible()
    })

    test('should show Messages, Sessions and Tokens used metrics', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Organization overview')).toBeVisible({ timeout: 30000 })
        await expect(page.getByText('Messages', { exact: true }).first()).toBeVisible()
        await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible()
        await expect(page.getByText('Tokens used', { exact: true })).toBeVisible()
    })

    test('should show percentage-change indicators next to metrics', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Organization overview')).toBeVisible({ timeout: 30000 })
        expect(await page.getByText(/[+-]\d+(\.\d+)?%/).count()).toBeGreaterThan(0)
    })

    test('should show the token-usage card with input/output breakdown', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        const card = page.locator('div.bg-gradient-to-br').filter({ hasText: 'Token usage' }).first()
        await expect(card).toBeVisible({ timeout: 30000 })
        await expect(card.getByText('Input', { exact: true })).toBeVisible()
        await expect(card.getByText('Output', { exact: true })).toBeVisible()
    })

    test('token usage total equals input plus output', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        const card = page.locator('div.bg-gradient-to-br').filter({ hasText: 'Token usage' }).first()
        await expect(card).toBeVisible({ timeout: 30000 })
        // The card holds exactly three comma-formatted integers, in DOM order:
        // total, then input, then output.
        const nums = card.locator('span').filter({ hasText: /^[\d,]+$/ })
        await expect(nums).toHaveCount(3)
        const [totalT, inputT, outputT] = await nums.allTextContents()
        const total = Number(totalT.replace(/,/g, ''))
        const input = Number(inputT.replace(/,/g, ''))
        const output = Number(outputT.replace(/,/g, ''))
        expect(input + output).toBe(total)
    })

    test('overview month stats reconcile with the analytics page', async ({ page }) => {
        await page.goto(OVERVIEW_URL)
        const ov = {
            messages: await readOverviewMetric(page, 'MESSAGES THIS MONTH'),
            sessions: await readOverviewMetric(page, 'SESSIONS THIS MONTH'),
            tokens: await readOverviewMetric(page, 'TOKEN USAGE'),
        }

        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Organization overview')).toBeVisible({ timeout: 30000 })
        const an = {
            messages: await readOrgRow(page, 'Messages'),
            sessions: await readOrgRow(page, 'Sessions'),
            tokens: await readOrgRow(page, 'Tokens used'),
        }

        for (const key of ['messages', 'sessions', 'tokens'] as const) {
            const a = parseAbbrev(ov[key])
            const b = parseAbbrev(an[key])
            const drift = Math.abs(a - b) / Math.max(a, b, 1)
            expect(drift, `${key}: overview="${ov[key]}" analytics="${an[key]}"`).toBeLessThan(0.02)
        }
    })

    test('should show the Activity over time chart with metric and period toggles', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Activity over time')).toBeVisible({ timeout: 30000 })
        for (const label of ['All', 'Messages', 'Sessions', 'Tokens']) {
            await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
        }
        for (const label of ['Weekly', 'Monthly', 'Yearly', 'All time']) {
            await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
        }
    })

    test('metric toggles are clickable and update the selection', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Activity over time')).toBeVisible({ timeout: 30000 })
        const group = page.locator('div.overflow-x-auto')
            .filter({ has: page.getByRole('button', { name: 'Messages', exact: true }) })
        for (const name of ['Messages', 'Sessions', 'Tokens', 'All']) {
            const btn = group.getByRole('button', { name, exact: true })
            await btn.click()
            await expect(btn).toHaveClass(/shadow-sm/) // active state
        }
    })

    test('period toggles are clickable and update the selection', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Activity over time')).toBeVisible({ timeout: 30000 })
        const group = page.locator('div.overflow-x-auto')
            .filter({ has: page.getByRole('button', { name: 'Weekly', exact: true }) })
        for (const name of ['Monthly', 'Yearly', 'All time', 'Weekly']) {
            const btn = group.getByRole('button', { name, exact: true })
            await btn.click()
            await expect(btn).toHaveClass(/shadow-sm/) // active state
        }
    })

    test('should show the chart legend for Messages, Sessions and Tokens', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByText('Activity over time')).toBeVisible({ timeout: 30000 })
        await expect(page.getByText('Messages', { exact: true }).first()).toBeVisible()
        await expect(page.getByText('Sessions', { exact: true }).first()).toBeVisible()
        await expect(page.getByText(/Tokens \(k\)/i)).toBeVisible()
    })

    // --- Guardrail triggers table ---
    // NOTE: this section was below the fold in the screenshots, so it's not
    // re-verified against the redesign. Copy is matched rename-tolerantly
    // (chatbots|agents). If these fail, send me the current DOM.

    test('should show the Guardrail triggers table with correct headers', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByRole('heading', { name: 'Guardrail triggers' })).toBeVisible({ timeout: 30000 })
        await expect(page.getByText(/Messages blocked by safety rules across all (chatbots|agents)/i)).toBeVisible()
        await expect(page.getByText('Category', { exact: true })).toBeVisible()
        await expect(page.getByText('Count', { exact: true })).toBeVisible()
        await expect(page.getByText('Last triggered', { exact: true })).toBeVisible()
    })

    test('should show a Review action for guardrail trigger rows when present', async ({ page }) => {
        await page.goto(ANALYTICS_URL)
        await expect(page.getByRole('heading', { name: 'Guardrail triggers' })).toBeVisible({ timeout: 30000 })
        const reviewBtns = page.getByRole('button', { name: 'Review' })
        if (await reviewBtns.count() > 0) {
            await expect(reviewBtns.first()).toBeVisible()
        }
    })
})