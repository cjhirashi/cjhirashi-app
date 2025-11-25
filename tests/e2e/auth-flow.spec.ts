import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should complete full authentication flow: login → dashboard → logout', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    await expect(page).toHaveURL('/auth/login');

    // Verify login page elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Fill login form with test credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Submit login form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to protected route
    await page.waitForURL('/protected');
    await expect(page).toHaveURL('/protected');

    // Verify dashboard elements
    await expect(page.getByText(/welcome/i)).toBeVisible();

    // Perform logout
    await page.getByRole('button', { name: /sign out/i }).click();

    // Verify redirect to login page
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Verify error message appears
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click sign up link
    await page.getByRole('link', { name: /sign up/i }).click();

    // Verify navigation
    await expect(page).toHaveURL('/auth/sign-up');
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click forgot password link
    await page.getByRole('link', { name: /forgot password/i }).click();

    // Verify navigation
    await expect(page).toHaveURL('/auth/forgot-password');
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  });
});
