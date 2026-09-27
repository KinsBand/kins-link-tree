# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> rapid start/stop toggling never wedges the engine
- Location: e2e\tier1-smoke\metronome.spec.ts:582:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#metroPlayBtn')
Expected pattern: /playing/
Received string:  "metro-play-btn brutal-press"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#metroPlayBtn')
    14 × locator resolved to <button type="button" id="metroPlayBtn" data-astro-cid-oerylgbb="" data-track="metronome:play" aria-label="Start metronome" class="metro-play-btn brutal-press">…</button>
       - unexpected value "metro-play-btn brutal-press"

```

```yaml
- button "Start metronome"
```

# Test source

```ts
  497 |   test('background play disabled stops the engine when the page is hidden', async ({ page }) => {
  498 |     await page.addInitScript(() => localStorage.setItem('kins-metro-backgroundPlay', '0'));
  499 |     await openMetro(page);
  500 |     const play2 = page.locator('#metroPlayBtn');
  501 |     await play2.click();
  502 |     await expect(play2).toHaveClass(/playing/);
  503 |     await page.evaluate(() => {
  504 |       Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  505 |       document.dispatchEvent(new Event('visibilitychange'));
  506 |     });
  507 |     await expect(play2).not.toHaveClass(/playing/);
  508 |   });
  509 | 
  510 |   /* ---------- scheduler robustness (?metrodebug=1 hooks) ---------- */
  511 | 
  512 |   type MetroDebug = {
  513 |     mode: string;
  514 |     ctxState: string;
  515 |     playing: boolean;
  516 |     bpm: number;
  517 |     scheduledTotal: number;
  518 |     firedBeats: number;
  519 |     pendingSources: number;
  520 |     visualQueued: number;
  521 |     nextClickInMs: number;
  522 |     ticks: number;
  523 |     lastTickDeltaMs: number;
  524 |     maxTickDeltaMs: number;
  525 |   };
  526 | 
  527 |   async function openMetroDebug(page: Page) {
  528 |     await page.goto('/metronome?metrodebug=1');
  529 |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  530 |     const read = (): Promise<MetroDebug | null> =>
  531 |       page.evaluate(() => {
  532 |         const fn = (window as unknown as { __metroDebug?: () => MetroDebug }).__metroDebug;
  533 |         return fn ? fn() : null;
  534 |       });
  535 |     return read;
  536 |   }
  537 | 
  538 |   test('live tempo/subdivision/time-signature changes while playing land instantly and stay stable', async ({ page }) => {
  539 |     const read = await openMetroDebug(page);
  540 |     const play = page.locator('#metroPlayBtn');
  541 |     await play.click();
  542 |     await expect(play).toHaveClass(/playing/);
  543 | 
  544 |     // live BPM change via scroll/keyboard (stepper buttons removed — scroll up increases)
  545 |     await page.keyboard.press('ArrowUp');
  546 |     await page.keyboard.press('ArrowUp');
  547 |     await expect(page.locator('#metroBpmNum')).toHaveText('122');
  548 | 
  549 |     // live subdivision change mid-run
  550 |     await page.locator('#metroSubPill').click();
  551 |     await page.locator('#metroSubRow .metro-sub-chip[data-index="2"]').click(); // 1/8
  552 |     await expect(page.locator('#metroSubPillLabel')).toHaveText('1/8');
  553 | 
  554 |     // preset chips intentionally keep the sheet open — close it via Escape
  555 |     await page.keyboard.press('Escape');
  556 |     await expect(page.locator('#metroSheet')).toBeHidden();
  557 | 
  558 |     // live time-signature change mid-run
  559 |     await page.locator('#metroTsPill').click();
  560 |     await page.locator('#metroTsGrid .metro-chip[data-index="4"]').click(); // 7/8
  561 |     await expect(page.locator('#metroTsPillLabel')).toHaveText('7/8');
  562 |     await page.keyboard.press('Escape');
  563 |     await expect(page.locator('#metroSheet')).toBeHidden();
  564 | 
  565 |     // engine kept running through all of it and every scheduled beat fires
  566 |     await expect(play).toHaveClass(/playing/);
  567 |     await page.waitForTimeout(700);
  568 |     const dbg = await read!();
  569 |     expect(dbg).not.toBeNull();
  570 |     expect(dbg!.playing).toBe(true);
  571 |     expect(dbg!.ctxState).toBe('running');
  572 |     // only the in-flight lookahead window may separate scheduled vs fired
  573 |     expect(Math.abs(dbg!.scheduledTotal - dbg!.firedBeats)).toBeLessThanOrEqual(12);
  574 | 
  575 |     // stop is immediate and honest — no ghost "playing" state
  576 |     await play.click();
  577 |     await expect(play).not.toHaveClass(/playing/);
  578 |     const stopped = await read!();
  579 |     expect(stopped!.playing).toBe(false);
  580 |   });
  581 | 
  582 |   test('rapid start/stop toggling never wedges the engine', async ({ page }) => {
  583 |     const read = await openMetroDebug(page);
  584 |     const play = page.locator('#metroPlayBtn');
  585 |     for (let i = 0; i < 4; i++) {
  586 |       await play.click();
  587 |       await page.waitForTimeout(60);
  588 |     }
  589 |     // even number of toggles → stopped; UI state must match engine truth
  590 |     const dbg = await read!();
  591 |     expect(dbg).not.toBeNull();
  592 |     expect(dbg!.playing).toBe(false);
  593 |     await expect(play).not.toHaveClass(/playing/);
  594 | 
  595 |     // one clean start afterwards works
  596 |     await play.click();
> 597 |     await expect(play).toHaveClass(/playing/);
      |                        ^ Error: expect(locator).toHaveClass(expected) failed
  598 |     const running = await read!();
  599 |     expect(running!.playing).toBe(true);
  600 |     expect(running!.firedBeats).toBeGreaterThanOrEqual(0);
  601 |     await play.click();
  602 |     await expect(play).not.toHaveClass(/playing/);
  603 |   });
  604 | 
  605 |   test('scheduler absorbs a main-thread stall without losing the beat', async ({ page }) => {
  606 |     const read = await openMetroDebug(page);
  607 |     const play = page.locator('#metroPlayBtn');
  608 |     await play.click();
  609 |     await expect(play).toHaveClass(/playing/);
  610 |     await page.waitForTimeout(500);
  611 | 
  612 |     const before = await read!();
  613 |     expect(before).not.toBeNull();
  614 | 
  615 |     // Block the main thread for 250ms (< the 300ms legacy lookahead; the
  616 |     // AudioWorklet path is immune at any duration). The metronome must
  617 |     // come out still playing with every beat accounted for.
  618 |     await page.evaluate(() => {
  619 |       const start = Date.now();
  620 |       let acc = 0;
  621 |       while (Date.now() - start < 250) acc += Math.sqrt(acc + 1);
  622 |       return acc;
  623 |     });
  624 | 
  625 |     await page.waitForTimeout(900);
  626 |     const after = await read!();
  627 |     expect(after).not.toBeNull();
  628 |     expect(after!.playing).toBe(true);
  629 |     expect(after!.ctxState).toBe('running');
  630 |     // beats kept flowing across the stall
  631 |     expect(after!.firedBeats).toBeGreaterThan(before!.firedBeats);
  632 |     // nothing was lost: only the in-flight window separates sched vs fired
  633 |     expect(Math.abs(after!.scheduledTotal - after!.firedBeats)).toBeLessThanOrEqual(12);
  634 |     // legacy path: prove the tick gap actually happened AND was absorbed
  635 |     if (after!.mode === 'legacy') {
  636 |       expect(after!.maxTickDeltaMs).toBeGreaterThanOrEqual(180);
  637 |     }
  638 |   });
  639 | 
  640 |   test('settings sheet footer renders theme toggle and opens modals', async ({ page }) => {
  641 |     await openMetro(page);
  642 |     await page.locator('#metroSettingsBtn').click();
  643 |     await expect(page.locator('#metroPanelSettings')).toBeVisible();
  644 | 
  645 |     // Check footer elements inside scroll
  646 |     const footerCard = page.locator('.metro-sheet-footer-card');
  647 |     await expect(footerCard).toBeVisible();
  648 | 
  649 |     // Test Theme Switcher
  650 |     const darkBtn = footerCard.locator('#metroThemePillDarkBtn');
  651 |     const lightBtn = footerCard.locator('#metroThemePillLightBtn');
  652 |     await darkBtn.click();
  653 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  654 |     await lightBtn.click();
  655 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
  656 | 
  657 |     // Ensure footer is scrolled into view (sheet is scrollable, buttons at bottom)
  658 |     await page.evaluate(() => {
  659 |       const sc = document.querySelector('#metroPanelSettings .metro-settings-scroll') || document.querySelector('#metroSettingsScroll');
  660 |       if (sc) sc.scrollTop = sc.scrollHeight;
  661 |     });
  662 |     await page.waitForTimeout(200);
  663 | 
  664 |     // Test Legal modal trigger
  665 |     await page.locator('#metroOpenLegalFooterBtn').click();
  666 |     const legalModal = page.locator('#legalModal');
  667 |     await expect(legalModal).toBeVisible();
  668 |     await expect(legalModal.locator('#legalTabPrivacy')).toHaveAttribute('aria-selected', 'true');
  669 |     await page.keyboard.press('Escape');
  670 |     await expect(legalModal).toBeHidden();
  671 | 
  672 |     // Test Feedback / Suggest Improvement modal trigger
  673 |     await page.locator('#metroOpenSuggestImprovementFooterBtn').click();
  674 |     await expect(page.locator('#feedbackModal')).toBeVisible();
  675 |     await page.keyboard.press('Escape');
  676 |     await expect(page.locator('#feedbackModal')).toBeHidden();
  677 |   });
  678 | });
  679 | 
```