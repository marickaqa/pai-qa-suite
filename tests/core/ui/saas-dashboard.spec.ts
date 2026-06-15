import { test, expect } from '@playwright/test'

const SAAS_URL = 'https://chat.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'

test.describe('Core — SaaS Dashboard', () => {

  test('should redirect unauthenticated users to login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('login')
    await context.close()
  })

  test('should login and land on dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    expect(page.url()).toContain('/dashboard/')
    await context.close()
  })

  test('should show key dashboard metrics', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('TOTAL AGENTS')).toBeVisible()
    await expect(page.getByText('MESSAGES THIS MONTH')).toBeVisible()
    await expect(page.getByText('RESOLUTION RATE')).toBeVisible()
    await expect(page.getByText('TOKEN USAGE')).toBeVisible()
    await context.close()
  })

  test('should show support bots and AI assistants sections', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('Support bots')).toBeVisible()
    await expect(page.getByText('AI Assistants')).toBeVisible()
    await context.close()
  })

  test('should show organization name in sidebar', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    await expect(page.getByText('noctocode.dev', { exact: true }).first()).toBeVisible()
    await context.close()
  })

  test('should show New button on dashboard', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/overview')
    await expect(page.locator('button').filter({ hasText: 'New' }).first()).toBeVisible()
    await context.close()
  })

})