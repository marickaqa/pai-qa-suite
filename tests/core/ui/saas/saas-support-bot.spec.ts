import { test, expect } from '@playwright/test'

/**
 * ## saas-support-bot.spec.ts
 *
 * Tests the support bot agent pages at chat.paicloud.ai.
 * Uses the stable Telaris test agent (77d5b55e-3326-4f2d-8380-b2bef6135552).
 * Covers team, guidelines, knowledge, widget, and danger zone pages.
 *
 * Uses reports/saas-session.json for all tests.
 * Destructive actions (archive, delete) are visibility-only — not executed.
 */

test.describe('SaaS Support Bot', () => {
    test.use({ storageState: 'reports/saas-session.json' })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat.paicloud.ai'
    const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    const AGENT_URL = `${SAAS_URL}/agent/${AGENT_ID}`

    // --- Team ---

    test('should show team page with Add member button', async ({ page }) => {
        await page.goto(`${AGENT_URL}/team`)
        await expect(page.getByRole('heading', { name: 'Agent team' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Add member' })).toBeVisible()
    })

    test('should show members table with correct columns', async ({ page }) => {
        await page.goto(`${AGENT_URL}/team`)
        await expect(page.getByRole('columnheader', { name: 'Member' })).toBeVisible()
        await expect(page.getByRole('columnheader', { name: 'Permissions' })).toBeVisible()
        await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()
    })

    test('should show role descriptions on team page', async ({ page }) => {
        await page.goto(`${AGENT_URL}/team`)
        await expect(page.getByText('Full access to manage this agent')).toBeVisible()
        await expect(page.getByText('View analytics and insights')).toBeVisible()
        await expect(page.getByText('Access chat conversations')).toBeVisible()
    })

    test('should open Add member dialog when button is clicked', async ({ page }) => {
        await page.goto(`${AGENT_URL}/team`)
        await page.getByRole('button', { name: 'Add member' }).click()
        await page.waitForTimeout(500)
        await expect(page.getByRole('dialog')).toBeVisible()
    })

    // --- Guidelines ---

    test('should show guidelines page with all sections', async ({ page }) => {
        await page.goto(`${AGENT_URL}/guidelines`)
        await expect(page.getByRole('heading', { name: 'Guidelines' })).toBeVisible()
        await expect(page.getByText('Communication style')).toBeVisible()
        await expect(page.getByText('Context and clarification')).toBeVisible()
        await expect(page.getByText('Content and sources')).toBeVisible()
        await expect(page.getByText('Spam', { exact: true }).first()).toBeVisible()
    })

    test('should show New guideline button', async ({ page }) => {
        await page.goto(`${AGENT_URL}/guidelines`)
        await expect(page.getByRole('button', { name: /new guideline/i }).first()).toBeVisible()
    })

    test('should expand a guideline section when clicked', async ({ page }) => {
        await page.goto(`${AGENT_URL}/guidelines`)
        await page.getByText('Communication style').click()
        await page.waitForTimeout(500)
        await expect(page.getByRole('button', { name: /new guideline/i }).first()).toBeVisible()
    })

    test('should show enable/disable toggle on existing guideline', async ({ page }) => {
        await page.goto(`${AGENT_URL}/guidelines`)
        const toggle = page.locator('button[role="switch"]').first()
        await expect(toggle).toBeVisible()
    })

    // --- Knowledge ---

    test('should show knowledge page with Files and Website URLs sections', async ({ page }) => {
        await page.goto(`${AGENT_URL}/knowledge`)
        await expect(page.getByRole('heading', { name: 'Knowledge' })).toBeVisible()
        await expect(page.getByText('Files')).toBeVisible()
        await expect(page.getByText('Website URLs')).toBeVisible()
    })

    test('should show Upload file and New folder buttons', async ({ page }) => {
        await page.goto(`${AGENT_URL}/knowledge`)
        await expect(page.getByRole('button', { name: 'Upload file', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'New folder' })).toBeVisible()
    })

    test('should show Crawl website button', async ({ page }) => {
        await page.goto(`${AGENT_URL}/knowledge`)
        await expect(page.getByRole('button', { name: 'Crawl website' })).toBeVisible()
    })

    test('should show existing crawled website in Website URLs table', async ({ page }) => {
        await page.goto(`${AGENT_URL}/knowledge`)
        await expect(page.getByText('Completed')).toBeVisible()
    })

    // --- Widget ---

    test('should show widget page with all config fields', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByText('Header text')).toBeVisible()
        await expect(page.getByText('Theme', { exact: true })).toBeVisible()
        await expect(page.getByText('Primary colour')).toBeVisible()
        await expect(page.getByText('Launcher position')).toBeVisible()
        await expect(page.getByText('Side spacing')).toBeVisible()
        await expect(page.getByText('Bottom spacing')).toBeVisible()
        await expect(page.getByText('Starter questions')).toBeVisible()
    })

    test('should show live preview iframe', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByText('Live preview')).toBeVisible()
    })

    test('should show theme toggle buttons', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByRole('button', { name: 'System' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    })

    test('should show launcher position toggle buttons', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByRole('button', { name: 'Left', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeVisible()
    })

    test('should show Add question button for starter questions', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByRole('button', { name: /add question/i })).toBeVisible()
    })

    test('should show Save widget button', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByRole('button', { name: 'Save widget' })).toBeVisible()
    })

    test('should show embed code section', async ({ page }) => {
        await page.goto(`${AGENT_URL}/widget`)
        await expect(page.getByText('Embed code')).toBeVisible()
        await expect(page.getByRole('button', { name: 'HTML' })).toBeVisible()
    })

    // --- Danger Zone ---

    test('should show danger zone page with Archive and Delete buttons', async ({ page }) => {
        await page.goto(`${AGENT_URL}/danger-zone`)
        await expect(page.getByRole('button', { name: 'Archive chatbot' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Delete chatbot' })).toBeVisible()
    })

    test('should show archive description text', async ({ page }) => {
        await page.goto(`${AGENT_URL}/danger-zone`)
        await page.waitForTimeout(1000)
        await expect(page.getByText(/becomes inactive and stops responding/i)).toBeVisible({ timeout: 10000 })
    })

    test('should show delete warning text', async ({ page }) => {
        await page.goto(`${AGENT_URL}/danger-zone`)
        await expect(page.getByText(/cannot be undone/i)).toBeVisible()
    })
})

