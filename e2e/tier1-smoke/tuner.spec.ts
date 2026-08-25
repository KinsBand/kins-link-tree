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

    // Mode now lives in settings sheet (topbar pills moved to sheet)
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerSheetModeRow')).toBeVisible();
    await page.locator('[data-sheet-mode="chromatic"]').click();
    await page.keyboard.press('Escape');
    // Mic must survive the switch — no permission re-prompt, no restart.
    await expect(cta).toHaveClass(/listening/);
    await expect(page.locator('#tunerChromRail')).toBeVisible();
    await expect(page.locator('#tunerChromTape .rail-note').first()).toBeVisible();

    await page.locator('#tunerSettingsBtn').click();
    await page.locator('[data-sheet-mode="guided"]').click();
    await page.keyboard.press('Escape');
    await expect(cta).toHaveClass(/listening/);
    await expect(page.locator('#tunerChromRail')).toBeHidden();
  });

  test('auto string select defaults on and toggles', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerSettingsBtn').click();
    const autoToggle = page.locator('#tunerSheetAutoId');
    await expect(autoToggle).toBeVisible();
    await expect(autoToggle).toBeChecked();
    await autoToggle.click();
    await expect(autoToggle).not.toBeChecked();
    await autoToggle.click();
    await expect(autoToggle).toBeChecked();
  });

  test('settings sheet exposes instruments and strings/material', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerSheetInstrumentRow')).toBeVisible();
    await expect(page.locator('[data-sheet-instrument="electric"]')).toBeVisible();
    await expect(page.locator('[data-sheet-instrument="drums"]')).toBeVisible();
    await expect(page.locator('#tunerSheetModeRow')).toBeVisible();
    await expect(page.locator('#tunerSheetStringsBtn')).toBeVisible();
    await expect(page.locator('#tunerSheetMaterialBtn')).toBeVisible();
    // Strings and material menus open upward
    await page.locator('#tunerSheetStringsBtn').click();
    await expect(page.locator('#tunerSheetStringsSlot .tuner-menu-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('#tunerSheetMaterialBtn').click();
    await expect(page.locator('#tunerSheetMaterialSlot .tuner-menu-panel')).toBeVisible();
    await page.keyboard.press('Escape');
    // A4 calibration removed
    await expect(page.locator('#tunerA4Chips')).toBeHidden();
    await expect(page.locator('#tunerSheetA4Row')).toBeHidden();
  });

  test('header centers TUNER title and hides legacy pills', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page.locator('#tunerPresetBtn .tuner-pill-title')).toHaveText('TUNER');
    await expect(page.locator('#tunerModeBtn')).toBeHidden();
    await expect(page.locator('#tunerStringsBtn')).toBeHidden();
    await expect(page.locator('#tunerMaterialBtn')).toBeHidden();
    await expect(page.locator('#tunerSettingsBtnBottom')).toBeHidden();
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
