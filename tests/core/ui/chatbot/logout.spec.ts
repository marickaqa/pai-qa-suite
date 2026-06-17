import { test, expect, type Page } from '@playwright/test';

/**
 * ## logout.spec.ts
 *
 * Tests the logout flow from the chatbot UI.
 * Logout is accessed via the profile button at the bottom of the sidebar
 * (shows avatar + email), which opens a small popup with a Log out option.
 *
 * Uses the saved session from `reports/session.json`.
 * After logout, the session is invalidated — tests run in isolation.
 */

test.describe('Logout', () => {
  test.use({ storageState: 'reports/session.json' });

  const openProfileMenu = async (page: Page) => {
    await page.goto('/');
    await page.locator('button').filter({ hasText: /@/ }).last().click();
  };

  const clickLogOut = async (page: Page) => {
    await page.getByRole('button', { name: 'Log out' }).first().click();
  };

  test('should show email in profile button before logout', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('button').filter({ hasText: /@/ }).last()).toBeVisible();
  });

  test('should show logout option when profile is clicked', async ({ page }) => {
    await openProfileMenu(page);
    await expect(page.getByRole('button', { name: 'Log out' }).first()).toBeVisible();
  });

  test('should log out and redirect to login page', async ({ page }) => {
    await openProfileMenu(page);
    await clickLogOut(page);
    await expect(page).toHaveURL(/login|sign-in/);
  });

  test('should not be able to access chat after logout', async ({ page }) => {
    // Log in fresh since test 3 invalidated the session
    await page.goto('/login')
    await page.fill('#email', process.env.API_EMAIL || '')
    await page.fill('#password', process.env.API_PASSWORD || '')
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.toString().includes('login'), { timeout: 20000 })

    // Now log out and verify redirect blocks re-entry
    await page.locator('button').filter({ hasText: /@/ }).last().click()
    await page.getByRole('button', { name: 'Log out' }).first().click()
    await expect(page).toHaveURL(/login|sign-in/)
    await page.goto('/')
    await expect(page).toHaveURL(/login|sign-in/)
  })
});