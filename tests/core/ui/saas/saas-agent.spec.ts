import { test, expect } from '@playwright/test'

const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
const SAAS_SESSION = 'reports/saas-session.json'
const TEST_BOT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
const BOT_BASE = `${SAAS_URL}/agent/${TEST_BOT_ID}`

test.describe('Core — SaaS Agent Knowledge', () => {

  test('should show knowledge page with files and crawl sections', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/knowledge')
    await expect(page.getByRole('heading', { name: 'Files' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Website URLs')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload file', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Crawl website' })).toBeVisible()
    await context.close()
  })

  test('should navigate to knowledge from agent sidebar', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/guidelines')
    await page.getByRole('link', { name: 'Knowledge' }).click()
    await page.waitForURL('**/knowledge', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Files' })).toBeVisible()
    await context.close()
  })

})

test.describe('Core — SaaS Agent Guidelines', () => {

  test('should show guidelines page with all sections', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/guidelines')
    await expect(page.getByText('Communication style').first()).toBeVisible()
    await expect(page.getByText('Context and clarification').first()).toBeVisible()
    await expect(page.getByText('Content and sources').first()).toBeVisible()
    await expect(page.getByText('Conditional').first()).toBeVisible()
    await expect(page.getByText('Other').first()).toBeVisible()
    await context.close()
  })

  test('should show New guideline button in each section', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/guidelines')
    await expect(page.getByText('Communication style').first()).toBeVisible({ timeout: 15000 })
    const newGuidelineButtons = page.getByRole('button', { name: 'New guideline' })
    await expect(newGuidelineButtons.first()).toBeVisible()
    const count = await newGuidelineButtons.count()
    expect(count).toBeGreaterThan(0)
    await context.close()
  })

  test('should navigate to guidelines from agent sidebar', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/knowledge')
    await page.getByRole('link', { name: 'Guidelines' }).click()
    await page.waitForURL('**/guidelines', { timeout: 10000 })
    await expect(page.getByText('Communication style')).toBeVisible()
    await context.close()
  })

})

test.describe('Core — SaaS Agent Style Config', () => {

  test('should show style config page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/style-config')
    await expect(page.getByRole('heading', { name: 'Style Config' })).toBeVisible()
    await expect(page.getByText('Light theme', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Dark theme', { exact: true }).first()).toBeVisible()
    await context.close()
  })

  test('should show Save changes button', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/style-config')
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
    await context.close()
  })

  test('should show Upload buttons for logo slots', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(BOT_BASE + '/style-config')
    await expect(page.getByRole('heading', { name: 'Style Config' })).toBeVisible()
    const uploadButtons = page.locator('button').filter({ hasText: 'Upload' })
    await expect(uploadButtons.first()).toBeVisible({ timeout: 10000 })
    const count = await uploadButtons.count()
    expect(count).toBeGreaterThanOrEqual(6)
    await context.close()
  })

})

test.describe('Core — SaaS Team Management', () => {

  test('should show team management page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Team management' })).toBeVisible()
    await context.close()
  })

  test('should show members table with correct columns', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/team')
    await expect(page.getByRole('columnheader', { name: 'Member' }).first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Permissions' }).first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Joined' }).first()).toBeVisible()
    await context.close()
  })

  test('should show Invite member button', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/team')
    await expect(page.getByRole('button', { name: 'Invite member' })).toBeVisible()
    await context.close()
  })

  test('should show pending invitations section', async ({ browser }) => {
    const context = await browser.newContext({ storageState: SAAS_SESSION })
    const page = await context.newPage()
    await page.goto(SAAS_URL + '/dashboard/team')
    await expect(page.getByRole('heading', { name: 'Pending Invitations' })).toBeVisible()
    await context.close()
  })

})
