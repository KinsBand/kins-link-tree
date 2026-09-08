# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\metronome.spec.ts >> tier1 smoke — metronome >> background play keeps the engine running across visibility changes
- Location: e2e\tier1-smoke\metronome.spec.ts:472:3

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
  443 |     // Switch to radial mode and verify radial segments carry tier and cycle
  444 |     await page.locator('#metroSettingsBtn').click();
  445 |     await page.locator('.metro-beatstyle-chip[data-style="radial"]').click();
  446 |     await page.keyboard.press('Escape');
  447 |     await expect(page.locator('#metroSheet')).toBeHidden();
  448 | 
  449 |     const segs = page.locator('#metroRadialRing .metro-radial-seg');
  450 |     await expect(segs).toHaveCount(4);
  451 |     await expect(segs.nth(0)).toHaveAttribute('data-tier', 'mid');
  452 |     await segs.nth(0).dispatchEvent('click');
  453 |     await expect(segs.nth(0)).toHaveAttribute('data-tier', 'high');
  454 | 
  455 |     // Test keyboard accessibility on radial seg
  456 |     await segs.nth(0).focus();
  457 |     await page.keyboard.press('Enter');
  458 |     await expect(segs.nth(0)).toHaveAttribute('data-tier', 'low');
  459 | 
  460 |     await page.keyboard.press('Enter');
  461 |     await expect(segs.nth(0)).toHaveAttribute('data-tier', 'mute');
  462 |     await expect(segs.nth(0)).toHaveClass(/tier-mute/);
  463 | 
  464 |     // Reset back to dots style and default tiers
  465 |     await page.locator('#metroSettingsBtn').click();
  466 |     await page.locator('.metro-beatstyle-chip[data-style="dots"]').click();
  467 |     await page.locator('#metroResetPitchBtn').click();
  468 |     await page.keyboard.press('Escape');
  469 |     await expect(page.locator('#metroSheet')).toBeHidden();
  470 |   });
  471 | 
  472 |   test('background play keeps the engine running across visibility changes', async ({ page }) => {
  473 |     await openMetro(page);
  474 |     // opt into background play before the controller boots
  475 |     await page.evaluate(() => localStorage.setItem('kins-metro-backgroundPlay', '1'));
  476 |     await page.reload();
  477 |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  478 | 
  479 |     const play = page.locator('#metroPlayBtn');
  480 |     await play.click();
> 481 |     await expect(play).toHaveClass(/playing/);
      |                        ^ Error: expect(locator).toHaveClass(expected) failed
  482 | 
  483 |     // Simulate tab hide WITHOUT user interaction — with BACKGROUND on, the
  484 |     // metronome must keep running and stay running when we come back.
  485 |     await page.evaluate(() => {
  486 |       Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  487 |       document.dispatchEvent(new Event('visibilitychange'));
  488 |     });
  489 |     await expect(play).toHaveClass(/playing/);
  490 | 
  491 |     await page.evaluate(() => {
  492 |       Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  493 |       document.dispatchEvent(new Event('visibilitychange'));
  494 |     });
  495 |     await expect(play).toHaveClass(/playing/);
  496 | 
  497 |     // And with the toggle off it stops honestly again
  498 |     await page.evaluate(() => localStorage.setItem('kins-metro-backgroundPlay', '0'));
  499 |     await page.reload();
  500 |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  501 |     const play2 = page.locator('#metroPlayBtn');
  502 |     await play2.click();
  503 |     await expect(play2).toHaveClass(/playing/);
  504 |     await page.evaluate(() => {
  505 |       Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  506 |       document.dispatchEvent(new Event('visibilitychange'));
  507 |     });
  508 |     await expect(play2).not.toHaveClass(/playing/);
  509 |   });
  510 | 
  511 |   /* ---------- scheduler robustness (?metrodebug=1 hooks) ---------- */
  512 | 
  513 |   type MetroDebug = {
  514 |     mode: string;
  515 |     ctxState: string;
  516 |     playing: boolean;
  517 |     bpm: number;
  518 |     scheduledTotal: number;
  519 |     firedBeats: number;
  520 |     pendingSources: number;
  521 |     visualQueued: number;
  522 |     nextClickInMs: number;
  523 |     ticks: number;
  524 |     lastTickDeltaMs: number;
  525 |     maxTickDeltaMs: number;
  526 |   };
  527 | 
  528 |   async function openMetroDebug(page: Page) {
  529 |     await page.goto('/metronome?metrodebug=1');
  530 |     await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  531 |     const read = (): MetroDebug | null =>
  532 |       page.evaluate(() => {
  533 |         const fn = (window as unknown as { __metroDebug?: () => MetroDebug }).__metroDebug;
  534 |         return fn ? fn() : null;
  535 |       });
  536 |     return read;
  537 |   }
  538 | 
  539 |   test('live tempo/subdivision/time-signature changes while playing land instantly and stay stable', async ({ page }) => {
  540 |     const read = await openMetroDebug(page);
  541 |     const play = page.locator('#metroPlayBtn');
  542 |     await play.click();
  543 |     await expect(play).toHaveClass(/playing/);
  544 | 
  545 |     // live BPM change via scroll/keyboard (stepper buttons removed — scroll up increases)
  546 |     await page.keyboard.press('ArrowUp');
  547 |     await page.keyboard.press('ArrowUp');
  548 |     await expect(page.locator('#metroBpmNum')).toHaveText('122');
  549 | 
  550 |     // live subdivision change mid-run
  551 |     await page.locator('#metroSubPill').click();
  552 |     await page.locator('#metroSubRow .metro-sub-chip[data-index="2"]').click(); // 1/8
  553 |     await expect(page.locator('#metroSubPillLabel')).toHaveText('1/8');
  554 | 
  555 |     // preset chips intentionally keep the sheet open — close it via Escape
  556 |     await page.keyboard.press('Escape');
  557 |     await expect(page.locator('#metroSheet')).toBeHidden();
  558 | 
  559 |     // live time-signature change mid-run
  560 |     await page.locator('#metroTsPill').click();
  561 |     await page.locator('#metroTsGrid .metro-chip[data-index="4"]').click(); // 7/8
  562 |     await expect(page.locator('#metroTsPillLabel')).toHaveText('7/8');
  563 |     await page.keyboard.press('Escape');
  564 |     await expect(page.locator('#metroSheet')).toBeHidden();
  565 | 
  566 |     // engine kept running through all of it and every scheduled beat fires
  567 |     await expect(play).toHaveClass(/playing/);
  568 |     await page.waitForTimeout(700);
  569 |     const dbg = await read!();
  570 |     expect(dbg).not.toBeNull();
  571 |     expect(dbg!.playing).toBe(true);
  572 |     expect(dbg!.ctxState).toBe('running');
  573 |     // only the in-flight lookahead window may separate scheduled vs fired
  574 |     expect(Math.abs(dbg!.scheduledTotal - dbg!.firedBeats)).toBeLessThanOrEqual(12);
  575 | 
  576 |     // stop is immediate and honest — no ghost "playing" state
  577 |     await play.click();
  578 |     await expect(play).not.toHaveClass(/playing/);
  579 |     const stopped = await read!();
  580 |     expect(stopped!.playing).toBe(false);
  581 |   });
```