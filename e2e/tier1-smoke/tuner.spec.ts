import { test, expect } from '@playwright/test';

/* Tuner smoke flows with Chromium's fake microphone: no real audio device or
   permission prompt needed. Pitch-value assertions are deliberately avoided
   (the fake device tone is not musically stable) — these cover the state
   machine, the tuning library and the auto-string-select control surface. */
test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
  }
});

test.describe('tier1 smoke — tuner', () => {
  test('mic starts and stops from the CTA', async ({ page }) => {
    await page.goto('/tuner');
    const cta = page.locator('#tunerMicToggleBtn');
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(cta).toHaveClass(/listening/);
    await expect(cta).toHaveAttribute('aria-label', 'Stop tuning');
    await cta.click();
    await expect(cta).not.toHaveClass(/listening/);
  });

  test('mode switch keeps the mic alive', async ({ page }) => {
    await page.goto('/tuner');
    const cta = page.locator('#tunerMicToggleBtn');
    await cta.click();
    await expect(cta).toHaveClass(/listening/);

    await page.locator('#tunerModeBtn').click();
    await page.locator('[data-mode="chromatic"]').click();
    // Mic must survive the switch — no permission re-prompt, no restart.
    await expect(cta).toHaveClass(/listening/);
    await expect(page.locator('#tunerChromRail')).toBeVisible();

    await page.locator('#tunerModeBtn').click();
    await page.locator('[data-mode="guided"]').click();
    await expect(cta).toHaveClass(/listening/);
  });

  test('auto string select defaults on and toggles', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerModeBtn').click();
    const row = page.locator('[data-auto-id]');
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute('aria-checked', 'true');
    await row.click();
    await expect(page.locator('[data-auto-id]')).toHaveAttribute('aria-checked', 'false');
  });

  test('tuning library renders, searches and applies presets', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerPresetBtn').click();
    await expect(page.locator('#tuningView')).toBeVisible();
    await page.locator('.tuning-category.open .tuning-card').first().waitFor();

    const search = page.locator('#tunerSearchInput');
    await search.fill('drop d');
    await expect(page.locator('.tuning-card', { hasText: 'Drop D' }).first()).toBeVisible();

    await search.fill('');
    await page.locator('.tuning-card', { hasText: 'Drop D' }).first().click();
    await expect(page.locator('#tunerView')).toBeVisible();
    await expect(page.locator('#tunerPresetLabel')).toHaveText(/Drop D/i);
  });
});
