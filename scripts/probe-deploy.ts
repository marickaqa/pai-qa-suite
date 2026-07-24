import axios from 'axios'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { getSaasToken, authHeaders } from '../utils/saasClient'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'https://pc-be-dev.noctocode.dev'
const SUPPORT_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'

async function probe(token: string, id: string, label: string) {
  try {
    const r = await axios.post(`${BASE_URL}/chatbot/${id}/deploy`, {}, { headers: authHeaders(token) })
    console.log(label, '->', r.status, JSON.stringify(r.data, null, 2))
  } catch (e: any) {
    console.log(label, '->', e.response?.status, JSON.stringify(e.response?.data, null, 2))
  }
}

async function run() {
  const token = await getSaasToken()
  await probe(token, SUPPORT_BOT_ID, 'support bot deploy')
  await probe(token, '00000000-0000-0000-0000-000000000000', 'invalid id deploy')
}

run()
