import { expect, test, type Page } from '@playwright/test';

const STATIONS = ['1', '2', '3', '4', '6'];

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'portrait-monitor', width: 1080, height: 1920 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'qhd', width: 2560, height: 1440 },
  { name: 'ultrawide', width: 3440, height: 1440 },
  { name: '4k', width: 3840, height: 2160 },
  { name: 'wall-2tv', width: 8248, height: 2160 },
  { name: 'wall-3tv', width: 12372, height: 2160 },
];

test.beforeEach(async ({ page }) => {
  await stubExternalCameraHosts(page);
});

test('overview renders, station card navigation works, and back returns to overview', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Command display navigation' })).toBeVisible();
  await expect(page.getByText('Watch Desk Posture')).toBeVisible();
  await expect(page.getByText('Vehicle Inspection Completion')).toBeVisible();
  await expect(page.getByText('Live Cameras')).toBeVisible();
  await expect(page.locator('button[aria-label*="Station 1"][aria-label*="50 percent"]').first()).toBeVisible();

  await page.locator('button[aria-label^="Open Station 1"]').first().click();
  await expect(page).toHaveURL(/\/stations\/1$/);
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Station 1');

  await page.getByRole('button', { name: 'Back to Overview' }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test('canonical station routes render and legacy route redirects', async ({ page }) => {
  const errors = collectConsoleErrors(page);

  for (const station of STATIONS) {
    await page.goto(`/stations/${station}`);
    await expect(page.getByRole('heading', { name: new RegExp(`Station ${station}`, 'i') })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Previous Screen' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(`Station ${station}`);
  }

  await page.goto('/station/1');
  await expect(page).toHaveURL(/\/stations\/1$/);
  expect(errors).toEqual([]);
});

test('AI empty state uses grounded fallback language', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.addInitScript(() => localStorage.setItem('mbfd-test-ai', 'empty'));
  await page.goto('/');

  await expect(page.getByText(/Grounded counts/i)).toBeVisible();
  await expect(page.getByText(/AI narrative offline|AI narrative updating/i)).toBeVisible();
  await expect(page.getByText(/AI narrative withheld for test/i)).toBeVisible();
  expect(errors).toEqual([]);
});

test('viewport matrix has no horizontal overflow or top-level panel overlap', async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expectNoLayoutBreaks(page, `overview ${viewport.name}`);
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-overview.jpg`), type: 'jpeg', quality: 72, fullPage: false, animations: 'disabled' });

    await page.goto('/stations/1');
    await page.waitForLoadState('domcontentloaded');
    await expectNoLayoutBreaks(page, `station ${viewport.name}`);
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-station-1.jpg`), type: 'jpeg', quality: 72, fullPage: false, animations: 'disabled' });
  }

  expect(errors).toEqual([]);
});

test('display fill mode can be toggled on a normal desktop', async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-display', '0');
  await page.getByRole('button', { name: /Wall/i }).click();
  await expect(page.locator('html')).toHaveAttribute('data-display', '1');
  await expectNoLayoutBreaks(page, 'manual display-fill overview');
  expect(errors).toEqual([]);
});

async function stubExternalCameraHosts(page: Page) {
  await page.route(/https:\/\/(media\.mbfdhub\.com|www\.youtube-nocookie\.com|relay\.ozolio\.com)\/.*/, async (route) => {
    const request = route.request();
    if (request.resourceType() === 'document') {
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body style="margin:0;background:#1c2330;color:#e9edf4;font:600 14px sans-serif;display:grid;place-items:center;height:100vh">Camera test feed</body></html>',
      });
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectNoLayoutBreaks(page: Page, label: string) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const layout = document.querySelector('.cg-overview, .cg-station');
    const panels = Array.from(document.querySelectorAll<HTMLElement>('.cg-overview > *, .cg-station > *'));
    const rects = panels.map((element, index) => {
      const rect = element.getBoundingClientRect();
      return { index, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    const overlaps: Array<{ a: number; b: number; area: number }> = [];

    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const area = Math.round(x * y);
        if (area > 4) overlaps.push({ a: a.index, b: b.index, area });
      }
    }

    const badText = Array.from(document.body.querySelectorAll('*'))
      .filter((element) => element.children.length === 0)
      .map((element) => element.textContent ?? '')
      .filter((text) => /undefined|NaN|0\/0/.test(text))
      .slice(0, 5);

    return {
      regime: root.dataset.regime,
      display: root.dataset.display,
      bodyHorizontalOverflow: body.scrollWidth > window.innerWidth + 2 || root.scrollWidth > window.innerWidth + 2,
      layoutHorizontalOverflow: layout ? layout.scrollWidth > layout.clientWidth + 2 : false,
      overlaps,
      badText,
    };
  });

  expect(result.bodyHorizontalOverflow, `${label}: body horizontal overflow`).toBe(false);
  expect(result.layoutHorizontalOverflow, `${label}: layout horizontal overflow`).toBe(false);
  expect(result.overlaps, `${label}: top-level panel overlap`).toEqual([]);
  expect(result.badText, `${label}: invalid rendered text`).toEqual([]);
}
