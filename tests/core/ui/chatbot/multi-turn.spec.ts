import { test, expect } from '@playwright/test'

test.describe('Core — Multi-turn Conversation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'New Chat' }).waitFor({ state: 'visible', timeout: 15000 })
    await page.getByRole('button', { name: 'New Chat' }).click()
    await expect(page.getByText('How can I help you today?')).toBeVisible({ timeout: 10000 })
  })

  const sendMessage = async (page: any, message: string) => {
    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill(message)
    await input.press('Enter')
    await expect(page.locator('div.prose').last()).toBeVisible({ timeout: 20000 })

    // wait for streaming to finish by polling until text stops changing
    const response = page.locator('div.prose').last()
    let previousText = ''
    let stableCount = 0
    for (let i = 0; i < 30; i++) {
      const currentText = await response.innerText()
      if (currentText === previousText && currentText.length > 0) {
        stableCount++
        if (stableCount >= 2) break
      } else {
        stableCount = 0
      }
      previousText = currentText
      await page.waitForTimeout(500)
    }
  }

  test('should remember a name given earlier in the conversation', async ({ page }) => {
    await sendMessage(page, 'My name is Alex')
    await sendMessage(page, 'What is my name?')

    const response = page.locator('div.prose').last()
    await expect(response).toContainText(/Alex/i)
  })

  test('should remember a number given earlier in the conversation', async ({ page }) => {
    await sendMessage(page, 'My favourite number is 42')
    await sendMessage(page, 'What is my favourite number?')

    const response = page.locator('div.prose').last()
    await expect(response).toContainText(/42/)
  })

  test('should maintain context across three turns', async ({ page }) => {
    await sendMessage(page, 'I am planning a trip to Tokyo')
    await sendMessage(page, 'I will be there for 5 days')
    await sendMessage(page, 'Where am I going and for how long?')

    const response = page.locator('div.prose').last()
    await expect(response).toContainText(/Tokyo/i)
    await expect(response).toContainText(/5|five/i)
  })

  test('should not confuse context from a new chat', async ({ page }) => {
    await sendMessage(page, 'My name is Alex')

    await page.getByRole('button', { name: 'New Chat' }).click()
    await expect(page.getByText('How can I help you today?')).toBeVisible({ timeout: 10000 })

    await sendMessage(page, 'What is my name?')

    const response = page.locator('div.prose').last()
    await expect(response).not.toContainText(/Alex/i)
  })

})