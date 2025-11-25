import { test, expect } from '@playwright/test';

test.describe('Dashboard - Agents View', () => {
  test.beforeEach(async ({ page }) => {
    // Login as user
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('userpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/protected');

    // Navigate to agents page
    await page.goto('/dashboard/agents');
    await expect(page).toHaveURL('/dashboard/agents');
  });

  test('should display agents list', async ({ page }) => {
    // Verify page heading
    await expect(page.getByRole('heading', { name: /agents/i })).toBeVisible();

    // Verify agents grid/list
    await expect(page.locator('[data-testid="agents-list"]')).toBeVisible();

    // Verify at least one agent card is visible
    await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(1);
  });

  test('should view agent details', async ({ page }) => {
    // Click on first agent card
    await page.locator('[data-testid="agent-card"]').first().click();

    // Verify agent details modal/page
    await expect(page.getByRole('heading', { name: /agent details/i })).toBeVisible();

    // Verify key information is displayed
    await expect(page.getByText(/name/i)).toBeVisible();
    await expect(page.getByText(/type/i)).toBeVisible();
    await expect(page.getByText(/model/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
  });

  test('should filter agents by type', async ({ page }) => {
    // Click type filter
    await page.getByRole('combobox', { name: /filter by type/i }).click();
    await page.getByRole('option', { name: /leader/i }).click();

    // Verify only leader agents are displayed
    const agents = page.locator('[data-testid="agent-card"]');
    await expect(agents).not.toHaveCount(0);

    // Verify all visible agents have leader type
    const typeLabels = page.locator('[data-testid="agent-card"] [data-testid="agent-type"]:has-text("leader")');
    await expect(typeLabels).not.toHaveCount(0);
  });

  test('should filter agents by status', async ({ page }) => {
    // Click status filter
    await page.getByRole('combobox', { name: /filter by status/i }).click();
    await page.getByRole('option', { name: /active/i }).click();

    // Verify only active agents are displayed
    const agents = page.locator('[data-testid="agent-card"]');
    await expect(agents).not.toHaveCount(0);

    // Verify all visible agents have active status
    const statusLabels = page.locator('[data-testid="agent-card"] [data-testid="agent-status"]:has-text("active")');
    await expect(statusLabels).not.toHaveCount(0);
  });

  test('should search agents by name', async ({ page }) => {
    // Enter search term
    await page.getByPlaceholder(/search agents/i).fill('orchestrator');

    // Verify filtered results
    await expect(page.getByText(/orchestrator/i)).toBeVisible();

    // Clear search
    await page.getByPlaceholder(/search agents/i).clear();

    // Verify all agents displayed again
    await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(1);
  });

  test('should display agent statistics', async ({ page }) => {
    // Verify statistics cards
    await expect(page.getByText(/total agents/i)).toBeVisible();
    await expect(page.getByText(/active agents/i)).toBeVisible();
    await expect(page.getByText(/leaders/i)).toBeVisible();
    await expect(page.getByText(/workers/i)).toBeVisible();

    // Verify numeric values are displayed
    await expect(page.locator('[data-testid="total-agents-count"]')).toHaveText(/\d+/);
    await expect(page.locator('[data-testid="active-agents-count"]')).toHaveText(/\d+/);
  });

  test('should display agent hierarchy visualization', async ({ page }) => {
    // Click hierarchy view button
    await page.getByRole('button', { name: /hierarchy view/i }).click();

    // Verify hierarchy visualization is displayed
    await expect(page.locator('[data-testid="agent-hierarchy"]')).toBeVisible();

    // Verify CEO agent is at top
    await expect(page.getByText(/orchestrator-main/i)).toBeVisible();

    // Verify leader agents are displayed
    await expect(page.getByText(/fase-1-conceptualizacion-leader/i)).toBeVisible();
  });

  test('should view agent model information', async ({ page }) => {
    // Click on first agent card
    await page.locator('[data-testid="agent-card"]').first().click();

    // Verify model information section
    await expect(page.getByText(/model/i)).toBeVisible();
    await expect(page.getByText(/claude-sonnet/i)).toBeVisible();

    // Verify model capabilities
    await expect(page.getByText(/capabilities/i)).toBeVisible();
  });

  test('should display agent tools', async ({ page }) => {
    // Click on first agent card
    await page.locator('[data-testid="agent-card"]').first().click();

    // Verify tools section
    await expect(page.getByText(/tools/i)).toBeVisible();

    // Verify at least one tool is listed
    await expect(page.locator('[data-testid="agent-tool"]')).toHaveCount(1);

    // Verify tool names
    await expect(page.getByText(/read/i)).toBeVisible();
    await expect(page.getByText(/write/i)).toBeVisible();
  });

  test('should sort agents by name', async ({ page }) => {
    // Click sort dropdown
    await page.getByRole('combobox', { name: /sort by/i }).click();
    await page.getByRole('option', { name: /name/i }).click();

    // Verify agents are sorted alphabetically
    const agentNames = await page.locator('[data-testid="agent-card"] [data-testid="agent-name"]').allTextContents();
    const sortedNames = [...agentNames].sort();
    expect(agentNames).toEqual(sortedNames);
  });

  test('should display agent responsibilities', async ({ page }) => {
    // Click on first agent card
    await page.locator('[data-testid="agent-card"]').first().click();

    // Verify responsibilities section
    await expect(page.getByText(/responsibilities/i)).toBeVisible();

    // Verify at least one responsibility is listed
    await expect(page.locator('[data-testid="agent-responsibility"]')).toHaveCount(1);
  });
});
