# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> settings sheet exposes sound, volume and toggle buttons
- Location: e2e\tier1-smoke\metronome.spec.ts:339:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#metroPanelSettings')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#metroPanelSettings')
    14 × locator resolved to <section hidden="" aria-label="Settings" id="metroPanelSettings" data-astro-cid-oerylgbb="" class="metro-sheet-panel metro-panel--settings">…</section>
       - unexpected value "hidden"

```

```yaml
- main:
  - link "Back to KINS home":
    - /url: /
    - text: KINS!
  - button "Open settings"
  - region "Tempo (drag or scroll to adjust)":
    - group "Beat pitch selectors — tap to cycle Low/Mid/High/Mute":
      - button "Beat 1 — pitch mid"
      - button "Beat 2 — pitch mid"
      - button "Beat 3 — pitch mid"
      - button "Beat 4 — pitch mid"
    - text: Allegro
    - button "Tempo 120 BPM — tap to edit, drag dial or use arrow keys to adjust": "120"
    - paragraph: BPM
    - button "4/4"
    - button "1/4"
  - button "Open setlist"
  - button "TAP TEMPO"
  - button "Start metronome"
  - button "COACH DECK"
```

# Test source

```ts
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
  316 |     await page.locator('#closeMetroCoachSheetBtn').click({ force: true });
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
> 342 |     await expect(page.locator('#metroPanelSettings')).toBeVisible();
      |                                                       ^ Error: expect(locator).toBeVisible() failed
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
  417 |     await dots.nth(0).click();
  418 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mid');
  419 |     await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch mid');
  420 | 
  421 |     // Cycle to high, then open settings and reset
  422 |     await dots.nth(0).click(); // mid -> high
  423 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'high');
  424 | 
  425 |     await page.locator('#metroSettingsBtn').click();
  426 |     await expect(page.locator('#metroPanelSettings')).toBeVisible();
  427 | 
  428 |     // Reset pitch map
  429 |     await page.locator('#metroResetPitchBtn').click();
  430 | 
  431 |     // Test beat colors reset independently
  432 |     await page.locator('#metroColorLow').fill('#112233');
  433 |     await page.locator('#metroColorLow').dispatchEvent('change');
  434 |     await expect(page.locator('#metroColorHexLow')).toHaveText('#112233');
  435 |     await page.locator('#metroResetColorsBtn').click();
  436 |     await expect(page.locator('#metroColorHexLow')).toHaveText('#FF9F1C');
  437 | 
  438 |     await page.keyboard.press('Escape');
  439 | 
  440 |     await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mid');
  441 |     await expect(dots.nth(0)).toHaveClass(/tier-mid/);
  442 | 
```