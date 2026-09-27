import { test, expect, type Page } from '@playwright/test';
import { functionalityConfig } from '../../src/settings/functionality.config';

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

/* Dev-only toolbar overlays the bottom of the viewport in `astro dev` */
async function openTuner(page: Page) {
  await page.goto('/tuner');
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
}

test.describe('tier1 smoke — tuner', () => {
  test.skip(!functionalityConfig.enableTunerPage, 'Tuner page is currently gated');
  test('mic starts and stops from the CTA', async ({ page }) => {
    await openTuner(page);
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
    await expect(page.locator('#tunerChromRail')).toBeHidden();
    // Visible cents are decorative for AT; readings are announced via #tunerStatusLine.
    await expect(page.locator('#tunerCentsReadout')).toHaveAttribute('aria-hidden', 'true');

    await page.locator('#tunerSettingsBtn').click();
    await page.locator('[data-sheet-mode="guided"]').click();
    await page.keyboard.press('Escape');
    await expect(cta).toHaveClass(/listening/);
    await expect(page.locator('#tunerChromRail')).toBeHidden();
  });

  test('auto string select defaults on and toggles', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerSheet')).toHaveClass(/open/);
    const autoToggle = page.locator('#tunerSheetAutoId');
    await expect(autoToggle).toBeVisible();
    await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');
    await autoToggle.click();
    await expect(autoToggle).toHaveAttribute('aria-pressed', 'false');
    await autoToggle.click();
    await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('settings sheet exposes instruments, strings and qualified input controls', async ({ page }) => {
    await page.goto('/tuner');
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerSheetInstrumentRow')).toBeVisible();
    await expect(page.locator('[data-sheet-instrument="electric"]')).toBeVisible();
    await expect(page.locator('[data-sheet-instrument="drums"]')).toBeVisible();
    await expect(page.locator('#tunerSheetModeRow')).toBeVisible();
    await expect(page.locator('#tunerStringCount')).toBeVisible();
    await expect(page.locator('#tunerCalibration')).toBeVisible();
    await expect(page.locator('#tunerTolerance')).toBeVisible();
    await expect(page.locator('#tunerInputDevice')).toHaveCount(0);
    await expect(page.locator('#tunerInputChannel')).toHaveCount(0);
    // Legacy chip controls remain hidden.
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

    // Verify top header has back button with 'Back' text, centered TUNING title, and reduced instrument label
    const backBtn = page.locator('.tuning-header #tunerBackToTunerBtn');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toHaveText(/Back/);
    await expect(page.locator('.tuning-header .tuning-title')).toHaveText('TUNING');
    await expect(page.locator('#tunerInstrumentLabel')).toHaveText('Electric');

    const search = page.locator('#tunerSearchInput');
    await search.fill('drop d');
    await expect(page.locator('.tuning-card', { hasText: 'Drop D' }).first()).toBeVisible();

    await search.fill('');
    await page.locator('.tuning-card', { hasText: 'Drop D' }).first().click();
    await expect(page.locator('#tunerView')).toBeVisible();
    await expect(page.locator('#tunerPresetLabel')).toHaveText(/Drop D/i);

    // Re-open tuning library and verify icon-only back button returns to tuner view
    await page.locator('#tunerPresetBtn').click();
    await expect(page.locator('#tuningView')).toBeVisible();
    await backBtn.click();
    await expect(page.locator('#tunerView')).toBeVisible();
  });

  test('settings sheet footer renders theme toggle and opens modals', async ({ page }) => {
    await openTuner(page);
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerPanelSettings')).toBeVisible();

    // Check footer elements
    const footerCard = page.locator('.tuner-sheet-footer-card');
    await expect(footerCard).toBeVisible();

    // Test Theme Switcher
    const darkBtn = footerCard.locator('#tunerThemePillDarkBtn');
    const lightBtn = footerCard.locator('#tunerThemePillLightBtn');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');

    // Test Legal modal trigger
    await page.locator('#tunerOpenLegalFooterBtn').click();
    const legalModal = page.locator('#legalModal');
    await expect(legalModal).toBeVisible();
    await expect(legalModal.locator('#legalTabPrivacy')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(legalModal).toBeHidden();

    // Test Feedback / Suggest Improvement modal trigger
    await page.locator('#tunerOpenSuggestImprovementFooterBtn').click();
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#feedbackModal')).toBeHidden();
  });
});
