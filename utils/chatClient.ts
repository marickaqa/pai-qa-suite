import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'

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

export async function sendPrompt(prompt: string): Promise<{
  status: number
  message: string
  responseTime: number
}> {
  const start = Date.now()

  try {
    const token = await getToken()
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 1: create conversation
    const conv = await axios.post(
      `${BASE_URL}/chat`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const chatId = conv.data.id

    // Step 2: send message
    const response = await axios.post(
      `${BASE_URL}/message/${chatId}`,
      { message: prompt },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const message = parseStreamResponse(response.data)

    return {
      status: response.status,
      message,
      responseTime: Date.now() - start,
    }
  } catch (error: any) {
    if (error.response?.status >= 500) {
      try {
        const freshToken = await getToken(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        const conv = await axios.post(
          `${BASE_URL}/chat`,
          {},
          { headers: { Authorization: `Bearer ${freshToken}` } }
        )
        const chatId = conv.data.id

        const retry = await axios.post(
          `${BASE_URL}/message/${chatId}`,
          { message: prompt },
          { headers: { Authorization: `Bearer ${freshToken}` } }
        )

        return {
          status: retry.status,
          message: parseStreamResponse(retry.data),
          responseTime: Date.now() - start,
        }
      } catch (retryError: any) {
        return {
          status: retryError.response?.status || 500,
          message: '',
          responseTime: Date.now() - start,
        }
      }
    }

    return {
      status: error.response?.status || 0,
      message: '',
      responseTime: Date.now() - start,
    }
  }
}