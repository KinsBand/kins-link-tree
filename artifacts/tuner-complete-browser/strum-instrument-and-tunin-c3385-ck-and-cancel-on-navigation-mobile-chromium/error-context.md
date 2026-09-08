# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: strum.spec.ts >> instrument and tuning selections strum on the audio clock and cancel on navigation
- Location: e2e\tuner\strum.spec.ts:3:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 10
Received: 6

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - navigation "Tuner navigation" [ref=e5]:
      - link "Back to KINS home" [ref=e6] [cursor=pointer]:
        - /url: /
      - button "TUNER Standard (E A D G)" [ref=e9] [cursor=pointer]:
        - generic [ref=e10]: TUNER
        - generic [ref=e11]: Standard (E A D G)
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
        - paragraph [ref=e31]: Target E1 · ±3 ct · A4 = 440 Hz
        - progressbar "String tuning confirmation" [ref=e32]
    - generic [ref=e33]:
      - text: 
      - region "String and drum targets" [ref=e34]:
        - group "bass guitar headstock with 4 playable tuning pegs" [ref=e35]:
          - generic [ref=e40]: KINS
          - button "Target string E1" [pressed] [ref=e59] [cursor=pointer]:
            - generic: E1
          - button "Target string A1" [ref=e62] [cursor=pointer]:
            - generic: A1
          - button "Target string D2" [ref=e65] [cursor=pointer]:
            - generic: D2
          - button "Target string G2" [ref=e68] [cursor=pointer]:
            - generic: G2
      - status [ref=e71]: Loading recorded guitar sound.
    - generic [ref=e72]:
      - button "Start tuning" [ref=e74] [cursor=pointer]:
        - generic [ref=e78]: START
      - tablist "Instrument" [ref=e79]:
        - tab "ELECTRIC" [ref=e80] [cursor=pointer]
        - tab "ACOUSTIC" [ref=e86] [cursor=pointer]
        - tab "BASS" [active] [selected] [ref=e92] [cursor=pointer]
        - tab "DRUMS" [ref=e97] [cursor=pointer]
      - text: 
  - text:    
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('instrument and tuning selections strum on the audio clock and cancel on navigation', async ({ page }) => {
  4  |   await page.addInitScript(() => {
  5  |     const log = { plays: [] as { time: number, rate: number }[], contexts: [] as AudioContext[] };
  6  |     (window as any).__strum = log;
  7  |     const Native = window.AudioContext;
  8  |     window.AudioContext = class extends Native {
  9  |       constructor(...args: any[]) { super(...args); log.contexts.push(this); }
  10 |       createBufferSource() {
  11 |         const source = super.createBufferSource(), start = source.start.bind(source);
  12 |         source.start = (time = 0, ...args) => { log.plays.push({ time, rate: source.playbackRate.value }); start(time, ...args); };
  13 |         return source;
  14 |       }
  15 |     };
  16 |   });
  17 |   await page.goto('/tuner');
  18 |   await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  19 |   await page.locator('[data-instrument="acoustic"]').click();
  20 |   await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length)).toBe(6);
  21 |   const played = await page.evaluate(() => (window as any).__strum.plays);
  22 |   for (let i = 1; i < 6; i++) expect(played[i].time - played[i - 1].time).toBeCloseTo(0.42, 6);
  23 |   // The acoustic illustration has two columns, visited from the top row down.
  24 |   const midi = [50, 55, 45, 59, 40, 64], recorded = [146.745, 195.7348, 109.9642, 246.7893, 82.2991, 329.8141];
  25 |   for (let i = 0; i < 6; i++) expect(played[i].rate).toBeCloseTo(440 * 2 ** ((midi[i] - 69) / 12) / recorded[i], 5);
  26 |   await page.locator('[data-instrument="bass"]').click();
> 27 |   await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length)).toBe(10);
     |                                                                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  28 |   expect(await page.evaluate(() => (window as any).__strum.contexts[0].state)).toBe('closed');
  29 |   await page.locator('#tunerPresetBtn').click();
  30 |   await page.locator('.tuning-card').nth(1).click();
  31 |   await expect.poll(() => page.evaluate(() => (window as any).__strum.plays.length)).toBe(14);
  32 |   for (const icon of await page.locator('#tunerInstrumentRow svg').all()) {
  33 |     const box = await icon.boundingBox(); expect(box!.width).toBeLessThanOrEqual(18); expect(box!.height).toBeLessThanOrEqual(18);
  34 |   }
  35 |   await page.locator('[data-instrument="drums"]').click();
  36 |   await expect.poll(() => page.evaluate(() => (window as any).__strum.contexts.every((c: AudioContext) => c.state === 'closed'))).toBe(true);
  37 | });
  38 | 
  39 | 
  40 | test('unusual string counts expose selectable adapted tunings for every guitar', async ({ page }) => {
  41 |   await page.goto('/tuner');
  42 |   await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  43 |   for (const instrument of ['electric', 'acoustic', 'bass']) {
  44 |     await page.locator(`#tunerInstrumentRow [data-instrument="${instrument}"]`).click();
  45 |     await page.locator('#tunerSettingsBtn').click();
  46 |     await page.locator('#tunerStringCount').fill('11'); await page.locator('#tunerStringCount').press('Enter');
  47 |     await page.locator('#tunerSheetClose').click();
  48 |     await page.locator('#tunerPresetBtn').click();
  49 |     const adapted = page.locator('.tuning-card').filter({ hasText: 'adapted' });
  50 |     expect(await adapted.count()).toBeGreaterThan(200);
  51 |     await adapted.first().click();
  52 |     await expect(page.locator('#tunerFigure .tuner-peg')).toHaveCount(11);
  53 |   }
  54 | });
  55 | 
```