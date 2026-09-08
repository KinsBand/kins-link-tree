import { test, expect } from '@playwright/test';

test('instrument and tuning selections strum on the audio clock and cancel on navigation', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const log = { plays: [] as { time: number, rate: number }[], contexts: [] as AudioContext[] };
    (window as any).__strum = log;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args: any[]) { super(...args); log.contexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource(), start = source.start.bind(source);
        source.start = (time = 0, ...args) => { log.plays.push({ time, rate: source.playbackRate.value }); start(time, ...args); };
        return source;
      }
    };
  });
  await page.goto('/tuner');
  await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  await page.locator('[data-instrument="acoustic"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length), { timeout: 15000 }).toBe(6);
  const played = await page.evaluate(() => (window as any).__strum.plays);
  for (let i = 1; i < 6; i++) expect(played[i].time - played[i - 1].time).toBeCloseTo(0.42, 6);
  // The acoustic illustration has two columns, visited from the top row down.
  const midi = [50, 55, 45, 59, 40, 64], recorded = [146.745, 195.7348, 109.9642, 246.7893, 82.2991, 329.8141];
  for (let i = 0; i < 6; i++) expect(played[i].rate).toBeCloseTo(440 * 2 ** ((midi[i] - 69) / 12) / recorded[i], 5);
  await page.locator('[data-instrument="bass"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length), { timeout: 15000 }).toBe(10);
  expect(await page.evaluate(() => (window as any).__strum.contexts[0].state)).toBe('closed');
  await page.locator('#tunerPresetBtn').click();
  await page.locator('.tuning-card').nth(1).click();
  await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length), { timeout: 15000 }).toBe(14);
  for (const icon of await page.locator('#tunerInstrumentRow svg').all()) {
    const box = await icon.boundingBox(); expect(box!.width).toBeLessThanOrEqual(18); expect(box!.height).toBeLessThanOrEqual(18);
  }
  await page.locator('[data-instrument="drums"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__strum.contexts.every((c: AudioContext) => c.state === 'closed'))).toBe(true);
});


test('unusual string counts expose selectable adapted tunings for every guitar', async ({ page }) => {
  await page.goto('/tuner');
  await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  for (const instrument of ['electric', 'acoustic', 'bass']) {
    await page.locator(`#tunerInstrumentRow [data-instrument="${instrument}"]`).click();
    await page.locator('#tunerSettingsBtn').click();
    await page.locator('#tunerStringCount').fill('11'); await page.locator('#tunerStringCount').press('Enter');
    await page.locator('#tunerSheetClose').click();
    await page.locator('#tunerPresetBtn').click();
    const adapted = page.locator('.tuning-card').filter({ hasText: 'adapted' });
    expect(await adapted.count()).toBeGreaterThan(200);
    await adapted.first().click();
    await expect(page.locator('#tunerFigure .tuner-peg')).toHaveCount(11);
  }
});
