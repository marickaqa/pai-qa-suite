import { describe, it, expect } from 'vitest'
import { sendPrompt } from '../../../utils/chatClient'
import { validateChatResponse } from '../../../utils/schemaValidator'

describe('Core — Schema Validation', () => {

  it('should return a valid response schema', async () => {
    const response = await sendPrompt('Who are you?')
    expect(() => validateChatResponse(response)).not.toThrow()
    expect(response.status).toBe(200)
    expect(typeof response.message).toBe('string')
    expect(typeof response.responseTime).toBe('number')
  }, 30000)

  it('should always return a string message, never null or undefined', async () => {
    const response = await sendPrompt('What is 2 + 2?')
    expect(response.message).not.toBeNull()
    expect(response.message).not.toBeUndefined()
    expect(typeof response.message).toBe('string')
  }, 30000)

  it('should always return a positive response time', async () => {
    const response = await sendPrompt('Hello')
    expect(response.responseTime).toBeGreaterThan(0)
  }, 30000)

  it('should return a message with meaningful content, not just whitespace', async () => {
    const response = await sendPrompt('What is the capital of Germany?')
    expect(response.status).toBe(200)
    expect(response.message.trim().length).toBeGreaterThan(0)
  }, 30000)

})