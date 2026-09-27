# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> setlist row loads its tempo and closes the sheet
- Location: e2e\tier1-smoke\metronome.spec.ts:72:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#metroPanelSetlist')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#metroPanelSetlist')
    14 × locator resolved to <section hidden="" id="metroPanelSetlist" data-astro-cid-oerylgbb="" aria-label="Setlists and Songs" class="metro-sheet-panel metro-panel--setlist">…</section>
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
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { functionalityConfig } from '../../src/settings/functionality.config';
  3   | 
  4   | /* Metronome smoke flows: no audio assertions (CI has no speakers) — these
  5   |    cover the play state machine, tap tempo, both picker sheets, the setlist
  6   |    and the coach-deck tab control surface. */
  7   | 
  8   | /* Dev-only toolbar overlays the bottom of the viewport in `astro dev` */
  9   | async function openMetro(page: Page) {
  10  |   await page.goto('/metronome');
  11  |   try {
  12  |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  13  |   } catch (e) {}
  14  | }
  15  | 
  16  | test.describe('tier1 smoke — metronome', () => {
  17  |   test.skip(!functionalityConfig.enableMetronomePage, 'Metronome page is currently gated');
  18  |   test('play starts and stops from the CTA', async ({ page }) => {
  19  |     await openMetro(page);
  20  |     const play = page.locator('#metroPlayBtn');
  21  |     await expect(play).toBeVisible();
  22  |     await play.click();
  23  |     await expect(play).toHaveClass(/playing/);
  24  |     await expect(play).toHaveAttribute('aria-label', 'Stop metronome');
  25  |     await play.click();
  26  |     await expect(play).not.toHaveClass(/playing/);
  27  |     await expect(play).toHaveAttribute('aria-label', 'Start metronome');
  28  |   });
  29  | 
  30  |   test('tap tempo moves the BPM readout off the default', async ({ page }) => {
  31  |     await openMetro(page);
  32  |     const num = page.locator('#metroBpmNum');
  33  |     await expect(num).toHaveText('120');
  34  |     const tap = page.locator('#metroTapBtn');
  35  |     for (let i = 0; i < 5; i++) {
  36  |       await tap.click();
  37  |     }
  38  |     // 5 fast taps average well above 120 BPM; exact value is timing-dependent.
  39  |     await expect(num).not.toHaveText('120');
  40  |     const value = await num.textContent();
  41  |     expect(Number(value)).toBeGreaterThanOrEqual(20);
  42  |     expect(Number(value)).toBeLessThanOrEqual(300);
  43  |   });
  44  | 
  45  |   test('time signature sheet opens, applies a preset and closes on Escape', async ({ page }) => {
  46  |     await openMetro(page);
  47  |     await page.locator('#metroTsPill').click();
  48  |     await expect(page.locator('#metroPanelTs')).toBeVisible();
  49  |     await expect(page.locator('#metroSheet')).toHaveClass(/open/);
  50  | 
  51  |     await page.locator('#metroTsGrid .metro-chip[data-index="4"]').click(); // 7/8
  52  |     await expect(page.locator('#metroTsPillLabel')).toHaveText('7/8');
  53  |     await expect(page.locator('#metroTsBoxTop')).toHaveText('7');
  54  |     await expect(page.locator('#metroTsGrid .metro-chip[data-index="4"]')).toHaveAttribute('aria-checked', 'true');
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
> 75  |     await expect(page.locator('#metroPanelSetlist')).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
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
  155 |     await expect(page.locator('#metroPanelCoach')).toBeVisible();
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
```