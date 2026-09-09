import { test, expect } from '@playwright/test';

test('drum removal, lug steppers and recorded target playback', async ({ page }, info) => {
  await page.addInitScript(() => {
    const audio = { plays: [] as number[], contexts: [] as AudioContext[] };
    (window as any).__drumAudio = audio;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args: any[]) { super(...args); audio.contexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource(), start = source.start.bind(source);
        source.start = (...args) => { audio.plays.push(source.playbackRate.value); start(...args); };
        return source;
      }
    };
  });
  await page.goto('/tuner');
  await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  await page.locator('[data-instrument="drums"]').click();
  await page.locator('#drumSelect').click();
  await page.locator('[data-drum-id="snare"]').click();
  await page.locator('#drumSelect').click();
  await page.locator('#drumName').fill('My snare');
  await page.locator('#drumName').press('Enter');
  await expect(page.locator('#drumSelectedName')).toHaveText('My snare');
  await expect(page.locator('#drumSelectMenu')).toBeHidden();
  await page.locator('#drumSave').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kins-tuner-drum-kit-v1')!).find((d: any) => d.id === 'snare').label)).toBe('My snare');
  await page.locator('#drumTargetHz').fill('200'); await page.locator('#drumTargetHz').press('Tab');
  await page.locator('[data-lug="0"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBe(1);
  await page.locator('#drumTargetHz').fill('400'); await page.locator('#drumTargetHz').press('Tab');
  await page.locator('[data-lug="1"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBe(2);
  const rates = await page.evaluate(() => (window as any).__drumAudio.plays);
  expect(rates[1] / rates[0]).toBeCloseTo(2, 8);
  await page.locator('#drumLugsPlus').click(); await expect(page.locator('#drumLugCount')).toHaveText('11');
  await expect(page.locator('[data-lug]')).toHaveCount(11);
  await page.locator('#drumLugsPlus').click(); await expect(page.locator('#drumLugsPlus')).toBeDisabled();
  for (let i = 0; i < 8; i++) await page.locator('#drumLugsMinus').click();
  await expect(page.locator('#drumLugsMinus')).toBeDisabled();
  await expect(page.locator('[data-lug]')).toHaveCount(4);
  await page.locator('#drumSelect').click(); await page.locator('#drumRemove').click(); await expect(page.locator('#drumOptions [data-drum-id]')).toHaveCount(3);
  await page.locator('#drumAdd').click(); await page.locator('#drumSelect').click(); await page.locator('#drumRemove').click(); await page.locator('#drumAdd').click();
  await page.locator('#drumSave').click();
  const kit = await page.evaluate(() => JSON.parse(localStorage.getItem('kins-tuner-drum-kit-v1')!));
  expect(new Set(kit.map((d: any) => d.id)).size).toBe(kit.length);
  expect(kit.some((d: any) => d.id === 'snare')).toBe(false);
  await page.reload();
  await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  await page.locator('[data-instrument="drums"]').click();
  await expect(page.locator('#drumWorkflow')).toBeVisible();
  await expect(page.locator('#drumOptions [data-drum-id]')).toHaveCount(4);
  for (const theme of ['standard', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.screenshot({ path: info.outputPath(`drum-controls-${theme}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (let i = 0; i < 3; i++) { await page.locator('#drumSelect').click(); await page.locator('#drumRemove').click(); }
  await page.locator('#drumSelect').click();
  await expect(page.locator('#drumRemove')).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.locator('[data-drum-step="whole"]').click(); await page.locator('#drumPreview').click();
  await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBeGreaterThan(0);
  await page.locator('[data-instrument="electric"]').click();
  await page.locator('[data-instrument="drums"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.contexts.every((c: AudioContext) => c.state === 'closed'))).toBe(true);
  await page.locator('[data-instrument="electric"]').click();
  await page.locator('#tunerSettingsBtn').click();
  await expect(page.locator('#tunerStringsPlus')).toHaveClass(/tuner-stepper-button/);
  await page.screenshot({ path: info.outputPath('string-stepper.png') });
});
