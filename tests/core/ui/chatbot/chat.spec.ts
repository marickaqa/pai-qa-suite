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

  test('should rename chat via header button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('rename test message')
    await input.press('Enter')
    await expect(page.locator('div.prose').first()).toBeVisible({ timeout: 20000 })

    const renameBtn = page.locator('button[title="Rename chat"]').first()
    await renameBtn.waitFor({ state: 'attached', timeout: 15000 })
    await renameBtn.dispatchEvent('click')

    const renameInput = page.locator('input[maxlength="128"]')
    await expect(renameInput).toBeVisible({ timeout: 5000 })
    await renameInput.fill('Renamed Chat')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(1000)

    await expect(page.locator('span.truncate').filter({ hasText: 'Renamed Chat' }).first()).toBeVisible()
  })

  test('should rename chat via sidebar history button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('sidebar rename test')
    await input.press('Enter')
    await expect(page.locator('div.prose').first()).toBeVisible({ timeout: 20000 })

    const chatItems = page.locator('div[role="button"]').filter({ has: page.locator('p.truncate') })
    await chatItems.first().waitFor({ state: 'attached', timeout: 15000 })

    const renameBtn = chatItems.first().locator('button[title="Rename chat"]')
    await renameBtn.waitFor({ state: 'attached', timeout: 5000 })
    await renameBtn.dispatchEvent('click')

    const renameInput = page.locator('input[maxlength="128"]')
    await expect(renameInput).toBeVisible({ timeout: 5000 })
    await renameInput.fill('Sidebar Renamed Chat')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(1000)

    await expect(page.locator('span.truncate').filter({ hasText: 'Sidebar Renamed Chat' }).first()).toBeVisible()
  })

  test('should always show copy button on assistant response without hover', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What is 2 + 2?')
    await input.press('Enter')

    const response = page.locator('div.prose').first()
    await expect(response).toBeVisible({ timeout: 20000 })

    const copyBtn = page.locator('button[title="Copy to clipboard"]').first()
    await expect(copyBtn).toBeVisible({ timeout: 5000 })
  })

  test('should copy chat response to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What is 2 + 2?')
    await input.press('Enter')

    const response = page.locator('div.prose').first()
    await expect(response).toBeVisible({ timeout: 20000 })

    const copyBtn = page.locator('button[title="Copy to clipboard"]').first()
    await expect(copyBtn).toBeVisible({ timeout: 5000 })
    await copyBtn.click()
    await page.waitForTimeout(500)

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard.length).toBeGreaterThan(0)
  })

  test('should show download button on assistant response', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What is 2 + 2?')
    await input.press('Enter')
    const downloadBtn = page.locator('button[title="Download"]').first()
    await expect(downloadBtn).toBeVisible({ timeout: 20000 })
  })

  test('should show PDF Markdown and DOCX options when download button is clicked', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What is 2 + 2?')
    await input.press('Enter')
    const downloadBtn = page.locator('button[title="Download"]').first()
    await expect(downloadBtn).toBeVisible({ timeout: 20000 })
    await downloadBtn.click()
    await expect(page.getByText('PDF', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Markdown', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('DOCX', { exact: true }).first()).toBeVisible()
  })

  test('should close download dropdown when a format is selected', async ({ page }) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What is 2 + 2?')
    await input.press('Enter')
    const downloadBtn = page.locator('button[title="Download"]').first()
    await expect(downloadBtn).toBeVisible({ timeout: 20000 })
    await downloadBtn.click()
    await page.waitForTimeout(300)
    // verify dropdown opened
    const pdfBtn = page.locator('button').filter({ hasText: /^PDF$/ }).first()
    await expect(pdfBtn).toBeVisible()
    // count PDF buttons before click
    const countBefore = await page.locator('button').filter({ hasText: /^PDF$/ }).count()
    await pdfBtn.click()
    await page.waitForTimeout(500)
    // dropdown closed — count should decrease
    const countAfter = await page.locator('button').filter({ hasText: /^PDF$/ }).count()
    expect(countAfter).toBeLessThan(countBefore)
  })

})