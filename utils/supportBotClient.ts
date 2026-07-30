import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Public support-widget backend. Confirmed by capturing the dummy widget's
// network calls: it still uses the PRE-migration host. Override via
// SUPPORT_API_URL if/when /support moves to chat-api-dev.paicloud.ai.
//
// prodGuard note: pc-be-dev.noctocode.dev is NOT in ALLOWED_DEV_HOSTNAMES and
// SUPPORT_API_URL is NOT in URL_ENV_VARS, so the production interlock does not
// cover this target. It is a dev host, so it is safe today; if the suite settles
// on it, add the hostname to ALLOWED_DEV_HOSTNAMES and SUPPORT_API_URL to
// URL_ENV_VARS in utils/prodGuard.ts so the guard stays meaningful.
const BASE_URL = (process.env.SUPPORT_API_URL || 'https://pc-be-dev.noctocode.dev').replace(/\/$/, '')

const SUPPORTBOT_ID = process.env.SUPPORTBOT_ID || '77d5b55e-3326-4f2d-8380-b2bef6135552'

// The widget resolves the bot by x-chatbot-id and identifies as the dummy site
// via Referer/Origin. We mirror those headers so the backend treats our calls
// like the widget's.
const DUMMY_SITE = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'
const BASE_HEADERS: Record<string, string> = {
  'x-chatbot-id': SUPPORTBOT_ID,
  'Content-Type': 'application/json',
  Referer: DUMMY_SITE,
  Origin: new URL(DUMMY_SITE).origin,
}

// Reply may arrive as an SSE stream (data: {"content":"..."}) or as a plain
// JSON object - handle both.
function extractReply(data: any): string {
  if (typeof data === 'string') {
    let sse = ''
    for (const line of data.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const json = line.replace('data: ', '').trim()
      if (!json || json === '[DONE]') continue
      try { const o = JSON.parse(json); if (o.content) sse += o.content } catch { /* skip */ }
    }
    if (sse) return sse
    try {
      const o = JSON.parse(data)
      return o.content ?? o.message ?? o.reply ?? o.text ?? o.answer ?? data
    } catch { return data }
  }
  if (data && typeof data === 'object') {
    return data.content ?? data.message ?? data.reply ?? data.text ?? data.answer ?? JSON.stringify(data)
  }
  return String(data ?? '')
}

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

// The public support flow, captured from the widget:
//   POST /support {}                -> 201 { id, accessToken }
//   POST /support/{id} { message }  -> reply (authorized by accessToken)
// The create call returns a per-conversation accessToken (also set as a
// chat_token cookie). We send it as BOTH Bearer and Cookie on the message
// call, exactly as the browser+client combination does, so authorization holds.
async function attemptConversation(turns: string[]) {
  const conv = await axios.post(`${BASE_URL}/support`, {}, {
    headers: BASE_HEADERS,
    responseType: 'text',
    transformResponse: (d) => d,
  })

  let convId: string | undefined
  let accessToken: string | undefined
  try {
    const o = JSON.parse(conv.data)
    convId = o.id ?? o.conversationId ?? o.chatId
    accessToken = o.accessToken ?? o.token ?? o.sessionToken
  } catch { /* leave undefined */ }
  if (!convId) throw new Error('POST /support returned no conversation id')

  const authHeaders: Record<string, string> = { ...BASE_HEADERS }
  if (accessToken) {
    authHeaders.Authorization = `Bearer ${accessToken}`
    authHeaders.Cookie = `chat_token=${accessToken}`
  }

  let last = { status: 0, message: '' }
  for (const turn of turns) {
    const res = await axios.post(`${BASE_URL}/support/${convId}`, { message: turn }, {
      headers: authHeaders,
      responseType: 'text',
      transformResponse: (d) => d,
    })
    last = { status: res.status, message: extractReply(res.data) }
    await sleep(300) // spacing between turns of the same conversation
  }
  return last
}

// 429/5xx retry-with-backoff, same spirit as utils/chatClient.ts.
const MAX_RETRIES = 3
const BASE_BACKOFF_MS = 2000

export async function sendToSupportBot(turns: string[]): Promise<{
  status: number
  message: string
  responseTime: number
}> {
  const start = Date.now()
  await sleep(500)

  let lastStatus = 0
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptConversation(turns)
      return { ...result, responseTime: Date.now() - start }
    } catch (error: any) {
      const status = error.response?.status ?? 0
      lastStatus = status
      if ((status === 429 || status >= 500) && attempt < MAX_RETRIES) {
        const retryAfter = Number(error.response?.headers?.['retry-after'])
        const backoff = !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : BASE_BACKOFF_MS * (attempt + 1)
        await sleep(backoff)
        continue
      }
      return { status, message: '', responseTime: Date.now() - start }
    }
  }
  return { status: lastStatus, message: '', responseTime: Date.now() - start }
}

export async function askSupportBot(prompt: string) {
  return sendToSupportBot([prompt])
}
