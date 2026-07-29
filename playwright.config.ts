import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

/**
 * Read a required env var, or fail immediately with a clear message.
 *
 * We deliberately do NOT provide hardcoded URL fallbacks. A `|| 'https://...'`
 * default is a second place a domain can drift or be wrong, and — more
 * importantly — a literal fallback is invisible to prodGuard (which only
 * inspects process.env values). Failing loud on a missing var keeps every
 * target flowing through the env, where the guard can see it.
 */
function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in ` +
        `(or export ${name} in your CI environment).`
    )
  }
  return value
}

/**
 * Some projects (currently: chatbot-custom) are local-only and never invoked
 * by any CI job — but Playwright evaluates the ENTIRE projects array at
 * config-load time, before applying any --project filter. That meant a
 * missing CHATBOT_URL (never set as a CI secret, since chatbot-custom isn't
 * part of any CI script) blocked every project in the run, including ones
 * that had nothing to do with it.
 *
 * This checks whether the given project was actually requested via
 * --project on the command line. If a --project filter is present and this
 * project isn't in it, the var is allowed to be missing (a placeholder is
 * returned — it will never be used to make a real request). If no --project
 * filter is given at all (meaning every project might run), or this project
 * IS explicitly requested, the var is required as normal.
 */
function requiredForProject(name: string, projectName: string): string {
  const argv = process.argv
  const projectFlags: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project') projectFlags.push(argv[i + 1])
    else if (argv[i].startsWith('--project=')) projectFlags.push(argv[i].slice('--project='.length))
  }
  const noFilter = projectFlags.length === 0
  const thisProjectSelected = projectFlags.includes(projectName)

  if (!noFilter && !thisProjectSelected) {
    return `unused-${name}` // this project won't run; the value is never touched
  }
  return required(name)
}

export default defineConfig({
  globalSetup: './global-setup.ts',
  timeout: 60000,
  // More retries in CI to absorb transient dev-backend slowness (pages
  // occasionally don't render within timeout). Locally keep it low for fast,
  // honest feedback while developing.
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: required('CHAT_URL'),
    storageState: 'reports/session.json',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30000,
  },
  projects: [
    {
      name: 'core-chatbot-ui',
      testDir: './tests/core/ui/chatbot',
      testIgnore: '**/logout.spec.ts',
      use: { storageState: 'reports/session.json' },
    },
    {
      name: 'core-chatbot-ui-logout',
      testDir: './tests/core/ui/chatbot',
      testMatch: '**/logout.spec.ts',
      use: { storageState: 'reports/session.json' },
      dependencies: ['core-chatbot-ui'],
    },
    {
      name: 'core-saas-ui',
      testDir: './tests/core/ui/saas',
      use: { storageState: 'reports/saas-session.json' },
    },
    {
      // Embeddable Support Bot Widget, tested on the public dummy-company site.
      // No auth: specs use an absolute WIDGET_URL, not baseURL/storageState.
      name: 'core-supportbot-ui',
      testDir: './tests/core/ui/supportbot',
    },
    {
      name: 'core-subtitles-ui',
      testDir: './tests/core/ui/subtitles',
      use: {
        baseURL: required('SUBTITLES_URL'),
        storageState: 'reports/subtitles-session.json',
      },
    },
    {
      name: 'known-bugs-ui',
      testDir: './tests/known-bugs/ui',
      use: { storageState: 'reports/session.json' },
    },
    {
      name: 'chatbot-custom',
      testDir: './tests/core/ui/chatbot',
      testIgnore: '**/logout.spec.ts',
      use: {
        baseURL: requiredForProject('CHATBOT_URL', 'chatbot-custom'),
        storageState: 'reports/custom-session.json',
      },
    },
  ],
})