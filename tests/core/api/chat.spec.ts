import { describe, it, expect } from 'vitest'
import { sendPrompt } from '../../../utils/chatClient'

describe('Core — Chat API', () => {

  it('should return HTTP 200', async () => {
    const response = await sendPrompt('Who are you?')
    expect(response.status).toBe(200)
  }, 30000)

  it('should return a non-empty message', async () => {
    const response = await sendPrompt('What is 2 + 2?')
    expect(response.status).toBe(200)
    expect(response.message.length).toBeGreaterThan(0)
  }, 30000)

  it('should identify itself as Egle', async () => {
    const response = await sendPrompt('What is your name?')
    expect(response.status).toBe(200)
    expect(response.message.toLowerCase()).toContain('egle')
  }, 30000)

  it('should respond within 15 seconds', async () => {
    const response = await sendPrompt('What is the capital of France?')
    expect(response.status).toBe(200)
    expect(response.responseTime).toBeLessThan(15000)
  }, 30000)

  it('should handle a long prompt without timing out', async () => {
    const longPrompt = 'Please explain in detail: ' + 'what is artificial intelligence? '.repeat(5)
    const response = await sendPrompt(longPrompt)
    expect(response.status).toBe(200)
    expect(response.message.length).toBeGreaterThan(0)
    expect(response.responseTime).toBeLessThan(30000)
  }, 60000)

})