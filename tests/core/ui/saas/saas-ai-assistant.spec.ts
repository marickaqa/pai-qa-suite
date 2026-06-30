import { test, expect } from '@playwright/test'

/**
 * ## saas-ai-assistant.spec.ts
 *
 * Tests the AI assistant agent pages at chat.paicloud.ai.
 * Uses the stable AI assistant test agent (edb91849-b4eb-4dbc-aa9f-5ae816833e56).
 * Covers team, guidelines, style config, and danger zone pages.
 *
 * Uses reports/saas-session.json for all tests.
 * Destructive actions (archive, delete) are visibility-only — not executed.
 */

test.describe('SaaS AI Assistant', () => {
  test.use({ storageState: 'reports/saas-session.json' })

  const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
  const AGENT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
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
    await page.waitForTimeout(1000)
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

  test('should show enable/disable toggle on existing guideline', async ({ page }) => {
    await page.goto(`${AGENT_URL}/guidelines`)
    await page.waitForTimeout(1000)
    const toggle = page.locator('button[role="switch"]').first()
    await expect(toggle).toBeVisible({ timeout: 10000 })
  })

  // --- Style Config ---

  test('should show style config page', async ({ page }) => {
    await page.goto(`${AGENT_URL}/style-config`)
    await expect(page.getByRole('heading', { name: 'Style Config' })).toBeVisible()
  })

  test('should show all 6 logo upload slots', async ({ page }) => {
    await page.goto(`${AGENT_URL}/style-config`)
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Vertical light')).toBeVisible()
    await expect(page.getByText('Vertical dark')).toBeVisible()
    await expect(page.getByText('Icon light')).toBeVisible()
    await expect(page.getByText('Icon dark')).toBeVisible()
  })

  test('should show at least 6 Upload buttons', async ({ page }) => {
    await page.goto(`${AGENT_URL}/style-config`)
    const uploadButtons = page.getByRole('button', { name: 'Upload' })
    await expect(uploadButtons).toHaveCount(6)
  })

  test('should show Save changes button', async ({ page }) => {
    await page.goto(`${AGENT_URL}/style-config`)
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
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
    await page.waitForTimeout(1000)
    await expect(page.getByText(/cannot be undone/i)).toBeVisible()
  })
})
