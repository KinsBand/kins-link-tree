import { test, expect } from '@playwright/test';

test('metronome waits for the delayed controller before enabling controls', async ({ page }) => {
  let releaseImport!: () => void;
  const holdImport = new Promise<void>(resolve => { releaseImport = resolve; });
  await page.route('**/src/scripts/controllers/metronome/index.js*', async route => {
    await holdImport;
    await route.continue();
  });
  await page.goto('/metronome', { waitUntil: 'domcontentloaded' });
  const play = page.locator('#metroPlayBtn');
  try {
    await expect(play).toBeDisabled();
    await expect(page.locator('#metroSettingsBtn')).toBeDisabled();
    await expect(page.locator('#metroView')).toHaveAttribute('aria-busy', 'true');
  } finally {
    releaseImport();
  }
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Stop metronome');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Start metronome');
});

test('closed search leaves the tab order and opening/closing restores focus', async ({ page }) => {
  await page.goto('/');
  const overlay = page.locator('#coversSearchOverlay');
  const opener = page.locator('#headerSearchPillBtn');
  await expect(overlay).toHaveAttribute('inert', '');
  await page.locator('#footerFaqToggleBtn').focus();
  await page.keyboard.press('Tab');
  expect(await overlay.evaluate(el => el.contains(document.activeElement))).toBe(false);
  await expect(overlay).toHaveAttribute('data-search-ready', 'true');
  await opener.click();
  await expect(page.locator('#overlaySearchInput')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await overlay.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator('#overlaySearchInput')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(overlay).toHaveAttribute('inert', '');
  await expect(overlay).toHaveAttribute('aria-hidden', 'true');
});

test('the first search click survives a delayed controller import', async ({ page }) => {
  let releaseImport!: () => void;
  const holdImport = new Promise<void>(resolve => { releaseImport = resolve; });
  await page.route('**/src/scripts/controllers/coversSearchEngine.js*', async route => {
    await holdImport;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  try {
    await page.locator('#headerSearchPillBtn').click();
    await expect(page.locator('#coversSearchOverlay')).toHaveAttribute('inert', '');
  } finally {
    releaseImport();
  }
  await expect(page.locator('#coversSearchOverlay')).toHaveClass(/active/);
  await expect(page.locator('#overlaySearchInput')).toBeFocused();
});

test('metronome recovers from a failed import and repeated route teardown', async ({ page }) => {
  await page.route('**/src/scripts/controllers/metronome/index.js*', route => route.abort(), { times: 1 });
  await page.goto('/metronome');
  await expect(page.locator('#metroLoadError')).toBeVisible();
  await expect(page.locator('#metroPlayBtn')).toBeDisabled();
  await page.locator('#metroRetryLoad').click();
  await expect(page.locator('#metroPlayBtn')).toBeEnabled();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => {
    document.dispatchEvent(new Event('astro:before-swap'));
    document.dispatchEvent(new Event('astro:before-swap'));
    document.dispatchEvent(new Event('astro:page-load'));
  });
  await page.locator('#metroPlayBtn').click();
  await expect(page.locator('#metroPlayBtn')).toHaveAttribute('aria-label', 'Stop metronome');
  await page.locator('#metroPlayBtn').click();
  expect(errors).toEqual([]);
});

test('inspiration labels meet text contrast in both themes', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['Light', 'Dark']) {
    await page.locator(`#themePill${theme}Btn`).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'Light' ? 'standard' : 'dark');
    // Read settled theme colors, not an intermediate frame of an existing CSS transition.
    const contrast = () => page.locator('#memberFilterBar [role="tab"]:not(.active)').first().evaluate(el => {
      const style = getComputedStyle(el);
      const luminance = (color: string) => {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255)
          .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
    await expect.poll(contrast).toBeGreaterThanOrEqual(4.5);
  }
});
