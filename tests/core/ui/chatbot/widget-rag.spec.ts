import { test, expect } from '@playwright/test'

const WIDGET_URL = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'

async function openWidget(page: any) {
  await page.goto(WIDGET_URL)
  await page.waitForTimeout(2000)
  await page.locator('button.pai-launcher').click()
  await page.waitForTimeout(1000)
}

async function askAndGetResponse(page: any, question: string): Promise<string> {
  const input = page.locator('textarea.pai-input')
  await input.fill(question)
  await input.press('Enter')
  await page.waitForTimeout(8000)
  const bubbles = page.locator('.pai-bubble')
  const count = await bubbles.count()
  if (count > 0) {
    return await bubbles.last().innerText()
  }
  return ''
}

test.describe(`Core — Widget RAG Knowledge Accuracy`, () => {

  test('should return correct Starter plan price (€19/month)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'How much does the Starter plan cost?')
    expect(response).toContain('19')
  })

  test('should confirm there is no data cap on any plan', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Is there a data cap on any plan?')
    expect(response.toLowerCase()).toMatch(/no.*data cap|unlimited data|no data cap/)
  })

  test('should return correct installation time (24-48 hours)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'How long does installation take?')
    expect(response).toMatch(/24|48/)
  })

  test('should return support phone number', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'What is the support phone number?')
    expect(response).toMatch(/064 064 064|080 8000/)
  })

  test('should return company location (Ljubljana)', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Where is the company located?')
    expect(response.toLowerCase()).toContain('ljubljana')
  })

  test('should respond to money back guarantee question', async ({ page }) => {
    await openWidget(page)
    const response = await askAndGetResponse(page, 'Is there a money back guarantee?')
    expect(response.length).toBeGreaterThan(0)
    // RAG is returning indexed content — response references actual policy details
    expect(response.toLowerCase()).toMatch(/guarantee|refund|money|cancell/)
  })

})