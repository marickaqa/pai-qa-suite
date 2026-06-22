import { test, expect } from '@playwright/test'

const WIDGET_URL = 'https://perception-chatbot-dummy-company-env-testing-noctocodeteam.vercel.app/'

// BUG-019: widget leaks raw <tool_call> syntax when knowledge base has no answer
// and falls back to human handoff. Expected: natural language response.
// Actual: raw <tool_call><function=handoff_to_human>...</tool_call> visible in response.

test.describe('Known Bug BUG-019 — tool call syntax leak on human handoff', () => {

  test('widget should not expose raw tool call syntax when falling back to human handoff', async ({ page }) => {
    await page.goto(WIDGET_URL)
    await page.waitForTimeout(2000)
    await page.locator('button.pai-launcher').click()
    await page.waitForTimeout(1000)

    const input = page.locator('textarea.pai-input')
    await input.fill('Is there a money back guarantee?')
    await input.press('Enter')
    await page.waitForTimeout(8000)

    const bubbles = page.locator('.pai-bubble')
    expect(await bubbles.count()).toBeGreaterThan(0)
    const response = await bubbles.last().innerText()

    expect(response).not.toContain('<tool_call>')
    expect(response).not.toContain('<function=')
    expect(response).not.toContain('</tool_call>')
  })

})

