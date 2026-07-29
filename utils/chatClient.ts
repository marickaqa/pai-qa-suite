import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://chat-api-dev.paicloud.ai'

let cachedToken: string | null = null

async function getToken(forceRefresh = false): Promise<string> {
  if (cachedToken && !forceRefresh) return cachedToken

  const response = await axios.post(`${BASE_URL}/auth/signin`, {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })

  cachedToken = response.data.token
  return cachedToken as string
}

function parseStreamResponse(data: string): string {
  const lines = data.split('\n')
  let message = ''

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = line.replace('data: ', '').trim()
      if (!json || json === '[DONE]') continue
      try {
        const parsed = JSON.parse(json)
        if (parsed.content) message += parsed.content
      } catch {
        // skip malformed chunks
      }
    }
  }

  return message
}

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

// One conversation-create + message-send attempt. Throws on any error status
// so the caller (sendPrompt) can decide how to react (retry on 429/5xx).
async function attemptPrompt(prompt: string, token: string) {
  const conv = await axios.post(
    `${BASE_URL}/chat`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const chatId = conv.data.id

  const response = await axios.post(
    `${BASE_URL}/message/${chatId}`,
    { message: prompt },
    { headers: { Authorization: `Bearer ${token}` } }
  )

  return {
    status: response.status,
    message: parseStreamResponse(response.data),
  }
}

/**
 * This suite hit whack-a-mole 429s across several files (schema, guardrails,
 * chat, ...) that all call sendPrompt — the shared /chat + /message endpoints
 * were getting rate-limited under normal test-suite load, but the ONLY retry
 * logic that existed was for >=500 errors. A 429 fell straight through as a
 * hard failure with no backoff at all. Patching each affected test file was
 * whack-a-mole (a new file kept failing every time a different one got
 * fixed) — the real fix belongs here, once, so every consumer benefits.
 *
 * On a 429, we respect a Retry-After header if the API sends one, otherwise
 * back off with increasing delays, and retry a bounded number of times
 * before giving up and returning the 429 to the caller (so a persistent rate
 * limit still surfaces as a real, informative failure rather than being
 * silently absorbed forever).
 */
const MAX_429_RETRIES = 3
const BASE_BACKOFF_MS = 2000

export async function sendPrompt(prompt: string): Promise<{
  status: number
  message: string
  responseTime: number
}> {
  const start = Date.now()

  try {
    const token = await getToken()
    await sleep(500) // small breathing room before the first attempt

    let lastStatus = 0
    for (let attempt = 0; attempt <= MAX_429_RETRIES; attempt++) {
      try {
        const result = await attemptPrompt(prompt, token)
        return { ...result, responseTime: Date.now() - start }
      } catch (error: any) {
        const status = error.response?.status
        lastStatus = status || 0

        if (status === 429 && attempt < MAX_429_RETRIES) {
          const retryAfterHeader = error.response?.headers?.['retry-after']
          const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null
          const backoff = retryAfterMs && !Number.isNaN(retryAfterMs)
            ? retryAfterMs
            : BASE_BACKOFF_MS * (attempt + 1)
          await sleep(backoff)
          continue // retry
        }

        // Not a 429, or we've exhausted retries — fall through to the
        // existing 500-retry-with-fresh-token path (or a final failure).
        if (status >= 500) {
          try {
            const freshToken = await getToken(true)
            await sleep(500)
            const retryResult = await attemptPrompt(prompt, freshToken)
            return { ...retryResult, responseTime: Date.now() - start }
          } catch (retryError: any) {
            return {
              status: retryError.response?.status || 500,
              message: '',
              responseTime: Date.now() - start,
            }
          }
        }

        return {
          status: status || 0,
          message: '',
          responseTime: Date.now() - start,
        }
      }
    }

    // Exhausted all 429 retries without success.
    return { status: lastStatus, message: '', responseTime: Date.now() - start }
  } catch (error: any) {
    return {
      status: error.response?.status || 0,
      message: '',
      responseTime: Date.now() - start,
    }
  }
}
