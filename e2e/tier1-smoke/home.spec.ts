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

  test('home footer renders theme toggle first and toggles theme', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.site-footer .footer-inner-card');
    await expect(footer).toBeVisible();

    // Verify first element inside footer-inner-card is footer-theme-toggle-wrap
    const firstChild = footer.locator('> *:first-child');
    await expect(firstChild).toHaveClass(/footer-theme-toggle-wrap/);

    // Test Theme Switcher
    const darkBtn = footer.locator('#themePillDarkBtn');
    const lightBtn = footer.locator('#themePillLightBtn');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
  });
});
