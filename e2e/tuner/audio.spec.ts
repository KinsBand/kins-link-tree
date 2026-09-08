import { test, expect, type Page } from '@playwright/test';

async function openTuner(page: Page, frequency = 440, mode = 'chromatic', a4 = '440') {
  await page.addInitScript(({ frequency, mode, a4 }) => {
    localStorage.setItem('kins-tuner-mode', mode);
    localStorage.setItem('kins-tuner-a4', a4);
    localStorage.setItem('kins-tuner-auto-id', '0');
    const state = { frequency, sources: [] as any[], pending: false, resolve: null as any };
    (window as any).__tunerInput = state;
    if (!navigator.mediaDevices) return;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, writable: true, value: async () => {
      if (state.pending) await new Promise(resolve => { state.resolve = resolve; });
      const context = new AudioContext({ sampleRate: 48000 });
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = state.frequency;
      gain.gain.value = 0.2;
      oscillator.connect(gain); gain.connect(destination); oscillator.start();
      sessionStorage.setItem('kins-tuner-test-starts', String(Number(sessionStorage.getItem('kins-tuner-test-starts') || 0) + 1));
      for (const track of destination.stream.getTracks()) {
        const originalStop = track.stop.bind(track);
        track.stop = () => {
          sessionStorage.setItem('kins-tuner-test-stops', String(Number(sessionStorage.getItem('kins-tuner-test-stops') || 0) + 1));
          originalStop();
        };
      }
      state.sources.push({ context, oscillator, gain, stream: destination.stream });
      return destination.stream;
    } });
  }, { frequency, mode, a4 });
  await page.goto('/tuner', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#tunerView')).toBeVisible(); // Never silently skip the gated route.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
}

async function start(page: Page) {
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Stop tuning');
}

