import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — theory (hidden)', () => {
  test('homepage does not render KINS TOOLS section when disabled', async ({ page }) => {
    await page.goto('/');
    const toolsSection = page.locator('#rehearsalUtilitiesSection');
    await expect(toolsSection).toBeHidden();

    const theoryCardBtn = page.locator('a[data-track="utilities:theory"]');
    await expect(theoryCardBtn).toBeHidden();
  });

  test('direct navigation to /theory redirects away to homepage', async ({ page }) => {
    await page.goto('/theory');
    await expect(page).not.toHaveURL(/\/theory/);
    await expect(page).toHaveURL(/\/$/);
  });
});

