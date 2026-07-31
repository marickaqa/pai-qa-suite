import { type Page, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const orgTrigger = (page: Page) => page.locator('button:has(svg.lucide-chevrons-up-down)')

// Force the active org to noctocode.dev on whatever page is loaded, as long as
// the org picker is present. Does not wait out a hydration timeout on the happy
// path: checks once, switches only if not already correct.
async function forceOrg(page: Page) {
  const trigger = orgTrigger(page)
  await trigger.waitFor({ state: 'visible', timeout: 30000 })
  if ((await trigger.textContent())?.includes('noctocode.dev')) return
  await trigger.click()
  // Picker is now open. "noctocode.dev" text also lives in the trigger itself,
  // so match only the dropdown OPTION: exclude the trigger (which has the
  // chevrons-up-down svg) and the account-email row (has '@').
  const option = page
    .getByRole('button', { name: /noctocode\.dev/i })
    .filter({ hasNotText: '@' })
    .filter({ hasNot: page.locator('svg.lucide-chevrons-up-down') })
  await option.click()
  await expect(trigger).toContainText('noctocode.dev', { timeout: 15000 })
}

// Settle org on OVERVIEW, whose sidebar + picker render regardless of active org.
async function settleOrgOnOverview(page: Page) {
  await page.goto(SAAS_URL + '/dashboard/overview')
  await forceOrg(page)
}

/**
 * Navigate to an org-scoped SaaS page with the active org guaranteed to be
 * noctocode.dev before the caller asserts.
 *
 * AUTHENTICATED, org-scoped pages only. Never use for unauthenticated tests
 * (no session -> no picker) or login-redirect assertions.
 */
export async function gotoSaasOrgScoped(page: Page, url: string) {
  // The probe showed a cold hard-nav to a scoped page settles on noctocode.dev
  // on its own, and the picker is present + clickable there. So navigate direct
  // and force the org ON the target page — no overview pre-nav (the extra nav
  // was racing the org state and flipping it back to the account default).
  await page.goto(url)
  await forceOrg(page)
}

/**
 * Wait until the org picker's label IS noctocode.dev (not merely until it stops
 * changing — that could lock in the wrong org). Use before interacting with
 * overlays (e.g. the logout dialog) that a late re-render would unmount.
 */
export async function waitForOrgSettled(page: Page) {
  const trigger = orgTrigger(page)
  await trigger.waitFor({ state: 'visible', timeout: 30000 })
  await expect(trigger).toContainText('noctocode.dev', { timeout: 15000 })
}