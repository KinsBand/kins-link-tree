import { test, expect } from '@playwright/test';

for (const path of ['/', '/tuner', '/live', '/epk']) {
  test(`page loads fully + changes present: ${path}`, async ({ page }) => {
    const failed: string[] = [];
    const consoleErrors: string[] = [];
    page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
    page.on('response', (r) => { if (r.status() >= 400) failed.push('HTTP ' + r.status() + ' ' + r.url()); });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    await page.goto(path, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(1500);

    if (path === '/tuner') {
      const cta = page.locator('#tunerMicToggleBtn');
      await expect(cta).toBeVisible();
      await expect(cta).toContainText('START TUNING');
      const html = await page.content();
      expect(html).toContain('tunerMicToggleBtn');
    }

    expect(failed.filter((u) => !u.includes('_vercel/insights'))).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
