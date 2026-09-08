# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> dynamic island takes over coach deck button when mode begins and restores on stop/cancel
- Location: e2e\tier1-smoke\metronome.spec.ts:260:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#metroPanelCoach')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#metroPanelCoach')
    13 × locator resolved to <section hidden="" id="metroPanelCoach" aria-label="Coach deck" data-astro-cid-oerylgbb="" class="metro-sheet-panel metro-panel--coach">…</section>
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
  174 |     await expect(randBtn).toHaveAttribute('aria-pressed', 'false');
  175 |     await randBtn.click();
  176 |     await expect(randBtn).toHaveAttribute('aria-pressed', 'true');
  177 |     await expect(randBtn).toHaveClass(/active/);
  178 |     await randBtn.click();
  179 |     await expect(randBtn).toHaveAttribute('aria-pressed', 'false');
  180 | 
  181 |     // Verify Cycle Balance Presets (single-row horizontal scroll)
  182 |     const presetRow = innerPanel.locator('#coachInnerPresetRow');
  183 |     await expect(presetRow).toBeVisible();
  184 |     const preset44 = presetRow.locator('.metro-coach-mini-chip[data-audible="4"][data-muted="4"]');
  185 |     await expect(preset44).toBeVisible();
  186 |     await preset44.click();
  187 |     await expect(innerPanel.locator('#coachInnerAudibleLabel')).toHaveText('4 Bars');
  188 |     await expect(innerPanel.locator('#coachInnerMutedLabel')).toHaveText('4 Bars');
  189 |     await expect(preset44).toHaveClass(/active/);
  190 | 
  191 |     // Test tab switching
  192 |     const speedTab = page.locator('#metroCoachTab-speed-trainer');
  193 |     await speedTab.click();
  194 |     await expect(speedTab).toHaveAttribute('aria-selected', 'true');
  195 |     const speedPanel = page.locator('#metroCoachPanel-speed-trainer');
  196 |     await expect(speedPanel).toBeVisible();
  197 |     await expect(innerPanel).toBeHidden();
  198 | 
  199 |     // Verify Speed Trainer controls: two separate sliders for Start and Target BPM
  200 |     const speedStart = speedPanel.locator('#coachSpeedStart');
  201 |     const speedTarget = speedPanel.locator('#coachSpeedTarget');
  202 |     await expect(speedStart).toBeVisible();
  203 |     await expect(speedTarget).toBeVisible();
  204 | 
  205 |     // Verify NO steppers in Speed Trainer
  206 |     await expect(speedPanel.locator('.metro-coach-step-btn')).toHaveCount(0);
  207 | 
  208 |     // Verify NO span presets in Speed Trainer
  209 |     await expect(speedPanel.locator('.metro-coach-mini-chip')).toHaveCount(0);
  210 | 
  211 |     // Verify Step and Change Every sliders
  212 |     const speedStep = speedPanel.locator('#coachSpeedStep');
  213 |     const speedEvery = speedPanel.locator('#coachSpeedEvery');
  214 |     await expect(speedStep).toBeVisible();
  215 |     await expect(speedEvery).toBeVisible();
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
> 274 |     await expect(page.locator('#metroPanelCoach')).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
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
```