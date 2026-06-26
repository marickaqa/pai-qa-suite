import { test, expect } from '@playwright/test'
import { getSaasToken, deleteChatbot } from '../../../../utils/saasClient'

/**
 * ## saas-create-agent.spec.ts
 *
 * Tests the Create New Agent flow at chat.paicloud.ai/agent/new.
 * Covers form visibility, type toggle defaults, validation, and successful creation.
 *
 * Uses reports/saas-session.json for authenticated tests.
 * Created agents are deleted after each creation test to avoid env clutter.
 */

test.describe('SaaS Create Agent', () => {
  test.use({ storageState: 'reports/saas-session.json' })

  const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'

  let createdAgentId: string | null = null

  test.afterEach(async () => {
    if (createdAgentId) {
      try {
        const token = await getSaasToken()
        await deleteChatbot(token, createdAgentId)
      } catch (e) {
        console.warn(`[cleanup] Failed to delete agent ${createdAgentId}:`, e)
      } finally {
        createdAgentId = null
      }
    }
  })

  // --- Form visibility ---

 test('should show create agent form with all fields', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new`)
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="slug"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Support', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create agent' })).toBeVisible()
  })

  test('should default to Chat type when opened via ?type=chat', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=chat`)
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Support', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  test('should default to Support type when opened via ?type=support', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=support`)
    await expect(page.getByRole('button', { name: 'Support', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  test('should toggle from Chat to Support when Support is clicked', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=chat`)
    await page.getByRole('button', { name: 'Support', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Support', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  test('should toggle from Support to Chat when Chat is clicked', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=support`)
    await page.getByRole('button', { name: 'Chat', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Support', exact: true })).toHaveAttribute('aria-pressed', 'false')
  })

  // --- Validation ---

  test('should not submit with empty name', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new`)
    await page.locator('input[name="slug"]').fill('test-agent')
    await page.getByRole('button', { name: 'Create agent' }).click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/agent\/new/)
  })

  test('should not submit with empty slug', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new`)
    await page.locator('input[name="name"]').fill('Test Agent')
    await page.locator('input[name="slug"]').clear()
    await page.getByRole('button', { name: 'Create agent' }).click()
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/agent\/new/)
  })

  test('should auto-populate slug from name', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new`)
    await page.locator('input[name="name"]').fill('My Test Agent')
    await page.waitForTimeout(500)
    const slugValue = await page.locator('input[name="slug"]').inputValue()
    expect(slugValue.length).toBeGreaterThan(0)
  })

  // --- Creation ---

  test('should create a chat agent and redirect to agent page', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=chat`)
    const timestamp = Date.now()
    await page.locator('input[name="name"]').fill(`QA Chat Agent ${timestamp}`)
    await page.waitForTimeout(500)
    await page.locator('input[name="slug"]').fill(`qa-chat-${timestamp}`)
    await page.getByRole('button', { name: 'Create agent' }).click()
    await page.waitForURL(url => !url.toString().includes('agent/new'), { timeout: 20000 })
    expect(page.url()).not.toContain('agent/new')

    const match = page.url().match(/\/agent\/([a-f0-9-]{36})/)
    if (match) createdAgentId = match[1]
  })

  test('should create a support agent and redirect to agent page', async ({ page }) => {
    await page.goto(`${SAAS_URL}/agent/new?type=support`)
    const timestamp = Date.now()
    await page.locator('input[name="name"]').fill(`QA Support Agent ${timestamp}`)
    await page.waitForTimeout(500)
    await page.locator('input[name="slug"]').fill(`qa-support-${timestamp}`)
    await page.getByRole('button', { name: 'Create agent' }).click()
    await page.waitForURL(url => !url.toString().includes('agent/new'), { timeout: 20000 })
    expect(page.url()).not.toContain('agent/new')

    const match = page.url().match(/\/agent\/([a-f0-9-]{36})/)
    if (match) createdAgentId = match[1]
  })
})
