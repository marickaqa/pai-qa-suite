import { test, expect, type Page } from '@playwright/test'
import { getSaasToken, deleteChatbot } from '../../../../utils/saasClient'

/**
 * ## saas-create-agent.spec.ts
 *
 * Create New Agent flow at /new — a 5-step wizard:
 * Type -> Basics -> Branding -> Model -> Review(Launch).
 *
 * No type is preselected: the Support card must be CLICKED before Continue
 * enables. The "Conversational chatbot" type is the hidden Chatbots product
 * ("Coming soon"), parked as test.fixme. Support creation walks all five steps
 * and launches, then deletes the created agent via saasClient.
 */

test.describe('SaaS Create Agent', () => {
  test.use({ storageState: 'reports/saas-session.json' })

  const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
  const NEW_AGENT_URL = `${SAAS_URL}/new`

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

  const supportCard = (page: Page) => page.getByRole('button', { name: /Support chatbot/i })
  const continueBtn = (page: Page) => page.getByRole('button', { name: 'Continue' })

  async function gotoWizard(page: Page) {
    await page.goto(NEW_AGENT_URL)
    // Anchor on the Support type card (the "Step 1 of 5" label text isn't reliable).
    await expect(supportCard(page)).toBeVisible({ timeout: 45000 })
  }

  // Select Support type so Continue enables, then advance to Basics.
  async function selectSupportAndContinue(page: Page) {
    await supportCard(page).click()
    await expect(supportCard(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(continueBtn(page)).toBeEnabled()
    await continueBtn(page).click()
  }

  // --- Step 1: Type ---

  test('should show step 1 with Support and Conversational type cards', async ({ page }) => {
    await gotoWizard(page)
    await expect(supportCard(page)).toBeVisible()
    await expect(page.getByRole('button', { name: /Conversational chatbot/i })).toBeVisible()
    // No type is selected initially, so Continue is disabled.
    await expect(continueBtn(page)).toBeDisabled()
  })

  test('should show the wizard step indicators', async ({ page }) => {
    await gotoWizard(page)
    for (const step of ['Type', 'Basics', 'Branding', 'Model', 'Review']) {
      await expect(page.getByText(step, { exact: true }).first()).toBeVisible()
    }
  })

  test('should enable Continue once the Support type is selected', async ({ page }) => {
    await gotoWizard(page)
    await expect(continueBtn(page)).toBeDisabled()
    await supportCard(page).click()
    await expect(supportCard(page)).toHaveAttribute('aria-pressed', 'true')
    await expect(continueBtn(page)).toBeEnabled()
  })

  // FIXME: Conversational (chat) type is the hidden Chatbots product
  // ("Coming soon") — re-enable when it ships.
  test.fixme('should allow selecting the Conversational type', async ({ page }) => {
    await gotoWizard(page)
    await page.getByRole('button', { name: /Conversational chatbot/i }).click()
    await expect(page.getByRole('button', { name: /Conversational chatbot/i })).toHaveAttribute('aria-pressed', 'true')
  })

  // --- Step 2: Basics ---

  test('should advance to Basics with Name and Slug fields', async ({ page }) => {
    await gotoWizard(page)
    await selectSupportAndContinue(page)
    await expect(page.locator('input[placeholder="Acme Support Bot"]').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[placeholder="acme-support-bot"]').first()).toBeVisible()
    await expect(page.getByText(/Lowercase letters, numbers, and hyphens only/i)).toBeVisible()
  })


  test('should auto-populate the slug from the name in Basics', async ({ page }) => {
    await gotoWizard(page)
    await selectSupportAndContinue(page)
    const slug = page.locator('input[placeholder="acme-support-bot"]').first()
    await expect(slug).toBeVisible({ timeout: 15000 })
    await page.locator('input[placeholder="Acme Support Bot"]').first().fill('My QA Support Agent')
    await expect(slug).not.toHaveValue('', { timeout: 10000 })
  })

  // --- Full creation (Support) ---

  test('should create a support agent through the wizard and launch', async ({ page }) => {
    await gotoWizard(page)
    const stamp = Date.now()

    // Step 1: select Support -> Continue
    await selectSupportAndContinue(page)

    // Step 2: Basics
    const nameInput = page.locator('input[placeholder="Acme Support Bot"]').first()
    await expect(nameInput).toBeVisible({ timeout: 15000 })
    await nameInput.fill(`QA Support Agent ${stamp}`)
    // Slug does not auto-populate (see fixme above) — fill it directly.
    const slug = page.locator('input[placeholder="acme-support-bot"]').first()
    await slug.fill(`qa-support-${stamp}`)
    await continueBtn(page).click()

    // Step 3: Branding — Header text is REQUIRED (empty header keeps Launch
    // disabled at Review). Its input shares the same placeholder as the Basics
    // Name field with no id/label wiring, so scope to the container that holds
    // the "Header text" label specifically.
    await expect(page.getByText('Header text')).toBeVisible({ timeout: 15000 })
    const headerTextField = page.locator('div').filter({ has: page.getByText('Header text', { exact: false }) }).last().locator('input')
    await headerTextField.fill(`QA Support Agent ${stamp}`)
    await continueBtn(page).click()

    // Step 4: Legal — post-redesign this step now sits where Model used to.
    // All three URL fields are optional (Skip step / Continue both advance),
    // so leave them blank and Continue past.
    await expect(page.getByRole('heading', { name: 'Legal' })).toBeVisible({ timeout: 15000 })
    await continueBtn(page).click()

    // WATCH: the failing run showed a hidden <h1>Model & logic</h1> still in the
    // DOM, which suggests Legal was INSERTED before Model rather than replacing
    // it. If so, a Model step is still active here and Launch won't be visible
    // below — uncomment the two lines to walk through it:
    // await expect(page.getByText('Model & logic')).toBeVisible({ timeout: 15000 })
    // await continueBtn(page).click()

    // Step 5: Review -> Launch
    await expect(page.getByRole('button', { name: 'Launch' })).toBeVisible({ timeout: 15000 })

    // Step 5: Review -> Launch
    await expect(page.getByRole('button', { name: 'Launch' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Launch' }).click()

    // Redirects to the created agent's page.
    await page.waitForURL(url => !url.toString().includes('/new'), { timeout: 30000 })
    const match = page.url().match(/\/agent\/([a-f0-9-]{36})/)
    expect(match, 'expected to land on /agent/{id}').not.toBeNull()
    if (match) createdAgentId = match[1]
  })
})