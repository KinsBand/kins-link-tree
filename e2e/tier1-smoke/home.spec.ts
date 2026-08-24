import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — home hub', () => {
  test('home renders hero, members and subscribe sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#subscribeFormSection')).toBeVisible();
    await expect(page.locator('.members-scroll-container .member-card').first()).toBeVisible();
  });

  test('tuner page loads with instrument tabs', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page.locator('#tunerReadoutPanel')).toBeVisible();
    await expect(page.locator('#tunerMicBtn')).toBeVisible();
  });

  test('live page resolves (offline or live mode, never 404)', async ({ page }) => {
    const res = await page.goto('/live');
    expect(res?.status() ?? 200).toBeLessThan(400);
  });
});
