# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audio.spec.ts >> low B0 identifies the correct bass octave
- Location: e2e\tuner\audio.spec.ts:68:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#tunerMicToggleBtn')
Expected: "Stop tuning"
Received: "Start tuning"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('#tunerMicToggleBtn')
    13 × locator resolved to <button type="button" id="tunerMicToggleBtn" aria-label="Start tuning" data-astro-cid-vkadm5px="" data-track="tuner:mic_start" class="tuner-mic-cta brutal-press">…</button>
       - unexpected value "Start tuning"

```

```yaml
- button "Start tuning": START
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | async function openTuner(page: Page, frequency = 440, mode = 'chromatic', a4 = '440') {
  4   |   await page.addInitScript(({ frequency, mode, a4 }) => {
  5   |     localStorage.setItem('kins-tuner-mode', mode);
  6   |     localStorage.setItem('kins-tuner-a4', a4);
  7   |     localStorage.setItem('kins-tuner-auto-id', '0');
  8   |     const state = { frequency, sources: [] as any[], pending: false, resolve: null as any };
  9   |     (window as any).__tunerInput = state;
  10  |     if (!navigator.mediaDevices) return;
  11  |     Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, writable: true, value: async () => {
  12  |       if (state.pending) await new Promise(resolve => { state.resolve = resolve; });
  13  |       const context = new AudioContext({ sampleRate: 48000 });
  14  |       await context.resume();
  15  |       const oscillator = context.createOscillator();
  16  |       const gain = context.createGain();
  17  |       const destination = context.createMediaStreamDestination();
  18  |       oscillator.frequency.value = state.frequency;
  19  |       gain.gain.value = 0.2;
  20  |       oscillator.connect(gain); gain.connect(destination); oscillator.start();
  21  |       sessionStorage.setItem('kins-tuner-test-starts', String(Number(sessionStorage.getItem('kins-tuner-test-starts') || 0) + 1));
  22  |       for (const track of destination.stream.getTracks()) {
  23  |         const originalStop = track.stop.bind(track);
  24  |         track.stop = () => {
  25  |           sessionStorage.setItem('kins-tuner-test-stops', String(Number(sessionStorage.getItem('kins-tuner-test-stops') || 0) + 1));
  26  |           originalStop();
  27  |         };
  28  |       }
  29  |       state.sources.push({ context, oscillator, gain, stream: destination.stream });
  30  |       return destination.stream;
  31  |     } });
  32  |   }, { frequency, mode, a4 });
  33  |   await page.goto('/tuner', { waitUntil: 'domcontentloaded' });
  34  |   await expect(page.locator('#tunerView')).toBeVisible(); // Never silently skip the gated route.
  35  |   await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  36  | }
  37  | 
  38  | async function start(page: Page) {
  39  |   await page.locator('#tunerMicToggleBtn').click();
> 40  |   await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Stop tuning');
      |                                                    ^ Error: expect(locator).toHaveAttribute(expected) failed
  41  | }
  42  | 
  43  | test('known 440 Hz reaches the worklet and clean Free mode readout', async ({ page }) => {
  44  |   const errors: string[] = [];
  45  |   page.on('pageerror', error => errors.push(error.message));
  46  |   await openTuner(page); await start(page);
  47  |   await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
  48  |   await expect(page.locator('#tunerDetectedNoteOctave')).toHaveText('4');
  49  |   await expect(page.locator('#tunerCentsReadout')).toBeHidden();
  50  |   await expect(page.locator('#tunerChromRail')).toBeVisible();
  51  |   await expect(page.locator('#tunerDetectedFreq')).toContainText('Hz');
  52  |   await expect(page.locator('.rail-note').first()).toHaveAttribute('data-midi', '12');
  53  |   await expect(page.locator('.rail-note').last()).toHaveAttribute('data-midi', '127');
  54  |   await expect(page.locator('.rail-note.is-near')).toHaveAttribute('data-midi', '69');
  55  |   const centered = await page.locator('.rail-note.is-near').evaluate(el => {
  56  |     const note = el.getBoundingClientRect();
  57  |     const rail = document.getElementById('tunerChromRail')!.getBoundingClientRect();
  58  |     return Math.abs(note.x + note.width / 2 - rail.x - rail.width / 2);
  59  |   });
  60  |   expect(centered).toBeLessThan(4);
  61  |   // The listening CTA pulses; keyboard activation is independent of its transform.
  62  |   await page.locator('#tunerMicToggleBtn').focus();
  63  |   await page.locator('#tunerMicToggleBtn').press('Enter');
  64  |   expect(await page.evaluate(() => (window as any).__tunerInput.sources[0].stream.getTracks().every((track: MediaStreamTrack) => track.readyState === 'ended'))).toBe(true);
  65  |   expect(errors).toEqual([]);
  66  | });
  67  | 
  68  | test('low B0 identifies the correct bass octave', async ({ page }) => {
  69  |   await openTuner(page, 30.867706); await start(page);
  70  |   await expect(page.locator('#tunerDetectedNote')).toHaveText('B');
  71  |   await expect(page.locator('#tunerDetectedNoteOctave')).toHaveText('0');
  72  |   await expect(page.locator('#tunerCentsReadout')).toBeHidden();
  73  | });
  74  | 
  75  | test('guided target confirms from fresh audio then loses live success on silence', async ({ page }) => {
  76  |   await openTuner(page, 82.406889, 'guided'); await start(page);
  77  |   await expect(page.locator('#tunerConfirmation')).toHaveAttribute('aria-valuenow', '100', { timeout: 20_000 });
  78  |   await expect(page.locator('#tunerStatusLine')).toHaveText('STRING CHECKED');
  79  |   await page.evaluate(() => { (window as any).__tunerInput.sources[0].gain.gain.value = 0; });
  80  |   await expect(page.locator('#tunerConfirmation')).toHaveAttribute('aria-valuenow', '0');
  81  |   await expect(page.locator('#tunerReadoutPanel')).not.toHaveClass(/in-tune/);
  82  |   await expect(page.locator('#tunerStatusLine')).not.toHaveText('STRING CHECKED');
  83  | });
  84  | 
  85  | test('calibration is visible and a saved fractional reference is preserved', async ({ page }) => {
  86  |   await openTuner(page, 432.5, 'chromatic', '432.5');
  87  |   await expect(page.locator('#tunerTargetLabel')).toHaveCount(0);
  88  |   await page.locator('#tunerSettingsBtn').click();
  89  |   await expect(page.locator('#tunerCalibration')).toHaveValue('432.5');
  90  |   await page.locator('#tunerTolerance').selectOption('1');
  91  |   await page.locator('#tunerCalibrationReset').click();
  92  |   await expect(page.locator('#tunerCalibration')).toHaveValue('440');
  93  |   await page.keyboard.press('Escape');
  94  |   await expect(page.locator('#tunerTargetLabel')).toHaveCount(0);
  95  | });
  96  | 
  97  | test('cancelled permission cannot restart capture when permission later resolves', async ({ page }) => {
  98  |   await openTuner(page);
  99  |   await page.evaluate(() => { (window as any).__tunerInput.pending = true; });
  100 |   await page.locator('#tunerMicToggleBtn').click();
  101 |   await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Cancel microphone request');
  102 |   await page.locator('#tunerMicToggleBtn').click();
  103 |   await page.evaluate(() => { (window as any).__tunerInput.resolve(); });
  104 |   await expect.poll(() => page.evaluate(() => (window as any).__tunerInput.sources[0]?.stream.getTracks()[0].readyState)).toBe('ended');
  105 |   await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Start tuning');
  106 | });
  107 | 
  108 | test('Astro navigation releases audio and return initialization keeps a single click handler', async ({ page }) => {
  109 |   await openTuner(page); await start(page);
  110 |   await page.locator('a[aria-label="Back to KINS home"]').click();
  111 |   await expect(page.locator('#tunerView')).toHaveCount(0);
  112 |   expect(await page.evaluate(() => Number(sessionStorage.getItem('kins-tuner-test-stops')))).toBe(1);
  113 |   await page.goBack();
  114 |   await expect(page.locator('#tunerView')).toBeVisible();
  115 |   await start(page);
  116 |   await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
  117 |   expect(await page.evaluate(() => Number(sessionStorage.getItem('kins-tuner-test-starts')))).toBe(2);
  118 | });
  119 | 
  120 | test('denied permission provides recovery and permits a later retry', async ({ page }) => {
  121 |   await openTuner(page);
  122 |   await page.evaluate(() => {
  123 |     const original = navigator.mediaDevices.getUserMedia;
  124 |     navigator.mediaDevices.getUserMedia = async () => {
  125 |       navigator.mediaDevices.getUserMedia = original;
  126 |       throw new DOMException('Denied by test', 'NotAllowedError');
  127 |     };
  128 |   });
  129 |   await page.locator('#tunerMicToggleBtn').click();
  130 |   await expect(page.locator('#tunerMicWarning')).toContainText('permission is blocked');
  131 |   await start(page);
  132 |   await expect(page.locator('#tunerDetectedNote')).toHaveText('A');
  133 | });
  134 | 
  135 | test('unsupported browsers explain unavailable microphone processing', async ({ page }) => {
  136 |   await openTuner(page);
  137 |   await page.evaluate(() => {
  138 |     Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined });
  139 |     Object.defineProperty(window, 'webkitAudioContext', { configurable: true, value: undefined });
  140 |   });
```