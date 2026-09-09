# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modes.spec.ts >> both themes show distinct guitar artwork and a usable drum workflow
- Location: e2e\tuner\modes.spec.ts:106:1

# Error details

```
Error: UNKNOWN: unknown error, open 'C:\Users\trai\.gemini\antigravity\scratch\kins-official-website\artifacts\tuner-modes\desktop-chromium-light-drums.png'
```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - navigation "Tuner navigation" [ref=e5]:
      - link "Back to KINS home" [ref=e6] [cursor=pointer]:
        - /url: /
      - button "TUNER My kit" [disabled] [ref=e9]:
        - generic [ref=e10]: TUNER
        - generic [ref=e11]: My kit
      - button "Open tuner settings" [ref=e15] [cursor=pointer]:
        - generic [ref=e16]: 
    - generic [ref=e17]:
      - region "Guided drum tuning" [ref=e18]:
        - generic [ref=e19]:
          - heading "TUNE YOUR KIT" [level=2] [ref=e20]
          - generic [ref=e21]: BETA
        - generic [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]: Drum
            - button "Drum Rack tom" [ref=e26] [cursor=pointer]:
              - generic [ref=e27]: Rack tom
              - generic [ref=e28]: 
          - generic [ref=e29]:
            - generic [ref=e30]: Lugs per head
            - group "Lugs per head" [ref=e31]:
              - button "Remove one lug" [ref=e32] [cursor=pointer]: −
              - status [ref=e33]: "6"
              - button "Add one lug" [ref=e34] [cursor=pointer]: +
          - generic [ref=e35]:
            - text: Lug target (Hz)
            - spinbutton "Lug target (Hz)" [ref=e36]: "180"
          - generic [ref=e37]:
            - text: Diameter (inches)
            - spinbutton "Diameter (inches)" [ref=e38]: "12"
        - navigation "Tuning steps" [ref=e39]:
          - button "1 · Batter" [ref=e40] [cursor=pointer]
          - button "2 · Resonant" [ref=e41] [cursor=pointer]
          - button "3 · Whole drum" [ref=e42] [cursor=pointer]
        - generic [ref=e43]:
          - group "Select a lug" [ref=e44]:
            - generic [ref=e49]: 12″ · 6 LUGS
            - button "Lug 1, step 1 in crossing order" [pressed] [ref=e50] [cursor=pointer]: "1"
            - button "Lug 2, step 3 in crossing order" [ref=e51] [cursor=pointer]: "2"
            - button "Lug 3, step 5 in crossing order" [ref=e52] [cursor=pointer]: "3"
            - button "Lug 4, step 2 in crossing order" [ref=e53] [cursor=pointer]: "4"
            - button "Lug 5, step 4 in crossing order" [ref=e54] [cursor=pointer]: "5"
            - button "Lug 6, step 6 in crossing order" [ref=e55] [cursor=pointer]: "6"
          - generic [ref=e56]:
            - status [ref=e57]:
              - text: —
              - generic [ref=e58]: Hz · last tap
            - status [ref=e59]: Tap to tune.
            - button "Use last tap as target" [disabled] [ref=e60] [cursor=pointer]
        - status [ref=e61]: Tap a lug to hear the target. Start to measure.
        - paragraph [ref=e62]: 0 / 6 matched
        - generic [ref=e63]:
          - button "Next lug →" [ref=e64] [cursor=pointer]
          - button "Next head →" [ref=e65] [cursor=pointer]
      - status [ref=e66]
    - generic [ref=e67]:
      - generic [ref=e68]:
        - button "Add" [ref=e69] [cursor=pointer]
        - button "Start tuning" [ref=e70] [cursor=pointer]:
          - generic [ref=e74]: START
        - button "Save" [ref=e75] [cursor=pointer]
      - tablist "Instrument" [ref=e76]:
        - tab "ELECTRIC" [ref=e77] [cursor=pointer]
        - tab "ACOUSTIC" [ref=e83] [cursor=pointer]
        - tab "BASS" [ref=e89] [cursor=pointer]
        - tab "DRUMS" [active] [selected] [ref=e94] [cursor=pointer]
      - text: 
  - text:    
```

# Test source

```ts
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
  114 |       await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-${instrument}.png` });
  115 |     }
  116 |     await page.locator('#tunerSettingsBtn').click();
  117 |     await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-settings.png` });
  118 |     await page.keyboard.press('Escape');
  119 |     await page.locator('#tunerInstrumentRow [data-instrument="drums"]').click();
  120 |     await expect(page.locator('#drumWorkflow')).toBeVisible();
> 121 |     await page.screenshot({ path: `artifacts/tuner-modes/${testInfo.project.name}-${theme}-drums.png` });
      |     ^ Error: UNKNOWN: unknown error, open 'C:\Users\trai\.gemini\antigravity\scratch\kins-official-website\artifacts\tuner-modes\desktop-chromium-light-drums.png'
  122 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  123 |     await page.locator('#drumNextStep').scrollIntoViewIfNeeded();
  124 |     await expect(page.locator('#drumNextStep')).toBeInViewport();
  125 |   }
  126 | });
  127 | 
```