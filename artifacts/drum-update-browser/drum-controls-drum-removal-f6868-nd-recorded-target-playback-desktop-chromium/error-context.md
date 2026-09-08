# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: drum-controls.spec.ts >> drum removal, lug steppers and recorded target playback
- Location: e2e\tuner\drum-controls.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#drumSelect')
    - locator resolved to <select id="drumSelect">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - element is not visible
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - element is not visible
    - retrying select option action
      - waiting 100ms
    52 × waiting for element to be visible and enabled
       - element is not visible
     - retrying select option action
       - waiting 500ms

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
      - generic [ref=e23]:
        - generic [ref=e24]: TOO LOW
        - generic [ref=e25]: "--"
        - generic [ref=e26]: TOO HIGH
      - paragraph [ref=e27]: TAP TO START TUNING
      - generic [ref=e28]: "--"
      - paragraph
      - generic [ref=e30]:
        - paragraph [ref=e31]: Target E2 · ±3 ct · A4 = 440 Hz
        - progressbar "String tuning confirmation" [ref=e32]
    - generic [ref=e33]:
      - text: 
      - region "String and drum targets" [ref=e34]:
        - group "electric guitar headstock with 6 playable tuning pegs" [ref=e35]:
          - generic [ref=e40]: KINS
          - button "Target string E2" [pressed] [ref=e67] [cursor=pointer]:
            - generic: E
          - button "Target string A2" [ref=e70] [cursor=pointer]:
            - generic: A
          - button "Target string D3" [ref=e73] [cursor=pointer]:
            - generic: D
          - button "Target string G3" [ref=e76] [cursor=pointer]:
            - generic: G
          - button "Target string B3" [ref=e79] [cursor=pointer]:
            - generic: B
          - button "Target string E4" [ref=e82] [cursor=pointer]:
            - generic: E
      - status [ref=e85]
    - generic [ref=e86]:
      - button "Start tuning" [ref=e88] [cursor=pointer]:
        - generic [ref=e92]: START
      - tablist "Instrument" [ref=e93]:
        - tab "ELECTRIC" [selected] [ref=e94] [cursor=pointer]
        - tab "ACOUSTIC" [ref=e100] [cursor=pointer]
        - tab "BASS" [ref=e106] [cursor=pointer]
        - tab "DRUMS" [active] [ref=e111] [cursor=pointer]
      - text: 
  - text:    
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('drum removal, lug steppers and recorded target playback', async ({ page }, info) => {
  4  |   await page.addInitScript(() => {
  5  |     const audio = { plays: [] as number[], contexts: [] as AudioContext[] };
  6  |     (window as any).__drumAudio = audio;
  7  |     const Native = window.AudioContext;
  8  |     window.AudioContext = class extends Native {
  9  |       constructor(...args: any[]) { super(...args); audio.contexts.push(this); }
  10 |       createBufferSource() {
  11 |         const source = super.createBufferSource(), start = source.start.bind(source);
  12 |         source.start = (...args) => { audio.plays.push(source.playbackRate.value); start(...args); };
  13 |         return source;
  14 |       }
  15 |     };
  16 |   });
  17 |   await page.goto('/tuner');
  18 |   await page.locator('[data-instrument="drums"]').click();
> 19 |   await page.locator('#drumSelect').selectOption('snare');
     |                                     ^ Error: locator.selectOption: Test timeout of 30000ms exceeded.
  20 |   await page.locator('#drumTargetHz').fill('200'); await page.locator('#drumTargetHz').press('Tab');
  21 |   await page.locator('[data-lug="0"]').click();
  22 |   await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBe(1);
  23 |   await page.locator('#drumTargetHz').fill('400'); await page.locator('#drumTargetHz').press('Tab');
  24 |   await page.locator('[data-lug="1"]').click();
  25 |   await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBe(2);
  26 |   const rates = await page.evaluate(() => (window as any).__drumAudio.plays);
  27 |   expect(rates[1] / rates[0]).toBeCloseTo(2, 8);
  28 |   await page.locator('#drumLugsPlus').click(); await expect(page.locator('#drumLugCount')).toHaveText('11');
  29 |   await expect(page.locator('[data-lug]')).toHaveCount(11);
  30 |   await page.locator('#drumLugsPlus').click(); await expect(page.locator('#drumLugsPlus')).toBeDisabled();
  31 |   for (let i = 0; i < 8; i++) await page.locator('#drumLugsMinus').click();
  32 |   await expect(page.locator('#drumLugsMinus')).toBeDisabled();
  33 |   await expect(page.locator('[data-lug]')).toHaveCount(4);
  34 |   await page.locator('#drumRemove').click(); await expect(page.locator('#drumSelect option')).toHaveCount(3);
  35 |   await page.locator('#drumAdd').click(); await page.locator('#drumRemove').click(); await page.locator('#drumAdd').click();
  36 |   await page.locator('#drumSave').click();
  37 |   const kit = await page.evaluate(() => JSON.parse(localStorage.getItem('kins-tuner-drum-kit-v1')!));
  38 |   expect(new Set(kit.map((d: any) => d.id)).size).toBe(kit.length);
  39 |   expect(kit.some((d: any) => d.id === 'snare')).toBe(false);
  40 |   await page.reload(); await expect(page.locator('#drumSelect option')).toHaveCount(4);
  41 |   for (const theme of ['standard', 'dark']) {
  42 |     await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  43 |     await page.screenshot({ path: info.outputPath(`drum-controls-${theme}.png`) });
  44 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  45 |   }
  46 |   for (let i = 0; i < 3; i++) await page.locator('#drumRemove').click();
  47 |   await expect(page.locator('#drumRemove')).toBeDisabled();
  48 |   await page.locator('[data-drum-step="whole"]').click(); await page.locator('#drumPreview').click();
  49 |   await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.plays.length)).toBeGreaterThan(0);
  50 |   await page.locator('[data-instrument="electric"]').click();
  51 |   await expect.poll(() => page.evaluate(() => (window as any).__drumAudio.contexts.every((c: AudioContext) => c.state === 'closed'))).toBe(true);
  52 |   await page.locator('#tunerSettingsBtn').click();
  53 |   await expect(page.locator('#tunerStringsPlus')).toHaveClass(/tuner-stepper-button/);
  54 |   await page.screenshot({ path: info.outputPath('string-stepper.png') });
  55 | });
  56 | 
```