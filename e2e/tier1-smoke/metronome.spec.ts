import { test, expect, type Page } from '@playwright/test';

/* Metronome smoke flows: no audio assertions (CI has no speakers) — these
   cover the play state machine, tap tempo, both picker sheets, the setlist
   and the coach-deck tab control surface. */

/* Dev-only toolbar overlays the bottom of the viewport in `astro dev` */
async function openMetro(page: Page) {
  await page.goto('/metronome');
  try {
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  } catch (e) {}
}

test.describe('tier1 smoke — metronome', () => {
  test('play starts and stops from the CTA', async ({ page }) => {
    await openMetro(page);
    const play = page.locator('#metroPlayBtn');
    await expect(play).toBeVisible();
    await play.click();
    await expect(play).toHaveClass(/playing/);
    await expect(play).toHaveAttribute('aria-label', 'Stop metronome');
    await play.click();
    await expect(play).not.toHaveClass(/playing/);
    await expect(play).toHaveAttribute('aria-label', 'Start metronome');
  });

  test('tap tempo moves the BPM readout off the default', async ({ page }) => {
    await openMetro(page);
    const num = page.locator('#metroBpmNum');
    await expect(num).toHaveText('120');
    const tap = page.locator('#metroTapBtn');
    for (let i = 0; i < 5; i++) {
      await tap.click();
    }
    // 5 fast taps average well above 120 BPM; exact value is timing-dependent.
    await expect(num).not.toHaveText('120');
    const value = await num.textContent();
    expect(Number(value)).toBeGreaterThanOrEqual(20);
    expect(Number(value)).toBeLessThanOrEqual(300);
  });

  test('time signature sheet opens, applies a preset and closes on Escape', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroTsPill').click();
    await expect(page.locator('#metroPanelTs')).toBeVisible();
    await expect(page.locator('#metroSheet')).toHaveClass(/open/);

    await page.locator('#metroTsGrid .metro-chip[data-index="4"]').click(); // 7/8
    await expect(page.locator('#metroTsPillLabel')).toHaveText('7/8');
    await expect(page.locator('#metroTsBoxTop')).toHaveText('7');
    await expect(page.locator('#metroTsGrid .metro-chip[data-index="4"]')).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('#metroSheet')).toBeHidden();
    await expect(page.locator('#metroTsPill')).toHaveAttribute('aria-expanded', 'false');
  });

  test('subdivision sheet opens and applies a preset', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSubPill').click();
    await expect(page.locator('#metroPanelSub')).toBeVisible();

    await page.locator('#metroSubRow .metro-sub-chip[data-index="2"]').click(); // 1/8
    await expect(page.locator('#metroSubPillLabel')).toHaveText('1/8');
    await expect(page.locator('#metroSubBoxBottom')).toHaveText('8');
    await expect(page.locator('#metroSubRow .metro-sub-chip[data-index="2"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('setlist row loads its tempo and closes the sheet', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSetlistBtn').click();
    await expect(page.locator('#metroPanelSetlist')).toBeVisible();
    await page.locator('#metroNavSongs').click();
    await expect(page.locator('#metroSongsBrowseView')).toBeVisible();
    await expect(page.locator('#metroSetlistFilters')).toBeVisible();
    await expect(page.locator('.metro-setlist-filter[data-filter="inspires"]')).toHaveAttribute('aria-selected', 'true');
    // Inspires mirrors What Inspires Us — first is Turnip Farm at 147 BPM
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
    await page.locator('.metro-setlist-row').first().click();
    await expect(page.locator('#metroBpmNum')).toHaveText('147');
    await expect(page.locator('#metroSheet')).toBeHidden();
  });

  test('setlist filters switch between inspires / covers / originals', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSetlistBtn').click();
    await expect(page.locator('#metroPanelSetlist')).toBeVisible();
    await page.locator('#metroNavSongs').click();
    await expect(page.locator('#metroSongsBrowseView')).toBeVisible();

    // default inspires
    await expect(page.locator('.metro-setlist-filter[data-filter="inspires"]')).toHaveClass(/active/);
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
    await expect(page.locator('.metro-setlist-row').first()).toContainText('Turnip Farm');

    // covers empty state
    await page.locator('.metro-setlist-filter[data-filter="covers"]').click();
    await expect(page.locator('.metro-setlist-filter[data-filter="covers"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.metro-setlist-empty')).toBeVisible();
    await expect(page.locator('.metro-setlist-empty')).toContainText('NO SONGS FOUND');

    // originals empty state
    await page.locator('.metro-setlist-filter[data-filter="originals"]').click();
    await expect(page.locator('.metro-setlist-filter[data-filter="originals"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.metro-setlist-empty')).toContainText('NO SONGS FOUND');

    // back to inspires restores list
    await page.locator('.metro-setlist-filter[data-filter="inspires"]').click();
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  });

  test('setlist sheet updates floating pill title and expands search to full width', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSetlistBtn').click();
    await expect(page.locator('#metroPanelSetlist')).toBeVisible();

    const pillTitle = page.locator('#metroSetlistSheetMainTitle');
    await expect(pillTitle).toHaveText('SETLISTS');
    await expect(page.locator('#metroBottomAddBtnLabel')).toHaveText('SETLIST');

    // Switch to songs
    await page.locator('#metroNavSongs').click();
    await expect(pillTitle).toHaveText('SONGS');
    await expect(page.locator('#metroBottomAddBtnLabel')).toHaveText('SONG');

    // Expand search
    const dock = page.locator('#metroBottomFixedDock');
    const searchPill = page.locator('#metroBottomSearchPill');
    const searchInput = page.locator('#metroBottomSearchInput');
    const searchToggleBtn = page.locator('#metroBottomSearchToggleBtn');

    await searchToggleBtn.click();
    await expect(dock).toHaveClass(/is-search-expanded/);
    await expect(searchPill).toHaveClass(/expanded/);
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill('Turnip');
    await expect(page.locator('.metro-setlist-row')).toHaveCount(1);
    await expect(page.locator('.metro-setlist-row').first()).toContainText('Turnip Farm');

    // Close search
    await page.locator('#metroBottomSearchCloseBtn').click();
    await expect(dock).not.toHaveClass(/is-search-expanded/);
    await expect(page.locator('#metroBottomAddBtn')).toBeVisible();
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  });

  test('coach deck tabs switch and inner clock controls operate correctly', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroCoachBtn').click();
    await expect(page.locator('#metroPanelCoach')).toBeVisible();

    // Verify Inner Clock initial state
    const innerPanel = page.locator('#metroCoachPanel-inner-clock');
    await expect(innerPanel).toBeVisible();

    // Verify no stepper buttons in inner clock controls
    const steppersInInner = innerPanel.locator('.metro-coach-step-btn');
    await expect(steppersInInner).toHaveCount(0);

    // Verify independent Audible and Muted sliders exist
    const audSlider = innerPanel.locator('#coachInnerAudible');
    const mutSlider = innerPanel.locator('#coachInnerMuted');
    await expect(audSlider).toBeVisible();
    await expect(mutSlider).toBeVisible();

    // Verify Random Dropouts button toggle
    const randBtn = innerPanel.locator('#coachInnerRandomBtn');
    await expect(randBtn).toBeVisible();
    await expect(randBtn).toHaveAttribute('aria-pressed', 'false');
    await randBtn.click();
    await expect(randBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(randBtn).toHaveClass(/active/);
    await randBtn.click();
    await expect(randBtn).toHaveAttribute('aria-pressed', 'false');

    // Verify Cycle Balance Presets (single-row horizontal scroll)
    const presetRow = innerPanel.locator('#coachInnerPresetRow');
    await expect(presetRow).toBeVisible();
    const preset44 = presetRow.locator('.metro-coach-mini-chip[data-audible="4"][data-muted="4"]');
    await expect(preset44).toBeVisible();
    await preset44.click();
    await expect(innerPanel.locator('#coachInnerAudibleLabel')).toHaveText('4 Bars');
    await expect(innerPanel.locator('#coachInnerMutedLabel')).toHaveText('4 Bars');
    await expect(preset44).toHaveClass(/active/);

    // Test tab switching
    const speedTab = page.locator('#metroCoachTab-speed-trainer');
    await speedTab.click();
    await expect(speedTab).toHaveAttribute('aria-selected', 'true');
    const speedPanel = page.locator('#metroCoachPanel-speed-trainer');
    await expect(speedPanel).toBeVisible();
    await expect(innerPanel).toBeHidden();

    // Verify Speed Trainer controls: two separate sliders for Start and Target BPM
    const speedStart = speedPanel.locator('#coachSpeedStart');
    const speedTarget = speedPanel.locator('#coachSpeedTarget');
    await expect(speedStart).toBeVisible();
    await expect(speedTarget).toBeVisible();

    // Verify NO steppers in Speed Trainer
    await expect(speedPanel.locator('.metro-coach-step-btn')).toHaveCount(0);

    // Verify NO span presets in Speed Trainer
    await expect(speedPanel.locator('.metro-coach-mini-chip')).toHaveCount(0);

    // Verify Step and Change Every sliders
    const speedStep = speedPanel.locator('#coachSpeedStep');
    const speedEvery = speedPanel.locator('#coachSpeedEvery');
    await expect(speedStep).toBeVisible();
    await expect(speedEvery).toBeVisible();

    // Verify Repeat button toggle
    const repeatBtn = speedPanel.locator('#coachSpeedRepeatBtn');
    await expect(repeatBtn).toBeVisible();
    await expect(repeatBtn).toHaveAttribute('aria-pressed', 'false');
    await repeatBtn.click();
    await expect(repeatBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(repeatBtn).toHaveClass(/active/);

    // Verify Unit toggle (bars, beats, seconds)
    const barsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="bars"]');
    const beatsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="beats"]');
    const secondsBtn = speedPanel.locator('#coachSpeedUnitToggle .metro-unit-btn[data-unit="seconds"]');
    await expect(barsBtn).toBeVisible();
    await expect(beatsBtn).toBeVisible();
    await expect(secondsBtn).toBeVisible();

    await secondsBtn.click();
    await expect(secondsBtn).toHaveClass(/active/);
    await expect(speedPanel.locator('#coachSpeedEveryVal')).toContainText('Seconds');

    await beatsBtn.click();
    await expect(beatsBtn).toHaveClass(/active/);
    await expect(speedPanel.locator('#coachSpeedEveryVal')).toContainText('Beats');

    // Test click-to-edit custom amount on Interval amount (#coachSpeedEveryVal)
    const everyVal = speedPanel.locator('#coachSpeedEveryVal');
    await everyVal.click();
    const inlineInput = everyVal.locator('input');
    await expect(inlineInput).toBeVisible();
    await inlineInput.fill('15');
    await inlineInput.press('Enter');
    await expect(speedPanel.locator('#coachSpeedEveryVal')).toHaveText('15 Beats');

    // Test click-to-edit custom amount on Step BPM (#coachSpeedStepVal)
    const stepVal = speedPanel.locator('#coachSpeedStepVal');
    await stepVal.click();
    const stepInput = stepVal.locator('input');
    await expect(stepInput).toBeVisible();
    await stepInput.fill('25');
    await stepInput.press('Enter');
    await expect(speedPanel.locator('#coachSpeedStepVal')).toHaveText('+25 BPM');
  });

  test('dynamic island takes over coach deck button when mode begins and restores on stop/cancel', async ({ page }) => {
    await openMetro(page);
    const coachBtn = page.locator('#metroCoachBtn');
    const liveDock = page.locator('#metroCoachLiveDock');
    const playBtn = page.locator('#metroPlayBtn');
    const topbarTitle = page.locator('#metroTopbarTitle');

    // Initially: coach button visible, dynamic island live dock hidden, topbar title hidden
    await expect(coachBtn).toBeVisible();
    await expect(liveDock).toBeHidden();
    await expect(topbarTitle).toBeHidden();

    // Open coach deck and start Inner Clock session
    await coachBtn.click();
    await expect(page.locator('#metroPanelCoach')).toBeVisible();
    await page.locator('#metroCoachTab-inner-clock').click();
    await expect(page.locator('#metroCoachPanel-inner-clock')).toBeVisible();
    const startBtn = page.locator('#metroCoachPanel-inner-clock .metro-coach-cta');
    await startBtn.click();

    // Mode begins: sheet closes, metronome is playing, coach button is hidden, dynamic island is visible
    // and topbar title displays the active mode title between KINS! and Settings
    await expect(page.locator('#metroSheet')).toBeHidden();
    await expect(playBtn).toHaveClass(/playing/);
    await expect(coachBtn).toBeHidden();
    await expect(topbarTitle).toBeVisible();
    await expect(topbarTitle).toHaveText('INNER CLOCK');
    await expect(liveDock).toBeVisible();
    await expect(liveDock).toContainText('AUDIBLE');
    await expect(liveDock.locator('.metro-coach-live-stop')).toBeVisible();

    // Stop session via dynamic island STOP button
    await liveDock.locator('.metro-coach-live-stop').click();
    await expect(liveDock).toBeHidden();
    await expect(topbarTitle).toBeHidden();
    await expect(coachBtn).toBeVisible();
    await expect(playBtn).not.toHaveClass(/playing/);

    // Start session again and test stopping via main Play/Stop button
    await coachBtn.click();
    await page.locator('#metroCoachPanel-inner-clock .metro-coach-cta').click();
    await expect(liveDock).toBeVisible();
    await expect(topbarTitle).toBeVisible();
    await expect(coachBtn).toBeHidden();
    await playBtn.click(); // main stop
    await expect(liveDock).toBeHidden();
    await expect(topbarTitle).toBeHidden();
    await expect(coachBtn).toBeVisible();
    await expect(playBtn).not.toHaveClass(/playing/);

    // Start session again and test stopping via Escape
    await coachBtn.click();
    await page.locator('#metroCoachPanel-inner-clock .metro-coach-cta').click();
    await expect(liveDock).toBeVisible();
    await expect(topbarTitle).toBeVisible();
    await expect(coachBtn).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(liveDock).toBeHidden();
    await expect(topbarTitle).toBeHidden();
    await expect(coachBtn).toBeVisible();
    await expect(playBtn).not.toHaveClass(/playing/);
  });

  test('settings sheet exposes sound, volume and toggle buttons', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSettingsBtn').click();
    await expect(page.locator('#metroPanelSettings')).toBeVisible();

    await page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]').click();
    await expect(page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]')).toHaveAttribute('aria-pressed', 'true');

    const flash = page.locator('#metroFlashToggle');
    await flash.click();
    await expect(flash).toHaveClass(/active/);
    await expect(flash).toHaveAttribute('aria-pressed', 'true');
  });

  test('settings toggle buttons render as a grid and persist across reloads', async ({ page }) => {
    await openMetro(page);
    const grid = page.locator('.metro-settoggle-grid');
    await page.locator('#metroSettingsBtn').click();
    await expect(grid).toBeVisible();
    // two per row (2×2 grid) — user request: 2 row by 2 row
    const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBeGreaterThanOrEqual(2);

    // defaults: options off
    await expect(page.locator('#metroFlashToggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'false');

    // opt into background play + keep-screen-on
    await page.locator('#metroBackgroundToggle').click();
    await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#metroKeepAwakeToggle').click();
    await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    await page.locator('#metroSettingsBtn').click();
    await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'true');

    // restore defaults so other tests are unaffected by persisted state
    await page.locator('#metroBackgroundToggle').click();
    await page.locator('#metroKeepAwakeToggle').click();
    await expect(page.locator('#metroBackgroundToggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#metroKeepAwakeToggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('per-beat pitch tiers: default renders all MID, tap cycles low/mid/high/mute, reset restores defaults', async ({ page }) => {
    await openMetro(page);
    const dots = page.locator('#metroBeatDots .metro-beat-dot');
    await expect(dots).toHaveCount(4);

    // Default: all 4 are 'mid' with correct aria-labels
    for (let i = 0; i < 4; i++) {
      await expect(dots.nth(i)).toHaveAttribute('data-tier', 'mid');
      await expect(dots.nth(i)).toHaveAttribute('aria-label', `Beat ${i + 1} — pitch mid`);
      await expect(dots.nth(i)).toHaveClass(/tier-mid/);
    }

    // Tap first dot: mid -> high
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'high');
    await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch high');
    await expect(dots.nth(0)).toHaveClass(/tier-high/);

    // Tap first dot: high -> low
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'low');
    await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch low');
    await expect(dots.nth(0)).toHaveClass(/tier-low/);

    // Tap first dot: low -> mute
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mute');
    await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — muted');
    await expect(dots.nth(0)).toHaveClass(/tier-mute/);

    // Tap first dot: mute -> mid
    await dots.nth(0).click();
    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mid');
    await expect(dots.nth(0)).toHaveAttribute('aria-label', 'Beat 1 — pitch mid');

    // Cycle to high, then open settings and reset
    await dots.nth(0).click(); // mid -> high
    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'high');

    await page.locator('#metroSettingsBtn').click();
    await expect(page.locator('#metroPanelSettings')).toBeVisible();

    // Reset pitch map
    await page.locator('#metroResetPitchBtn').click();

    // Test beat colors reset independently
    await page.locator('#metroColorLow').fill('#112233');
    await page.locator('#metroColorLow').dispatchEvent('change');
    await expect(page.locator('#metroColorHexLow')).toHaveText('#112233');
    await page.locator('#metroResetColorsBtn').click();
    await expect(page.locator('#metroColorHexLow')).toHaveText('#FF9F1C');

    await page.keyboard.press('Escape');

    await expect(dots.nth(0)).toHaveAttribute('data-tier', 'mid');
    await expect(dots.nth(0)).toHaveClass(/tier-mid/);

    // Switch to radial mode and verify radial segments carry tier and cycle
    await page.locator('#metroSettingsBtn').click();
    await page.locator('.metro-beatstyle-chip[data-style="radial"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#metroSheet')).toBeHidden();

    const segs = page.locator('#metroRadialRing .metro-radial-seg');
    await expect(segs).toHaveCount(4);
    await expect(segs.nth(0)).toHaveAttribute('data-tier', 'mid');
    await segs.nth(0).dispatchEvent('click');
    await expect(segs.nth(0)).toHaveAttribute('data-tier', 'high');

    // Test keyboard accessibility on radial seg
    await segs.nth(0).focus();
    await page.keyboard.press('Enter');
    await expect(segs.nth(0)).toHaveAttribute('data-tier', 'low');

    await page.keyboard.press('Enter');
    await expect(segs.nth(0)).toHaveAttribute('data-tier', 'mute');
    await expect(segs.nth(0)).toHaveClass(/tier-mute/);

    // Reset back to dots style and default tiers
    await page.locator('#metroSettingsBtn').click();
    await page.locator('.metro-beatstyle-chip[data-style="dots"]').click();
    await page.locator('#metroResetPitchBtn').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#metroSheet')).toBeHidden();
  });

  test('background play keeps the engine running across visibility changes', async ({ page }) => {
    await openMetro(page);
    // opt into background play before the controller boots
    await page.evaluate(() => localStorage.setItem('kins-metro-backgroundPlay', '1'));
    await page.reload();
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());

    const play = page.locator('#metroPlayBtn');
    await play.click();
    await expect(play).toHaveClass(/playing/);

    // Simulate tab hide WITHOUT user interaction — with BACKGROUND on, the
    // metronome must keep running and stay running when we come back.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(play).toHaveClass(/playing/);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(play).toHaveClass(/playing/);

    // And with the toggle off it stops honestly again
    await page.evaluate(() => localStorage.setItem('kins-metro-backgroundPlay', '0'));
    await page.reload();
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    const play2 = page.locator('#metroPlayBtn');
    await play2.click();
    await expect(play2).toHaveClass(/playing/);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(play2).not.toHaveClass(/playing/);
  });

  /* ---------- scheduler robustness (?metrodebug=1 hooks) ---------- */

  type MetroDebug = {
    mode: string;
    ctxState: string;
    playing: boolean;
    bpm: number;
    scheduledTotal: number;
    firedBeats: number;
    pendingSources: number;
    visualQueued: number;
    nextClickInMs: number;
    ticks: number;
    lastTickDeltaMs: number;
    maxTickDeltaMs: number;
  };

  async function openMetroDebug(page: Page) {
    await page.goto('/metronome?metrodebug=1');
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    const read = (): MetroDebug | null =>
      page.evaluate(() => {
        const fn = (window as unknown as { __metroDebug?: () => MetroDebug }).__metroDebug;
        return fn ? fn() : null;
      });
    return read;
  }

  test('live tempo/subdivision/time-signature changes while playing land instantly and stay stable', async ({ page }) => {
    const read = await openMetroDebug(page);
    const play = page.locator('#metroPlayBtn');
    await play.click();
    await expect(play).toHaveClass(/playing/);

    // live BPM change via scroll/keyboard (stepper buttons removed — scroll up increases)
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#metroBpmNum')).toHaveText('122');

    // live subdivision change mid-run
    await page.locator('#metroSubPill').click();
    await page.locator('#metroSubRow .metro-sub-chip[data-index="2"]').click(); // 1/8
    await expect(page.locator('#metroSubPillLabel')).toHaveText('1/8');

    // preset chips intentionally keep the sheet open — close it via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#metroSheet')).toBeHidden();

    // live time-signature change mid-run
    await page.locator('#metroTsPill').click();
    await page.locator('#metroTsGrid .metro-chip[data-index="4"]').click(); // 7/8
    await expect(page.locator('#metroTsPillLabel')).toHaveText('7/8');
    await page.keyboard.press('Escape');
    await expect(page.locator('#metroSheet')).toBeHidden();

    // engine kept running through all of it and every scheduled beat fires
    await expect(play).toHaveClass(/playing/);
    await page.waitForTimeout(700);
    const dbg = await read!();
    expect(dbg).not.toBeNull();
    expect(dbg!.playing).toBe(true);
    expect(dbg!.ctxState).toBe('running');
    // only the in-flight lookahead window may separate scheduled vs fired
    expect(Math.abs(dbg!.scheduledTotal - dbg!.firedBeats)).toBeLessThanOrEqual(12);

    // stop is immediate and honest — no ghost "playing" state
    await play.click();
    await expect(play).not.toHaveClass(/playing/);
    const stopped = await read!();
    expect(stopped!.playing).toBe(false);
  });

  test('rapid start/stop toggling never wedges the engine', async ({ page }) => {
    const read = await openMetroDebug(page);
    const play = page.locator('#metroPlayBtn');
    for (let i = 0; i < 4; i++) {
      await play.click();
      await page.waitForTimeout(60);
    }
    // even number of toggles → stopped; UI state must match engine truth
    const dbg = await read!();
    expect(dbg).not.toBeNull();
    expect(dbg!.playing).toBe(false);
    await expect(play).not.toHaveClass(/playing/);

    // one clean start afterwards works
    await play.click();
    await expect(play).toHaveClass(/playing/);
    const running = await read!();
    expect(running!.playing).toBe(true);
    expect(running!.firedBeats).toBeGreaterThanOrEqual(0);
    await play.click();
    await expect(play).not.toHaveClass(/playing/);
  });

  test('scheduler absorbs a main-thread stall without losing the beat', async ({ page }) => {
    const read = await openMetroDebug(page);
    const play = page.locator('#metroPlayBtn');
    await play.click();
    await expect(play).toHaveClass(/playing/);
    await page.waitForTimeout(500);

    const before = await read!();
    expect(before).not.toBeNull();

    // Block the main thread for 250ms (< the 300ms legacy lookahead; the
    // AudioWorklet path is immune at any duration). The metronome must
    // come out still playing with every beat accounted for.
    await page.evaluate(() => {
      const start = Date.now();
      let acc = 0;
      while (Date.now() - start < 250) acc += Math.sqrt(acc + 1);
      return acc;
    });

    await page.waitForTimeout(900);
    const after = await read!();
    expect(after).not.toBeNull();
    expect(after!.playing).toBe(true);
    expect(after!.ctxState).toBe('running');
    // beats kept flowing across the stall
    expect(after!.firedBeats).toBeGreaterThan(before!.firedBeats);
    // nothing was lost: only the in-flight window separates sched vs fired
    expect(Math.abs(after!.scheduledTotal - after!.firedBeats)).toBeLessThanOrEqual(12);
    // legacy path: prove the tick gap actually happened AND was absorbed
    if (after!.mode === 'legacy') {
      expect(after!.maxTickDeltaMs).toBeGreaterThanOrEqual(180);
    }
  });

  test('settings sheet footer renders theme toggle and opens modals', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSettingsBtn').click();
    await expect(page.locator('#metroPanelSettings')).toBeVisible();

    // Check footer elements inside scroll
    const footerCard = page.locator('.metro-sheet-footer-card');
    await expect(footerCard).toBeVisible();

    // Test Theme Switcher
    const darkBtn = footerCard.locator('#metroThemePillDarkBtn');
    const lightBtn = footerCard.locator('#metroThemePillLightBtn');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');

    // Ensure footer is scrolled into view (sheet is scrollable, buttons at bottom)
    await page.evaluate(() => {
      const sc = document.querySelector('#metroPanelSettings .metro-settings-scroll') || document.querySelector('#metroSettingsScroll');
      if (sc) sc.scrollTop = sc.scrollHeight;
    });
    await page.waitForTimeout(200);

    // Test Legal modal trigger
    await page.locator('#metroOpenLegalFooterBtn').click();
    const legalModal = page.locator('#legalModal');
    await expect(legalModal).toBeVisible();
    await expect(legalModal.locator('#legalTabPrivacy')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(legalModal).toBeHidden();

    // Test Feedback / Suggest Improvement modal trigger
    await page.locator('#metroOpenSuggestImprovementFooterBtn').click();
    await expect(page.locator('#feedbackModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#feedbackModal')).toBeHidden();
  });
});
