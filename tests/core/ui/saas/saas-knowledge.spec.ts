import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

/**
 * ## saas-knowledge.spec.ts
 *
 * Tests knowledge CRUD operations on the Telaris support bot agent.
 * Covers file upload, folder creation, and crawl website form.
 * Each test is self-contained — created items are deleted after,
 * and deletions are VERIFIED (confirmation dialog + row disappearance).
 *
 * Uses reports/saas-session.json for all tests.
 *
 * NOTE: no waitForTimeout in this file — all waits are condition-based
 * (element state or network response). Keep it that way.
 */

test.describe('SaaS Knowledge', () => {
    test.use({ storageState: 'reports/saas-session.json' })

    const SAAS_URL = process.env.SAAS_URL || 'https://chat-dev.paicloud.ai'
    const AGENT_ID = '77d5b55e-3326-4f2d-8380-b2bef6135552'
    const KNOWLEDGE_URL = `${SAAS_URL}/agent/${AGENT_ID}/knowledge`

    // The knowledge page occasionally takes a long time to render on dev.
    // Navigate and wait for a known anchor before interacting, so a slow
    // page gets a clear allowance and a hung page fails with a clear message.
    async function gotoKnowledge(page: Page) {
        await page.goto(KNOWLEDGE_URL)
        await expect(
            page.getByRole('button', { name: 'Upload file', exact: true }),
            'knowledge page did not render its toolbar'
        ).toBeVisible({ timeout: 45000 })
    }

    // Deleting a document opens a confirmation dialog ("Are you sure you want
    // to remove ...?" with a Remove button). Folder deletion may or may not
    // confirm, and the label may differ — so: if a Remove/Delete confirm
    // button shows up shortly after clicking delete, click it; otherwise
    // assume the deletion was immediate. The caller ALWAYS verifies the
    // entry actually disappeared, so a missed dialog still fails loudly.
    async function confirmRemovalIfAsked(page: Page) {
        const confirmBtn = page.getByRole('button', { name: /^(Remove|Delete|Delete folder|Confirm)$/ }).first()
        try {
            await confirmBtn.waitFor({ state: 'visible', timeout: 2500 })
            await confirmBtn.click()
        } catch {
            // no confirmation dialog appeared — deletion was immediate
        }
    }

    // --- New Folder ---

    test('should show folder name input when New folder is clicked', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'New folder', exact: true }).click()
        await expect(page.locator('input[placeholder="e.g. Product Documentation"]').first()).toBeVisible()
    })

    test('should create a new folder and show it in the list', async ({ page }) => {
        await gotoKnowledge(page)
        const folderName = `qa-folder-${Date.now()}`
        await page.getByRole('button', { name: 'New folder', exact: true }).click()

        const nameInput = page.locator('input[placeholder="e.g. Product Documentation"]').first()
        await expect(nameInput).toBeVisible()
        await nameInput.fill(folderName)

        const folderResponse = page.waitForResponse(r => r.url().includes('/folder') && r.request().method() === 'POST')
        await page.keyboard.press('Enter')
        await folderResponse
        // scope to the Files list — the folder name also appears inside the
        // delete confirmation dialog, so an unscoped getByText matches twice
        const folderEntry = page.getByLabel('Files').getByText(folderName)
        await expect(folderEntry).toBeVisible({ timeout: 10000 })

        // cleanup — hover the folder name itself (not an outer container) so the
        // row's delete control appears, confirm the dialog, verify it's gone
        await folderEntry.hover()
        const deleteBtn = page.locator('button[aria-label*="Delete"], button[title*="Delete"]').first()
        await expect(deleteBtn, 'delete control did not appear on folder row hover').toBeVisible({ timeout: 5000 })
        await deleteBtn.click()
        await confirmRemovalIfAsked(page)
        await expect(folderEntry, `folder ${folderName} was not removed — cleanup failed`).not.toBeVisible({ timeout: 10000 })
    })

    // --- Upload File ---

    test('should show upload area when Upload file is clicked', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()
        await expect(page.getByText('Drag & drop or click to browse')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    })

    test('should close upload area when Cancel is clicked', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()
        await expect(page.getByText('Drag & drop or click to browse')).toBeVisible()
        await page.getByRole('button', { name: 'Cancel' }).click()
        await expect(page.getByText('Drag & drop or click to browse')).not.toBeVisible()
    })

    test('should upload a file and show it in the list', async ({ page }) => {
        const filePath = path.join('reports', 'qa-knowledge-test.txt')
        fs.writeFileSync(filePath, 'QA knowledge base test file. Please ignore.')

        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Upload file', exact: true }).click()

        const dialog = page.getByRole('dialog', { name: 'Upload Document' })
        await expect(dialog).toBeVisible()

        const fileInput = dialog.locator('input[type="file"]')
        await fileInput.setInputFiles(filePath)

        const uploadBtn = page.getByRole('button', { name: 'Upload' })
        await expect(uploadBtn).toBeEnabled()
        await uploadBtn.click()

        // upload complete = dialog closes and the file appears in the list
        await expect(dialog).not.toBeVisible({ timeout: 20000 })
        await expect(page.getByText('qa-knowledge-test.txt').first()).toBeVisible({ timeout: 20000 })

        // cleanup — remove ALL qa-knowledge-test.txt entries (this run's and any
        // debris from older runs). Each removal: click delete, confirm the
        // dialog, verify the count actually drops. Fails loudly if it doesn't.
        const deleteButtons = page.locator('button[aria-label*="qa-knowledge-test"]')
        let remaining = await deleteButtons.count()
        while (remaining > 0) {
            await deleteButtons.first().click({ force: true })
            await confirmRemovalIfAsked(page)
            // wait for the confirmation dialog to fully close before counting —
            // its text contains the filename and would otherwise match briefly
            await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 })
            await expect(deleteButtons, 'document was not removed — cleanup failed').toHaveCount(remaining - 1, { timeout: 10000 })
            remaining -= 1
        }

        fs.unlinkSync(filePath)
    })

    // --- Crawl Website ---

    test('should show crawl form when Crawl website is clicked', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await expect(page.locator('input[placeholder="https://docs.example.com"]')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Start crawling' })).toBeVisible()
    })

    test('should not start crawling with empty URL', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await expect(page.getByRole('button', { name: 'Start crawling' })).toBeDisabled()
    })

    test('should show Add pattern button in crawl form', async ({ page }) => {
        await gotoKnowledge(page)
        await page.getByRole('button', { name: 'Crawl website' }).click()
        await expect(page.getByRole('button', { name: 'Add pattern' })).toBeVisible()
    })
})