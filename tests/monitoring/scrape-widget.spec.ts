import { test, expect, type Page, type Locator, type FrameLocator } from '@playwright/test'

/**
 * scrape-widget.spec.ts  —  ONE site, end to end (monitoring tier / non-blocking)
 *
 * This does exactly the manual flow you do by hand, but automated:
 *   1. open a support bot you already created
 *   2. Knowledge tab  -> Crawl website -> paste URL -> Start crawling -> wait
 *   3. Widget tab      -> ask the live-preview widget a question -> check the answer
 *
 * ── HOW TO RUN ────────────────────────────────────────────────────────────
 *   Save this file into your repo (e.g. tests/monitoring/scrape-widget.spec.ts),
 *   fill in the 4 values below, then run it HEADED so you can WATCH each step:
 *
 *     npx playwright test tests/monitoring/scrape-widget.spec.ts --headed
 *
 * ── WHAT TO EXPECT ON THE FIRST RUN ──────────────────────────────────────
 *   There are 3 spots I had to guess because I couldn't see them in your specs
 *   (they're marked "⚠ GUESS" below). It may stop at one of them. If it does,
 *   the error message will tell you what to Inspect and paste me — then I fix
 *   that one line. Same paste-the-error loop as always.
 */

// ─────────────────────────────────────────────────────────────────────────
// EDIT THESE 4 VALUES, then run. Nothing else needs changing.
// ─────────────────────────────────────────────────────────────────────────

// 1. Make ONE support bot by hand, open it, and copy the URL from your address
//    bar. Any tab of that bot works — we click the sidebar from there.
const BOT_URL: string = ''  // e.g. 'https://chat-dev.paicloud.ai/support-bots/<id>/widget'

// 2. The site to scrape for THIS run. Start with the CSR / HP case.
const CRAWL_URL: string = 'https://support.hp.com/'

// 3. A specific token that ONLY appears if scraping actually worked — a part
//    number, a price, a phone number. NOT something the model already knows.
//    This is the fact we ask the widget about.
const FACT: string = ''

// 4. A fact that belongs to a DIFFERENT site's bot. This must NOT show up in
//    this bot's answers — the cross-tenant leakage probe (BUG-003 history).
const FOREIGN_FACT: string = ''


// ─────────────────────────────────────────────────────────────────────────

// The Widget/Knowledge pages are behind SaaS login. Reuse the saved session
// that global setup creates — same as every other SaaS UI spec.
test.use({ storageState: 'reports/saas-session.json' })

