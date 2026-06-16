import { test, expect } from '@playwright/test'

test.describe('Core — Incognito Mode', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(1000)
    })

    test('should show incognito toggle', async ({ page }) => {
        await expect(page.getByRole('switch', { name: 'Incognito' })).toBeVisible()
    })

    test('should be off by default', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('false')
    })

    test('should turn on when clicked', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await toggle.click()
        await page.waitForTimeout(500)
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('true')
    })

    test('should turn off when clicked again', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await toggle.click()
        await page.waitForTimeout(500)
        await toggle.click()
        await page.waitForTimeout(500)
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('false')
    })

    test('should show incognito chat in history with incognito label', async ({ page }) => {
        await page.goto('/')
        const toggle = page.locator('button').filter({ hasText: /incognito/i }).first()
        await toggle.click()
        await page.waitForTimeout(500)

        const input = page.locator('textarea')
        await input.fill('This is an incognito test message')
        await input.press('Enter')
        await page.waitForTimeout(5000)

        const badgeExists = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'))
            return spans.some(s => s.textContent?.trim() === 'Incognito')
        })
        expect(badgeExists).toBe(true)
    })
})