import { test, expect } from '@playwright/test';

const E2E_USER = process.env.E2E_USER;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

/**
 * B5 Verification Tests
 * 1. No hydration error on /network (F-01)
 * 2. Demo badge visible on mock pages (F-03)
 * 3. Sidebar badges not hard-coded (F-05)
 */

test.describe('B5 Remediation Verification', () => {
  test.beforeEach(async ({ page }) => {
    if (E2E_USER && E2E_PASSWORD) {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await page.locator('input[autocomplete="username"]').fill(E2E_USER);
      await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
    }
  });

  test('F-01: no hydration console error on /network at 4 viewports', async ({ page }) => {
    const VIEWPORTS = [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ];

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp);
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/network', { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
        await page.waitForLoadState('domcontentloaded');
      });
      await page.waitForTimeout(500);

      // Filter for hydration-specific errors (#418, #423, "Hydration", "hydration")
      const hydrationErrors = consoleErrors.filter(
        (e) => /hydrat/i.test(e) || /#418/.test(e) || /#423/.test(e)
      );

      expect(
        hydrationErrors,
        `Hydration errors at ${vp.width}x${vp.height}: ${hydrationErrors.join(', ')}`
      ).toHaveLength(0);
    }
  });

  test('F-03: demo badge visible on mock data pages', async ({ page }) => {
    const demoRoutes = [
      '/hosts',
      '/mitre',
      '/network',
      '/plugins',
      '/simulation',
      '/dashboard',
    ];

    for (const route of demoRoutes) {
      await page.goto(route, { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
        await page.waitForLoadState('domcontentloaded');
      });
      await page.waitForTimeout(300);

      const badges = await page.locator('[data-testid="demo-data-badge"]').count();
      expect(
        badges,
        `Expected at least one demo badge on ${route}, found ${badges}`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  test('F-05: sidebar badges not hard-coded, no hard-coded version number', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
      await page.waitForLoadState('domcontentloaded');
    });
    await page.waitForTimeout(300);

    // Check that sidebar doesn't contain hard-coded badge counts (16, 2) for alerts/incidents
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    await expect(sidebar).toBeVisible();

    const sidebarText = await sidebar.innerText();

    // Should NOT contain the old hard-coded badge numbers as standalone numbers in nav context
    // Old: Alerts badge="16", Incidents badge="2"
    const alertsLink = sidebar.locator('a[href="/alerts"]');
    const alertsText = await alertsLink.innerText();
    expect(alertsText).not.toContain('16');

    const incidentsLink = sidebar.locator('a[href="/incidents"]');
    const incidentsText = await incidentsLink.innerText();
    expect(incidentsText).not.toContain('2');

    // Should NOT contain hard-coded version "v1.4.2"
    expect(sidebarText).not.toContain('v1.4.2');
  });
});
