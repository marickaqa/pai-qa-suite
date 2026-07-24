import { chromium } from "playwright"
import * as dotenv from "dotenv"
import * as path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const URL = process.env.CHAT_URL || "https://pc-fe-dev.noctocode.dev"

async function run() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ storageState: "reports/session.json" })
  const p = await ctx.newPage()
  await p.goto(URL)
  await p.waitForTimeout(3000)
  const btns = await p.locator("button").all()
  for (const btn of btns) {
    const aria = await btn.getAttribute("aria-label")
    const title = await btn.getAttribute("title")
    const txt = (await btn.innerText().catch(() => ""))?.slice(0, 20)
    const hasSvg = await btn.locator("svg").count() > 0
    if (aria || title || hasSvg) console.log(JSON.stringify({ aria, title, txt, hasSvg }))
  }
  await b.close()
}

run().catch(e => { console.error(e); process.exit(1) })
