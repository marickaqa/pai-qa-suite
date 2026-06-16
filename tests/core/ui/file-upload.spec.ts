import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.describe('Core — File Upload', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('should show filename chip after file is attached', async ({ page }) => {
    const filePath = path.join('reports', 'test-upload.txt')
    fs.writeFileSync(filePath, 'This is a test file for upload automation.')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    await page.waitForTimeout(500)

    await expect(page.getByText('test-upload.txt')).toBeVisible()
  })

  test('should remove file when X is clicked', async ({ page }) => {
    const filePath = path.join('reports', 'test-upload.txt')
    fs.writeFileSync(filePath, 'This is a test file for upload automation.')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    await page.waitForTimeout(500)

    await expect(page.getByText('test-upload.txt')).toBeVisible()

    const removeButton = page.locator('button').filter({
      has: page.locator('svg path[d*="10.5 3.5"]')
    }).first()
    await removeButton.click({ force: true })
    await page.waitForTimeout(500)

    await expect(page.getByText('test-upload.txt')).not.toBeVisible()
  })

  test('should accept expected file types', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    const accept = await fileInput.getAttribute('accept')
    expect(accept).toContain('.pdf')
    expect(accept).toContain('.txt')
  })

  test('should allow sending a message with an attached file', async ({ page }) => {
    const filePath = path.join('reports', 'test-upload.txt')
    fs.writeFileSync(filePath, 'Hello from the automated test suite.')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    await page.waitForTimeout(500)

    const input = page.locator('textarea[placeholder="Type a message..."]')
    await input.fill('What does this file say?')
    await input.press('Enter')

    await expect(page.locator('div.prose').first()).toBeVisible({ timeout: 20000 })
  })

  test('should reject unsupported file types', async ({ page }) => {
    const filePath = path.join('reports', 'test-upload.exe')
    fs.writeFileSync(filePath, 'fake executable content')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)
    await page.waitForTimeout(500)

    await expect(page.getByText('test-upload.exe')).not.toBeVisible()
  })

  test('should handle oversized file gracefully', async ({ page }) => {
    const filePath = path.join('reports', 'test-large.txt')
    const largeContent = 'A'.repeat(11 * 1024 * 1024) // 11MB
    fs.writeFileSync(filePath, largeContent)

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)

    await expect(page.getByText(/exceeds the 10 MB limit|cannot be uploaded/i)).toBeVisible({ timeout: 3000 })

    fs.unlinkSync(filePath)
  })

})