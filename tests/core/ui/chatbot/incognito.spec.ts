import { test, expect } from '@playwright/test'

test.describe('Core — Incognito Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    test('should show incognito toggle', async ({ page }) => {
        await expect(page.locator('button[role="switch"]').first()).toBeVisible({ timeout: 10000 })
    })

    test('should be off by default', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await expect(toggle).toBeVisible({ timeout: 10000 })
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('false')
    })

    test('should turn on when clicked', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await expect(toggle).toBeVisible({ timeout: 10000 })
        await toggle.click()
        await page.waitForTimeout(500)
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('true')
    })

    test('should turn off when clicked again', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await expect(toggle).toBeVisible({ timeout: 10000 })
        await toggle.click()
        await page.waitForTimeout(500)
        await toggle.click()
        await page.waitForTimeout(500)
        const checked = await toggle.getAttribute('aria-checked')
        expect(checked).toBe('false')
    })

    test('should show incognito chat in history with incognito label', async ({ page }) => {
        const toggle = page.locator('button[role="switch"]').first()
        await expect(toggle).toBeVisible({ timeout: 10000 })
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