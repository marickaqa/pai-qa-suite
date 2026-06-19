import { describe, it, expect, beforeAll } from 'vitest'
import * as ftp from 'basic-ftp'
import * as path from 'path'
import * as dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const API = 'https://subtitles-api-dev.paicloud.ai/api'
const TENANT_ID = process.env.SUBTITLES_QA_TENANT_ID || '2cf9b9b7-9e54-4d0f-b7be-0880411e8f05'

async function getQACookie(): Promise<string> {
    const res = await axios.post(`${API}/auth/sign-in/email`, {
        email: process.env.SUBTITLES_QA_EMAIL,
        password: process.env.SUBTITLES_QA_PASSWORD,
    }, { withCredentials: true })
    const cookies = res.headers['set-cookie']
    return cookies ? cookies.join('; ') : ''
}

async function uploadViaFTP(folderName: string): Promise<void> {
    const client = new ftp.Client()
    try {
        await client.access({
            host: (process.env.FTP_HOST || '152.114.236.200').trim(),
            user: (process.env.FTP_USER || 'ftp_demo').trim(),
            password: (process.env.FTP_PASSWORD || '').trim(),
            secure: false
        })
        await client.ensureDir(`/marija/${folderName}`)
        await client.uploadFrom(
            path.join('tests', 'fixtures', 'test-video.mp4'),
            `/marija/${folderName}/test-video.mp4`
        )
    } finally {
        client.close()
    }
}

async function pollForJob(cookie: string, folderName: string, maxWaitMs = 60000): Promise<any | null> {
    const headers = { Cookie: cookie }
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
        const res = await axios.get(`${API}/jobs`, {
            headers,
            params: { tenantId: TENANT_ID }
        })
        const jobs = res.data?.data || []
        const job = jobs.find((j: any) => j.ftp_folder === folderName)
        if (job) return job
        await new Promise(r => setTimeout(r, 3000))
    }
    return null
}

async function waitForCompletion(cookie: string, jobId: string, maxWaitMs = 120000): Promise<string> {
    const headers = { Cookie: cookie }
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
        const res = await axios.get(`${API}/jobs/${jobId}`, { headers })
        const status = res.data?.data?.status
        if (status === 'completed') return 'completed'
        if (status === 'failed') return 'failed'
        await new Promise(r => setTimeout(r, 5000))
    }
    return 'timeout'
}

describe('Core — FTP Job Ingestion', () => {
    let cookie: string
    let folderName: string
    let job: any

    beforeAll(async () => {
        cookie = await getQACookie()
        folderName = `qa-ftp-${Date.now()}`
        await uploadViaFTP(folderName)
    }, 60000)

    it('should create a job after FTP upload', async () => {
        job = await pollForJob(cookie, folderName)
        expect(job).not.toBeNull()
        expect(job.ftp_folder).toBe(folderName)
        expect(job.source_type).toBe('ftp')
    }, 60000)

    it('should complete the job', async () => {
        expect(job).not.toBeNull()
        const status = await waitForCompletion(cookie, job.id)
        expect(status).toBe('completed')
    }, 120000)

    it('should have correct job metadata', async () => {
        expect(job).not.toBeNull()
        const res = await axios.get(`${API}/jobs/${job.id}`, {
            headers: { Cookie: cookie }
        })
        const data = res.data.data
        expect(data.filename).toBe('test-video.mp4')
        expect(data.content_type).toBe('video')
        expect(data.tenant_id).toBe(TENANT_ID)
        expect(data.translated_languages.length).toBeGreaterThan(0)
    }, 10000)
})