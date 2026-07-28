import { test, expect, type Page } from '@playwright/test'

/**
 * ## widget-rag.spec.ts
 *
 * Tests RAG knowledge-base accuracy on the embedded support widget (dummy
 * company site, Telaris knowledge base).
 *
 * IMPORTANT: "Starter plan" is NOT a real, unambiguous plan name in this KB —
 * asking about it produced different answers across runs (sometimes "Orange
 * Start" at €29.99, sometimes a general package list). Questions here must
 * name a REAL, SPECIFIC plan so the bot can't reasonably interpret it two
 * ways; that's what makes the assertion meaningful rather than a coin flip.
 *
 * Shares the shadow-DOM-safe, echo-vs-reply-safe openWidget/sendPrompt
 * approach from widget.spec.ts (no waitForTimeout sleeps — condition-based
 * waits throughout).
 */

const WIDGET_URL = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'

async function openWidget(page: Page) {
  await page.goto(WIDGET_URL)
  const launcher = page.locator('button.pai-launcher')
  await expect(launcher).toBeVisible({ timeout: 20000 })
  await launcher.click()
  await expect(page.locator('textarea.pai-input')).toBeVisible({ timeout: 10000 })
}

// Send a prompt and return the settled assistant reply text. Mirrors
// widget.spec.ts's sendPrompt: waits for the user's echo bubble first, THEN a
// further bubble beyond it (the real reply), so it can't mistake the echo for
// the answer, and fails fast on a persistently empty reply instead of a vague
// 45s timeout.
async function askAndGetResponse(page: Page, question: string): Promise<string> {
  const input = page.locator('textarea.pai-input')
  const sendBtn = page.locator('button.pai-send')
  const bubbles = page.locator('.pai-bubble')

  await expect(input).toBeEditable({ timeout: 45000 })
  const countBefore = await bubbles.count()

  await input.fill(question)
  try {
    await expect(sendBtn).toBeEnabled({ timeout: 5000 })
    await sendBtn.click()
  } catch {
    await input.press('Enter')
  }

  await expect
    .poll(async () => (await bubbles.count()) > countBefore, {
      timeout: 20000,
      intervals: [300],
      message: 'user message echo did not appear',
    })
    .toBe(true)
  const countAfterEcho = await bubbles.count()

  await expect
    .poll(async () => (await bubbles.count()) > countAfterEcho, {
      timeout: 45000,
      intervals: [500],
      message: 'assistant reply did not appear',
    })
    .toBe(true)

  const reply = bubbles.last()
  let previous = ''
  let emptyStreak = 0
  await expect
    .poll(async () => {
      const current = (await reply.innerText().catch(() => '')).trim()
      if (current === '') {
        emptyStreak++
        if (emptyStreak >= 10) {
          throw new Error(`Assistant returned an EMPTY reply to "${question}".`)
        }
        previous = current
        return false
      }
      emptyStreak = 0
      const stable = current === previous
      previous = current
      return stable
    }, { timeout: 45000, intervals: [1000], message: 'assistant reply did not settle' })
    .toBe(true)

  return (await reply.innerText()).trim()
}

test.describe(`Core — Widget RAG Knowledge Accuracy`, () => {

  test('should return correct T2 TV + TEL package price (€18.99/month)', async ({ page }) => {
    await openWidget(page)
    // Named a real, specific plan (not the ambiguous "Starter plan" — that
    // term isn't a canonical KB entry and resolved differently across runs).
    const response = await askAndGetResponse(page, 'How much does the T2 TV + TEL package cost per month?')
    expect(response).toMatch(/18[.,]99/)
  })

  // FIXME: the KB confirms Telaris DOES have data caps on several plans
  // (e.g. Data Maxi throttles after 1TB; roaming caps as low as 3GB before
  // cutoff) — the opposite of this test's original "no data cap" premise.
  // Parked pending the correct assertion; ping Marija for the exact policy
  // wording to assert against instead of guessing at a rewrite.
  test.fixme('should confirm there is no data cap on any plan', async ({ page }) => {
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
    expect(response.toLowerCase()).toMatch(/guarantee|refund|money|cancell/)
  })

})