test('known 440 Hz reaches the real worklet, worker and fractional-cents readout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openTuner(page); await start(page);
  await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
  await expect(page.locator('#tunerDetectedNoteOctave')).toHaveText('4');
  await expect.poll(() => page.evaluate(() => {
    const note = document.querySelector('.rail-note.is-near')?.getBoundingClientRect();
    const rail = document.querySelector('.tuner-chromatic-rail')?.getBoundingClientRect();
    return note && rail ? Math.abs((note.left + note.right - rail.left - rail.right) / 2) : Infinity;
  })).toBeLessThan(4);
  await expect.poll(async () => Math.abs(parseFloat(await page.locator('#tunerCentsReadout').innerText()))).toBeLessThan(1);
  await page.evaluate(() => { const source = (window as any).__tunerInput.sources[0]; source.oscillator.frequency.value = 440 * 2 ** (2 / 1200); });
  await expect.poll(async () => parseFloat(await page.locator('#tunerCentsReadout').innerText())).toBeGreaterThan(1.5);
  await page.locator('#tunerMicToggleBtn').click();
  expect(await page.evaluate(() => (window as any).__tunerInput.sources[0].stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended'))).toBe(true);
  expect(errors).toEqual([]);
});

test('low B0 identifies the correct bass octave', async ({ page }) => {
  await openTuner(page, 30.867706); await start(page);
  await expect(page.locator('#tunerDetectedNote')).toHaveText('B');
  await expect(page.locator('#tunerDetectedNoteOctave')).toHaveText('0');
  await expect.poll(async () => Math.abs(parseFloat(await page.locator('#tunerCentsReadout').innerText()))).toBeLessThan(1);
});

test('guided target confirms from fresh audio then loses live success on silence', async ({ page }) => {
  await openTuner(page, 82.406889, 'guided'); await start(page);
  await expect(page.locator('#tunerConfirmation')).toHaveAttribute('aria-valuenow', '100', { timeout: 20_000 });
  await expect(page.locator('#tunerStatusLine')).toHaveText('STRING CHECKED');
  await page.evaluate(() => { (window as any).__tunerInput.sources[0].gain.gain.value = 0; });
  await expect(page.locator('#tunerConfirmation')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator('#tunerReadoutPanel')).not.toHaveClass(/in-tune/);
  await expect(page.locator('#tunerStatusLine')).not.toHaveText('STRING CHECKED');
});

test('calibration is visible and a saved fractional reference is preserved', async ({ page }) => {
  await openTuner(page, 432.5, 'chromatic', '432.5');
  await expect(page.locator('#tunerTargetLabel')).toContainText('432.5 Hz');
  await page.locator('#tunerSettingsBtn').click();
  await expect(page.locator('#tunerCalibration')).toHaveValue('432.5');
  await page.locator('#tunerTolerance').selectOption('1');
  await page.locator('#tunerCalibrationReset').click();
  await expect(page.locator('#tunerCalibration')).toHaveValue('440');
  await page.keyboard.press('Escape');
  await expect(page.locator('#tunerTargetLabel')).toContainText('440 Hz');
});

test('cancelled permission cannot restart capture when permission later resolves', async ({ page }) => {
  await openTuner(page);
  await page.evaluate(() => { (window as any).__tunerInput.pending = true; });
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Cancel microphone request');
  await page.locator('#tunerMicToggleBtn').click();
  await page.evaluate(() => { (window as any).__tunerInput.resolve(); });
  await expect.poll(() => page.evaluate(() => (window as any).__tunerInput.sources[0]?.stream.getTracks()[0].readyState)).toBe('ended');
  await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Start tuning');
});

test('Astro navigation releases audio and return initialization keeps a single click handler', async ({ page }) => {
  await openTuner(page); await start(page);
  await page.locator('a[aria-label="Back to KINS home"]').click();
  await expect(page.locator('#tunerView')).toHaveCount(0);
  expect(await page.evaluate(() => Number(sessionStorage.getItem('kins-tuner-test-stops')))).toBe(1);
  await page.goBack();
  await expect(page.locator('#tunerView')).toBeVisible();
  await start(page);
  await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
  expect(await page.evaluate(() => Number(sessionStorage.getItem('kins-tuner-test-starts')))).toBe(2);
});

test('denied permission provides recovery and permits a later retry', async ({ page }) => {
  await openTuner(page);
  await page.evaluate(() => {
    const original = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async () => {
      navigator.mediaDevices.getUserMedia = original;
      throw new DOMException('Denied by test', 'NotAllowedError');
    };
  });
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#tunerMicWarning')).toContainText('permission is blocked');
  await start(page);
  await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
});

test('unsupported browsers explain unavailable microphone processing', async ({ page }) => {
  await openTuner(page);
  await page.evaluate(() => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
    Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
  });
  await page.locator('#tunerMicToggleBtn').click();
  await expect(page.locator('#tunerMicWarning')).toContainText('does not support microphone');
  await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Start tuning');
});

test('auto advance follows confirmation without reusing the previous string pitch', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kins-tuner-auto-advance', '1'));
  await openTuner(page, 82.406889, 'guided'); await start(page);
  await expect(page.locator('#tunerTargetLabel')).toContainText('Target A2', { timeout: 20_000 });
  await expect(page.locator('#tunerConfirmation')).toHaveAttribute('aria-valuenow', '0');
  await page.evaluate(() => { (window as any).__tunerInput.sources[0].oscillator.frequency.value = 110; });
  await expect(page.locator('#tunerTargetLabel')).toContainText('Target D3', { timeout: 20_000 });
});

test('both themes fit the viewport and settings retain keyboard focus', async ({ page }, testInfo) => {
  await openTuner(page, 440);
  for (const theme of ['standard', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.waitForTimeout(300); // Theme surface transitions must settle before visual capture.
    await expect(page.locator('#tunerSheet')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`tuner-${theme}.png`), fullPage: true });
    await page.locator('#tunerSettingsBtn').click();
    await expect(page.locator('#tunerCalibration')).toBeVisible();
    await page.waitForTimeout(300); // Finish the documented 240 ms sheet entrance before visual capture.
    await page.locator('#tunerCalibration').focus();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`settings-${theme}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.locator('#tunerSheet')).toBeHidden();
    await expect(page.locator('#tunerSettingsBtn')).toBeFocused();
  }
});
