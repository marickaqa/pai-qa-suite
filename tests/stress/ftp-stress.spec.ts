import { describe, it, expect } from 'vitest'
import * as ftp from 'basic-ftp'
import * as path from 'path'
import * as dotenv from 'dotenv'
import axios from 'axios'
import { Writable } from 'stream'

dotenv.config()

const CONCURRENT_USERS = parseInt(process.env.FTP_STRESS_USERS || '10')
const FTP_STABLE_LIMIT = 11
const SUBTITLES_API = 'https://subtitles-api-dev.paicloud.ai/api'
const STREAM_JOB_ID = 'c45b4742-34d2-42fc-9676-c3abb7c8f354'
const EDITOR_JOB_ID = '41de6834-c476-4c57-b4a0-8fbdbfe69599'

async function uploadOne(i: number, timestamp: number): Promise<{ success: boolean; error?: string }> {
  const client = new ftp.Client()
  const folder = `qa-stress-${i}-${timestamp}`
  try {
    await client.access({
      host: (process.env.FTP_HOST || '').trim(),
      user: (process.env.FTP_USER || '').trim(),
      password: (process.env.FTP_PASSWORD || '').trim(),
      secure: false
    })
    await client.ensureDir(`/marija/${folder}`)
    await client.uploadFrom(
      path.join('tests', 'fixtures', 'test-video.mp4'),
      `/marija/${folder}/test-video.mp4`
    )
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  } finally {
    client.close()
  }
}

async function downloadOne(filePath: string): Promise<{ success: boolean; bytes?: number; time?: number; error?: string }> {
  const client = new ftp.Client()
  try {
    await client.access({
      host: (process.env.FTP_HOST || '').trim(),
      user: (process.env.FTP_USER || '').trim(),
      password: (process.env.FTP_PASSWORD || '').trim(),
      secure: false
    })
    let bytes = 0
    const sink = new Writable({
      write(chunk, _enc, cb) { bytes += chunk.length; cb() }
    })
    const start = Date.now()
    await client.downloadTo(sink, filePath)
    return { success: true, bytes, time: Date.now() - start }
  } catch (e: any) {
    return { success: false, error: e.message }
  } finally {
    client.close()
  }
}

async function getSubtitlesAuth(): Promise<string> {
  const r = await axios.post(`${SUBTITLES_API}/auth/sign-in/email`, {
    email: process.env.SUBTITLES_QA_EMAIL,
    password: process.env.SUBTITLES_QA_PASSWORD
  }, { withCredentials: true })
  return r.headers['set-cookie']?.join('; ') || ''
}

async function streamOne(cookie: string): Promise<{ success: boolean; status?: number; bytes?: number; time?: number; error?: string }> {
  try {
    const start = Date.now()
    const res = await axios.get(`${SUBTITLES_API}/jobs/${STREAM_JOB_ID}/editor/media`, {
      headers: { Cookie: cookie, Range: 'bytes=0-1048576' },
      responseType: 'arraybuffer'
    })
    return { success: true, status: res.status, bytes: (res.data as Buffer).byteLength, time: Date.now() - start }
  } catch (e: any) {
    return { success: false, status: e.response?.status, error: e.message }
  }
}

// ─── 1. FTP Upload ────────────────────────────────────────────────────────────

describe(`FTP Upload Stress — ${CONCURRENT_USERS} concurrent users`, () => {

  it(`should handle ${CONCURRENT_USERS} concurrent FTP uploads`, async () => {
    const timestamp = Date.now()
    const start = Date.now()
    const results = await Promise.all(
      Array.from({ length: CONCURRENT_USERS }, (_, i) => uploadOne(i, timestamp))
    )
    const succeeded = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)
    const duration = Date.now() - start
    console.log(`${succeeded}/${CONCURRENT_USERS} succeeded in ${duration}ms`)
    if (failed.length > 0) console.log('Errors:', [...new Set(failed.map(r => r.error))])
    if (CONCURRENT_USERS <= FTP_STABLE_LIMIT) {
      expect(succeeded).toBe(CONCURRENT_USERS)
    } else {
      console.warn(`Above known stable limit (${FTP_STABLE_LIMIT}). Success rate: ${Math.round(succeeded / CONCURRENT_USERS * 100)}%`)
      expect(succeeded).toBeGreaterThan(0)
    }
  }, 120000)

  it('should confirm stable FTP upload limit of 11 concurrent connections', async () => {
    await new Promise(r => setTimeout(r, 5000))
    const timestamp = Date.now()
    const results = await Promise.all(
      Array.from({ length: FTP_STABLE_LIMIT }, (_, i) => uploadOne(i, timestamp))
    )
    const succeeded = results.filter(r => r.success).length
    console.log(`FTP stable limit test: ${succeeded}/${FTP_STABLE_LIMIT}`)
    expect(succeeded).toBeGreaterThanOrEqual(10)
  }, 120000)

})

// ─── 2. FTP Download ──────────────────────────────────────────────────────────

