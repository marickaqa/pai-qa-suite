import { test, expect } from '@playwright/test'

test.describe('Core — Chat UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('should show the main chat UI after login', async ({ page }) => {
    await expect(page.locator('textarea[placeholder="Type a message..."]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Chat' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Chat History' })).toBeVisible()
  })

  test('should send a message and clear the input', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]')
    await textarea.fill('Hello, who are you?')
    await textarea.press('Enter')
    await page.waitForTimeout(2000)
    await expect(textarea).toHaveValue('')
  })

  test('should show a response after sending a message', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder="Type a message..."]')
    await textarea.fill('What is 2 + 2?')
    await textarea.press('Enter')
    await expect(page.locator('div.prose').first()).toBeVisible({ timeout: 20000 })
  })

  test('should create a new chat when New Chat is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'New Chat' }).click()
    await expect(page.getByText('How can I help you today?')).toBeVisible()
  })

  test('should show chat history in sidebar', async ({ page }) => {
    const chatItems = page.locator('div[role="button"]').filter({ has: page.locator('p.truncate') })
    const count = await chatItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should send message when Enter is pressed', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('keyboard test message')
    await input.press('Enter')
    await expect(page.locator('div.prose').first()).toBeVisible({ timeout: 20000 })
  })

  test('should add new line when Shift+Enter is pressed', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('first line')
    await input.press('Shift+Enter')
    await input.type('second line')
    const value = await input.inputValue()
    expect(value).toContain('\n')
    const responseCount = await page.locator('div.prose').count()
    expect(responseCount).toBe(0)
  })

  test('should not send empty message when Enter is pressed', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('')
    await input.press('Enter')
    await page.waitForTimeout(1000)
    const responseCount = await page.locator('div.prose').count()
    expect(responseCount).toBe(0)
  })

})