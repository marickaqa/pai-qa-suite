import { test, expect, type Page } from '@playwright/test'

async function openImageMode(page: Page) {
  await page.goto('/')
  await page.waitForTimeout(1000)

  const imageButton = page.locator('button').filter({
    has: page.locator('svg rect[x="3"][y="3"]')
  }).first()
  await imageButton.click()
  await page.getByText('Create image').click()
  await expect(page.getByText('Image', { exact: true })).toBeVisible()
}

test.describe('Core — Image Generation', () => {

  test('should show image toolbar when Create image is clicked', async ({ page }) => {
    await openImageMode(page)
    await expect(page.locator('select').first()).toBeVisible()
    await expect(page.locator('select').nth(1)).toBeVisible()
  })

  test('should show all aspect ratio options', async ({ page }) => {
    await openImageMode(page)
    const aspectSelect = page.locator('select').first()
    await expect(aspectSelect.locator('option[value="1328x1328"]')).toHaveText('square (1:1)')
    await expect(aspectSelect.locator('option[value="1664x928"]')).toHaveText('widescreen (16:9)')
    await expect(aspectSelect.locator('option[value="928x1664"]')).toHaveText('story (9:16)')
  })

  test('should show all style options', async ({ page }) => {
    await openImageMode(page)
    const styleSelect = page.locator('select').nth(1)
    await expect(styleSelect.locator('option[value="20"]')).toHaveText('fast')
    await expect(styleSelect.locator('option[value="30"]')).toHaveText('balanced')
    await expect(styleSelect.locator('option[value="40"]')).toHaveText('quality')
    await expect(styleSelect.locator('option[value="50"]')).toHaveText('max')
  })

  test('should be able to change aspect ratio', async ({ page }) => {
    await openImageMode(page)
    const aspectSelect = page.locator('select').first()
    await aspectSelect.selectOption('1664x928')
    await expect(aspectSelect).toHaveValue('1664x928')
  })

  test('should be able to change quality style', async ({ page }) => {
    await openImageMode(page)
    const styleSelect = page.locator('select').nth(1)
    await styleSelect.selectOption('40')
    await expect(styleSelect).toHaveValue('40')
  })

  test('should close image mode when X is clicked', async ({ page }) => {
    await openImageMode(page)
    const closeButton = page.locator('button').filter({
      has: page.locator('svg[viewBox="0 0 12 12"]')
    }).first()
    await closeButton.click()
    await expect(page.locator('select').first()).not.toBeVisible()
  })

})