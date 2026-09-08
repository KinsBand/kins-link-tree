# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> dynamic island takes over coach deck button when mode begins and restores on stop/cancel
- Location: e2e\tier1-smoke\metronome.spec.ts:260:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#closeMetroCoachSheetBtn')

```

# Page snapshot

```yaml
- main [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Back to KINS home" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: 
        - generic [ref=e7]: KINS!
      - generic:
        - 'generic "Coach Mode: INNER CLOCK" [ref=e8]': INNER CLOCK
        - text: 
      - button "Open settings" [ref=e9] [cursor=pointer]:
        - generic [ref=e10]: 
    - region "Tempo (drag or scroll to adjust)" [ref=e11]:
      - group "Beat pitch selectors — tap to cycle Low/Mid/High/Mute":
        - button "Beat 1 — pitch mid" [ref=e12] [cursor=pointer]
        - button "Beat 2 — pitch mid" [ref=e13] [cursor=pointer]
        - button "Beat 3 — pitch mid" [ref=e14] [cursor=pointer]
        - button "Beat 4 — pitch mid" [ref=e15] [cursor=pointer]
      - generic [ref=e16]:
        - generic: Allegro
        - button "Tempo 120 BPM — tap to edit, drag dial or use arrow keys to adjust" [ref=e18] [cursor=pointer]: "120"
        - paragraph [ref=e19]: BPM
        - generic [ref=e20]:
          - button "4/4" [ref=e21] [cursor=pointer]:
            - generic [ref=e23]: 
          - button "1/4" [ref=e25] [cursor=pointer]:
            - generic [ref=e27]: 
    - generic [ref=e29]:
      - button "Open setlist" [ref=e30] [cursor=pointer]:
        - generic [ref=e31]: 
      - text: 
      - button "TAP TEMPO" [ref=e32] [cursor=pointer]
      - button "Stop metronome" [ref=e33] [cursor=pointer]:
        - text: 
        - generic [ref=e34]: 
    - text:    
    - generic [ref=e37]:
      - generic [ref=e38]:
        - button "Stop training session" [ref=e39] [cursor=pointer]:
          - generic [ref=e40]: 
        - text: 
      - generic [ref=e43]:
        - generic [ref=e44]: AUDIBLE
        - generic [ref=e45]: Bar 1/2
      - button "Open coach settings" [expanded] [ref=e46] [cursor=pointer]:
        - generic [ref=e47]: 
  - dialog [active] [ref=e49]:
    - generic:
      - generic [ref=e50]:
        - generic [ref=e51]: 
        - generic [ref=e52]: COACH DECK
      - button "Close coach deck menu" [ref=e53] [cursor=pointer]:
        - generic: 
    - text:         +           +                         
    - region "Coach deck" [ref=e55]:
      - tablist "Coach deck modules" [ref=e56]:
        - tab "INNER CLOCK" [selected] [ref=e57] [cursor=pointer]
        - tab "SPEED TRAINER" [ref=e58] [cursor=pointer]
        - tab "RHYTHM STEP" [ref=e59] [cursor=pointer]
        - tab "TEMPO PRIMER" [ref=e60] [cursor=pointer]
        - button "Suggest a new practice module" [ref=e61] [cursor=pointer]:
          - generic [ref=e62]: +
          - text: SUGGEST
      - generic [ref=e63]:
        - tabpanel "INNER CLOCK" [ref=e64]:
          - generic [ref=e65]:
            - generic [ref=e66]:
              - paragraph [ref=e67]: Mute Trainer
              - paragraph [ref=e68]: Automated mute cycles to build your internal timekeeping.
            - generic [ref=e69]:
              - generic [ref=e70]: "CYCLE:"
              - generic [ref=e71]:
                - generic [ref=e72]: A
                - generic [ref=e73]: A
                - generic [ref=e74]: +
                - generic [ref=e75]: M
                - generic [ref=e76]: M
            - generic [ref=e77]:
              - generic [ref=e78]:
                - generic [ref=e79]:
                  - generic [ref=e80]: AUDIBLE BARS
                  - button "Click to enter custom audible bars" [ref=e81] [cursor=pointer]: 2 Bars
                - slider "Audible bars count" [ref=e84] [cursor=pointer]: "2"
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - generic [ref=e87]: MUTED BARS
                  - button "Click to enter custom muted bars" [ref=e88] [cursor=pointer]: 2 Bars
                - slider "Muted bars count" [ref=e91] [cursor=pointer]: "2"
            - generic [ref=e92]:
              - generic [ref=e93]: CYCLE BALANCE PRESETS
              - generic [ref=e95]:
                - button "1+1" [ref=e96] [cursor=pointer]
                - button "2+1" [ref=e97] [cursor=pointer]
                - button "3+1" [ref=e98] [cursor=pointer]
                - button "2+2" [ref=e99] [cursor=pointer]
                - button "4+2" [ref=e100] [cursor=pointer]
                - button "4+4" [ref=e101] [cursor=pointer]
                - button "6+2" [ref=e102] [cursor=pointer]
                - button "7+1" [ref=e103] [cursor=pointer]
                - button "8+4" [ref=e104] [cursor=pointer]
                - button "8+8" [ref=e105] [cursor=pointer]
                - button "12+4" [ref=e106] [cursor=pointer]
                - button "15+1" [ref=e107] [cursor=pointer]
            - button "Random Dropouts" [ref=e108] [cursor=pointer]:
              - generic [ref=e109]: 
            - button " STOP SESSION" [ref=e111] [cursor=pointer]:
              - generic [ref=e112]: 
              - text: STOP SESSION
        - text:     +  
```

# Test source

```ts
  216 | 
  217 |     // Verify Repeat button toggle
  218 |     const repeatBtn = speedPanel.locator('#coachSpeedRepeatBtn');
  219 |     await expect(repeatBtn).toBeVisible();
  220 |     await expect(repeatBtn).toHaveAttribute('aria-pressed', 'false');
  221 |     await repeatBtn.click();
  222 |     await expect(repeatBtn).toHaveAttribute('aria-pressed', 'true');
  223 |     await expect(repeatBtn).toHaveClass(/active/);
  224 | 
  225 |     // Verify Unit toggle (bars, beats, seconds)
  226 |     const barsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="bars"]');
  227 |     const beatsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="beats"]');
  228 |     const secondsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="seconds"]');
  229 |     await expect(barsBtn).toBeVisible();
  230 |     await expect(beatsBtn).toBeVisible();
  231 |     await expect(secondsBtn).toBeVisible();
  232 | 
  233 |     await secondsBtn.click();
  234 |     await expect(secondsBtn).toHaveClass(/active/);
  235 |     await expect(speedPanel.locator('#coachSpeedEveryVal')).toContainText('Seconds');
  236 | 
  237 |     await beatsBtn.click();
  238 |     await expect(beatsBtn).toHaveClass(/active/);
  239 |     await expect(speedPanel.locator('#coachSpeedEveryVal')).toContainText('Beats');
  240 | 
  241 |     // Test click-to-edit custom amount on Interval amount (#coachSpeedEveryVal)
  242 |     const everyVal = speedPanel.locator('#coachSpeedEveryVal');
  243 |     await everyVal.click();
  244 |     const inlineInput = everyVal.locator('input');
  245 |     await expect(inlineInput).toBeVisible();
  246 |     await inlineInput.fill('15');
  247 |     await inlineInput.press('Enter');
  248 |     await expect(speedPanel.locator('#coachSpeedEveryVal')).toHaveText('15 Beats');
  249 | 
  250 |     // Test click-to-edit custom amount on Step BPM (#coachSpeedStepVal)
  251 |     const stepVal = speedPanel.locator('#coachSpeedStepVal');
  252 |     await stepVal.click();
  253 |     const stepInput = stepVal.locator('input');
  254 |     await expect(stepInput).toBeVisible();
  255 |     await stepInput.fill('25');
  256 |     await stepInput.press('Enter');
  257 |     await expect(speedPanel.locator('#coachSpeedStepVal')).toHaveText('+25 BPM');
  258 |   });
  259 | 
  260 |   test('dynamic island takes over coach deck button when mode begins and restores on stop/cancel', async ({ page }) => {
  261 |     await openMetro(page);
  262 |     const coachBtn = page.locator('#metroCoachBtn');
  263 |     const liveDock = page.locator('#metroCoachLiveDock');
  264 |     const playBtn = page.locator('#metroPlayBtn');
  265 |     const topbarTitle = page.locator('#metroTopbarTitle');
  266 | 
  267 |     // Initially: coach button visible, dynamic island live dock hidden, topbar title hidden
  268 |     await expect(coachBtn).toBeVisible();
  269 |     await expect(liveDock).toBeHidden();
  270 |     await expect(topbarTitle).toBeHidden();
  271 | 
  272 |     // Open coach deck and start Inner Clock session
  273 |     await coachBtn.click();
  274 |     await expect(page.locator('#metroPanelCoach')).toBeVisible();
  275 |     await page.locator('#metroCoachTab-inner-clock').click();
  276 |     await expect(page.locator('#metroCoachPanel-inner-clock')).toBeVisible();
  277 |     const startBtn = page.locator('#metroCoachPanel-inner-clock .metro-coach-cta');
  278 |     await startBtn.click();
  279 | 
  280 |     // Mode begins: sheet closes, metronome is playing, coach button is hidden, dynamic island is visible
  281 |     // and topbar title displays the active mode title between KINS! and Settings
  282 |     await expect(page.locator('#metroSheet')).toBeHidden();
  283 |     await expect(playBtn).toHaveClass(/playing/);
  284 |     await expect(coachBtn).toBeHidden();
  285 |     await expect(topbarTitle).toBeVisible();
  286 |     await expect(topbarTitle).toHaveText('INNER CLOCK');
  287 |     await expect(liveDock).toBeVisible();
  288 |     await expect(liveDock).toContainText('AUDIBLE');
  289 | 
  290 |     // Verify 3-part layout: Left (stop button), Middle (info), Right (expand up arrow)
  291 |     const stopBtnEl = liveDock.locator('#metroCoachPillStop');
  292 |     const infoEl = liveDock.locator('.metro-coach-pill-info');
  293 |     const expandBtnEl = liveDock.locator('#metroCoachPillExpand');
  294 |     await expect(stopBtnEl).toBeVisible();
  295 |     await expect(infoEl).toBeVisible();
  296 |     await expect(expandBtnEl).toBeVisible();
  297 | 
  298 |     // Toggling the main Play/Stop button pauses audio but keeps the game mode active with PAUSED indicator
  299 |     await playBtn.click(); // main stop / pause
  300 |     await expect(playBtn).not.toHaveClass(/playing/);
  301 |     await expect(liveDock).toBeVisible();
  302 |     await expect(liveDock).toContainText('PAUSED');
  303 |     await expect(topbarTitle).toBeVisible();
  304 |     await expect(coachBtn).toBeHidden();
  305 | 
  306 |     // Restarting metronome clears PAUSED and resumes coach live progression
  307 |     await playBtn.click();
  308 |     await expect(playBtn).toHaveClass(/playing/);
  309 |     await expect(liveDock).toBeVisible();
  310 |     await expect(liveDock).not.toContainText('PAUSED');
  311 | 
  312 |     // Clicking the Up Arrow opens coach deck sheet focused on active tab
  313 |     await expandBtnEl.click();
  314 |     await expect(page.locator('#metroPanelCoach')).toBeVisible();
  315 |     await expect(page.locator('#metroCoachTab-inner-clock')).toHaveAttribute('aria-selected', 'true');
> 316 |     await page.locator('#closeMetroCoachSheetBtn').click({ force: true });
      |                                                    ^ Error: locator.click: Test timeout of 30000ms exceeded.
  317 |     await expect(page.locator('#metroSheet')).toBeHidden();
  318 | 
  319 |     // Stop session via adaptive game mode STOP button on left
  320 |     await liveDock.locator('.metro-coach-live-stop').click();
  321 |     await expect(liveDock).toBeHidden();
  322 |     await expect(topbarTitle).toBeHidden();
  323 |     await expect(coachBtn).toBeVisible();
  324 |     await expect(playBtn).not.toHaveClass(/playing/);
  325 | 
  326 |     // Start session again and test stopping via Escape
  327 |     await coachBtn.click();
  328 |     await page.locator('#metroCoachPanel-inner-clock .metro-coach-cta').click();
  329 |     await expect(liveDock).toBeVisible();
  330 |     await expect(topbarTitle).toBeVisible();
  331 |     await expect(coachBtn).toBeHidden();
  332 |     await page.keyboard.press('Escape');
  333 |     await expect(liveDock).toBeHidden();
  334 |     await expect(topbarTitle).toBeHidden();
  335 |     await expect(coachBtn).toBeVisible();
  336 |     await expect(playBtn).not.toHaveClass(/playing/);
  337 |   });
  338 | 
  339 |   test('settings sheet exposes sound, volume and toggle buttons', async ({ page }) => {
  340 |     await openMetro(page);
  341 |     await page.locator('#metroSettingsBtn').click();
  342 |     await expect(page.locator('#metroPanelSettings')).toBeVisible();
  343 | 
  344 |     await page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]').click();
  345 |     await expect(page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]')).toHaveAttribute('aria-pressed', 'true');
  346 | 
  347 |     const flash = page.locator('#metroFlashToggle');
  348 |     await flash.click();
  349 |     await expect(flash).toHaveClass(/active/);
  350 |     await expect(flash).toHaveAttribute('aria-pressed', 'true');
  351 |   });
  352 | 
  353 |   test('settings toggle buttons render as a grid and persist across reloads', async ({ page }) => {
  354 |     await openMetro(page);
  355 |     const grid = page.locator('.metro-settoggle-grid');
  356 |     await page.locator('#metroSettingsBtn').click();
  357 |     await expect(grid).toBeVisible();
  358 |     // two per row (2×2 grid) — user request: 2 row by 2 row
  359 |     const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  360 |     expect(columns).toBeGreaterThanOrEqual(2);
  361 | 
  362 |     // defaults: options off
  363 |     await expect(page.locator('#metroFlashToggle')).toHaveAttribute('aria-pressed', 'false');
  364 |     await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'false');
  365 |     await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'false');
  366 | 
  367 |     // opt into background play + keep-screen-on
  368 |     await page.locator('#metroBackgroundToggle').click();
  369 |     await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'true');
  370 |     await page.locator('#metroKeepAwakeToggle').click();
  371 |     await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'true');
  372 | 
  373 |     await page.reload();
  374 |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  375 |     await page.locator('#metroSettingsBtn').click();
  376 |     await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'true');
  377 |     await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'true');
  378 | 
  379 |     // restore defaults so other tests are unaffected by persisted state
  380 |     await page.locator('#metroBackgroundToggle').click();
  381 |     await page.locator('#metroKeepAwakeToggle').click();
  382 |     await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'false');
  383 |     await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'false');
  384 |   });
  385 | 
  386 |   test('per-beat pitch tiers: default renders all MID, tap cycles low/mid/high/mute, reset restores defaults', async ({ page }) => {
  387 |     await openMetro(page);
  388 |     const dots = page.locator('#metroBeatDots .metro-beat-dot');
  389 |     await expect(dots).toHaveCount(4);
  390 | 
  391 |     // Default: all 4 are 'mid' with correct aria-labels
  392 |     for (let i = 0; i < 4; i++) {
  393 |       await expect(dots.nth(i)).toHaveAttribute('data-tier', 'mid');
  394 |       await expect(dots.nth(i)).toHaveAttribute('aria-label', `Beat ${i + 1} — pitch mid`);
  395 |       await expect(dots.nth(i)).toHaveClass(/tier-mid/);
  396 |     }
  397 | 
  398 |     // Tap first dot: mid -> high
  399 |     await dots.nth(0).click();
  400 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'high');
  401 |     await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch high');
  402 |     await expect(dots.nth(0)).toHaveClass(/tier-high/);
  403 | 
  404 |     // Tap first dot: high -> low
  405 |     await dots.nth(0).click();
  406 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'low');
  407 |     await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch low');
  408 |     await expect(dots.nth(0)).toHaveClass(/tier-low/);
  409 | 
  410 |     // Tap first dot: low -> mute
  411 |     await dots.nth(0).click();
  412 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mute');
  413 |     await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — muted');
  414 |     await expect(dots.nth(0)).toHaveClass(/tier-mute/);
  415 | 
  416 |     // Tap first dot: mute -> mid
```