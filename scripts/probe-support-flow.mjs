// probe-support-flow.mjs  (cookie-aware)
//
// Create works (POST /support -> 201) but POST /support/{id} 401s from Node,
// while the widget's identical call succeeds in the browser. The difference is
// almost certainly the SESSION COOKIE the browser carries between calls. This
// probe walks the widget's sequence, captures Set-Cookie, dumps the full create
// body + headers (in case a token is in there instead), and re-sends the cookie
// (+ Bearer if a token field exists) on the message call.
//
//   node scripts/probe-support-flow.mjs

import fs from 'node:fs'
import path from 'node:path'

function loadEnv() {
  const p = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(p)) return
  for (const raw of fs.readFileSync(p, 'utf-8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv()

const HOST = (process.env.SUPPORT_API_URL || 'https://pc-be-dev.noctocode.dev').replace(/\/$/, '')
const BOT_ID = process.env.SUPPORTBOT_ID || '77d5b55e-3326-4f2d-8380-b2bef6135552'
const DUMMY = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'
const ORIGIN = new URL(DUMMY).origin

// --- tiny cookie jar ---
const jar = new Map()
function absorb(res) {
  let cookies = []
  if (typeof res.headers.getSetCookie === 'function') cookies = res.headers.getSetCookie()
  else { const sc = res.headers.get('set-cookie'); if (sc) cookies = [sc] }
  for (const c of cookies) {
    const pair = c.split(';')[0]
    const eq = pair.indexOf('=')
    if (eq > -1) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }
  return cookies
}
function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

let bearer = null
function headers(extra = {}) {
  const h = { 'x-chatbot-id': BOT_ID, 'Content-Type': 'application/json', 'Referer': DUMMY, 'Origin': ORIGIN, ...extra }
  const ck = cookieHeader()
  if (ck) h['Cookie'] = ck
  if (bearer) h['Authorization'] = `Bearer ${bearer}`
  return h
}

function extractReply(raw) {
  let sse = ''
  for (const line of String(raw).split('\n')) {
    if (!line.startsWith('data: ')) continue
    const p = line.slice(6).trim()
    if (!p || p === '[DONE]') continue
    try { const o = JSON.parse(p); if (o.content) sse += o.content } catch { /* skip */ }
  }
  if (sse) return sse
  try { const o = JSON.parse(raw); return o.content ?? o.message ?? o.reply ?? o.text ?? o.answer ?? JSON.stringify(o) } catch { return raw }
}

console.log('HOST  :', HOST)
console.log('BOT_ID:', BOT_ID)
console.log('='.repeat(72))

// 0) GET /  (widget did this first; may set a cookie) ---------------------
console.log('\n0) GET /   (warm-up, collect cookies)')
try {
  const res = await fetch(`${HOST}/`, { headers: headers() })
  const sc = absorb(res)
  console.log('   status    :', res.status)
  console.log('   set-cookie :', sc.length ? sc.map(c => c.split(';')[0]) : 'none')
} catch (e) { console.log('   ERROR:', e.message) }

// 1) POST /support  (create) ----------------------------------------------
console.log('\n1) POST /support   (create conversation)')
let convId = null
try {
  const res = await fetch(`${HOST}/support`, { method: 'POST', headers: headers(), body: '{}' })
  const sc = absorb(res)
  const raw = await res.text()
  console.log('   status    :', res.status)
  console.log('   set-cookie :', sc.length ? sc.map(c => c.split(';')[0]) : 'none')
  console.log('   FULL body :', raw)
  try {
    const o = JSON.parse(raw)
    convId = o.id ?? o.conversationId ?? o.chatId
    bearer = o.token ?? o.sessionToken ?? o.accessToken ?? null
    if (bearer) console.log('   >>> found a token field in the body -> will send as Bearer')
  } catch { /* leave convId null */ }
  console.log('   convId    :', convId)
  console.log('   cookies now:', cookieHeader() || 'none')
} catch (e) { console.log('   ERROR:', e.message) }

if (!convId) { console.log('\nNo conversation id - stop.'); process.exit(0) }

// 2) GET /support/{id}  (widget did this before messaging) ----------------
console.log('\n2) GET /support/' + convId + '   (load state; collect cookies)')
try {
  const res = await fetch(`${HOST}/support/${convId}`, { headers: headers() })
  absorb(res)
  console.log('   status:', res.status)
} catch (e) { console.log('   ERROR:', e.message) }

// 3) Messages -------------------------------------------------------------
async function say(msg) {
  const res = await fetch(`${HOST}/support/${convId}`, { method: 'POST', headers: headers(), body: JSON.stringify({ message: msg }) })
  absorb(res)
  const raw = await res.text()
  return { status: res.status, reply: extractReply(raw), raw }
}

console.log('\n3) IN-DOMAIN   "How can I reset my password?"')
const a = await say('How can I reset my password?')
console.log('   status:', a.status)
console.log('   reply :', a.reply.slice(0, 800))

console.log('\n4) OFF-DOMAIN  "Tell me a joke about a chicken."')
const b = await say('Tell me a joke about a chicken.')
console.log('   status:', b.status)
console.log('   reply :', b.reply.slice(0, 800))

console.log('\n' + '='.repeat(72))
if (a.status === 401 || b.status === 401) {
  console.log('STILL 401: the cookie/token from create is not what authorizes messaging.')
  console.log('Re-run the widget network probe and this time note the RESPONSE headers on the')
  console.log('create call, and whether any request carries an Authorization or a cookie we')
  console.log('missed. This is now a "how does the public widget authorize messaging" question')
  console.log('for Kristof.')
} else {
  console.log('AUTHORIZED. Note whether it used a COOKIE or a TOKEN (see logs above) so the')
  console.log('client can replicate it. Then read the two replies:')
  console.log(' - off-domain refused => copy the refusal into REFUSAL_INDICATORS, run the suite.')
  console.log(' - off-domain answered => this bot has no domain lock (see earlier note).')
}
