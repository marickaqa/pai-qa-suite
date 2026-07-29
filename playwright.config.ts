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

export default defineConfig({
  globalSetup: './global-setup.ts',
  timeout: 60000,
  // More retries in CI to absorb transient dev-backend slowness (pages
  // occasionally don't render within timeout). Locally keep it low for fast,
  // honest feedback while developing.
  retries: process.env.CI ? 3 : 0,
  workers: 1,
  expect: {
    // Global default for expect().toBeVisible() etc. Today's CI runs showed
    // a recurring pattern: some assertions with the 5s built-in default
    // timed out, some with an explicit 10-15s override still timed out, and
    // even one with an explicit 30s override failed once. Patching each
    // flaky assertion's timeout individually was whack-a-mole — a different
    // test failed on every run. Raising the GLOBAL default gives every
    // assertion in the suite more patience against a shared dev backend that
    // is occasionally slow, without hunting down each one by hand.
    timeout: 10000,
  },
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
      // Local-only project, never invoked by any CI job (not in ci.yml).
      // CHATBOT_URL is deliberately NOT required() here. An earlier attempt
      // used an argv-sniffing helper (requiredForProject) to only enforce
      // this when chatbot-custom was actually selected via --project — but
      // that broke in CI (it still threw even though chatbot-custom was
      // never requested), most likely because this config also declares
      // globalSetup, and Playwright's handling of that phase means
      // process.argv inside config-load isn't a reliable signal to sniff.
      // Simplest and bulletproof: just read the env var directly, possibly
      // undefined. Every spec file in this suite already builds its own
      // absolute URL from an env var with its own fallback/guard (this
      // project's specs do the same with CHATBOT_URL) rather than relying on
      // Playwright's own baseURL for navigation, so an undefined baseURL
      // here is harmless unless someone actually runs chatbot-custom without
      // setting CHATBOT_URL — in which case that project's own specs will
      // surface a clear enough error at that point.
      name: 'chatbot-custom',
      testDir: './tests/core/ui/chatbot',
      testIgnore: '**/logout.spec.ts',
      use: {
        baseURL: process.env.CHATBOT_URL,
        storageState: 'reports/custom-session.json',
      },
    },
  ],
})