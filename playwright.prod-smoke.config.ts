import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

// Prod smoke tier — read-only checks against the production deployment.
// Run with:  npm run test:prod-smoke   (requires ALLOW_PROD=1 for prod targets)
// Dry-run against dev:  set SMOKE_SAAS_URL=https://chat-dev.paicloud.ai first.
export default defineConfig({
  globalSetup: './prod-smoke-setup.ts',
  testDir: './tests/prod-smoke',
  timeout: 60000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.SMOKE_SAAS_URL || 'https://chat.paicloud.ai',
    storageState: 'reports/prod-smoke-session.json',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30000,
  },
})
