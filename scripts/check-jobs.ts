import axios from 'axios'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const TENANT_ID = '2cf9b9b7-9e54-4d0f-b7be-0880411e8f05'

async function run() {
  const res = await axios.post(`${API}/auth/sign-in/email`, {
    email: process.env.SUBTITLES_QA_EMAIL,
    password: process.env.SUBTITLES_QA_PASSWORD,
  }, { withCredentials: true })
  const cookie = res.headers['set-cookie']?.join('; ') || ''

  const jobs = await axios.get(`${API}/jobs`, {
    headers: { Cookie: cookie },
    params: { tenantId: TENANT_ID }
  })
  console.log(JSON.stringify(jobs.data, null, 2))
}

run().catch(e => console.error(e.response?.data || e.message))