import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-support-bot.spec.ts
 *
 * Tests the support bot agent pages on the SaaS platform.
 * Uses the stable Telaris test agent (77d5b55e-3326-4f2d-8380-b2bef6135552).
 * Covers team, guidelines, knowledge, widget, and danger zone pages.
 *
 * Uses reports/saas-session.json for all tests.
 * Destructive actions (archive, delete) are visibility-only — not executed.
 *
 * NOTE: no waitForTimeout / networkidle in this file. Each test navigates
 * via gotoAgentPage(), which waits for a page-specific anchor element to
 * render before any assertion runs. This absorbs slow dev loads without
 * fixed sleeps and turns a genuine hang into a clear "page did not render"
 * failure. Keep it that way.
 */

test.describe('SaaS Support Bot', () => {
    test.use({ storageState: 'reports/saas-session.json' })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
    const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    const AGENT_URL = `${SAAS_URL}/agent/${AGENT_ID}`

    // Navigate to an agent sub-page and wait for its anchor element to render.
    // The anchor is something that only appears once the page's content has
    // actually painted, so assertions never fire against a half-loaded page.
    async function gotoAgentPage(page: Page, subPath: string, anchor: () => Promise<void>) {
        await page.goto(`${AGENT_URL}/${subPath}`)
        await anchor()
    }

    const READY = 45000 // generous allowance for slow dev loads

    // --- Team ---

    test('should show team page with Add member button', async ({ page }) => {
        await gotoAgentPage(page, 'team', async () => {
            await expect(page.getByRole('heading', { name: 'Agent team' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'Add member' })).toBeVisible()
    })

    test('should show members table with correct columns', async ({ page }) => {
        await gotoAgentPage(page, 'team', async () => {
            await expect(page.getByRole('columnheader', { name: 'Member' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('columnheader', { name: 'Permissions' })).toBeVisible()
        await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()
    })

    test('should show role descriptions on team page', async ({ page }) => {
        await gotoAgentPage(page, 'team', async () => {
            await expect(page.getByText('Full access to manage this agent')).toBeVisible({ timeout: READY })
        })
        await expect(page.getByText('View analytics and insights')).toBeVisible()
        await expect(page.getByText('Access chat conversations')).toBeVisible()
    })

    test('should open Add member dialog when button is clicked', async ({ page }) => {
        await gotoAgentPage(page, 'team', async () => {
            await expect(page.getByRole('button', { name: 'Add member' })).toBeVisible({ timeout: READY })
        })
        await page.getByRole('button', { name: 'Add member' }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
    })

    // --- Guidelines ---

    test('should show guidelines page with all sections', async ({ page }) => {
        await gotoAgentPage(page, 'guidelines', async () => {
            await expect(page.getByRole('heading', { name: 'Guidelines' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByText('Communication style')).toBeVisible()
        await expect(page.getByText('Context and clarification')).toBeVisible()
        await expect(page.getByText('Content and sources')).toBeVisible()
        await expect(page.getByText('Spam', { exact: true }).first()).toBeVisible()
    })

    test('should show New guideline button', async ({ page }) => {
        await gotoAgentPage(page, 'guidelines', async () => {
            await expect(page.getByRole('button', { name: /new guideline/i }).first()).toBeVisible({ timeout: READY })
        })
    })

    test('should expand a guideline section when clicked', async ({ page }) => {
        await gotoAgentPage(page, 'guidelines', async () => {
            await expect(page.getByText('Communication style')).toBeVisible({ timeout: READY })
        })
        await page.getByText('Communication style').click()
        await expect(page.getByRole('button', { name: /new guideline/i }).first()).toBeVisible()
    })

    test('should show enable/disable toggle on existing guideline', async ({ page }) => {
        await gotoAgentPage(page, 'guidelines', async () => {
            await expect(page.locator('button[role="switch"]').first()).toBeVisible({ timeout: READY })
        })
    })

    // --- Knowledge ---

    test('should show knowledge page with Files and Website URLs sections', async ({ page }) => {
        await gotoAgentPage(page, 'knowledge', async () => {
            await expect(page.getByRole('heading', { name: 'Knowledge' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByText('Files')).toBeVisible()
        await expect(page.getByText('Website URLs')).toBeVisible()
    })

    test('should show Upload file and New folder buttons', async ({ page }) => {
        await gotoAgentPage(page, 'knowledge', async () => {
            await expect(page.getByRole('button', { name: 'Upload file', exact: true })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'New folder' })).toBeVisible()
    })

    test('should show Crawl website button', async ({ page }) => {
        await gotoAgentPage(page, 'knowledge', async () => {
            await expect(page.getByRole('button', { name: 'Upload file', exact: true })).toBeVisible({ timeout: READY })
        })
        const crawlBtn = page.getByRole('button', { name: 'Crawl website' })
        await crawlBtn.scrollIntoViewIfNeeded()
        await expect(crawlBtn).toBeVisible({ timeout: 10000 })
    })

    test('should show Website URLs section on knowledge page', async ({ page }) => {
        await gotoAgentPage(page, 'knowledge', async () => {
            await expect(page.getByRole('heading', { name: 'Knowledge' })).toBeVisible({ timeout: READY })
        })
        // Assert the section renders — NOT that a specific crawl exists.
        // Crawl rows are ephemeral data this test doesn't create, so asserting
        // on "Completed" made the test depend on pre-existing state (it broke
        // when the agent had no crawls). Check the stable UI instead: the
        // section header and its Crawl website action are always present.
        await expect(page.getByText('Website URLs')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Crawl website' })).toBeVisible()
    })

    // --- Widget ---

    test('should show widget page with all config fields', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByText('Header text')).toBeVisible({ timeout: READY })
        })
        await expect(page.getByText('Theme', { exact: true })).toBeVisible()
        await expect(page.getByText('Primary colour')).toBeVisible()
        await expect(page.getByText('Launcher position')).toBeVisible()
        await expect(page.getByText('Side spacing')).toBeVisible()
        await expect(page.getByText('Bottom spacing')).toBeVisible()
        await expect(page.getByText('Starter questions')).toBeVisible()
    })

    test('should show branding section with widget logo upload slots', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByRole('heading', { name: 'Branding' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByText('Widget logos')).toBeVisible()
        await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
        await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
    })

    test('should show live preview iframe', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByText('Live preview')).toBeVisible({ timeout: READY })
        })
    })

    test('should show theme toggle buttons', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByRole('button', { name: 'System' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    })

    test('should show launcher position toggle buttons', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByRole('button', { name: 'Left', exact: true })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeVisible()
    })

    test('should show Add question button for starter questions', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByRole('button', { name: /add question/i })).toBeVisible({ timeout: READY })
        })
    })

    test('should show Save widget button', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByRole('button', { name: 'Save widget' })).toBeVisible({ timeout: READY })
        })
    })

    test('should show embed code section', async ({ page }) => {
        await gotoAgentPage(page, 'widget', async () => {
            await expect(page.getByText('Embed code')).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'HTML' })).toBeVisible()
    })

    // --- Danger Zone ---

    test('should show danger zone page with Archive and Delete buttons', async ({ page }) => {
        await gotoAgentPage(page, 'danger-zone', async () => {
            await expect(page.getByRole('button', { name: 'Archive chatbot' })).toBeVisible({ timeout: READY })
        })
        await expect(page.getByRole('button', { name: 'Delete chatbot' })).toBeVisible()
    })

    test('should show archive description text', async ({ page }) => {
        await gotoAgentPage(page, 'danger-zone', async () => {
            await expect(page.getByText(/becomes inactive and stops responding/i)).toBeVisible({ timeout: READY })
        })
    })

    test('should show delete warning text', async ({ page }) => {
        await gotoAgentPage(page, 'danger-zone', async () => {
            await expect(page.getByText(/cannot be undone/i)).toBeVisible({ timeout: READY })
        })
    })
})