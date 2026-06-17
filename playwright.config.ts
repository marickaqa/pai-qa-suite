import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

export default defineConfig({
  globalSetup: './global-setup.ts',
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
      name: 'core-chatbot-ui',
      testDir: './tests/core/ui/chatbot',
      testIgnore: '**/logout.spec.ts',
      use: { storageState: 'reports/session.json' }
    },
    {
      name: 'core-chatbot-ui-logout',
      testDir: './tests/core/ui/chatbot',
      testMatch: '**/logout.spec.ts',
      use: { storageState: 'reports/session.json' },
      dependencies: ['core-chatbot-ui']
    },
    {
      name: 'core-saas-ui',
      testDir: './tests/core/ui/saas',
      use: { storageState: 'reports/saas-session.json' }
    },
    {
      name: 'core-subtitles-ui',
      testDir: './tests/core/ui/subtitles',
      use: {
        baseURL: process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai',
        storageState: 'reports/subtitles-session.json'
      }
    },
    {
      name: 'known-bugs-ui',
      testDir: './tests/known-bugs/ui',
      use: { storageState: 'reports/session.json' }
    },
  ]
})