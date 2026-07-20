import fs from 'fs'
import path from 'path'
import axios, { AxiosResponse } from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const TOKEN_CACHE = path.resolve(__dirname, '../reports/api-token.json')

function readCache(): { chatToken: string; saasToken: string } | null {
  try {
    if (fs.existsSync(TOKEN_CACHE)) {
      return JSON.parse(fs.readFileSync(TOKEN_CACHE, 'utf-8'))
    }
  } catch { /* fall through */ }
  return null
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * POST a sign-in request, backing off and retrying when the server's sign-in
 * rate limit is hit. The limit is ~10 sign-ins/min; when exceeded the backend
 * currently returns 500 with a Retry-After header (should be 429 — see
 * BUG-026). This helper respects Retry-After (or a default) and retries so
 * legitimate sign-ins don't fail CI just because the limiter tripped.
 */
export async function signInWithRetry(
  urlPath: string,
  body: Record<string, unknown>,
  maxRetries = 3
): Promise<AxiosResponse> {
  let lastError: any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await axios.post(`${BASE_URL}${urlPath}`, body, { validateStatus: () => true })

    // success or a genuine client error (e.g. 400/401) — return as-is
    const isRateLimited =
      res.status === 429 ||
      (res.status >= 500 && res.headers['retry-after'] != null)

    if (!isRateLimited) return res

    lastError = res
    if (attempt < maxRetries) {
      const retryAfter = Number(res.headers['retry-after']) || 30
      // cap the wait so a stuck limiter can't hang CI forever
      const waitMs = Math.min(retryAfter, 60) * 1000
      console.warn(`[signInWithRetry] rate limited (${res.status}); waiting ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`)
      await sleep(waitMs)
    }
  }
  return lastError
}

export async function getChatToken(): Promise<string> {
  const cache = readCache()
  if (cache?.chatToken) return cache.chatToken
  const response = await signInWithRetry('/auth/signin', {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  return response.data.token
}

export async function getSaasApiToken(): Promise<string> {
  const cache = readCache()
  if (cache?.saasToken) return cache.saasToken
  const response = await signInWithRetry('/auth-saas/signin', {
    email: process.env.SAAS_EMAIL,
    password: process.env.SAAS_PASSWORD,
  })
  return response.data.token
}

/**
 * Fresh sign-in that bypasses the cache — for tests that need a token they can
 * safely invalidate (e.g. sign-out tests) without disturbing the shared token.
 * Still retries on rate limiting.
 */
export async function getFreshChatToken(): Promise<string> {
  const response = await signInWithRetry('/auth/signin', {
    email: process.env.API_EMAIL,
    password: process.env.API_PASSWORD,
  })
  return response.data.token
}