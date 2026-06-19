import { test, expect } from '@playwright/test'

/**
 * ## subtitles-team.spec.ts
 *
 * Tests the Team page and member detail page.
 * Uses reports/subtitles-session.json for all tests.
 */

test.describe('Subtitles Team', () => {
    test.use({ storageState: 'reports/subtitles-session.json' })

    const BASE_URL = process.env.SUBTITLES_URL || 'https://subtitles-dev.paicloud.ai'
    const MEMBER_URL = `${BASE_URL}/team/MDoe5SfvZBGV0mKxDkacn7JG2xuIBnZP`

    // --- Team list ---

    test('should show team members page', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await expect(page.getByRole('heading', { name: 'Team members' })).toBeVisible()
    })

    test('should show table columns', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await expect(page.getByText('Member', { exact: true })).toBeVisible()
        await expect(page.getByText('Role', { exact: true })).toBeVisible()
        await expect(page.getByText('Status', { exact: true })).toBeVisible()
        await expect(page.getByText('Last active')).toBeVisible()
    })

    test('should show QA user in members list', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await expect(page.getByText('QA Automation')).toBeVisible()
        await expect(page.getByText('Admin')).toBeVisible()
        await expect(page.getByText('Active', { exact: true })).toBeVisible()
    })

    test('should show Invite teammate button', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await expect(page.getByRole('button', { name: 'Invite teammate' })).toBeVisible()
    })

    test('should open invite dialog when Invite teammate is clicked', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await page.getByRole('button', { name: 'Invite teammate' }).click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('dialog')).toBeVisible()
    })

    test('should show 3-dot menu on member row', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await page.locator('button:has(.lucide-ellipsis)').click()
        await page.waitForTimeout(300)
        await expect(page.getByRole('menuitem', { name: 'Edit member' })).toBeVisible()
    })

    test('should navigate to member detail when Edit member is clicked', async ({ page }) => {
        await page.goto(`${BASE_URL}/team`)
        await page.locator('button:has(.lucide-ellipsis)').click()
        await page.waitForTimeout(300)
        await page.getByRole('menuitem', { name: 'Edit member' }).click()
        await expect(page).toHaveURL(/team\//)
    })

    // --- Member detail ---

    test('should show member detail page', async ({ page }) => {
        await page.goto(MEMBER_URL)
        await expect(page.getByRole('heading', { name: 'QA Automation' }).last()).toBeVisible()
        await expect(page.getByText('qa-subtitles@noctocode.com').first()).toBeVisible()
    })

    test('should show personal data section', async ({ page }) => {
        await page.goto(MEMBER_URL)
        await expect(page.getByText('Personal data')).toBeVisible()
        await expect(page.getByText('Full name', { exact: true })).toBeVisible()
        await expect(page.getByText('Email', { exact: true })).toBeVisible()
        await expect(page.getByText('Role', { exact: true })).toBeVisible()
    })

    test('should show cannot change own role message', async ({ page }) => {
        await page.goto(MEMBER_URL)
        await expect(page.getByText('You cannot change your own role.')).toBeVisible()
    })

    test('should show recent activity section', async ({ page }) => {
        await page.goto(MEMBER_URL)
        await expect(page.getByText('Recent activity')).toBeVisible()
        await expect(page.getByText('Joined team')).toBeVisible()
    })

    test('should show breadcrumb on member detail page', async ({ page }) => {
        await page.goto(MEMBER_URL)
        await expect(page.getByRole('link', { name: 'Team' })).toBeVisible()
        await expect(page.getByText('QA Automation').first()).toBeVisible()
    })
})