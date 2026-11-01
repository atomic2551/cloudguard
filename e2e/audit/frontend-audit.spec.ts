import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const E2E_USER = process.env.E2E_USER;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

const VIEWPORTS = [
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1024, height: 768, name: '1024x768' },
  { width: 390, height: 844, name: '390x844' },
];

interface AuditRoute {
  name: string;
  path: string;
  authRequired: boolean;
}

const STATIC_ROUTES: AuditRoute[] = [
  { name: 'root', path: '/', authRequired: false },
  { name: 'login', path: '/login', authRequired: false },
  { name: 'dashboard', path: '/dashboard', authRequired: true },
  { name: 'alerts', path: '/alerts', authRequired: true },
  { name: 'alerts-id', path: '/alerts/1', authRequired: true },
  { name: 'audit-logs', path: '/audit-logs', authRequired: true },
  { name: 'cloud-accounts', path: '/cloud-accounts', authRequired: true },
  { name: 'detection-rules', path: '/detection-rules', authRequired: true },
  { name: 'events', path: '/events', authRequired: true },
  { name: 'findings', path: '/findings', authRequired: true },
  { name: 'hosts', path: '/hosts', authRequired: true },
  { name: 'iam', path: '/iam', authRequired: true },
  { name: 'incidents', path: '/incidents', authRequired: true },
  { name: 'incidents-id', path: '/incidents/1', authRequired: true },
  { name: 'mitre', path: '/mitre', authRequired: true },
  { name: 'network', path: '/network', authRequired: true },
  { name: 'plugins', path: '/plugins', authRequired: true },
  { name: 'reports', path: '/reports', authRequired: true },
  { name: 'scanner', path: '/scanner', authRequired: true },
  { name: 'settings', path: '/settings', authRequired: true },
  { name: 'simulation', path: '/simulation', authRequired: true },
  { name: 'users', path: '/users', authRequired: true },
];

interface ApiCallRecord {
  url: string;
  method: string;
  status: number;
  shapeOk: boolean;
  shapeDetails: string;
  route: string;
}

interface PageAuditRecord {
  route: string;
  path: string;
  viewport: string;
  width: number;
  height: number;
  screenshotPath: string;
  hasHorizontalOverflow: boolean;
  scrollWidth: number;
  clientWidth: number;
  overflowPx: number;
  consoleErrors: string[];
  failedRequests: string[];
  h1Count: number;
  h1Text: string[];
  missingButtonLabels: number;
  unlabeledInputs: number;
}

test.describe.configure({ mode: 'serial' });

