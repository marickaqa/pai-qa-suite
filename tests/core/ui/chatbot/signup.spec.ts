import { test, expect, type Page } from '@playwright/test';

/**
 * ## signup.spec.ts
 *
 * Tests the signup flow from the chatbot UI.
 * Signup is accessed via "Sign Up" link on the login page → /signup.
 * Form fields: email, password, confirm password.
 *
 * Uses a fresh context with no session — no storageState.
 */

test.describe('Signup', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const navigateToSignup = async (page: Page) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/signup/);
  };

  test('should show signup link on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('should navigate to signup page when link is clicked', async ({ page }) => {
    await navigateToSignup(page);
    await expect(page).toHaveURL(/signup/);
  });

  test('should show signup form with all fields', async ({ page }) => {
    await navigateToSignup(page);
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  test('should not submit with empty fields', async ({ page }) => {
    await navigateToSignup(page);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/signup/);
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await navigateToSignup(page);
    await page.getByPlaceholder('Enter your email').fill('test@example.com');
    await page.getByPlaceholder('Create a password').fill('Password123!');
    await page.getByPlaceholder('Confirm your password').fill('Different123!');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText(/passwords? do not match|passwords? must match/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await navigateToSignup(page);
    await page.getByPlaceholder('Enter your email').fill('notanemail');
    await page.getByPlaceholder('Create a password').fill('Password123!');
    await page.getByPlaceholder('Confirm your password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/signup/);
  });

  test('should show generic confirmation for already registered email (no enumeration)', async ({ page }) => {
    // BUG-024 fixed — same confirmation shown regardless of whether email is registered
    await navigateToSignup(page);
    await page.getByPlaceholder('Enter your email').fill(process.env.API_EMAIL || '');
    await page.getByPlaceholder('Create a password').fill('Password123!');
    await page.getByPlaceholder('Confirm your password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('should show sign in link on signup page', async ({ page }) => {
    await navigateToSignup(page);
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });
});