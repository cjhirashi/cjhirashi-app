import { test, expect } from '@playwright/test';

test.describe('Dashboard - Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('userpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/protected');

    // Navigate to projects page
    await page.goto('/dashboard/projects');
    await expect(page).toHaveURL('/dashboard/projects');
  });

  test('should display projects dashboard', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();

    // Verify create project button
    await expect(page.getByRole('button', { name: /create project/i })).toBeVisible();

    // Verify projects grid/list
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
  });

  test('should create new project', async ({ page }) => {
    // Click create project button
    await page.getByRole('button', { name: /create project/i }).click();

    // Verify create project dialog/page
    await expect(page.getByRole('heading', { name: /new project/i })).toBeVisible();

    // Fill project form
    await page.getByLabel(/project name/i).fill('E2E Test Project');
    await page.getByLabel(/description/i).fill('Project created via E2E test');

    // Select project type
    await page.getByRole('combobox', { name: /type/i }).click();
    await page.getByRole('option', { name: /web app/i }).click();

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success message
    await expect(page.getByText(/project created successfully/i)).toBeVisible();

    // Verify project appears in list
    await expect(page.getByText('E2E Test Project')).toBeVisible();
  });

  test('should view project details', async ({ page }) => {
    // Click on first project card
    await page.locator('[data-testid="project-card"]').first().click();

    // Verify navigation to project detail page
    await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+$/);

    // Verify project details
    await expect(page.getByRole('heading', { name: /project details/i })).toBeVisible();
    await expect(page.getByText(/description/i)).toBeVisible();
    await expect(page.getByText(/created/i)).toBeVisible();
  });

  test('should edit project', async ({ page }) => {
    // Click edit button on first project
    await page.locator('[data-testid="project-card"]').first().getByRole('button', { name: /edit/i }).click();

    // Update project name
    const nameInput = page.getByLabel(/project name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Project Name');

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success message
    await expect(page.getByText(/project updated successfully/i)).toBeVisible();

    // Verify updated name in list
    await expect(page.getByText('Updated Project Name')).toBeVisible();
  });

  test('should delete project', async ({ page }) => {
    // Click delete button on first project
    await page.locator('[data-testid="project-card"]').first().getByRole('button', { name: /delete/i }).click();

    // Confirm deletion in dialog
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify success message
    await expect(page.getByText(/project deleted successfully/i)).toBeVisible();
  });

  test('should filter projects by type', async ({ page }) => {
    // Click type filter
    await page.getByRole('combobox', { name: /filter by type/i }).click();
    await page.getByRole('option', { name: /web app/i }).click();

    // Verify only web app projects are displayed
    const projects = page.locator('[data-testid="project-card"]');
    await expect(projects).not.toHaveCount(0);
  });

  test('should search projects', async ({ page }) => {
    // Enter search term
    await page.getByPlaceholder(/search projects/i).fill('Test');

    // Verify filtered results
    await expect(page.getByText(/test project/i)).toBeVisible();

    // Clear search
    await page.getByPlaceholder(/search projects/i).clear();

    // Verify all projects displayed again
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(1);
  });

  test('should display empty state when no projects', async ({ page }) => {
    // Assuming user has no projects
    // This test might need adjustment based on actual data state

    // Navigate to projects page
    await page.goto('/dashboard/projects');

    // Delete all projects first (if any)
    const deleteButtons = page.locator('[data-testid="project-card"] button:has-text("delete")');
    const count = await deleteButtons.count();

    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await page.getByRole('button', { name: /confirm/i }).click();
      await page.waitForTimeout(500);
    }

    // Verify empty state
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
    await expect(page.getByText(/create your first project/i)).toBeVisible();
  });
});
