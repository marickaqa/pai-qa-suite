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

    test('should not save chat to history when incognito is on', async ({ page }) => {
        const chatItems = page.locator('div[role="button"]').filter({ has: page.locator('p.truncate') })
        const countBefore = await chatItems.count()

        const toggle = page.locator('button[role="switch"]').first()
        await toggle.click()
        await page.waitForTimeout(500)

        const input = page.locator('textarea[placeholder="Type a message..."]')
        await input.fill('incognito test message abc123')
        await input.press('Enter')
        await page.waitForTimeout(4000)

        await page.goto('/')
        await page.waitForTimeout(1000)

        const countAfter = await chatItems.count()
        expect(countAfter).toBe(countBefore)
    })

})