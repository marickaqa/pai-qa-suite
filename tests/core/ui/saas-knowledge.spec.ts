import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * ## saas-knowledge.spec.ts
 *
 * Tests knowledge CRUD operations on the Telaris support bot agent.
 * Covers file upload, folder creation, and crawl website form.
 * Each test is self-contained — created items are deleted after.
 *
 * Uses reports/saas-session.json for all tests.
 */

test.describe('SaaS Knowledge', () => {
    test.use({ storageState: 'reports/saas-session.json' })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat.paicloud.ai'
    const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    const KNOWLEDGE_URL = `${SAAS_URL}/agent/${AGENT_ID}/knowledge`

    // --- New Folder ---

    test('should show folder name input when New folder is clicked', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'New folder', exact: true }).click()
        await page.waitForTimeout(300)
        await expect(page.locator('input[placeholder="e.g. Product Documentation"]').first()).toBeVisible()
    })

    test('should create a new folder and show it in the list', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        const folderName = `qa-folder-${Date.now()}`
        await page.getByRole('button', { name: 'New folder', exact: true }).click()
        await page.waitForTimeout(300)
        await page.locator('input[placeholder="e.g. Product Documentation"]').first().fill(folderName)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
        await expect(page.getByText(folderName)).toBeVisible()

        // cleanup — delete the folder
        const row = page.locator('div, tr').filter({ hasText: folderName }).first()
        await row.hover()
        await page.waitForTimeout(300)
        const deleteBtn = page.locator('button[aria-label*="Delete"], button[title*="Delete"]').first()
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click()
            await page.waitForTimeout(500)
        }
    })

    // --- Upload File ---

    test('should show upload area when Upload file is clicked', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Drag & drop or click to browse')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    })

    test('should close upload area when Cancel is clicked', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Drag & drop or click to browse')).toBeVisible()
        await page.getByRole('button', { name: 'Cancel' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByText('Drag & drop or click to browse')).not.toBeVisible()
    })

    test('should upload a file and show it in the list', async ({ page }) => {
        const filePath = path.join('reports', 'qa-knowledge-test.txt')
        fs.writeFileSync(filePath, 'QA knowledge base test file. Please ignore.')

        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()
        await page.waitForTimeout(300)

        const fileInput = page.getByRole('dialog', { name: 'Upload Document' }).locator('input[type="file"]')
        await fileInput.setInputFiles(filePath)
        await page.waitForTimeout(500)
        await page.getByRole('button', { name: 'Upload' }).click()
        await page.waitForTimeout(3000)

        await expect(page.getByText('qa-knowledge-test.txt').first()).toBeVisible()

        // cleanup — delete all qa-knowledge-test.txt files left by this or previous runs
        const deleteButtons = page.locator('button[aria-label*="qa-knowledge-test"]')
        const count = await deleteButtons.count()
        for (let i = 0; i < count; i++) {
            await deleteButtons.first().click({ force: true })
            await page.waitForTimeout(500)
        }

        fs.unlinkSync(filePath)
    })

    // --- Crawl Website ---

    test('should show crawl form when Crawl website is clicked', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await page.waitForTimeout(300)
        await expect(page.locator('input[placeholder="https://docs.example.com"]')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Start crawling' })).toBeVisible()
    })

    test('should not start crawling with empty URL', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('button', { name: 'Start crawling' })).toBeDisabled()
    })

    test('should show Add pattern button in crawl form', async ({ page }) => {
        await page.goto(KNOWLEDGE_URL)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('button', { name: 'Add pattern' })).toBeVisible()
    })
})