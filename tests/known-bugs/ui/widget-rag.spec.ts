import { test, expect } from '@playwright/test'
import { KNOWN_BUGS } from '../../../config/known-bugs'

const WIDGET_URL = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'

async function openWidget(page: any) {
  await page.goto(WIDGET_URL)
  await page.waitForTimeout(2000)
  await page.locator('button.egle-launcher').click()
  await page.waitForTimeout(1000)
}

async function askAndGetResponse(page: any, question: string): Promise<string> {
  const input = page.locator('textarea.egle-input')
  await input.fill(question)
  await input.press('Enter')
  await page.waitForTimeout(8000)

  // Target only the bot response bubbles, not the whole page
  const bubbles = page.locator('.egle-bubble')
  const count = await bubbles.count()
  if (count > 0) {
    return await bubbles.last().innerText()
  }

  return ''
}

// These tests fail until BUG-003 is fixed
// When they pass, RAG is working correctly
// See config/known-bugs.ts — KNOWN_BUGS.RAG_NOT_RETRIEVING_CONTENT

test.describe(`Known Bug ${KNOWN_BUGS.RAG_NOT_RETRIEVING_CONTENT.id} — RAG Knowledge Accuracy`, () => {

  test('should return correct Starter plan price (€19/month)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'How much does the Starter plan cost?')
    expect(response).toContain('19')
  })

  test('should confirm there is no data cap on any plan', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Is there a data cap on any plan?')
    expect(response.toLowerCase()).toContain('no data cap')
  })

  test('should return correct installation time (24-48 hours)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'How long does installation take?')
    expect(response).toMatch(/24|48/)
  })

  test('should return Telaris phone number (080 8000)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'What is the Telaris phone number?')
    expect(response).toContain('080 8000')
  })

  test('should return Telaris location (Ljubljana)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Where is Telaris located?')
    expect(response.toLowerCase()).toContain('ljubljana')
  })

  test('should confirm 30-day money back guarantee', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Is there a money back guarantee?')
    expect(response).toContain('30')
  })

})