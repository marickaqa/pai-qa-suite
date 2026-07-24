import axios from "axios"
import * as dotenv from "dotenv"
import * as path from "path"
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const URL = (process.env.API_BASE_URL || "https://pc-be-dev.noctocode.dev") + "/auth/signin"
let firstErrorBody: any = null
async function once(i: number) {
  const t = Date.now()
  try {
    const r = await axios.post(URL,
      { email: process.env.API_EMAIL, password: process.env.API_PASSWORD },
      { validateStatus: () => true })
    const ms = Date.now() - t
    const ra = r.headers["retry-after"] ? ` retry-after=${r.headers["retry-after"]}` : ""
    console.log(`#${i} -> ${r.status} (${ms}ms)${ra}`)
    if (r.status >= 500 && !firstErrorBody) firstErrorBody = r.data
  } catch (e: any) {
    console.log(`#${i} -> ERR ${e.code} (${Date.now() - t}ms)`)
  }
}
async function run() {
  for (let i = 1; i <= 15; i++) await once(i)
  if (firstErrorBody) {
    console.log("\n--- first 5xx response body ---")
    console.log(JSON.stringify(firstErrorBody, null, 2))
  }
}
run()
