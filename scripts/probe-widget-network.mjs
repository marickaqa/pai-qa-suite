// probe-widget-network.mjs
//
// Captures the REAL public flow the support widget uses, by driving the dummy
// site and logging every non-asset request it fires. The widget works with no
// login, so its calls ARE the public contract we need to mirror.
//
//   node scripts/probe-widget-network.mjs
//
// From the output, find the POST that starts a conversation / sends the
// message, and read off:
//   - the HOST it hits (may differ from API_BASE_URL, esp. post-migration)
//   - the chatbot id it uses (x-chatbot-id header or in the body) - is it
//     77d5b55e, or a DIFFERENT bot than the one we resolved?
//   - whether it sends an Authorization token or is fully public
// Then mirror that exact call in utils/supportBotClient.ts (attemptConversation).

import { chromium } from '@playwright/test'

const WIDGET_URL = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'

// Skip asset noise; keep xhr/fetch/eventsource/websocket/other so we never miss
// the message call whatever transport it uses.
const SKIP = new Set(['document', 'stylesheet', 'image', 'font', 'media', 'script', 'manifest'])

const captured = []
const browser = await chromium.launch()
const page = await browser.newPage()

page.on('request', (req) => {
  if (SKIP.has(req.resourceType())) return
  const h = req.headers()
  captured.push({
    type: req.resourceType(),
    method: req.method(),
    url: req.url(),
    auth: h['authorization'] ? h['authorization'].slice(0, 24) + '...' : undefined,
    xChatbotId: h['x-chatbot-id'],
    referer: h['referer'],
    origin: h['origin'],
    contentType: h['content-type'],
    postData: req.postData(),
  })
})

try {
  await page.goto(WIDGET_URL, { waitUntil: 'domcontentloaded' })
  await page.locator('button.pai-launcher').click({ timeout: 20000 })
  const input = page.locator('textarea.pai-input')
  await input.waitFor({ timeout: 10000 })
  await input.fill('How can I reset my password?')
  const send = page.locator('button.pai-send')
  try { await send.click({ timeout: 5000 }) } catch { await input.press('Enter') }
  await page.waitForTimeout(8000) // let the create + message + stream settle
} catch (e) {
  console.log('interaction error (still dumping what was captured):', e.message)
} finally {
  await browser.close()
}

console.log('Captured non-asset requests from the widget:')
console.log('='.repeat(72))
for (const c of captured) {
  console.log(`\n[${c.type}] ${c.method} ${c.url}`)
  if (c.xChatbotId) console.log('   x-chatbot-id :', c.xChatbotId)
  if (c.auth) console.log('   authorization:', c.auth)
  if (c.origin) console.log('   origin       :', c.origin)
  if (c.referer) console.log('   referer      :', c.referer)
  if (c.contentType) console.log('   content-type :', c.contentType)
  if (c.postData) console.log('   body         :', String(c.postData).slice(0, 600))
}
console.log('\n' + '='.repeat(72))
console.log('FIND the POST that creates the conversation / sends the message, then check:')
console.log(' - host (vs API_BASE_URL) | chatbot id used | auth token vs public')
console.log('Paste that request back and we mirror it in utils/supportBotClient.ts.')
