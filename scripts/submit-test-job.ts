import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'
import * as fs from 'fs'
import FormData from 'form-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const TENANT_ID = process.env.SUBTITLES_QA_TENANT_ID || '2cf9b9b7-9e54-4d0f-b7be-0880411e8f05'

async function getCookie(email: string, password: string): Promise<string> {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email,
    password,
  }, { withCredentials: true })
  const cookies = res.headers['set-cookie']
  return cookies ? cookies.join('; ') : ''
}

async function run() {
  console.log('🔐 Signing in as QA user...')
  const cookie = await getCookie(
    process.env.SUBTITLES_QA_EMAIL || '',
    process.env.SUBTITLES_QA_PASSWORD || ''
  )
  const headers = {
    'Cookie': cookie,
    'Origin': 'https://subtitles-dev.paicloud.ai'
  }

  console.log('🎬 Submitting test video job...')
  const videoPath = path.resolve(__dirname, '../tests/fixtures/test-video.mp4')
  const form = new FormData()
  form.append('file', fs.createReadStream(videoPath), 'test-video.mp4')
  form.append('tenantId', TENANT_ID)
  form.append('targetLanguages', 'English,Spanish,French')

  const res = await axios.post(`${API}/jobs/video`, form, {
    headers: {
      ...headers,
      ...form.getHeaders()
    }
  })

  console.log('✅ Job submitted:', JSON.stringify(res.data, null, 2))
  console.log(`\nJob ID: ${res.data.data.jobId}`)
  console.log('Job will take a few minutes to complete.')
}

run().catch(err => {
  console.error('❌ Failed:', err.response?.data || err.message)
  process.exit(1)
})