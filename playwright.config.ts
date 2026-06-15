import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.CHAT_URL || 'https://pc-fe-dev.noctocode.dev',
    storageState: 'reports/session.json',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'core-ui',
      testDir: './tests/core/ui',
      use: { storageState: 'reports/session.json' }
    },
    {
      name: 'known-bugs-ui',
      testDir: './tests/known-bugs/ui',
      use: { storageState: 'reports/session.json' }
    }
  ]
})