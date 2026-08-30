import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — KINS THEORY & KINS TOOLS', () => {
  test('KINS TOOLS section renders both METRONOME and THEORY tools', async ({ page }) => {
    await page.goto('/');
    const toolsSection = page.locator('#rehearsalUtilitiesSection');
    await expect(toolsSection).toBeVisible();

    const metroCardBtn = page.locator('a[data-track="utilities:metronome"]');
    await expect(metroCardBtn).toBeVisible();
    await expect(metroCardBtn).toHaveAttribute('href', '/metronome');

    const theoryCardBtn = page.locator('a[data-track="utilities:theory"]');
    await expect(theoryCardBtn).toBeVisible();
    await expect(theoryCardBtn).toHaveAttribute('href', '/theory');
  });

  test('direct navigation to /theory loads KINS THEORY with visual chord cards grid and authentic fretboard', async ({ page }) => {
    await page.goto('/theory');
    await expect(page).toHaveURL(/\/theory/);

    // Verify topbar & navigation
    await expect(page.locator('#theoryTopbar')).toBeVisible();
    await expect(page.locator('#guitarTabBtn')).toBeVisible();
    await expect(page.locator('#drumsTabBtn')).toBeVisible();

    // Verify hero fretboard canvas and realistic components
    const fretboardCanvas = page.locator('#guitarFretboardCanvas');
    await expect(fretboardCanvas).toBeVisible();
    await expect(fretboardCanvas.locator('.fretboard-headstock')).toBeVisible();
    await expect(fretboardCanvas.locator('.fretboard-bone-nut')).toBeAttached();
    await expect(fretboardCanvas.locator('.neck-frets-grid')).toBeVisible();
    await expect(fretboardCanvas.locator('.fret-note-dot').first()).toBeVisible();

    // Test Interval Degrees vs Note Names toggle
    const noteModeBtn = page.locator('#fretLabelSelector button[data-fret-label="note"]');
    await expect(noteModeBtn).toBeVisible();
    await noteModeBtn.click();
    await expect(noteModeBtn).toHaveClass(/active/);

    // Verify chords grid list
    const chordsGrid = page.locator('#chords-list');
    await expect(chordsGrid).toBeVisible();

    // Verify G5 power chord card
    const g5Card = chordsGrid.locator('article[data-chord-id="g5"]');
    await expect(g5Card).toBeVisible();
    await expect(g5Card.locator('.chord-card-title')).toHaveText('G5');
    await expect(g5Card.locator('.chord-type-pill')).toContainText('POWER');
    await expect(g5Card.locator('.chord-svg')).toBeVisible();

    // Verify chord action buttons exist
    await expect(g5Card.locator('button[data-play-chord="g5"]')).toBeVisible();
    await expect(g5Card.locator('button[data-load-chord="g5"]')).toBeVisible();
  });

  test('drum visualizer tab loads multi-tier stage, spectrum scope, and 16-step sequencer', async ({ page }) => {
    await page.goto('/theory');

    // Switch to Drums Tab
    const drumsTabBtn = page.locator('#drumsTabBtn');
    await drumsTabBtn.click();
    await expect(page.locator('#drumsPanel')).toBeVisible();

    // Verify Tier 1: Interactive Drum Kit Pads
    const drumStage = page.locator('#drumKitStage');
    await expect(drumStage).toBeVisible();
    await expect(drumStage.locator('.drum-pad-piece[data-drum-piece="hihat"]')).toBeVisible();
    await expect(drumStage.locator('.drum-pad-piece[data-drum-piece="snare"]')).toBeVisible();
    await expect(drumStage.locator('.drum-pad-piece[data-drum-piece="kick"]')).toBeVisible();

    // Click Kick Pad
    const kickPad = drumStage.locator('.drum-pad-piece[data-drum-piece="kick"]');
    await kickPad.click();

    // Verify Tier 2: Real-time Audio Spectrum Scope Canvas
    await expect(page.locator('#drumAudioScope')).toBeVisible();
    await expect(page.locator('#drumScopeStatus')).toBeVisible();

    // Verify Tier 3: 16-Step Sequencer Grid
    const visualCanvas = page.locator('#drumVisualCanvas');
    await expect(visualCanvas).toBeVisible();
    await expect(visualCanvas.locator('.drum-matrix-row').first()).toBeVisible();

    // Test Play Beat toggle
    const playToggleBtn = page.locator('#drumPlayToggleBtn');
    await expect(playToggleBtn).toBeVisible();
    await playToggleBtn.click();
    await expect(page.locator('#drumPlayText')).toHaveText('STOP');
    await playToggleBtn.click();
    await expect(page.locator('#drumPlayText')).toHaveText('PLAY');

    // Test Rudiments Mode
    const rudimentModeBtn = page.locator('#drumModeSelector button[data-drum-mode="sticking"]');
    await rudimentModeBtn.click();
    await expect(visualCanvas.locator('.sticking-flow-container')).toBeVisible();
    await expect(visualCanvas.locator('.sticking-note-card').first()).toBeVisible();

    // Test Polyrhythms Mode
    const polyModeBtn = page.locator('#drumModeSelector button[data-drum-mode="polyrhythm"]');
    await polyModeBtn.click();
    await expect(visualCanvas.locator('.polyrhythm-radar-container')).toBeVisible();
    await expect(visualCanvas.locator('.poly-radar-stage')).toBeVisible();
  });

  test('chord subfilters properly filter chord cards', async ({ page }) => {
    await page.goto('/theory');

    const chordsList = page.locator('#chords-list');
    const powerSubfilterBtn = page.locator('.section-subfilters-row[data-target-list="chords-list"] button[data-type="power"]');
    const openSubfilterBtn = page.locator('.section-subfilters-row[data-target-list="chords-list"] button[data-type="open"]');

    // Click Power Chords subfilter
    await powerSubfilterBtn.click();
    await expect(chordsList.locator('article[data-chord-id="g5"]')).toBeVisible();
    await expect(chordsList.locator('article[data-chord-id="e5"]')).toBeVisible();
    await expect(chordsList.locator('article[data-chord-id="c-major"]')).toBeHidden();

    // Click Open Chords subfilter
    await openSubfilterBtn.click();
    await expect(chordsList.locator('article[data-chord-id="c-major"]')).toBeVisible();
    await expect(chordsList.locator('article[data-chord-id="g5"]')).toBeHidden();
  });

  test('responsive viewport renders fretboard and drum visualizer cleanly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/theory');

    const fretboardCanvas = page.locator('#guitarFretboardCanvas');
    await expect(fretboardCanvas).toBeVisible();

    const drumsTabBtn = page.locator('#drumsTabBtn');
    await drumsTabBtn.click();
    await expect(page.locator('#drumKitStage')).toBeVisible();
  });
});
