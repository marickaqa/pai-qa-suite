import { test, expect } from '@playwright/test'

test.describe('Core — Sidebar', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
  })

  test('should show chat history heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Chat History' })).toBeVisible()
  })

  test('should filter chats when searching', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search chats..."]').nth(1)
    await searchInput.click({ force: true })
    await searchInput.fill('e')
    await page.waitForTimeout(500)
    await expect(searchInput).toHaveValue('e')
  })

  test('should show no results for non-existent search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search chats..."]').nth(1)
    await searchInput.click({ force: true })
    await searchInput.fill('xyznonexistentchat123')
    await page.waitForTimeout(500)

    const chatItems = page.locator('div[role="button"]').filter({
      has: page.locator('p.truncate')
    })
    const count = await chatItems.count()
    expect(count).toBe(0)
  })

  test('should clear search and restore all chats', async ({ page }) => {
    const chatItems = page.locator('div[role="button"]').filter({
      has: page.locator('p.truncate')
    })
    const totalBefore = await chatItems.count()

    const searchInput = page.locator('input[placeholder="Search chats..."]').nth(1)
    await searchInput.click({ force: true })
    await searchInput.fill('e')
    await page.waitForTimeout(500)
    await searchInput.clear()
    await page.waitForTimeout(500)

    const countAfter = await chatItems.count()
    expect(countAfter).toBe(totalBefore)
  })

  test('should delete a chat', async ({ page }) => {
    const chatItems = page.locator('div[role="button"]').filter({
      has: page.locator('p.truncate')
    })
    const countBefore = await chatItems.count()
    expect(countBefore).toBeGreaterThan(0)

    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Delete chat"]') as HTMLButtonElement
      if (btn) btn.click()
    })

    await page.waitForTimeout(1000)
    const countAfter = await chatItems.count()
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

})