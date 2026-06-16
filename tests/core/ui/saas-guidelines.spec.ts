import { test, expect, type Page } from '@playwright/test'

/**
 * ## saas-guidelines.spec.ts
 *
 * Tests guideline CRUD operations on the Telaris support bot agent.
 * Each test is self-contained — created guidelines are deleted after.
 *
 * Uses reports/saas-session.json for all tests.
 */

test.describe('SaaS Guidelines', () => {
    test.use({ storageState: 'reports/saas-session.json' })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat.paicloud.ai'
    const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    const GUIDELINES_URL = `${SAAS_URL}/agent/${AGENT_ID}/guidelines`

    const openNewGuidelineForm = async (page: Page) => {
        const sectionHeader = page.locator('div[role="button"]').filter({ hasText: 'Communication style' }).first()
        const isExpanded = await sectionHeader.getAttribute('aria-expanded')
        if (isExpanded === 'false') {
            await sectionHeader.click()
            await page.waitForTimeout(300)
        }
        await page.getByRole('button', { name: 'New guideline' }).first().click()
        await page.waitForTimeout(300)
    }

    const fillGuidelineForm = async (page: Page, name: string, content: string) => {
        await page.locator('input[name="name"]').fill(name)
        await page.locator('textarea[name="content"]').fill(content)
    }

    const deleteGuideline = async (page: Page, name: string) => {
        await page.getByText(name).click()
        await page.waitForTimeout(500)
        await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
        await page.waitForTimeout(500)
    }

    test('should show New guideline form when button is clicked', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        await openNewGuidelineForm(page)
        await expect(page.locator('input[name="name"]')).toBeVisible()
        await expect(page.locator('textarea[name="content"]')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Create' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    })

    test('should cancel guideline creation when Cancel is clicked', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        await openNewGuidelineForm(page)
        await page.getByRole('button', { name: 'Cancel' }).click()
        await page.waitForTimeout(300)
        await expect(page.locator('input[name="name"]')).not.toBeVisible()
    })

    test('should not submit guideline with empty name', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        await openNewGuidelineForm(page)
        await page.locator('textarea[name="content"]').fill('Some content')
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForTimeout(500)
        await expect(page.locator('input[name="name"]')).toBeVisible()
    })

    test('should not submit guideline with empty content', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        await openNewGuidelineForm(page)
        await page.locator('input[name="name"]').fill('QA Test Guideline')
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForTimeout(500)
        await expect(page.locator('textarea[name="content"]')).toBeVisible()
    })

    test('should create a new guideline and show it in the section', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        const name = `qa-guideline-${Date.now()}`
        await openNewGuidelineForm(page)
        await fillGuidelineForm(page, name, 'This is a QA test guideline. Please ignore.')
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForTimeout(1000)
        await expect(page.getByText(name)).toBeVisible()
        await deleteGuideline(page, name)
    })

    test('should enable and disable a guideline toggle', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        const name = `qa-toggle-${Date.now()}`
        await openNewGuidelineForm(page)
        await fillGuidelineForm(page, name, 'Toggle test guideline.')
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForTimeout(1000)
        await expect(page.getByText(name)).toBeVisible()
        const toggle = page.getByRole('switch').last()
        const stateBefore = await toggle.getAttribute('aria-checked')
        await toggle.click()
        await page.waitForTimeout(500)
        const stateAfter = await toggle.getAttribute('aria-checked')
        expect(stateBefore).not.toEqual(stateAfter)
        await deleteGuideline(page, name)
    })

    test('should delete a guideline', async ({ page }) => {
        await page.goto(GUIDELINES_URL)
        const name = `qa-delete-${Date.now()}`
        await openNewGuidelineForm(page)
        await fillGuidelineForm(page, name, 'Guideline to be deleted.')
        await page.getByRole('button', { name: 'Create' }).click()
        await page.waitForTimeout(1000)
        await expect(page.getByText(name)).toBeVisible()
        await deleteGuideline(page, name)
        await expect(page.getByText(name)).not.toBeVisible()
    })
})