import * as ftp from 'basic-ftp'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function run() {
  const client = new ftp.Client()

  try {
    await client.access({
      host: process.env.FTP_HOST || '152.114.236.200',
      user: process.env.FTP_USER || 'ftp_demo',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    })

    console.log('✅ Connected to FTP server')

    const folderName = `qa-test-${Date.now()}`
    console.log(`📁 Creating folder /marija/${folderName}/...`)
    await client.ensureDir(`/marija/${folderName}`)

    console.log(`🎬 Uploading test video to /marija/${folderName}/...`)
    await client.uploadFrom(
      path.join('tests', 'fixtures', 'test-video.mp4'),
      `/marija/${folderName}/test-video.mp4`
    )
    console.log(`✅ Upload complete`)
    console.log(`\n📋 Job reference: ${folderName}`)
    console.log('Check the subtitles dashboard for a new job.')

  } catch (err) {
    console.error('❌ FTP error:', err)
  } finally {
    client.close()
  }
}

run()