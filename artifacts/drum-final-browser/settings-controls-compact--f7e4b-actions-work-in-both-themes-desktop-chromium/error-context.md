# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-controls.spec.ts >> compact settings and drum actions work in both themes
- Location: e2e\tuner\settings-controls.spec.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-sheet-instrument="electric"]')
    - locator resolved to <button role="radio" type="button" aria-checked="true" data-sheet-instrument="electric" class="tuner-sheet-chip brutal-press active">ELECTRIC</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    52 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
      - button "Open tuner settings" [active] [ref=e15] [cursor=pointer]:
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
        - tab "DRUMS" [ref=e111] [cursor=pointer]
      - text: 
  - text:    
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('compact settings and drum actions work in both themes', async ({ page }, info) => {
  4  |   await page.goto('/tuner');
  5  |   for (const theme of ['standard', 'dark']) {
  6  |     await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  7  |     await page.locator('#tunerSettingsBtn').click();
  8  |     const count = page.locator('#tunerStringCount');
  9  |     for (const instrument of ['electric', 'acoustic', 'bass']) {
> 10 |       await page.locator(`[data-sheet-instrument="${instrument}"]`).click();
     |                                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  11 |       await count.fill('11'); await count.press('Enter');
  12 |       await expect(count).toHaveValue('11');
  13 |       await page.locator('#tunerStringsPlus').click(); await expect(count).toHaveValue('12');
  14 |       await expect(page.locator('#tunerStringsPlus')).toBeDisabled();
  15 |       await page.locator('#tunerStringsMinus').click(); await expect(count).toHaveValue('11');
  16 |       await count.fill('22'); await count.press('Escape'); await expect(count).toHaveValue('11');
  17 |       await expect(page.locator('#tunerFigure .tuner-peg')).toHaveCount(11);
  18 |     }
  19 |     const toggle = page.locator('#tunerSheetAutoAdvance');
  20 |     const before = await toggle.getAttribute('aria-pressed');
  21 |     await toggle.click(); await expect(toggle).toHaveAttribute('aria-pressed', String(before !== 'true'));
  22 |     const title = await page.locator('.tuner-sheet-title').boundingBox();
  23 |     const close = await page.locator('#tunerSheetClose').boundingBox();
  24 |     expect(Math.abs(title!.y + title!.height / 2 - close!.y - close!.height / 2)).toBeLessThan(2);
  25 |     expect(close!.x).toBeGreaterThan(title!.x + title!.width);
  26 |     await page.locator("#tunerPanelSettings").evaluate(el => { el.scrollTop = 0; });
  27 |     await page.screenshot({ path: info.outputPath(`settings-${theme}.png`) });
  28 |     await page.locator('#tunerSheetClose').click();
  29 |     await page.locator('[data-instrument="drums"]').click();
  30 |     const select = await page.locator('#drumSelect').boundingBox();
  31 |     const hz = await page.locator('#drumTargetHz').boundingBox();
  32 |     expect(Math.abs(select!.y - hz!.y)).toBeLessThan(2);
  33 |     const add = await page.locator('#drumAdd').boundingBox();
  34 |     const start = await page.locator('#tunerMicToggleBtn').boundingBox();
  35 |     const save = await page.locator('#drumSave').boundingBox();
  36 |     expect(add!.x).toBeLessThan(start!.x); expect(save!.x).toBeGreaterThan(start!.x);
  37 |     const options = await page.locator('#drumSelect option').count();
  38 |     await page.locator('#drumAdd').click(); await expect(page.locator('#drumSelect option')).toHaveCount(options + 1);
  39 |     await page.locator('#drumSave').click();
  40 |     await expect(page.locator('#drumNotice')).toHaveText('Kit saved');
  41 |     await page.screenshot({ path: info.outputPath(`drums-${theme}.png`) });
  42 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  43 |   }
  44 | });
  45 | 
```