test.describe('Frontend Audit Suite', () => {
  const auditOutputDir = path.resolve(process.cwd(), 'test-results', 'audit');
  const resultsJsonPath = path.resolve(auditOutputDir, 'audit-results.json');

  const allPageAudits: PageAuditRecord[] = [];
  const allApiCalls: ApiCallRecord[] = [];

  test.beforeAll(async () => {
    if (!fs.existsSync(auditOutputDir)) {
      fs.mkdirSync(auditOutputDir, { recursive: true });
    }
  });

  test('audit all routes across viewports', async ({ browser }) => {
    test.setTimeout(240 * 1000);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Collect console errors & page errors
      let currentConsoleErrors: string[] = [];
      let currentFailedRequests: string[] = [];
      let currentRoute = '';

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          currentConsoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', (err) => {
        currentConsoleErrors.push(`[PageError] ${err.message}`);
      });

      page.on('requestfailed', (req) => {
        currentFailedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || 'failed'})`);
      });

      page.on('response', async (res) => {
        const url = res.url();
        if (url.includes('/api/')) {
          const status = res.status();
          const method = res.request().method();
          let shapeOk = false;
          let shapeDetails = '';

          try {
            const contentType = res.headers()['content-type'] || '';
            if (contentType.includes('application/json')) {
              const body = await res.json().catch(() => null);
              if (body !== null && typeof body === 'object') {
                shapeOk = true;
                if (Array.isArray(body)) {
                  shapeDetails = `Array(${body.length})`;
                } else if ('data' in body) {
                  shapeDetails = `ApiResponse.data (${typeof (body as any).data})`;
                } else {
                  shapeDetails = `Object keys: ${Object.keys(body).slice(0, 4).join(', ')}`;
                }
              } else {
                shapeDetails = 'Non-object JSON';
              }
            } else {
              shapeOk = status < 400;
              shapeDetails = `Content-Type: ${contentType || 'none'}`;
            }
          } catch {
            shapeOk = false;
            shapeDetails = 'Failed to parse body';
          }

          allApiCalls.push({
            url: url.replace(/^https?:\/\/[^/]+/, ''),
            method,
            status,
            shapeOk: shapeOk && status < 400,
            shapeDetails: status >= 400 ? `HTTP ${status}` : shapeDetails,
            route: currentRoute,
          });
        }
      });

      // 1. Log in once for authenticated routes
      if (E2E_USER && E2E_PASSWORD) {
        currentRoute = '/login';
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.locator('input[autocomplete="username"]').fill(E2E_USER);
        await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
      }

      // Check if we can find dynamic IDs for alerts and incidents
      let realAlertId: string | null = null;
      let realIncidentId: string | null = null;
      try {
        const alertsRes = await page.evaluate(async () => {
          const res = await fetch('/api/alerts?size=1').catch(() => null);
          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            const items = data?.data?.items || data?.items || [];
            return items[0]?.id || null;
          }
          return null;
        });
        realAlertId = alertsRes;
      } catch {}

      try {
        const incRes = await page.evaluate(async () => {
          const res = await fetch('/api/incidents?size=1').catch(() => null);
          if (res && res.ok) {
            const data = await res.json().catch(() => null);
            const items = data?.data?.items || data?.items || [];
            return items[0]?.id || null;
          }
          return null;
        });
        realIncidentId = incRes;
      } catch {}

      // Now iterate over each route
      for (const r of STATIC_ROUTES) {
        let routePath = r.path;
        if (r.name === 'alerts-id' && realAlertId) {
          routePath = `/alerts/${realAlertId}`;
        }
        if (r.name === 'incidents-id' && realIncidentId) {
          routePath = `/incidents/${realIncidentId}`;
        }

        currentRoute = routePath;
        currentConsoleErrors = [];
        currentFailedRequests = [];

        try {
          await page.goto(routePath, { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
            await page.waitForLoadState('domcontentloaded');
          });
        } catch (e: any) {
          currentConsoleErrors.push(`Navigation failed: ${e.message}`);
        }

        // Wait a small moment for animations / charts to render
        await page.waitForTimeout(350);

        // Screenshot
        const screenshotFileName = `${r.name}-${vp.width}.png`;
        const screenshotFullPath = path.join(auditOutputDir, screenshotFileName);
        await page.screenshot({ path: screenshotFullPath, fullPage: true });

        // Horizontal overflow check
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl ? docEl.scrollWidth : 0, body ? body.scrollWidth : 0);
          const clientW = window.innerWidth;
          const isOverflow = scrollW > clientW + 1; // 1px tolerance for subpixel rounding
          return {
            hasOverflow: isOverflow,
            scrollWidth: scrollW,
            clientWidth: clientW,
            overflowPx: isOverflow ? scrollW - clientW : 0,
          };
        });

        // Accessibility checks: h1, buttons without accessible name, inputs without labels
        const a11y = await page.evaluate(() => {
          const h1Elements = Array.from(document.querySelectorAll('h1'));
          const h1Texts = h1Elements.map((el) => (el.textContent || '').trim()).filter(Boolean);

          const buttons = Array.from(document.querySelectorAll('button'));
          let missingButtonLabels = 0;
          for (const btn of buttons) {
            const text = (btn.textContent || '').trim();
            const ariaLabel = btn.getAttribute('aria-label') || btn.getAttribute('title');
            if (!text && !ariaLabel) {
              missingButtonLabels++;
            }
          }

          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
          let unlabeledInputs = 0;
          for (const input of inputs) {
            const id = input.getAttribute('id');
            const hasLabel = id && document.querySelector(`label[for="${id}"]`);
            const ariaLabel = input.getAttribute('aria-label') || input.getAttribute('placeholder');
            const parentLabel = input.closest('label');
            if (!hasLabel && !ariaLabel && !parentLabel) {
              unlabeledInputs++;
            }
          }

          return {
            h1Count: h1Elements.length,
            h1Texts,
            missingButtonLabels,
            unlabeledInputs,
          };
        });

        allPageAudits.push({
          route: r.name,
          path: routePath,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          screenshotPath: `test-results/audit/${screenshotFileName}`,
          hasHorizontalOverflow: overflow.hasOverflow,
          scrollWidth: overflow.scrollWidth,
          clientWidth: overflow.clientWidth,
          overflowPx: overflow.overflowPx,
          consoleErrors: [...currentConsoleErrors],
          failedRequests: [...currentFailedRequests],
          h1Count: a11y.h1Count,
          h1Text: a11y.h1Texts,
          missingButtonLabels: a11y.missingButtonLabels,
          unlabeledInputs: a11y.unlabeledInputs,
        });
      }

      await context.close();
    }

    // De-duplicate API calls by URL + method + status
    const uniqueApiMap = new Map<string, ApiCallRecord>();
    for (const call of allApiCalls) {
      const key = `${call.method}:${call.url}:${call.status}`;
      if (!uniqueApiMap.has(key)) {
        uniqueApiMap.set(key, call);
      }
    }
    const deduplicatedApiCalls = Array.from(uniqueApiMap.values());

    const summaryReport = {
      timestamp: new Date().toISOString(),
      totalPagesAudited: allPageAudits.length,
      viewports: VIEWPORTS.map((v) => v.name),
      pageAudits: allPageAudits,
      apiCalls: deduplicatedApiCalls,
    };

    fs.writeFileSync(resultsJsonPath, JSON.stringify(summaryReport, null, 2), 'utf-8');
    expect(fs.existsSync(resultsJsonPath)).toBe(true);
  });

  test('laptop viewports (1366x768, 1536x864) bounding box overlap & clipping audit', async ({ browser }) => {
    test.setTimeout(120 * 1000);

    const LAPTOP_VIEWPORTS = [
      { width: 1366, height: 768, name: '1366x768' },
      { width: 1536, height: 864, name: '1536x864' },
    ];
    const TARGET_ROUTES = ['/dashboard', '/alerts', '/incidents', '/reports'];
    const laptopFindings: any[] = [];

    for (const vp of LAPTOP_VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Log in
      if (E2E_USER && E2E_PASSWORD) {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.locator('input[autocomplete="username"]').fill(E2E_USER);
        await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
      }

      for (const routePath of TARGET_ROUTES) {
        const routeName = routePath.replace(/^\//, '');
        await page.goto(routePath, { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
          await page.waitForLoadState('domcontentloaded');
        });
        await page.waitForTimeout(400);

        const screenshotFileName = `${routeName}-${vp.width}.png`;
        const screenshotFullPath = path.join(auditOutputDir, screenshotFileName);
        await page.screenshot({ path: screenshotFullPath, fullPage: true });

        // Bounding box check for KPI cards, charts, and tables
        const layoutAudit = await page.evaluate(() => {
          const results: {
            clippedElements: Array<{ tag: string; className: string; textSnippet: string; reason: string }>;
            overlappingElements: Array<{ el1: string; el2: string; overlapArea: number }>;
            crushedKpis: Array<{ label: string; width: number; naturalWidth: number }>;
          } = {
            clippedElements: [],
            overlappingElements: [],
            crushedKpis: [],
          };

          const viewW = window.innerWidth;

          // 1. Check all KPI cards / grid cards
          const cards = Array.from(document.querySelectorAll('.bg-gray-900.border, .recharts-responsive-container, table'));
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const r1 = card.getBoundingClientRect();

            // Check clipping beyond viewport width
            if (r1.right > viewW + 2) {
              results.clippedElements.push({
                tag: card.tagName.toLowerCase(),
                className: card.className.slice(0, 40),
                textSnippet: card.innerText?.slice(0, 30) || '',
                reason: `Right boundary (${Math.round(r1.right)}px) exceeds viewport (${viewW}px)`,
              });
            }

            // Check if internal text overflows container
            if (card.scrollWidth > card.clientWidth + 4) {
              results.clippedElements.push({
                tag: card.tagName.toLowerCase(),
                className: card.className.slice(0, 40),
                textSnippet: card.innerText?.slice(0, 30) || '',
                reason: `Internal content scrollWidth (${card.scrollWidth}px) exceeds clientWidth (${card.clientWidth}px)`,
              });
            }

            // Check if card width is crushed (< 150px for KPI or chart)
            if (card.classList.contains('p-4') && r1.width < 150 && r1.width > 0) {
              results.crushedKpis.push({
                label: card.innerText?.split('\n')[0] || 'Unknown',
                width: Math.round(r1.width),
                naturalWidth: card.scrollWidth,
              });
            }

            // 2. Overlap check against subsequent cards in DOM
            for (let j = i + 1; j < Math.min(i + 8, cards.length); j++) {
              const other = cards[j] as HTMLElement;
              // Don't compare ancestors/descendants
              if (card.contains(other) || other.contains(card)) continue;

              const r2 = other.getBoundingClientRect();
              if (r1.width === 0 || r1.height === 0 || r2.width === 0 || r2.height === 0) continue;

              const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
              const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
              const overlapArea = xOverlap * yOverlap;

              if (xOverlap > 2 && yOverlap > 2) {
                results.overlappingElements.push({
                  el1: (card.innerText || card.className).slice(0, 25),
                  el2: (other.innerText || other.className).slice(0, 25),
                  overlapArea: Math.round(overlapArea),
                });
              }
            }
          }

          return results;
        });

        laptopFindings.push({
          route: routeName,
          viewport: vp.name,
          width: vp.width,
          screenshotPath: `test-results/audit/${screenshotFileName}`,
          ...layoutAudit,
        });
      }

      await context.close();
    }

    const laptopReportPath = path.resolve(auditOutputDir, 'laptop-audit-results.json');
    fs.writeFileSync(laptopReportPath, JSON.stringify(laptopFindings, null, 2), 'utf-8');
    expect(fs.existsSync(laptopReportPath)).toBe(true);
  });
});
