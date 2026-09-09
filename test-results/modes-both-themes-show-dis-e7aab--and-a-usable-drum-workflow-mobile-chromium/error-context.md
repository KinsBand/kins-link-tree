# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modes.spec.ts >> both themes show distinct guitar artwork and a usable drum workflow
- Location: e2e\tuner\modes.spec.ts:106:1

# Error details

```
Error: UNKNOWN: unknown error, open 'C:\Users\trai\.gemini\antigravity\scratch\kins-official-website\artifacts\tuner-modes\mobile-chromium-light-acoustic.png'
```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - navigation "Tuner navigation" [ref=e5]:
      - link "Back to KINS home" [ref=e6] [cursor=pointer]:
        - /url: /
      - button "TUNER Standard" [ref=e9] [cursor=pointer]:
        - generic [ref=e10]: TUNER
        - generic [ref=e11]: Standard
      - button "Open tuner settings" [ref=e15] [cursor=pointer]:
        - generic [ref=e16]: 
    - region "Tuning meter" [ref=e17]:
      - button "Start tuning" [ref=e18] [cursor=pointer]
      - generic "Estimated string tension" [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: Loose
          - generic [ref=e28]: Normal
          - generic [ref=e29]: Tight
    - generic [ref=e30]:
      - text: 
      - region "String and drum targets" [ref=e31]:
        - group "acoustic guitar headstock with 6 playable tuning pegs" [ref=e32]:
          - generic [ref=e37]: KINS
          - button "Play reference for string 6" [pressed] [ref=e65] [cursor=pointer]:
            - generic: "6"
          - button "Play reference for string 5" [ref=e68] [cursor=pointer]:
            - generic: "5"
          - button "Play reference for string 4" [ref=e71] [cursor=pointer]:
            - generic: "4"
          - button "Play reference for string 3" [ref=e74] [cursor=pointer]:
            - generic: "3"
          - button "Play reference for string 2" [ref=e77] [cursor=pointer]:
            - generic: "2"
          - button "Play reference for string 1" [ref=e80] [cursor=pointer]:
            - generic: "1"
      - status [ref=e83]: Playing recorded reference.
    - generic [ref=e84]:
      - button "Start tuning" [ref=e86] [cursor=pointer]:
        - generic [ref=e90]: START
      - tablist "Instrument" [ref=e91]:
        - tab "ELECTRIC" [ref=e92] [cursor=pointer]
        - tab "ACOUSTIC" [active] [selected] [ref=e98] [cursor=pointer]
        - tab "BASS" [ref=e104] [cursor=pointer]
        - tab "DRUMS" [ref=e109] [cursor=pointer]
      - text: 
  - text:    
```

# Test source

```ts
  14  |       createBufferSource() {
  15  |         const source = super.createBufferSource();
  16  |         const start = source.start.bind(source);
  17  |         source.start = (when, offset, duration) => { audio.references.push(source.playbackRate.value); start(when, offset, duration); };
  18  |         return source;
  19  |       }
  20  |     };
  21  |     if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
  22  |       const ctx = new Native({ sampleRate: 48000 }); await ctx.resume();
  23  |       const destination = ctx.createMediaStreamDestination();
  24  |       const buffer = ctx.createBuffer(1, 48000, 48000), samples = buffer.getChannelData(0);
  25  |       for (let i = 7200; i < samples.length; i++) {
  26  |         const t = (i - 7200) / 48000;
  27  |         samples[i] = Math.exp(-t * 7) * (0.24 * Math.sin(2 * Math.PI * 180 * t) + 0.06 * Math.sin(2 * Math.PI * 286.2 * t));
  28  |       }
  29  |       const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true; source.connect(destination); source.start();
  30  |       destination.stream.getTracks().forEach(track => { const stop = track.stop.bind(track); track.stop = () => { stop(); source.stop(); void ctx.close(); }; });
  31  |       audio.streams.push(destination.stream);
  32  |       return destination.stream;
  33  |     } });
  34  |   }, { mode });
  35  |   await page.goto('/tuner');
  36  |   await expect(page.locator('.tuner-peg').first()).toBeVisible();
  37  |   await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  38  | }
  39  | 
  40  | test('ear training spans the settings row, plays calibrated pegs and restores guided UI', async ({ page }) => {
  41  |   await open(page);
  42  |   await page.locator('#tunerSettingsBtn').click();
  43  |   const ear = page.locator('[data-sheet-mode="ear"]');
  44  |   const parent = await page.locator('#tunerSheetModeRow').boundingBox();
  45  |   const box = await ear.boundingBox();
  46  |   expect(Math.abs(box!.width - parent!.width)).toBeLessThan(2);
  47  |   await ear.click(); await page.keyboard.press('Escape');
  48  |   await expect(page.locator('#tunerReadoutPanel')).toBeVisible();
  49  |   await expect(page.locator('#tunerTension')).toBeVisible();
  50  |   await expect(page.locator('.tuner-tension-scale span')).toHaveText(['Loose', 'Normal', 'Tight']);
  51  |   await expect(page.locator('.tuner-tension-colors')).toBeVisible();
  52  |   await expect(page.locator('#tunerTensionStatus')).toBeEmpty();
  53  |   await expect(page.locator('#tunerCentsReadout')).toBeHidden();
  54  |   await expect(page.locator('#tunerNeedle')).toBeHidden();
  55  |   await expect(page.locator('#tunerMicToggleBtn')).toBeVisible();
  56  |   await page.locator('[data-string-index="0"]').click();
  57  |   await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.references.length)).toBe(1);
  58  |   expect(await page.evaluate(() => (window as any).__modeAudio.references[0])).toBeCloseTo(432.5 * 2 ** ((40 - 69) / 12) / 82.3846, 5);
  59  |   expect(await page.evaluate(() => (window as any).__modeAudio.streams.length)).toBe(0);
  60  |   await expect(page.locator('[data-string-index="0"]')).toBeFocused();
  61  |   await page.keyboard.press('Enter');
  62  |   await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.references.length)).toBe(2);
  63  |   await page.locator('#tunerSettingsBtn').click();
  64  |   await page.locator('[data-sheet-mode="guided"]').click(); await page.keyboard.press('Escape');
  65  |   await expect(page.locator('#tunerReadoutPanel')).toBeVisible();
  66  |   await expect(page.locator('#tunerMicToggleBtn')).toBeVisible();
  67  |   await expect.poll(() => page.evaluate(() => (window as any).__modeAudio.contexts.every((ctx: AudioContext) => ctx.state === 'closed'))).toBe(true);
  68  | });
  69  | 
  70  | test('ear training retains capture for tension estimates and persists the selected mode', async ({ page }) => {
  71  |   await open(page);
  72  |   await page.locator('#tunerMicToggleBtn').click();
  73  |   await expect(page.locator('#tunerMicToggleBtn')).toHaveAttribute('aria-label', 'Stop tuning');
  74  |   await page.locator('#tunerSettingsBtn').click(); await page.locator('[data-sheet-mode="ear"]').click();
  75  |   expect(await page.evaluate(() => (window as any).__modeAudio.streams.every((s: MediaStream) => s.getTracks().every(t => t.readyState === 'live')))).toBe(true);
  76  |   // The init script intentionally resets the initial mode; inspect saved value before reload.
  77  |   expect(await page.evaluate(() => localStorage.getItem('kins-tuner-mode'))).toBe('ear');
  78  | });
  79  | 
  80  | test('drum taps travel through capture and worker; lug order, separate targets and saving work', async ({ page }) => {
  81  |   await open(page);
  82  |   await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  83  |   await expect(page.locator('#drumWorkflow')).toBeVisible();
  84  |   await expect(page.locator('#tunerFigure')).toBeHidden();
  85  |   await page.locator('#tunerMicToggleBtn').click();
  86  |   await expect(page.locator('#drumReading')).toContainText('180.', { timeout: 15000 });
  87  |   await expect(page.locator('#drumFeedback')).toContainText('Matched on last tap');
  88  |   await expect(page.locator('[data-lug="0"]')).toHaveClass(/matched/);
  89  |   await page.locator('#drumNextLug').click();
  90  |   await expect(page.locator('[data-lug="3"]')).toHaveAttribute('aria-pressed', 'true');
  91  |   await page.locator('#drumTargetHz').fill('185'); await page.locator('#drumTargetHz').press('Tab');
  92  |   await page.locator('[data-drum-step="resonant"]').click();
  93  |   await expect(page.locator('#drumTargetHz')).toHaveValue('180');
  94  |   await page.locator('[data-drum-step="whole"]').click();
  95  |   await expect(page.locator('#drumTargetHz')).toHaveValue('110');
  96  |   await expect(page.locator('#drumNextLug')).toBeHidden();
  97  |   await page.locator('#drumSave').click();
  98  |   expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kins-tuner-drum-kit-v1')!)[0].batter)).toBe(185);
  99  |   await page.locator('#tunerInstrumentRow [data-instrument="electric"]').click();
  100 |   expect(await page.evaluate(() => (window as any).__modeAudio.streams.every((s: MediaStream) => s.getTracks().every(t => t.readyState === 'ended')))).toBe(true);
  101 |   await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  102 |   await page.locator('[data-drum-step="batter"]').click();
  103 |   await expect(page.locator('#drumTargetHz')).toHaveValue('185');
  104 | });
  105 | 
  106 | test('both themes show distinct guitar artwork and a usable drum workflow', async ({ page }, testInfo) => {
  107 |   await open(page, 'ear');
  108 |   for (const theme of ['light', 'dark']) {
  109 |     await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  110 |     for (const instrument of ['electric', 'acoustic', 'bass']) {
  111 |       await page.locator(`#tunerInstrumentRow [data-instrument="${instrument}"]`).click();
  112 |       await expect(page.locator(`.art-${instrument}`)).toBeVisible();
  113 |       await expect(page.locator('.tuner-peg')).toHaveCount(instrument === 'bass' ? 4 : 6);
> 114 |       await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-${instrument}.png` });
      |       ^ Error: UNKNOWN: unknown error, open 'C:\Users\trai\.gemini\antigravity\scratch\kins-official-website\artifacts\tuner-modes\mobile-chromium-light-acoustic.png'
  115 |     }
  116 |     await page.locator('#tunerSettingsBtn').click();
  117 |     await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-settings.png` });
  118 |     await page.keyboard.press('Escape');
  119 |     await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  120 |     await expect(page.locator('#drumWorkflow')).toBeVisible();
  121 |     await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-drums.png` });
  122 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  123 |     await page.locator('#drumNextStep').scrollIntoViewIfNeeded();
  124 |     await expect(page.locator('#drumNextStep')).toBeInViewport();
  125 |   }
  126 | });
  127 | 
```