test('scrape + live-preview widget: single site', async ({ page }) => {
  test.setTimeout(6 * 60_000) // crawling a real site is slow — give it room

  if (!BOT_URL || !FACT || !FOREIGN_FACT) {
    throw new Error('Fill in BOT_URL, FACT and FOREIGN_FACT at the top of the file first.')
  }

  // ── Step 1: open the bot ─────────────────────────────────────────────────
  await page.goto(BOT_URL)
  await page.waitForLoadState('networkidle') // SaaS pages hydrate slowly

  // ── Step 2: Knowledge -> crawl the site ──────────────────────────────────
  await clickSidebar(page, 'Knowledge')
  await page.waitForLoadState('networkidle')

  // Reveal the crawl form (this button you confirmed exists).
  await page.getByRole('button', { name: 'Crawl website' }).click()

  // ⚠ GUESS #1: the crawl URL input. I don't know its placeholder, so I match a
  // few likely ones. If this throws, Inspect the URL box and send me its HTML.
  const urlInput = page.getByPlaceholder(/https?:|url|website|link|domain/i).first()
  if (await urlInput.count() === 0) {
    throw new Error('Could not find the crawl URL input. Right-click it, Inspect, and paste me the element.')
  }
  await urlInput.fill(CRAWL_URL)
  await page.getByRole('button', { name: 'Start crawling' }).click()

  // ⚠ GUESS #2: how we know the crawl FINISHED. My assumption: once crawled, the
  // page shows up in the knowledge list, so I wait for the crawl domain to
  // appear. WATCH this step on the headed run. If the real "done" signal is
  // different (a spinner stopping, a "completed" badge, a page count), tell me
  // exactly what you see and I'll fix just this block.
  const crawlHost = new URL(CRAWL_URL).hostname.replace(/^www\./, '')
  await expect(page.getByText(crawlHost, { exact: false }).first())
    .toBeVisible({ timeout: 4 * 60_000 })
  await page.waitForTimeout(3000) // small settle after it appears

  // ── Step 3: Widget -> ask the live-preview widget ────────────────────────
  await clickSidebar(page, 'Widget')
  await page.waitForLoadState('networkidle')

  // The live preview is a srcdoc iframe (title="Live widget preview"). The widget
  // inside is alwaysOpen, so there's NO launcher to click. Everything below runs
  // INSIDE that frame. The widget renders in a shadow DOM, so we use .locator()
  // (which pierces shadow roots) — never evaluate/querySelectorAll.
  const frame = page.frameLocator('iframe[title="Live widget preview"]')
  const input = frame.locator('textarea.pai-input') // placeholder "Write a message..."
  await expect(input).toBeVisible({ timeout: 20_000 }) // wait out PaiWidget.init()

  // Positive: the scraped fact must surface in the answer.
  const answer = await askWidget(frame, input, page, `Tell me about ${FACT}`)
  console.log('\n[POSITIVE] asked about:', FACT, '\nanswer:\n', answer, '\n')
  expect(answer.toLowerCase()).toContain(FACT.toLowerCase())

  // Negative: a fact from a different bot must NOT surface (cross-tenant probe).
  const foreign = await askWidget(frame, input, page, `Tell me about ${FOREIGN_FACT}`)
  console.log('\n[NEGATIVE] asked about:', FOREIGN_FACT, '\nanswer:\n', foreign, '\n')
  expect(foreign.toLowerCase()).not.toContain(FOREIGN_FACT.toLowerCase())
})

/**
 * ⚠ GUESS #3 lives here: whether the sidebar items are links, buttons, or plain
 * text. This tries all three, so it should "just work". If none match, it throws
 * a message telling you what to paste.
 */
async function clickSidebar(page: Page, name: string) {
  const candidates = [
    page.getByRole('link', { name, exact: true }),
    page.getByRole('button', { name, exact: true }),
    page.getByText(name, { exact: true }),
  ]
  for (const loc of candidates) {
    if (await loc.count() > 0) {
      await loc.first().click()
      return
    }
  }
  throw new Error(`Sidebar item "${name}" not found. Right-click it in the app, Inspect, and paste me the element.`)
}

/**
 * Sends one message into the widget and returns the settled reply text.
 * User echo and assistant reply are both .pai-bubble in a .pai-message-stack —
 * structurally identical — so we go by ORDER: count bubbles before, send, wait
 * for two new ones (echo + reply), read the last, then wait for it to stop
 * changing (the reply streams in). This mirrors your widget.spec.ts helper.
 */
async function askWidget(frame: FrameLocator, input: Locator, page: Page, question: string): Promise<string> {
  const bubbles = frame.locator('.pai-bubble')
  const before = await bubbles.count()

  await input.fill(question)
  await input.press('Enter')

  // wait for user echo + assistant reply to both appear
  await expect.poll(() => bubbles.count(), { timeout: 60_000 }).toBeGreaterThan(before + 1)

  // wait for the last bubble's text to settle (streaming)
  const last = bubbles.last()
  let prev = ''
  let cur = ''
  for (let i = 0; i < 40; i++) {          // ~20s cap; never settling is itself a finding, won't hang forever
    await page.waitForTimeout(500)
    cur = (await last.textContent() ?? '').trim()
    if (cur && cur === prev) break
    prev = cur
  }
  return cur
}
