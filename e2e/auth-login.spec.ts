import { test, expect } from '@playwright/test';

const E2E_USER = process.env.E2E_USER;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

test.beforeAll(() => {
  if (!E2E_USER || !E2E_PASSWORD) {
    throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set.');
  }
});

test.describe('Authentication and Session Security E2E', () => {
  test('login flow, cookie security, storage check, and logout with XSRF header', async ({ page }) => {
    if (!E2E_USER || !E2E_PASSWORD) {
      throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set.');
    }

    // 1. Navigate to login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    // 2. Fill credentials through the real UI
    await page.locator('input[autocomplete="username"]').fill(E2E_USER);
    await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 3. Assert redirect to dashboard
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');

    // 4. Assert context.cookies() has cg_token (httpOnly=true, sameSite='Strict') and XSRF-TOKEN
    const cookies = await page.context().cookies();
    const cgToken = cookies.find((c) => c.name === 'cg_token');
    expect(cgToken, 'cg_token cookie should exist').toBeDefined();
    expect(cgToken?.httpOnly, 'cg_token must be httpOnly').toBe(true);
    expect(cgToken?.sameSite, 'cg_token sameSite must be Strict').toBe('Strict');

    const xsrfToken = cookies.find((c) => c.name === 'XSRF-TOKEN');
    expect(xsrfToken, 'XSRF-TOKEN cookie should exist').toBeDefined();

    // 5. Assert localStorage and sessionStorage contain no token-like value
    const storage = await page.evaluate(() => {
      const getEntries = (s: Storage) => {
        const entries: Array<{ key: string; value: string | null }> = [];
        for (let i = 0; i < s.length; i++) {
          const key = s.key(i);
          if (key !== null) {
            entries.push({ key, value: s.getItem(key) });
          }
        }
        return entries;
      };
      return {
        local: getEntries(localStorage),
        session: getEntries(sessionStorage),
      };
    });

    const forbiddenPattern = /(?:token|jwt|bearer|cg_token)/i;
    for (const item of [...storage.local, ...storage.session]) {
      expect(item.key, `Storage key ${item.key} must not be token-like`).not.toMatch(forbiddenPattern);
      if (item.value) {
        expect(item.value, `Storage value for ${item.key} must not be token-like`).not.toMatch(forbiddenPattern);
      }
    }

    // 6. Assert logout (mutating request) succeeds with the XSRF header
    const [logoutRequest] = await Promise.all([
      page.waitForRequest((req) => req.url().includes('/api/auth/logout') && req.method() === 'POST'),
      page.waitForResponse((res) => res.url().includes('/api/auth/logout') && res.status() === 200),
      page.locator('button[title="Sign out"]').click(),
    ]);

    const xsrfHeader = logoutRequest.headers()['x-xsrf-token'];
    expect(xsrfHeader, 'Logout mutating request must send X-XSRF-TOKEN header').toBeTruthy();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('wrong password shows "Invalid username or password"', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[autocomplete="username"]').fill('nonexistent.user.test');
    await page.locator('input[autocomplete="current-password"]').fill('WrongPassword999!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=Invalid username or password')).toBeVisible();
  });

  test('server 500 error shows "Server unavailable", not credentials error', async ({ page }) => {
    if (!E2E_USER || !E2E_PASSWORD) {
      throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set.');
    }

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Backend database down' }),
      });
    });

    await page.goto('/login');
    await page.locator('input[autocomplete="username"]').fill(E2E_USER);
    await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=Server unavailable')).toBeVisible();
    await expect(page.locator('text=Invalid username or password')).not.toBeVisible();
    await expect(page.locator('text=Invalid credentials. Please try again.')).not.toBeVisible();
  });

  test('redirect sanitization prevents open redirects', async ({ page }) => {
    if (!E2E_USER || !E2E_PASSWORD) {
      throw new Error('E2E_USER and E2E_PASSWORD environment variables must be set.');
    }

    // Case 1: https://evil.example should sanitize to /dashboard
    await page.goto('/login?from=https://evil.example');
    await page.locator('input[autocomplete="username"]').fill(E2E_USER);
    await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('evil.example');

    // Logout
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auth/logout') && res.status() === 200),
      page.locator('button[title="Sign out"]').click(),
    ]);
    await page.waitForURL('**/login');

    // Case 2: //evil.example should sanitize to /dashboard
    await page.goto('/login?from=//evil.example');
    await page.locator('input[autocomplete="username"]').fill(E2E_USER);
    await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('evil.example');

    // Logout
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auth/logout') && res.status() === 200),
      page.locator('button[title="Sign out"]').click(),
    ]);
    await page.waitForURL('**/login');

    // Case 3: /alerts should legitimately land on /alerts
    await page.goto('/login?from=/alerts');
    await page.locator('input[autocomplete="username"]').fill(E2E_USER);
    await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/alerts');
    expect(page.url()).toContain('/alerts');
  });
});
