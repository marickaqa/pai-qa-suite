import { type Page, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const orgTrigger = (page: Page) => page.locator('button:has(svg.lucide-chevrons-up-down)')

// Settle the active org on noctocode.dev from OVERVIEW, whose sidebar + org
// picker render regardless of active org. A hard load first paints the account
// default (Acme Corp), then reads localStorage.lastSavedOrganizationId and
// switches ~1s later; occasionally that stalls, so we switch explicitly here —
// safe, because on overview the picker is reliably present and clickable.
async function settleOrgOnOverview(page: Page) {
  await page.goto(SAAS_URL + '/dashboard/overview')
  const trigger = orgTrigger(page)
  await trigger.waitFor({ state: 'visible', timeout: 30000 })
  try {
    await expect(trigger).toContainText('noctocode.dev', { timeout: 15000 })
    return
  } catch {
    // hydration stalled on this load — switch explicitly
  }
  await trigger.click()
  await page.getByRole('button', { name: /noctocode\.dev/i }).filter({ hasNotText: '@' }).click()
  await expect(trigger).toContainText('noctocode.dev', { timeout: 15000 })
}

/**
 * Navigate to an org-scoped SaaS page with the active org guaranteed to be
 * noctocode.dev before the caller asserts. Settle on overview first, then load
 * the target and wait for it to hydrate onto noctocode.dev. We deliberately do
 * NOT switch org on the target: agent-scoped pages under the wrong org can
 * render without a usable sidebar, so the picker may not be clickable there.
 *
 * AUTHENTICATED, org-scoped pages only. Never use for unauthenticated tests
 * (no session -> no picker) or login-redirect assertions.
 */
export async function gotoSaasOrgScoped(page: Page, url: string) {
  await settleOrgOnOverview(page)
  await page.goto(url)
  await expect(
    orgTrigger(page),
    `page did not hydrate onto noctocode.dev: ${url}`
  ).toContainText('noctocode.dev', { timeout: 30000 })
}

/**
 * Wait until the org picker's label stops changing — i.e. the post-login
 * hydration re-render has settled. Use before interacting with overlays (e.g.
 * the logout dialog) that a late re-render would otherwise unmount mid-action.
 */
export async function waitForOrgSettled(page: Page) {
  const trigger = orgTrigger(page)
  await trigger.waitFor({ state: 'visible', timeout: 30000 })
  await expect(async () => {
    const first = await trigger.textContent()
    await page.waitForTimeout(400)          // sampling gap inside a bounded poll
    expect(await trigger.textContent()).toBe(first)
  }).toPass({ timeout: 15000 })
}