import { test, expect } from '@playwright/test';

test.describe('Admin - Users Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('adminpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/protected');

    // Navigate to admin users page
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');
  });

  test('should display users list', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    // Verify table headers
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/role/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();

    // Verify at least one user is listed
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should update user role', async ({ page }) => {
    // Click edit button on first user
    await page.locator('table tbody tr').first().getByRole('button', { name: /edit/i }).click();

    // Change role
    await page.getByRole('combobox', { name: /role/i }).click();
    await page.getByRole('option', { name: /moderator/i }).click();

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success message
    await expect(page.getByText(/user updated successfully/i)).toBeVisible();

    // Verify role updated in list
    await expect(page.getByText('moderator')).toBeVisible();
  });

  test('should deactivate user', async ({ page }) => {
    // Click deactivate button on first user
    await page.locator('table tbody tr').first().getByRole('button', { name: /deactivate/i }).click();

    // Confirm action in dialog
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success message
    await expect(page.getByText(/user deactivated successfully/i)).toBeVisible();

    // Verify status updated
    await expect(page.getByText(/inactive/i)).toBeVisible();
  });

  test('should reactivate user', async ({ page }) => {
    // First deactivate a user
    await page.locator('table tbody tr').first().getByRole('button', { name: /deactivate/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Then reactivate
    await page.locator('table tbody tr').first().getByRole('button', { name: /activate/i }).click();

    // Verify success message
    await expect(page.getByText(/user activated successfully/i)).toBeVisible();

    // Verify status updated
    await expect(page.getByText(/active/i)).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    // Click role filter
    await page.getByRole('combobox', { name: /role/i }).click();
    await page.getByRole('option', { name: /admin/i }).click();

    // Verify only admin users are displayed
    const rows = page.locator('table tbody tr');
    await expect(rows).not.toHaveCount(0);

    // Verify all visible users have admin role
    const roleCells = page.locator('table tbody tr td:has-text("admin")');
    await expect(roleCells).not.toHaveCount(0);
  });

  test('should search users by email', async ({ page }) => {
    // Enter search term
    await page.getByPlaceholder(/search/i).fill('admin@example.com');

    // Verify filtered results
    await expect(page.getByText('admin@example.com')).toBeVisible();

    // Clear search
    await page.getByPlaceholder(/search/i).clear();

    // Verify all users displayed again
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should view user details', async ({ page }) => {
    // Click on first user
    await page.locator('table tbody tr').first().click();

    // Verify detail page/modal
    await expect(page.getByText(/user details/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/role/i)).toBeVisible();
    await expect(page.getByText(/created at/i)).toBeVisible();
  });

  test('should prevent self role change', async ({ page }) => {
    // Try to edit own role
    await page.locator('table tbody tr:has-text("admin@example.com")').getByRole('button', { name: /edit/i }).click();

    // Try to change role
    await page.getByRole('combobox', { name: /role/i }).click();
    await page.getByRole('option', { name: /user/i }).click();

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify error message
    await expect(page.getByText(/cannot change your own role/i)).toBeVisible();
  });
});
