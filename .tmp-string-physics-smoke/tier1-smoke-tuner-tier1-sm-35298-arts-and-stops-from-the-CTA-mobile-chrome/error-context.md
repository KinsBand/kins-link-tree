# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\tuner.spec.ts >> tier1 smoke — tuner >> mic starts and stops from the CTA
- Location: e2e\tier1-smoke\tuner.spec.ts:23:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#tunerMicToggleBtn')
Expected pattern: /listening/
Received string:  "tuner-mic-cta brutal-press"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#tunerMicToggleBtn')
    13 × locator resolved to <button type="button" id="tunerMicToggleBtn" aria-label="Start tuning" data-astro-cid-vkadm5px="" data-track="tuner:mic_start" class="tuner-mic-cta brutal-press">…</button>
       - unexpected value "tuner-mic-cta brutal-press"

```

```yaml
- button "Start tuning": START
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { functionalityConfig } from '../../src/settings/functionality.config';
  3   | 
  4   | /* Tuner smoke flows with Chromium's fake microphone: no real audio device or
  5   |    permission prompt needed. Pitch-value assertions are deliberately avoided
  6   |    (the fake device tone is not musically stable) — these cover the state
  7   |    machine, the tuning library and the auto-string-select control surface. */
  8   | test.use({
  9   |   permissions: ['microphone'],
  10  |   launchOptions: {
  11  |     args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
  12  |   }
  13  | });
  14  | 
  15  | /* Dev-only toolbar overlays the bottom of the viewport in `astro dev` */
  16  | async function openTuner(page: Page) {
  17  |   await page.goto('/tuner');
  18  |   await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  19  | }
  20  | 
  21  | test.describe('tier1 smoke — tuner', () => {
  22  |   test.skip(!functionalityConfig.enableTunerPage, 'Tuner page is currently gated');
  23  |   test('mic starts and stops from the CTA', async ({ page }) => {
  24  |     await openTuner(page);
  25  |     const cta = page.locator('#tunerMicToggleBtn');
  26  |     await expect(cta).toBeVisible();
  27  |     await cta.click();
> 28  |     await expect(cta).toHaveClass(/listening/);
      |                       ^ Error: expect(locator).toHaveClass(expected) failed
  29  |     await expect(cta).toHaveAttribute('aria-label', 'Stop tuning');
  30  |     await cta.click();
  31  |     await expect(cta).not.toHaveClass(/listening/);
  32  |   });
  33  | 
  34  |   test('mode switch keeps the mic alive', async ({ page }) => {
  35  |     await page.goto('/tuner');
  36  |     const cta = page.locator('#tunerMicToggleBtn');
  37  |     await cta.click();
  38  |     await expect(cta).toHaveClass(/listening/);
  39  | 
  40  |     // Mode now lives in settings sheet (topbar pills moved to sheet)
  41  |     await page.locator('#tunerSettingsBtn').click();
  42  |     await expect(page.locator('#tunerSheetModeRow')).toBeVisible();
  43  |     await page.locator('[data-sheet-mode="chromatic"]').click();
  44  |     await page.keyboard.press('Escape');
  45  |     // Mic must survive the switch — no permission re-prompt, no restart.
  46  |     await expect(cta).toHaveClass(/listening/);
  47  |     await expect(page.locator('#tunerChromRail')).toBeHidden();
  48  |     await expect(page.locator('#tunerCentsReadout')).toBeHidden();
  49  | 
  50  |     await page.locator('#tunerSettingsBtn').click();
  51  |     await page.locator('[data-sheet-mode="guided"]').click();
  52  |     await page.keyboard.press('Escape');
  53  |     await expect(cta).toHaveClass(/listening/);
  54  |     await expect(page.locator('#tunerChromRail')).toBeHidden();
  55  |   });
  56  | 
  57  |   test('auto string select defaults on and toggles', async ({ page }) => {
  58  |     await page.goto('/tuner');
  59  |     await page.locator('#tunerSettingsBtn').click();
  60  |     await expect(page.locator('#tunerSheet')).toHaveClass(/open/);
  61  |     const autoToggle = page.locator('#tunerSheetAutoId');
  62  |     await expect(autoToggle).toBeVisible();
  63  |     await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');
  64  |     await autoToggle.click();
  65  |     await expect(autoToggle).toHaveAttribute('aria-pressed', 'false');
  66  |     await autoToggle.click();
  67  |     await expect(autoToggle).toHaveAttribute('aria-pressed', 'true');
  68  |   });
  69  | 
  70  |   test('settings sheet exposes instruments, strings and qualified input controls', async ({ page }) => {
  71  |     await page.goto('/tuner');
  72  |     await page.locator('#tunerSettingsBtn').click();
  73  |     await expect(page.locator('#tunerSheetInstrumentRow')).toBeVisible();
  74  |     await expect(page.locator('[data-sheet-instrument="electric"]')).toBeVisible();
  75  |     await expect(page.locator('[data-sheet-instrument="drums"]')).toBeVisible();
  76  |     await expect(page.locator('#tunerSheetModeRow')).toBeVisible();
  77  |     await expect(page.locator('#tunerStringCount')).toBeVisible();
  78  |     await expect(page.locator('#tunerCalibration')).toBeVisible();
  79  |     await expect(page.locator('#tunerTolerance')).toBeVisible();
  80  |     await expect(page.locator('#tunerInputDevice')).toHaveCount(0);
  81  |     await expect(page.locator('#tunerInputChannel')).toHaveCount(0);
  82  |     // Legacy chip controls remain hidden.
  83  |     await expect(page.locator('#tunerA4Chips')).toBeHidden();
  84  |     await expect(page.locator('#tunerSheetA4Row')).toBeHidden();
  85  |   });
  86  | 
  87  |   test('header centers TUNER title and hides legacy pills', async ({ page }) => {
  88  |     await page.goto('/tuner');
  89  |     await expect(page.locator('#tunerPresetBtn .tuner-pill-title')).toHaveText('TUNER');
  90  |     await expect(page.locator('#tunerModeBtn')).toBeHidden();
  91  |     await expect(page.locator('#tunerStringsBtn')).toBeHidden();
  92  |     await expect(page.locator('#tunerMaterialBtn')).toBeHidden();
  93  |     await expect(page.locator('#tunerSettingsBtnBottom')).toBeHidden();
  94  |   });
  95  | 
  96  |   test('tuning library renders, searches and applies presets', async ({ page }) => {
  97  |     await page.goto('/tuner');
  98  |     await page.locator('#tunerPresetBtn').click();
  99  |     await expect(page.locator('#tuningView')).toBeVisible();
  100 |     await page.locator('.tuning-category.open .tuning-card').first().waitFor();
  101 | 
  102 |     // Verify top header has back button with 'Back' text, centered TUNING title, and reduced instrument label
  103 |     const backBtn = page.locator('.tuning-header #tunerBackToTunerBtn');
  104 |     await expect(backBtn).toBeVisible();
  105 |     await expect(backBtn).toHaveText(/Back/);
  106 |     await expect(page.locator('.tuning-header .tuning-title')).toHaveText('TUNING');
  107 |     await expect(page.locator('#tunerInstrumentLabel')).toHaveText('Electric');
  108 | 
  109 |     const search = page.locator('#tunerSearchInput');
  110 |     await search.fill('drop d');
  111 |     await expect(page.locator('.tuning-card', { hasText: 'Drop D' }).first()).toBeVisible();
  112 | 
  113 |     await search.fill('');
  114 |     await page.locator('.tuning-card', { hasText: 'Drop D' }).first().click();
  115 |     await expect(page.locator('#tunerView')).toBeVisible();
  116 |     await expect(page.locator('#tunerPresetLabel')).toHaveText(/Drop D/i);
  117 | 
  118 |     // Re-open tuning library and verify icon-only back button returns to tuner view
  119 |     await page.locator('#tunerPresetBtn').click();
  120 |     await expect(page.locator('#tuningView')).toBeVisible();
  121 |     await backBtn.click();
  122 |     await expect(page.locator('#tunerView')).toBeVisible();
  123 |   });
  124 | 
  125 |   test('settings sheet footer renders theme toggle and opens modals', async ({ page }) => {
  126 |     await openTuner(page);
  127 |     await page.locator('#tunerSettingsBtn').click();
  128 |     await expect(page.locator('#tunerPanelSettings')).toBeVisible();
```