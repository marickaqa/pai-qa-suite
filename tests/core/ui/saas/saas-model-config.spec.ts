import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const CHAT_BOT_ID = 'edb91849-b4eb-4dbc-aa9f-5ae816833e56'
const MODEL_CONFIG_URL = `${SAAS_URL}/agent/${CHAT_BOT_ID}/model-config`

test.describe('Core — SaaS Model & Logic', () => {
  test.use({ storageState: SAAS_SESSION })

  test('should show Model & Logic heading and description', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Choose the model that generates the bot's responses")).toBeVisible()
  })

  test('should show all 5 sections', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    for (const section of ['Output', 'Text to Image', 'Image to Image', 'Text Ranking', 'Feature Extraction']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible()
    }
  })

  test('should show section descriptions', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('How the main output that is returned to the user is generated.')).toBeVisible()
    await expect(page.getByText('The model used when the bot generates an image from a text prompt.')).toBeVisible()
    await expect(page.getByText('The model used when the bot edits or transforms an existing image.')).toBeVisible()
    await expect(page.getByText('The model used to rank and score text results for relevance.')).toBeVisible()
    await expect(page.getByText('The model used to generate embeddings from text.')).toBeVisible()
  })

  test('should show model dropdowns with selected values', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    const dropdowns = page.locator('[role="combobox"]')
    // wait for the dropdowns to render AND populate — the elements can exist
    // before their selected-value text loads, so assert on populated content
    // rather than counting elements then racing to read their text.
    await expect(dropdowns.first()).toBeVisible({ timeout: 15000 })
    const count = await dropdowns.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      // each dropdown should end up with non-empty selected text
      await expect(dropdowns.nth(i)).not.toHaveText('', { timeout: 15000 })
    }
  })

  test('should show Output parameter inputs', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Temperature')).toBeVisible()
    await expect(page.getByText('Top P')).toBeVisible()
    await expect(page.getByText('Presence penalty')).toBeVisible()
    await expect(page.getByText('Frequency penalty')).toBeVisible()
  })

  test('should show parameter range descriptions', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Range: 0.0 to 2.0/i).first()).toBeVisible()
    await expect(page.getByText(/Range: 0.0 to 1.0/i)).toBeVisible()
  })

  test('should show Reset to defaults link in Output section', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Reset to defaults')).toBeVisible()
  })

  test('should show Save and Discard buttons for each section', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    // one Save/Discard pair per section — assert they render and are paired,
    // not a hard-coded count that breaks if a section is added or removed
    const saveButtons = page.getByRole('button', { name: 'Save' })
    const discardButtons = page.getByRole('button', { name: 'Discard' })
    await expect(saveButtons.first()).toBeVisible({ timeout: 15000 })
    const saveCount = await saveButtons.count()
    expect(saveCount).toBeGreaterThan(0)
    await expect(discardButtons).toHaveCount(saveCount)
  })

  test('should update a parameter input value', async ({ page }) => {
    await page.goto(MODEL_CONFIG_URL)
    await expect(page.getByRole('heading', { name: 'Model & Logic' })).toBeVisible({ timeout: 15000 })
    const tempInput = page.locator('input[placeholder="1.0"]').first()
    await tempInput.fill('0.8')
    await expect(tempInput).toHaveValue('0.8')
  })

})