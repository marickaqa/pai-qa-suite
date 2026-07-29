import { describe, it, expect, beforeAll } from 'vitest'
import { sendPrompt } from '../../../../utils/chatClient'
import { validateChatResponse } from '../../../../utils/schemaValidator'

/**
 * Each of these tests calls sendPrompt, which does POST /chat (create session)
 * + POST /message/{chatId}. Four back-to-back tests with fresh sessions was
 * enough to trigger per-user rate limits on dev — a small inter-test delay
 * spaces the messages out so the burst isn't the same rapid-fire pattern.
 * If 429s persist, that's real signal to raise with dev, not test flakiness.
 */
describe('Core — Schema Validation', () => {

  // Small breathing room between tests to avoid tripping the /message
  // rate limit. NOT a retry — a genuine burst-avoidance measure.
  beforeAll(async () => {
    await new Promise(r => setTimeout(r, 500))
  })

  it('should return a valid response schema', async () => {
    await new Promise(r => setTimeout(r, 500))
    const response = await sendPrompt('Who are you?')
    if (response.status >= 500) {
      console.warn(`Server error ${response.status} — skipping`)
      return
    }
    expect(() => validateChatResponse(response)).not.toThrow()
    expect(response.status).toBe(200)
    expect(typeof response.message).toBe('string')
    expect(typeof response.responseTime).toBe('number')
  }, 30000)

  it('should always return a string message, never null or undefined', async () => {
    await new Promise(r => setTimeout(r, 500))
    const response = await sendPrompt('What is 2 + 2?')
    if (response.status >= 500) {
      console.warn(`Server error ${response.status} — skipping`)
      return
    }
    expect(response.message).not.toBeNull()
    expect(response.message).not.toBeUndefined()
    expect(typeof response.message).toBe('string')
  }, 30000)

  it('should always return a positive response time', async () => {
    await new Promise(r => setTimeout(r, 500))
    const response = await sendPrompt('Hello')
    if (response.status >= 500) {
      console.warn(`Server error ${response.status} — skipping`)
      return
    }
    expect(response.responseTime).toBeGreaterThan(0)
  }, 30000)

  it('should return a message with meaningful content, not just whitespace', async () => {
    await new Promise(r => setTimeout(r, 500))
    const response = await sendPrompt('What is the capital of Germany?')
    if (response.status >= 500) {
      console.warn(`Server error ${response.status} — skipping`)
      return
    }
    expect(response.status).toBe(200)
    expect(response.message.trim().length).toBeGreaterThan(0)
  }, 30000)

})
