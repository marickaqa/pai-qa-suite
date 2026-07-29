import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * Shared axios instance with built-in 429 retry/backoff.
 *
 * Root cause this fixes: CI runs long enough now (after today's other fixes)
 * that the dev API's rate limits get hit on ordinary suite traffic — not
 * just on the chatbot /chat + /message endpoints (already fixed in
 * utils/chatClient.ts) but on plain CRUD reads too, e.g. GET /prompt-templates
 * (tests/core/api/saas/guidelines.spec.ts) and POST /chat via chat-groups.
 *
 * Rather than patch each spec file that happens to fail next (we already did
 * that once and it was whack-a-mole — a different file failed every time one
 * got fixed), this is a drop-in axios replacement: swap
 *   import axios from 'axios'
 * for
 *   import { apiClient as axios } from '<path>/utils/apiClient'
 * and every existing axios.get/post/patch/delete call in that file gets 429
 * retry with backoff automatically, no other code changes required.
 *
 * On a 429, this respects a Retry-After header if the API sends one,
 * otherwise backs off with increasing delays, retrying a bounded number of
 * times before giving up and rejecting with the real error — so a genuinely
 * persistent rate limit still surfaces as a real failure, it just isn't
 * mistaken for one after a single transient hit.
 */

const MAX_429_RETRIES = 3
const BASE_BACKOFF_MS = 2000

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const apiClient: AxiosInstance = axios.create()

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    if (!config) return Promise.reject(error)

    const status = error.response?.status
    config.__retryCount = config.__retryCount ?? 0

    if (status === 429 && config.__retryCount < MAX_429_RETRIES) {
      config.__retryCount += 1

      const retryAfterHeader = error.response?.headers?.['retry-after']
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null
      const backoff = retryAfterMs && !Number.isNaN(retryAfterMs)
        ? retryAfterMs
        : BASE_BACKOFF_MS * config.__retryCount

      await sleep(backoff)
      return apiClient.request(config)
    }

    return Promise.reject(error)
  }
)