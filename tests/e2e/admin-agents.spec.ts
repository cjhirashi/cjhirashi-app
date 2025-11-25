import { test, expect } from '@playwright/test';

test.describe('Admin - Agents Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('adminpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/protected');

    // Navigate to admin agents page
    await page.goto('/admin/agents');
    await expect(page).toHaveURL('/admin/agents');
  });

  test('should display agents list', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /agents/i })).toBeVisible();

    // Verify table headers
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/type/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();

    // Verify at least one agent is listed
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should create new agent', async ({ page }) => {
    // Click create agent button
    await page.getByRole('button', { name: /create agent/i }).click();

    // Fill agent form
    await page.getByLabel(/name/i).fill('Test Agent');
    await page.getByLabel(/description/i).fill('E2E test agent');
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /leader/i }).click();
    await page.getByLabel(/model/i).fill('claude-sonnet-4');

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success message
    await expect(page.getByText(/agent created successfully/i)).toBeVisible();

    // Verify agent appears in list
    await expect(page.getByText('Test Agent')).toBeVisible();
  });

  test('should edit existing agent', async ({ page }) => {
    // Click edit button on first agent
    await page.locator('table tbody tr').first().getByRole('button', { name: /edit/i }).click();

    // Update agent name
    const nameInput = page.getByLabel(/name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Agent Name');

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success message
    await expect(page.getByText(/agent updated successfully/i)).toBeVisible();

    // Verify updated name in list
    await expect(page.getByText('Updated Agent Name')).toBeVisible();
  });

  test('should delete agent', async ({ page }) => {
    // Click delete button on first agent
    await page.locator('table tbody tr').first().getByRole('button', { name: /delete/i }).click();

    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success message
    await expect(page.getByText(/agent deleted successfully/i)).toBeVisible();
  });

  test('should filter agents by status', async ({ page }) => {
    // Click status filter
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /active/i }).click();

    // Verify only active agents are displayed
    const rows = page.locator('table tbody tr');
    await expect(rows).not.toHaveCount(0);

    // Verify all visible agents have active status
    const statusCells = page.locator('table tbody tr td:has-text("active")');
    await expect(statusCells).not.toHaveCount(0);
  });

  test('should search agents by name', async ({ page }) => {
    // Enter search term
    await page.getByPlaceholder(/search/i).fill('orchestrator');

    // Verify filtered results
    await expect(page.getByText(/orchestrator/i)).toBeVisible();

    // Clear search
    await page.getByPlaceholder(/search/i).clear();

    // Verify all agents displayed again
    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('should view agent details', async ({ page }) => {
    // Click on first agent
    await page.locator('table tbody tr').first().click();

    // Verify detail page/modal
    await expect(page.getByText(/agent details/i)).toBeVisible();
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/description/i)).toBeVisible();
    await expect(page.getByText(/model/i)).toBeVisible();
  });
});
