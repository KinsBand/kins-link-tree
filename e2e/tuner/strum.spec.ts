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
  await expect(page.locator('.tuner-string-line.reference-vibrating').first()).toBeVisible();
  await expect(page.locator('.tuner-peg.reference-vibrating').first()).toBeVisible();
  const played = await page.evaluate(() => (window as any).__strum.plays);
  for (let i = 1; i < 6; i++) expect(played[i].time - played[i - 1].time).toBeCloseTo(0.42, 6);
  // Sound and peg animation follow ascending pitch across both headstock columns.
  const midi = [40, 45, 50, 55, 59, 64], recorded = [82.2991, 109.9642, 146.745, 195.7348, 246.7893, 329.8141];
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


test('peg playback animates its string and peg, respects reduced motion and cleans up', async ({ page }) => {
  await page.goto('/tuner');
  const peg = page.locator('.tuner-peg[data-string-index="1"]');
  await peg.click();
  await expect(peg).toHaveClass(/reference-vibrating/);
  const string = page.locator('.tuner-string-line.str-s1');
  await expect(string).toHaveClass(/reference-vibrating/);
  expect(await string.evaluate(el => getComputedStyle(el).animationName)).toBe('tuner-string-vibration');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await peg.click();
  await expect(peg).toHaveClass(/reference-vibrating/);
  expect(await string.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await page.locator('[data-instrument="drums"]').click();
  await expect(page.locator('.reference-vibrating')).toHaveCount(0);
});
