import { test, expect } from '@playwright/test';

test.describe('SecLab XDR / CloudGuard Authentication & Smoke Test', () => {
  test('unauthenticated access to /alerts redirects to /login', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('text=Sign in to SecLab XDR')).toBeVisible();
  });

  test('login with valid credentials and verify alerts view', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[placeholder="Enter username or email"]', 'sarah.chen');
    await page.fill('input[placeholder="Enter your password"]', 'CloudGuard2026!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or requested page
    await page.waitForURL(/\/(dashboard|alerts)/);

    // Navigate to alerts
    await page.goto('/alerts');
    await expect(page).toHaveURL(/\/alerts/);

    // Verify main page elements
    await expect(page.locator('h1')).toContainText('Alerts');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });
});
