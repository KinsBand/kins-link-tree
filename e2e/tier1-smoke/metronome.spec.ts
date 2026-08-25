import { test, expect, type Page } from '@playwright/test';

/* Metronome smoke flows: no audio assertions (CI has no speakers) — these
   cover the play state machine, tap tempo, both picker sheets, the setlist
   and the coach-deck tab control surface. */

/* Dev-only toolbar overlays the bottom of the viewport in `astro dev` */
async function openMetro(page: Page) {
  await page.goto('/metronome');
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
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

    // default inspires
    await expect(page.locator('.metro-setlist-filter[data-filter="inspires"]')).toHaveClass(/active/);
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
    await expect(page.locator('.metro-setlist-row').first()).toContainText('Turnip Farm');

    // covers empty state
    await page.locator('.metro-setlist-filter[data-filter="covers"]').click();
    await expect(page.locator('.metro-setlist-filter[data-filter="covers"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.metro-setlist-empty')).toBeVisible();
    await expect(page.locator('.metro-setlist-empty')).toContainText('No covers yet');

    // originals empty state
    await page.locator('.metro-setlist-filter[data-filter="originals"]').click();
    await expect(page.locator('.metro-setlist-filter[data-filter="originals"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.metro-setlist-empty')).toContainText('Originals coming soon');

    // back to inspires restores list
    await page.locator('.metro-setlist-filter[data-filter="inspires"]').click();
    await expect(page.locator('.metro-setlist-row')).toHaveCount(15);
  });

  test('coach deck tabs switch', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroCoachBtn').click();
    await expect(page.locator('#metroPanelCoach')).toBeVisible();

    const speedTab = page.locator('#metroCoachTab-speed-trainer');
    await speedTab.click();
    await expect(speedTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#metroCoachPanel-speed-trainer')).toBeVisible();
    await expect(page.locator('#metroCoachPanel-inner-clock')).toBeHidden();
  });

  test('settings sheet exposes sound, volume and toggles', async ({ page }) => {
    await openMetro(page);
    await page.locator('#metroSettingsBtn').click();
    await expect(page.locator('#metroPanelSettings')).toBeVisible();

    await page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]').click();
    await expect(page.locator('#metroSoundRow .metro-chip[data-sound="woodblock"]')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#metroFlashToggle').check({ force: true });
    await expect(page.locator('#metroFlashToggle')).toBeChecked();
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

    // live BPM change
    await page.locator('#metroBpmPlus').click();
    await page.locator('#metroBpmPlus').click();
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
});
