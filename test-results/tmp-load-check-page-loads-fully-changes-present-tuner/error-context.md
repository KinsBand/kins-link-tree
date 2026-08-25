# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tmp-load-check.spec.ts >> page loads fully + changes present: /tuner
- Location: e2e\tmp-load-check.spec.ts:4:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 404 (OK)",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - button "Standard" [ref=e5] [cursor=pointer]
        - generic [ref=e12]:
          - button "GUIDED" [ref=e14] [cursor=pointer]
          - button "6 STRINGS" [ref=e19] [cursor=pointer]
          - button "AVG" [ref=e24] [cursor=pointer]
      - generic [ref=e28]:
        - region "Tuning meter" [ref=e29]:
          - button "Start or stop mic tuning" [ref=e30] [cursor=pointer]
          - generic [ref=e35]:
            - generic [ref=e36]: TOO LOW
            - paragraph [ref=e37]: TAP TO START TUNING
            - generic [ref=e38]: TOO HIGH
          - generic [ref=e39]: "--"
          - paragraph
        - region "String and drum targets" [ref=e41]:
          - img [ref=e42]:
            - button "Target string E2" [ref=e87] [cursor=pointer]:
              - generic: E
            - button "Target string A2" [ref=e91] [cursor=pointer]:
              - generic: A
            - button "Target string D3" [ref=e95] [cursor=pointer]:
              - generic: D
            - button "Target string G3" [ref=e99] [cursor=pointer]:
              - generic: G
            - button "Target string B3" [ref=e103] [cursor=pointer]:
              - generic: B
            - button "Target string E4" [ref=e107] [cursor=pointer]:
              - generic: E
      - generic [ref=e111]:
        - button "Start tuning" [ref=e112] [cursor=pointer]:
          - generic [ref=e116]: START TUNING
        - tablist "Instrument" [ref=e117]:
          - tab "ELECTRIC" [selected] [ref=e118] [cursor=pointer]
          - tab "ACOUSTIC" [ref=e122] [cursor=pointer]
          - tab "BASS" [ref=e128] [cursor=pointer]
          - tab "DRUMS" [ref=e133] [cursor=pointer]
        - link "← Back to KINS" [ref=e139] [cursor=pointer]:
          - /url: /
  - generic [ref=e142]:
    - button [ref=e143]
    - button [ref=e149]
    - button [ref=e153]
    - button [ref=e161]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | for (const path of ['/', '/tuner', '/live', '/epk']) {
  4  |   test(`page loads fully + changes present: ${path}`, async ({ page }) => {
  5  |     const failed: string[] = [];
  6  |     const consoleErrors: string[] = [];
  7  |     page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
  8  |     page.on('response', (r) => { if (r.status() >= 400) failed.push('HTTP ' + r.status() + ' ' + r.url()); });
  9  |     page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  10 | 
  11 |     await page.goto(path, { waitUntil: 'load', timeout: 20000 });
  12 |     await page.waitForTimeout(1500);
  13 | 
  14 |     if (path === '/tuner') {
  15 |       const cta = page.locator('#tunerMicToggleBtn');
  16 |       await expect(cta).toBeVisible();
  17 |       await expect(cta).toContainText('START TUNING');
  18 |       const html = await page.content();
  19 |       expect(html).toContain('tunerMicToggleBtn');
  20 |     }
  21 | 
  22 |     expect(failed.filter((u) => !u.includes('_vercel/insights'))).toEqual([]);
> 23 |     expect(consoleErrors).toEqual([]);
     |                           ^ Error: expect(received).toEqual(expected) // deep equality
  24 |   });
  25 | }
  26 | 
```