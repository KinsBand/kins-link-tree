# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> coach deck tabs switch and inner clock controls operate correctly
- Location: e2e\tier1-smoke\metronome.spec.ts:152:3

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
  55  | 
  56  |     await page.keyboard.press('Escape');
  57  |     await expect(page.locator('#metroSheet')).toBeHidden();
  58  |     await expect(page.locator('#metroTsPill')).toHaveAttribute('aria-expanded', 'false');
  59  |   });
  60  | 
  61  |   test('subdivision sheet opens and applies a preset', async ({ page }) => {
  62  |     await openMetro(page);
  63  |     await page.locator('#metroSubPill').click();
  64  |     await expect(page.locator('#metroPanelSub')).toBeVisible();
  65  | 
  66  |     await page.locator('#metroSubRow .metro-sub-chip[data-index="2"]').click(); // 1/8
  67  |     await expect(page.locator('#metroSubPillLabel')).toHaveText('1/8');
  68  |     await expect(page.locator('#metroSubBoxBottom')).toHaveText('8');
  69  |     await expect(page.locator('#metroSubRow .metro-sub-chip[data-index="2"]')).toHaveAttribute('aria-pressed', 'true');
  70  |   });
  71  | 
  72  |   test('setlist row loads its tempo and closes the sheet', async ({ page }) => {
  73  |     await openMetro(page);
  74  |     await page.locator('#metroSetlistBtn').click();
  75  |     await expect(page.locator('#metroPanelSetlist')).toBeVisible();
  76  |     await page.locator('#metroNavSongs').click();
  77  |     await expect(page.locator('#metroSongsBrowseView')).toBeVisible();
  78  |     await expect(page.locator('#metroSetlistFilters')).toBeVisible();
  79  |     await expect(page.locator('.metro-setlist-filter[data-filter="inspires"]')).toHaveAttribute('aria-selected', 'true');
  80  |     // Inspires mirrors What Inspires Us — first is Turnip Farm at 147 BPM
  81  |     await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  82  |     await page.locator('.metro-setlist-row').first().click();
  83  |     await expect(page.locator('#metroBpmNum')).toHaveText('147');
  84  |     await expect(page.locator('#metroSheet')).toBeHidden();
  85  |   });
  86  | 
  87  |   test('setlist filters switch between inspires / covers / originals', async ({ page }) => {
  88  |     await openMetro(page);
  89  |     await page.locator('#metroSetlistBtn').click();
  90  |     await expect(page.locator('#metroPanelSetlist')).toBeVisible();
  91  |     await page.locator('#metroNavSongs').click();
  92  |     await expect(page.locator('#metroSongsBrowseView')).toBeVisible();
  93  | 
  94  |     // default inspires
  95  |     await expect(page.locator('.metro-setlist-filter[data-filter="inspires"]')).toHaveClass(/active/);
  96  |     await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  97  |     await expect(page.locator('.metro-setlist-row').first()).toContainText('Turnip Farm');
  98  | 
  99  |     // covers empty state
  100 |     await page.locator('.metro-setlist-filter[data-filter="covers"]').click();
  101 |     await expect(page.locator('.metro-setlist-filter[data-filter="covers"]')).toHaveAttribute('aria-selected', 'true');
  102 |     await expect(page.locator('.metro-setlist-empty')).toBeVisible();
  103 |     await expect(page.locator('.metro-setlist-empty')).toContainText('NO SONGS FOUND');
  104 | 
  105 |     // originals empty state
  106 |     await page.locator('.metro-setlist-filter[data-filter="originals"]').click();
  107 |     await expect(page.locator('.metro-setlist-filter[data-filter="originals"]')).toHaveAttribute('aria-selected', 'true');
  108 |     await expect(page.locator('.metro-setlist-empty')).toContainText('NO SONGS FOUND');
  109 | 
  110 |     // back to inspires restores list
  111 |     await page.locator('.metro-setlist-filter[data-filter="inspires"]').click();
  112 |     await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  113 |   });
  114 | 
  115 |   test('setlist sheet updates floating pill title and expands search to full width', async ({ page }) => {
  116 |     await openMetro(page);
  117 |     await page.locator('#metroSetlistBtn').click();
  118 |     await expect(page.locator('#metroPanelSetlist')).toBeVisible();
  119 | 
  120 |     const pillTitle = page.locator('#metroSetlistSheetMainTitle');
  121 |     await expect(pillTitle).toHaveText('SETLISTS');
  122 |     await expect(page.locator('#metroBottomAddBtnLabel')).toHaveText('SETLIST');
  123 | 
  124 |     // Switch to songs
  125 |     await page.locator('#metroNavSongs').click();
  126 |     await expect(pillTitle).toHaveText('SONGS');
  127 |     await expect(page.locator('#metroBottomAddBtnLabel')).toHaveText('SONG');
  128 | 
  129 |     // Expand search
  130 |     const dock = page.locator('#metroBottomFixedDock');
  131 |     const searchPill = page.locator('#metroBottomSearchPill');
  132 |     const searchInput = page.locator('#metroBottomSearchInput');
  133 |     const searchToggleBtn = page.locator('#metroBottomSearchToggleBtn');
  134 | 
  135 |     await searchToggleBtn.click();
  136 |     await expect(dock).toHaveClass(/is-search-expanded/);
  137 |     await expect(searchPill).toHaveClass(/expanded/);
  138 |     await expect(searchInput).toBeVisible();
  139 | 
  140 |     // Type query
  141 |     await searchInput.fill('Turnip');
  142 |     await expect(page.locator('.metro-setlist-row')).toHaveCount(1);
  143 |     await expect(page.locator('.metro-setlist-row').first()).toContainText('Turnip Farm');
  144 | 
  145 |     // Close search
  146 |     await page.locator('#metroBottomSearchCloseBtn').click();
  147 |     await expect(dock).not.toHaveClass(/is-search-expanded/);
  148 |     await expect(page.locator('#metroBottomAddBtn')).toBeVisible();
  149 |     await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  150 |   });
  151 | 
  152 |   test('coach deck tabs switch and inner clock controls operate correctly', async ({ page }) => {
  153 |     await openMetro(page);
  154 |     await page.locator('#metroCoachBtn').click();
> 155 |     await expect(page.locator('#metroPanelCoach')).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  156 | 
  157 |     // Verify Inner Clock initial state
  158 |     const innerPanel = page.locator('#metroCoachPanel-inner-clock');
  159 |     await expect(innerPanel).toBeVisible();
  160 | 
  161 |     // Verify no stepper buttons in inner clock controls
  162 |     const steppersInInner = innerPanel.locator('.metro-coach-step-btn');
  163 |     await expect(steppersInInner).toHaveCount(0);
  164 | 
  165 |     // Verify independent Audible and Muted sliders exist
  166 |     const audSlider = innerPanel.locator('#coachInnerAudible');
  167 |     const mutSlider = innerPanel.locator('#coachInnerMuted');
  168 |     await expect(audSlider).toBeVisible();
  169 |     await expect(mutSlider).toBeVisible();
  170 | 
  171 |     // Verify Random Dropouts button toggle
  172 |     const randBtn = innerPanel.locator('#coachInnerRandomBtn');
  173 |     await expect(randBtn).toBeVisible();
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
```