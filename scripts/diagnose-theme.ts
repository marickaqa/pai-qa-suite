import { chromium } from "playwright"
import * as dotenv from "dotenv"; import * as path from "path"; import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })
const URL = process.env.CHAT_URL || "https://pc-fe-dev.noctocode.dev"
async function snap(p: any) {
  return await p.evaluate(() => ({
    htmlClass: document.documentElement.className,
    htmlData: document.documentElement.getAttribute("data-theme"),
    bodyClass: document.body.className,
    bodyData: document.body.getAttribute("data-theme"),
  }))
}
async function run() {
  const b = await chromium.launch()
  const ctx = await b.newContext({ storageState: "reports/session.json" })
  const p = await ctx.newPage()
  await p.goto(URL); await p.waitForTimeout(3000)
  console.log("BEFORE:", JSON.stringify(await snap(p)))
  // click each top-bar icon button, snapshot after each
  const btns = await p.locator("button:has(svg)").all()
  let idx = 0
  for (const btn of btns) {
    const box = await btn.boundingBox().catch(() => null)
    if (!box || box.y > 90) continue
    await btn.click().catch(() => {})
    await p.waitForTimeout(600)
    console.log(`AFTER top-bar btn #${idx} (x=${Math.round(box.x)}):`, JSON.stringify(await snap(p)))
    idx++
  }
  await b.close()
}
run().catch(e => { console.error(e); process.exit(1) })
