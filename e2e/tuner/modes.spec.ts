import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, mode = 'guided') {
  await page.addInitScript(({ mode }) => {
    localStorage.setItem('kins-tuner-mode', mode);
    localStorage.setItem('kins-tuner-instrument', 'electric');
    localStorage.setItem('kins-tuner-a4', '432.5');
    const audio = { references: [] as number[], contexts: [] as AudioContext[], streams: [] as MediaStream[] };
    (window as any).__modeAudio = audio;
    const Native = window.AudioContext;
    if (!Native) return;
    (window as any).AudioContext = class extends Native {
      constructor(...args: any[]) { super(...args); audio.contexts.push(this); }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (when, offset, duration) => { audio.references.push(source.playbackRate.value); start(when, offset, duration); };
        return source;
      }
    };
    if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      const ctx = new Native({ sampleRate: 48000 }); await ctx.resume();
      const destination = ctx.createMediaStreamDestination();
      const buffer = ctx.createBuffer(1, 48000, 48000), samples = buffer.getChannelData(0);
      for (let i = 7200; i < samples.length; i++) {
        const t = (i - 7200) / 48000;
        samples[i] = Math.exp(-t * 7) * (0.24 * Math.sin(2 * Math.PI * 180 * t) + 0.06 * Math.sin(2 * Math.PI * 286.2 * t));
      }
      const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true; source.connect(destination); source.start();
      destination.stream.getTracks().forEach(track => { const stop = track.stop.bind(track); track.stop = () => { stop(); source.stop(); void ctx.close(); }; });
      audio.streams.push(destination.stream);
      return destination.stream;
    } });
  }, { mode });
  await page.goto('/tuner');
  await expect(page.locator('.tuner-peg').first()).toBeVisible();
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
}

test('ear training spans the settings row, plays calibrated pegs and restores guided UI', async ({ page }) => {
  await open(page);
  await page.locator('#tunerSettingsBtn').click();
  const ear = page.locator('[data-sheet-mode="ear"]');
  const parent = await page.locator('#tunerSheetModeRow').boundingBox();
  const box = await ear.boundingBox();
  expect(Math.abs(box!.width - parent!.width)).toBeLessThan(2);
  await ear.click(); await page.keyboard.press('Escape');
  await expect(page.locator('#tunerReadoutPanel')).toBeHidden();
  await expect(page.locator('#tunerMicToggleBtn')).toBeHidden();
  await page.locator('[data-string-index="0"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.references.length)).toBe(1);
  expect(await page.evaluate(() => (window as any).__modeAudio.references[0])).toBeCloseTo(432.5 * 2 ** ((40 - 69) / 12) / 82.3846, 5);
  expect(await page.evaluate(() => (window as any).__modeAudio.streams.length)).toBe(0);
  await expect(page.locator('[data-string-index="0"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.references.length)).toBe(2);
  await page.locator('#tunerSettingsBtn').click();
  await page.locator('[data-sheet-mode="guided"]').click(); await page.keyboard.press('Escape');
  await expect(page.locator('#tunerReadoutPanel')).toBeVisible();
  await expect(page.locator('#tunerMicToggleBtn')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.contexts.every((ctx: AudioContext) => ctx.state === 'closed'))).toBe(true);
});

test('ear training stops active capture and persists the selected mode', async ({ page }) => {
  await open(page);
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Stop tuning');
  await page.locator('#tunerSettingsBtn').click(); await page.locator('[data-sheet-mode="ear"]').click();
  expect(await page.evaluate(() => (window as any).__modeAudio.streams.every((s: MediaStream) => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);
  // The init script intentionally resets the initial mode; inspect saved value before reload.
  expect(await page.evaluate(() => localStorage.getItem('kins-tuner-mode'))).toBe('ear');
});

test('drum taps travel through capture and worker; lug order, separate targets and saving work', async ({ page }) => {
  await open(page);
  await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  await expect(page.locator('#drumWorkflow')).toBeVisible();
  await expect(page.locator('#tunerFigure')).toBeHidden();
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#drumReading')).toContainText('180.', { timeout: 15000 });
  await expect(page.locator('#drumFeedback')).toContainText('Matched on last tap');
  await expect(page.locator('[data-lug="0"]')).toHaveClass(/matched/);
  await page.locator('#drumNextLug').click();
  await expect(page.locator('[data-lug="3"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#drumTargetHz').fill('185'); await page.locator('#drumTargetHz').press('Tab');
  await page.locator('[data-drum-step="resonant"]').click();
  await expect(page.locator('#drumTargetHz')).toHaveValue('180');
  await page.locator('[data-drum-step="whole"]').click();
  await expect(page.locator('#drumTargetHz')).toHaveValue('110');
  await expect(page.locator('#drumNextLug')).toBeHidden();
  await page.locator('#drumSave').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kins-tuner-drum-kit-v1')!)[0].batter)).toBe(185);
  await page.locator('#tunerInstrumentRow [data-instrument="electric"]').click();
  expect(await page.evaluate(() => (window as any).__modeAudio.streams.every((s: MediaStream) => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);
  await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  await page.locator('[data-drum-step="batter"]').click();
  await expect(page.locator('#drumTargetHz')).toHaveValue('185');
});

test('both themes show distinct guitar artwork and a usable drum workflow', async ({ page }, testInfo) => {
  await open(page, 'ear');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    for (const instrument of ['electric', 'acoustic', 'bass']) {
      await page.locator(`#tunerInstrumentRow [data-instrument="${instrument}"]`).click();
      await expect(page.locator(`.art-${instrument}`)).toBeVisible();
      await expect(page.locator('.tuner-peg')).toHaveCount(instrument === 'bass' ? 4 : 6);
      await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-${instrument}.png` });
    }
    await page.locator('#tunerSettingsBtn').click();
    await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-settings.png` });
    await page.keyboard.press('Escape');
    await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
    await expect(page.locator('#drumWorkflow')).toBeVisible();
    await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-drums.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator('#drumNextStep').scrollIntoViewIfNeeded();
    await expect(page.locator('#drumNextStep')).toBeInViewport();
  }
});