describe('FTP Download Stress — subtitle files', () => {

  const SRT_PATH = '/marija/outputs/qa-ftp-1781855089774/test-video/test-video_spa.srt'

  it('should handle 50 concurrent FTP subtitle downloads', async () => {
    await new Promise(r => setTimeout(r, 3000))
    const start = Date.now()
    const results = await Promise.all(Array.from({ length: 50 }, () => downloadOne(SRT_PATH)))
    const succeeded = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const avgTime = succeeded.length > 0
      ? Math.round(succeeded.reduce((a, r) => a + (r.time || 0), 0) / succeeded.length)
      : 0
    console.log(`FTP downloads: ${succeeded.length}/50 succeeded, avg ${avgTime}ms in ${Date.now() - start}ms`)
    if (failed.length > 0) console.log('Errors:', [...new Set(failed.map(r => r.error))])
    expect(succeeded.length).toBeGreaterThanOrEqual(48)
  }, 60000)

})

// ─── 3. HTTP Video Streaming ──────────────────────────────────────────────────

describe('HTTP Video Streaming Stress — subtitle editor', () => {

  let cookie: string

  it('should handle 10 concurrent video streams', async () => {
    cookie = await getSubtitlesAuth()
    const start = Date.now()
    const results = await Promise.all(Array.from({ length: 10 }, () => streamOne(cookie)))
    const succeeded = results.filter(r => r.success)
    const avgTime = Math.round(succeeded.reduce((a, r) => a + (r.time || 0), 0) / succeeded.length)
    console.log(`HTTP streaming 10: ${succeeded.length}/10 avg ${avgTime}ms in ${Date.now() - start}ms`)
    expect(succeeded.length).toBe(10)
  }, 60000)

  it('should handle 50 concurrent video streams', async () => {
    await new Promise(r => setTimeout(r, 2000))
    const start = Date.now()
    const results = await Promise.all(Array.from({ length: 50 }, () => streamOne(cookie)))
    const succeeded = results.filter(r => r.success)
    const avgTime = Math.round(succeeded.reduce((a, r) => a + (r.time || 0), 0) / succeeded.length)
    console.log(`HTTP streaming 50: ${succeeded.length}/50 avg ${avgTime}ms in ${Date.now() - start}ms`)
    expect(succeeded.length).toBe(50)
  }, 120000)

  it('should handle 100 concurrent video streams', async () => {
    await new Promise(r => setTimeout(r, 2000))
    const start = Date.now()
    const results = await Promise.all(Array.from({ length: 100 }, () => streamOne(cookie)))
    const succeeded = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const avgTime = Math.round(succeeded.reduce((a, r) => a + (r.time || 0), 0) / succeeded.length)
    console.log(`HTTP streaming 100: ${succeeded.length}/100 avg ${avgTime}ms in ${Date.now() - start}ms`)
    if (failed.length > 0) console.log('Failures:', failed.length, 'statuses:', [...new Set(failed.map(r => r.status))])
    expect(succeeded.length).toBeGreaterThanOrEqual(80)
  }, 180000)

})

// ─── 4. Full Editor Simulation ────────────────────────────────────────────────

describe('Full Editor Simulation Stress — subtitle editor', () => {

  const EDITOR_URL = `https://subtitles-dev.paicloud.ai/jobs/${EDITOR_JOB_ID}/edit/English`
  const N_EDITOR_USERS = parseInt(process.env.EDITOR_STRESS_USERS || '10')

  it(`should handle ${N_EDITOR_USERS} concurrent users editing subtitles`, async () => {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })
    const start = Date.now()

    async function simulateUser(userId: number): Promise<{ success: boolean; time?: number; error?: string }> {
      const context = await browser.newContext({ storageState: 'reports/subtitles-session.json' })
      const page = await context.newPage()
      page.setDefaultTimeout(120000)
      const userStart = Date.now()
      try {
        await new Promise(r => setTimeout(r, Math.random() * 10000))
        await page.goto(EDITOR_URL, { timeout: 90000 })
        await page.waitForTimeout(3000)
        await page.locator('button[aria-label="Play"]').first().click()
        await page.waitForTimeout(2000)
        const captions = page.locator('textarea, [contenteditable="true"]')
        const count = await captions.count()
        const idx = Math.floor(Math.random() * Math.min(count, 20))
        await captions.nth(idx).click()
        await captions.nth(idx).fill(`User ${userId} edited at ${Date.now()}`)
        await page.getByRole('button', { name: /save/i }).first().click()
        await page.waitForTimeout(1000)
        return { success: true, time: Date.now() - userStart }
      } catch (e: any) {
        return { success: false, error: e.message?.substring(0, 80) }
      } finally {
        await context.close()
      }
    }

    const results = await Promise.all(Array.from({ length: N_EDITOR_USERS }, (_, i) => simulateUser(i)))
    const succeeded = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const avgTime = succeeded.length > 0
      ? Math.round(succeeded.reduce((a, r) => a + (r.time || 0), 0) / succeeded.length)
      : 0

    console.log(`Editor stress: ${succeeded.length}/${N_EDITOR_USERS} succeeded, avg ${avgTime}ms in ${Date.now() - start}ms`)
    if (failed.length > 0) console.log('Failures:', [...new Set(failed.map(r => r.error))])

    await browser.close()

    if (N_EDITOR_USERS <= 10) {
      expect(succeeded.length).toBe(N_EDITOR_USERS)
    } else {
      expect(succeeded.length).toBeGreaterThanOrEqual(Math.floor(N_EDITOR_USERS * 0.85))
    }
  }, 300000)

})