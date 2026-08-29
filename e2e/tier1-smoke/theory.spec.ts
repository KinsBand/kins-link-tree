import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — theory gating & KINS TOOLS', () => {
  test('KINS TOOLS section renders with the metronome only', async ({ page }) => {
    await page.goto('/');
    const toolsSection = page.locator('#rehearsalUtilitiesSection');
    await expect(toolsSection).toBeVisible();

    const metroCardBtn = page.locator('a[data-track="utilities:metronome"]');
    await expect(metroCardBtn).toBeVisible();
    await expect(metroCardBtn).toHaveAttribute('href', '/metronome');

    await expect(page.locator('a[data-track="utilities:tuner"]')).toHaveCount(0);
    await expect(page.locator('a[data-track="utilities:theory"]')).toHaveCount(0);
  });

  test('direct navigation to /theory redirects away to homepage', async ({ page }) => {
    await page.goto('/theory');
    await expect(page).not.toHaveURL(/\/theory/);
    await expect(page).toHaveURL(/\/$/);
  });
});
