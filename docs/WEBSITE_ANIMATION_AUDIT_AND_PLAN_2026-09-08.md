# Master Website Animation Audit & 3-Phase Motion Plan (In, Active, Out)

Prepared 8 September 2026 from an exhaustive review of the local working tree, stylesheets, Astro components, and client controllers across the entire Kins Official Web Platform.

Following the forensic methodology of [docs/WEBSITE_AUDIT_2026-09-07.md](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/docs/WEBSITE_AUDIT_2026-09-07.md), this document provides a complete audit of every existing animation (87 `@keyframes`, 593 `transition` declarations, rAF engines) and details an implementation plan to ensure that **every interactive surface, dialog, card, drawer, and tab across the entire website possesses a deliberate In-Animation, Out-Animation, and (where applicable) Active/Kinetic Animation**.

---

## User Review Required

> [!IMPORTANT]
> **The 3-Phase Motion Contract (SSOT):**
> Every interactive element in the platform must transition across three explicit lifecycle phases:
> 1. **Phase 1: In-Animation (Mount / Reveal / Enter / Open):** Tactile entrance matching `--ease-snappy` (`cubic-bezier(0.16, 1, 0.3, 1)`) or `--ease-spring` (`cubic-bezier(0.175, 0.885, 0.32, 1.15)`), duration 180ms–260ms.
> 2. **Phase 2: Active Animation (Running / Playing / Looping / Hover / Press):** Continuous ambient feedback (e.g., vinyl spin, audio equalizer dance, tuner strobe drift, live dot pulse, breathing glows, tactile press `.brutal-press`).
> 3. **Phase 3: Out-Animation (Dismiss / Unmount / Exit / Close):** Controlled graceful departure using `.is-closing` state class with `--ease-tactile` or `ease-in`, duration 160ms–200ms, followed by DOM `.hidden` / unmount only after animation completion.

> [!WARNING]
> **Zero Layout Thrashing (60fps Mobile Budget):**
> Multiple existing drawers (`TabbedLinks.astro`, `SubscribeSection.astro`) animate `max-height` from `0` to `500px`. This triggers full-page layout reflows and drops frames on mobile devices. All collapsible containers will be refactored to CSS Grid `grid-template-rows: 0fr -> 1fr` and compositor-only `opacity`/`transform` transitions.

---

## Open Questions

> [!NOTE]
> 1. **High-Precision Tools Gating (`/metronome` & `/tuner`):** For real-time canvas visualizers (strobe wheel, needle meter, polyrhythm radar), when `prefers-reduced-motion` or `html.low-power-mode` is detected, should the animation frame rate be capped at 30fps with damped motion, or should the visualizer fall back to a high-contrast static digital readout? *(Recommended: Damped 30fps with disabled rotational strobe, preserving live pitch readability).*
> 2. **Modal Dismiss Acceleration:** Should double-tapping ESC or fast background tapping cancel the out-animation immediately and instantly unmount to prevent UI sluggishness during rapid navigation? *(Recommended: Yes, an immediate abort override if another trigger occurs during `.is-closing`).*

---

## Executive Summary & Global Animation Census

A complete scan of `src/` identified:
- **87 `@keyframes` declarations**
- **593 CSS `transition` declarations**
- **102 CSS `animation:` rules**
- **6 JavaScript `requestAnimationFrame` engines** (`followers.js`, `audioPlayer.js`, `metronome/audioEngine.js`, `tuner/uiBindings.js`, `theory/fretboardController.ts`, `theory/drumVisualizerController.ts`).

### The Fundamental Flaw: The "Sudden Death" Unmount Pattern
While opening animations (`modalPopIn`, `sheetSlideUp`, `fadeInTab`) are implemented across several surfaces, **out-animations are broken or completely absent in over 70% of the modal and drawer components**. 

When a close button or backdrop is clicked, the controllers immediately apply `.hidden` (which has `display: none !important;` in [global.css:61](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/styles/global.css#L61)) or remove `.active` synchronously. This aborts all CSS transitions instantly in 0ms, causing cards and sheets to vanish abruptly with zero exit motion.

---

## Findings, in Priority Order

### 1. P1 — "Sudden Death" Unmount in Modals, Sheets & Lightboxes

**Location:** 
- [GigMapSheet.astro:256-262](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/GigMapSheet.astro#L256-L262), [gigMap.js:2204](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/gigMap.js#L2204)
- [CoverVideoModal.astro:126](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/CoverVideoModal.astro#L126), [videoModalController.js:251-255](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/videoModalController.js#L251-L255)
- [CommunitySubmissionModal.astro:830](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/CommunitySubmissionModal.astro#L830)
- [RequestSongModal.astro:190-230](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/RequestSongModal.astro#L190-L230)
- [LiveUploadModal.astro:180](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveUploadModal.astro#L180), [LiveTabsLyricsModal.astro:120](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveTabsLyricsModal.astro#L120), [LiveStreamSettingsModal.astro:140](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveStreamSettingsModal.astro#L140), [LiveTipJarModal.astro:110](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveTipJarModal.astro#L110), [LiveAlertsModal.astro:90](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveAlertsModal.astro#L90), [LiveMediaLightbox.astro:80](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/live/LiveMediaLightbox.astro#L80)

**Evidence:**
In `gigMap.js`, `closeGigMapSheet` runs `gigMapModal.classList.remove('active')`. In `GigMapSheet.astro`, `.bottom-sheet-backdrop:not(:global(.active))` sets `display: none !important;`. The declared `transition: transform 0.26s var(--ease-snappy), opacity 0.22s ease;` cannot execute because the element is removed from layout in the same frame.
Similarly, `videoModalController.js` executes `modal.classList.add('hidden')` immediately, preventing `CoverVideoModal` from fading or scaling out.

**Fix:**
Implement the standardized `.is-closing` state lifecycle across all modals and drawers:
1. When closing begins: add class `.is-closing`.
2. Play dedicated `@keyframes modalPopOut` or `@keyframes sheetSlideDown` (180ms, cubic-bezier(0.4, 0, 1, 1)).
3. Listen for `animationend` (with a 200ms `setTimeout` fallback).
4. Only upon animation completion, add `.hidden` and remove `.is-closing` and `.active`.

---

### 2. P1 — Instant Cut Tab & View Switching (Zero Exit Motion)

**Location:**
- [TabbedLinks.astro:262-275](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/sections/TabbedLinks.astro#L262-L275), [tabs.js:14-26](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tabs.js#L14-L26)
- [InspirationVault.astro:31-33](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/sections/InspirationVault.astro#L31-L33), [inspirationVault.js:280-320](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/inspirationVault.js#L280-L320)
- [theory.astro:185](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/theory.astro#L185), [theory.css:1348](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/styles/theory/theory.css#L1348)
- [EpkBio.astro:293-303](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/epk/EpkBio.astro#L293-L303)

**Evidence:**
In `TabbedLinks.astro`, switching between STREAMS, SOCIALS, and COMMUNITY uses:
```css
.tab-content { display: none; }
.tab-content.active { display: block !important; animation: fadeInTab 0.2s var(--ease-snappy) forwards; }
```
When `tabs.js` runs `tabPanels.forEach(p => p.classList.remove('active'))`, the outgoing tab snaps into `display: none` instantly. There is no crossfade, no slide exit, and no sliding active pill indicator across the tab bar buttons.
In `InspirationVault.astro`, filtering by member (TRAI / VIVIAN / OSCAR / CHARLIE) empties `#inspiredTracksContainer.innerHTML` with no exit transition of the existing track cards.

**Fix:**
1. Introduce a directional or crossfade exit animation (`@keyframes fadeOutTab { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-4px); } }`).
2. Tab switcher buttons must implement a sliding indicator pill (`transform: translateX(...)` with spring easing) to track the active segment.
3. In `inspirationVault.js`, apply `.is-leaving` to the old track cards (80ms stagger out) before rendering the new set.

---

### 3. P1 — Layout Thrashing Collapsible Drawers (`max-height` Anti-Pattern)

**Location:**
- [TabbedLinks.astro:394-405](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/sections/TabbedLinks.astro#L394-L405)
- [SubscribeSection.astro:660](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/sections/SubscribeSection.astro#L660)

**Evidence:**
`.more-socials-container` transitions `max-height: 0` to `max-height: 500px` on click. Animating `max-height` forces browser layout recalculation and repaint on every frame, violating AGENTS.md Directive 7 ("Animate transform and opacity ONLY").

**Fix:**
Refactor drawer expansion to modern CSS Grid accordion animation:
```css
.collapsible-drawer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.24s var(--ease-snappy);
}
.collapsible-drawer.is-expanded {
  grid-template-rows: 1fr;
}
.collapsible-drawer > .drawer-inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity 0.2s ease, transform 0.2s var(--ease-snappy);
}
.collapsible-drawer.is-expanded > .drawer-inner {
  opacity: 1;
  transform: translateY(0);
}
```

---

### 4. P1 — Audio Player State Morph & Needle Drop Lifecycle Gaps

**Location:**
- [AudioPlayer.astro:84-120](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/ui/AudioPlayer.astro#L84-L120), [audioPlayer.js:354-378](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/audioPlayer.js#L354-L378)
- [AudioPlayer.astro:541](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/ui/AudioPlayer.astro#L541) (`needleDropBounce`)

**Evidence:**
In `audioPlayer.js`, switching between the idle state (`#deckIdleView` with stacked albums) and the active state (`#deckActiveView` with spinning vinyl) toggles `.hidden` on both elements. The transition is an abrupt cut.
Furthermore, the turntable stylus needle (`#vinylStylusWrapper`) has a drop animation (`needleDropBounce`), but **no needle lift animation** when playback pauses or stops; the stylus simply jumps back to rest position.

**Fix:**
1. Implement a 3-phase state transition between Idle and Active views (`deckViewMorphOut` -> `deckViewMorphIn`).
2. Add `@keyframes needleLiftEase` (`transform: rotate(0deg) translate(0, 0)`) when pausing, pairing with `needleDropBounce` on play.
3. Add an active 4-bar equalizer dance animation in the audio dock that pulses dynamically with playback time.

---

### 5. P2 — Chromatic Tuner Lacks 2s Dwell Confirmation & Snap Alert Lifecycles

**Location:**
- [tuner.astro:1362-1379](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/tuner.astro#L1362-L1379)
- [tuner.astro:2272](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/tuner.astro#L2272)
- [uiBindings.js:1348](file:///c:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/uiBindings.js#L1348)

**Evidence:**
`tuner.astro` defines `tuner-sheet-menu-in` for setup popups, but has **no `tuner-sheet-menu-out`**.
The safety tension monitor warning banner appears and disappears without an entry pop or exit slide.
When tuning reaches the green correctness zone (±3 cents), there is no 2,000 ms dwell progress animation (ring / arc fill), nor is there an active strobe visualizer phase shift.

**Fix:**
1. Pair `tuner-sheet-menu-in` with `tuner-sheet-menu-out`.
2. Add `@keyframes inTuneDwellArc` for continuous dwell progress and `@keyframes inTuneLockPop` for alignment confirmation.
3. Implement 3-phase animation for the string tension alert: `@keyframes safetyAlertIn`, `@keyframes safetyAlertPulse` (active danger loop), and `@keyframes safetyAlertOut`.

---

## Exhaustive Component-by-Component 3-Phase Animation Matrix

The table below catalogs **every single animated or animatable element** on the Kins Official Web Platform, detailing its exact In, Active, and Out animation requirements.

| Component & Element | File Location | Phase 1: In-Animation | Phase 2: Active / Idle Animation | Phase 3: Out-Animation |
| :--- | :--- | :--- | :--- | :--- |
| **TopNav — Header Shell** | `TopNav.astro:14` | `@keyframes navSlideDown` (0.24s, `--ease-snappy`) on mount | Sticky backdrop glass blur | `@keyframes navSlideUp` (0.2s) on route exit |
| **TopNav — Live Pulse Dot** | `TopNav.astro:404` | Scale from 0 to 1 | `@keyframes topLiveDotPulse` (1.2s infinite pulse) | Fade to 0 on stream offline |
| **TopNav — Subscribe Bell** | `TopNav.astro:25` | Fade & scale in | `@keyframes youtubeBellShake` on subscribe | Scale down to normal badge |
| **TopNav — Search Pill** | `TopNav.astro:41` | Expand width from 40px to 220px | Hover: `-1px, -1px` lift, glow ring | Shrink width on mobile collapse |
| **HeroBanner — Logo Banner** | `HeroBanner.astro:12` | `@keyframes heroLogoDropIn` (0.32s, `--ease-spring`) | `@keyframes glowBreath` (4s infinite radial aura) | `@keyframes heroLogoFadeOut` (0.2s) |
| **Profile — Tape Badges** | `ProfileSection.astro:7` | `@keyframes tapeSlamIn` (0.22s, slight skew) | `@keyframes tapeJitterAnim` on hover | `@keyframes tapePeelOut` (0.16s) |
| **Profile — Follower Counter** | `ProfileSection.astro:39` | Count-up `requestAnimationFrame` ease | `@keyframes counterTickPop` on update | Fade-out on filter |
| **HeroFeature — Card Shell** | `HeroFeatureCard.astro:54` | `@keyframes featureCardIn` (0.28s, scale 0.97) | Ambient border glow, tape hover | `@keyframes featureCardOut` (0.2s) |
| **HeroFeature — Countdown** | `HeroFeatureCard.astro:78` | Number slide-down in | `@keyframes cdDigitFlip` (every second tick) | Number slide-up out |
| **HeroFeature — Vinyl Preview** | `HeroFeatureCard.astro:62` | Record slip-out from sleeve | `@keyframes vinylSpinContinuous` (3s linear) | Record slip-in to sleeve |
| **HeroFeature — Poll Vote Bar** | `HeroFeatureCard.astro:42` | Percentage bar expands from 0% | `@keyframes votePulseGlow` on active vote | Collapse on results reset |
| **TabbedLinks — Tab Segment** | `TabbedLinks.astro:22` | Segmented bar slide in | Active sliding pill follower (`translateX`) | Segment fade out |
| **TabbedLinks — Tab Content** | `TabbedLinks.astro:63` | `@keyframes fadeInTab` (0.2s, `--ease-snappy`) | Hover lift on cards (`-1.5px, -1.5px`) | `@keyframes fadeOutTab` (0.16s) via `.is-closing` |
| **TabbedLinks — Star Badge** | `TabbedLinks.astro:362` | `@keyframes popStar` (0.2s, scale 0.5 to 1) | `@keyframes starTwinkle` (2s subtle pulse) | Scale down to 0 on untag |
| **TabbedLinks — More Drawer** | `TabbedLinks.astro:394` | Grid row `0fr -> 1fr` (0.24s) | Arrow rotation 180deg | Grid row `1fr -> 0fr` (0.2s) |
| **Members — Member Card** | `MembersSection.astro:22` | `@keyframes cardDealIn` (staggered 40ms) | Hover lift `-3px, -3px` + brutal shadow | `@keyframes cardDealOut` (0.18s) |
| **CrewSpotlight — Spot Card** | `KinsCrewSpotlight.astro:61` | Fade & scale in (0.25s) | `@keyframes badgePulseGlow` on "Spot Open" | Fade & scale out |
| **Merch — Preview Card** | `MerchSection.astro:23` | `@keyframes merchCardPop` (0.26s) | Card image zoom `scale(1.05)` on hover | Merch card scale out |
| **Inspiration — Track Items** | `InspirationVault.astro:31` | `@keyframes trackItemSlideIn` (staggered) | `@keyframes vinylSpin` on active track | `@keyframes trackItemSlideOut` (0.16s) |
| **Inspiration — Filter Tabs** | `InspirationVault.astro:16` | Horizontal bar reveal | Active pill indicator slide | Tab deselect fade |
| **KinsTools — Tool Cards** | `KinsToolsSection.astro` | `@keyframes toolCardRise` (0.25s) | `@keyframes sectionIconSpinBounce` on hover | Card collapse on disable |
| **Subscribe — Form Container** | `SubscribeSection.astro:13` | Fade in and drop down | Form focus ring glow (`--brand-accent-glow`) | `@keyframes formFoldOut` (0.2s) |
| **Subscribe — Autocomplete** | `SubscribeSection.astro:67` | `@keyframes suggestionsSlideDown` | Hover item background highlight | `@keyframes suggestionsSlideUp` (.is-closing) |
| **Subscribe — Success State** | `SubscribeSection.astro:83` | `@keyframes celebrateSuccessPop` (scale bounce) | Checkmark draw-in animation | Fade out on reset |
| **ShareModal — Modal & Sheet** | `ShareModal.astro:573` | `@keyframes modalPopIn` / `sheetSlideUp` | QR code canvas scan radar pulse | `@keyframes modalPopOut` / `sheetSlideDown` |
| **GigMapSheet — Map & List** | `GigMapSheet.astro:271` | `@keyframes gigSheetIn` (0.26s) | `@keyframes userGeoPulseAnim` GPS wave | `@keyframes gigSheetOut` (0.2s, .is-closing) |
| **CoversSearch — Overlay** | `CoversSearchOverlay.astro:79` | `@keyframes searchOverlayIn` (scale 0.95 to 1) | `@keyframes learningPulse` on active card | `@keyframes searchOverlayOut` (.is-closing) |
| **CoverVideoModal — Dialog** | `CoverVideoModal.astro:131` | `@keyframes videoModalPopIn` (0.24s) | Center play icon ripple on hover | `@keyframes videoModalPopOut` (0.18s) |
| **CommunityModal — Dialog** | `CommunitySubmissionModal.astro` | `@keyframes modalPopIn` (0.25s) | Input paste ripple & category chip spring | `@keyframes modalPopOut` (.is-closing) |
| **LegalModal — Legal Sheets** | `LegalModal.astro:286` | `@keyframes legalModalPopIn` / `legalSheetSlideUp` | Scroll thumb glow | `@keyframes legalModalPopOut` / `SlideDown` |
| **RequestSongModal — Sheet** | `RequestSongModal.astro:199` | `@keyframes modalPopIn` / `sheetSlideUp` | Live iTunes search result pop | `@keyframes modalPopOut` / `sheetSlideDown` |
| **LiveNav — Live Header** | `LiveNav.astro` | Slide down on mount | `@keyframes liveDotPulseAnim` | Slide up on exit |
| **Live — MasterStreamPlayer** | `MasterStreamPlayer.astro:10` | `@keyframes stageRevealIn` (0.3s) | `@keyframes stageLightingPulse` (dynamic aura) | Theater mode aspect morph |
| **Live — Chat Messages** | `LiveChatReactions.astro:34` | `@keyframes chatMsgAppear` (0.18s) | Emoji button spring bounce | `@keyframes chatMsgFadeOut` on clear |
| **Live — Reaction Particles** | `LiveChatReactions.astro:75` | `@keyframes reactionSpawn` | `@keyframes reactionParticleFloat` (float up) | `@keyframes reactionVanish` (fade out) |
| **Live — Pinned Banner** | `LiveChatReactions.astro:19` | Slide down into chat head | Yellow tape accent | `@keyframes bannerFoldUp` on dismiss |
| **Live — Fan Wall Posts** | `LiveFanWall.astro` | `@keyframes fadeInEmpty` (0.2s) | `@keyframes heartPop` on like click | Grid reorder transition |
| **Live — Tip Jar Modal** | `LiveTipJarModal.astro` | `@keyframes modalScaleIn` (0.24s) | Tip coin icon shimmer loop | `@keyframes modalScaleOut` (.is-closing) |
| **Live — Media Lightbox** | `LiveMediaLightbox.astro` | `@keyframes lightboxPopIn` (0.24s) | Pinch/drag active transform | `@keyframes lightboxPopOut` (.is-closing) |
| **Metronome — Tactile Dial** | `metronome.astro` | Scale in with dial ticks | Active touch drag / inertia rotation | Spin down on pause |
| **Metronome — Beat Visualizer**| `metronome.astro` | Indicator dots reveal | `@keyframes metro-bpm-flash-a/b` on downbeat | Inactive dots desaturate |
| **Metronome — Tempo Markings** | `metronome.astro:1609` | `@keyframes tempoBlurInA/B` | BPM font glow on subdivision | `@keyframes tempoBlurOut` (0.16s) |
| **Metronome — Settings Sheet** | `metronome.astro:2368` | `@keyframes metroSheetIn` (0.24s) | Slider thumb hover spring | `@keyframes metroSheetOut` (0.2s, .is-closing) |
| **Metronome — Coach Pill** | `metronome.astro:7569` | `@keyframes coachPillIn` (0.2s) | Bar-mute exercise progress fill | `@keyframes coachPillOut` on routine end |
| **Tuner — Needle Meter** | `tuner.astro:646` | Needle sweep from -50ct | Spring damping interpolation to target note | Smooth return to 0ct on silence |
| **Tuner — In-Tune Green Zone** | `tuner.astro:670` | `@keyframes inTuneGreenGlow` | `@keyframes inTuneDwellArc` (2s dwell progress)| Reset to gray on pitch drift |
| **Tuner — Alignment Lock** | `tuner.astro` | `@keyframes lockPopCelebrate` (0.2s) | Haptic + visual green flash confirmation | Fade out into next string transition |
| **Tuner — Strobe Visualizer** | `tuner.astro` | Strobe bands slide into aperture | Dynamic rotation speed proportional to cents | Strobe deceleration to stop |
| **Tuner — Headstock Peg Art** | `tuner.astro:2272` | `@keyframes tuner-peg-pop` | Active string vibration wave (`stroke-dashoffset`)| Peg deselect unpop |
| **Tuner — Tension Snap Alert** | `tuner.astro` | `@keyframes safetyAlertIn` (slide from top) | `@keyframes safetyDangerPulse` (red pulse loop) | `@keyframes safetyAlertOut` on safe pitch |
| **Theory — Fretboard Sandbox** | `TheoryFretboardHero.astro`| Fret markers scale in | `@keyframes stringPluckVibrate` on fret hit | Note marker fade out |
| **Theory — Drum Sequencer** | `DrumGridHero.astro` | 16-step grid layout cascade | `@keyframes playheadSweep` & pad impact wave | Stop playhead sweep |
| **Theory — Circle of Fifths** | `GuitarIntervalsSection.astro`| Wheel pop in | Active sector highlight + key link beam | Sector deselect crossfade |
| **Store — Cart Drawer** | `StoreCartDrawer.astro:10` | Slide in from right (`translateX(0)`) | Free shipping progress bar fill | Slide out right (`translateX(105%)`) |
| **Store — Cart Line Items** | `StoreCartDrawer.astro:51` | `@keyframes lineItemSlideIn` | Quantity stepper press animation | `@keyframes lineItemSlideOut` (collapse height) |
| **Store — Quick View Modal** | `ProductQuickViewModal.astro` | `@keyframes modalPopIn` (0.24s) | Thumbnail switcher border slide | `@keyframes modalPopOut` (.is-closing) |
| **404 — Status Page** | `404.astro:10` | `@keyframes crtPowerOn` (0.4s) | `@keyframes glitchTextDrift` & tape spool | `@keyframes crtPowerOff` on back navigate |
| **Global — Audio Player Dock** | `AudioPlayer.astro:48` | Slide up from viewport bottom | Stylus needle drop (`needleDropBounce`) | Slide down into hidden dock |
| **Global — Equalizer Bars** | `AudioPlayer.astro` | Bars rise from 0px | `@keyframes eqBarBounce` (dynamic frequency dance)| Bars settle to flat 2px |
| **Global — Stream Drawer** | `AudioPlayer.astro:233` | Slide up & fade in | Platform button hover lift | Slide down & fade out (.is-closing) |
| **Global — Toast Container** | `ToastContainer.astro:139`| `@keyframes toastSpringIn` (0.24s) | `@keyframes toastProgress` (2.8s linear bar) | `@keyframes toastSpringOut` (0.25s) |
| **Global — FAQ Accordion** | `SiteFooter.astro:743` | `@keyframes faqAnswerFadeIn` | Chevron rotation 180deg | `@keyframes faqAnswerFadeOut` on collapse |

---

## Technical Implementation Architecture

### 1. The Standardized `.is-closing` Lifecycle Controller Pattern
To guarantee every modal and drawer plays its exit animation before unmounting, all controllers will adopt this unified helper:

```javascript
// src/scripts/utils/modalAnimation.js
export function animateAndClose(modalEl, wrapperEl, closingClass = 'is-closing', duration = 200) {
  if (!modalEl || modalEl.classList.contains('hidden') || modalEl.classList.contains(closingClass)) return;

  modalEl.classList.add(closingClass);
  if (wrapperEl) wrapperEl.classList.add(closingClass);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    modalEl.classList.remove('active', closingClass);
    if (wrapperEl) wrapperEl.classList.remove(closingClass);
    modalEl.classList.add('hidden');
    modalEl.inert = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  };

  // Wait for CSS animationend or timeout safety fallback
  const target = wrapperEl || modalEl;
  target.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, duration + 40);
}
```

### 2. Standardized Keyframes Token Library
Add missing In, Active, and Out keyframes to `src/styles/tokens/animations.css`:

```css
/* ==========================================================================
   Master 3-Phase Kinetic Keyframes (SSOT)
   ========================================================================== */

/* --- Phase 1: In-Animations --- */
@keyframes modalPopIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes sheetSlideUp {
  from { transform: translateY(100%); opacity: 0.4; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeInTab {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Phase 2: Active & Looping Animations --- */
@keyframes eqBarBounce {
  0%, 100% { height: 4px; }
  50% { height: 18px; }
}

@keyframes inTuneDwellArc {
  from { stroke-dashoffset: 283; }
  to { stroke-dashoffset: 0; }
}

@keyframes glowBreath {
  0%, 100% { opacity: 0.12; transform: scale(1); }
  50% { opacity: 0.28; transform: scale(1.04); }
}

/* --- Phase 3: Out-Animations --- */
@keyframes modalPopOut {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.96) translateY(8px); }
}

@keyframes sheetSlideDown {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
}

@keyframes fadeOutTab {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-4px); }
}
```

### 3. Reduced Motion & Performance Gating
All newly introduced keyframes and continuous loops will be strictly guarded:

```css
@media (prefers-reduced-motion: reduce), (update: slow) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:global(html.low-power-mode) .vinyl-spin-anim,
:global(html.low-power-mode) .stage-lighting-overlay {
  animation: none !important;
}
```

---

## Verification Plan

### Automated Tests
1. **Playwright Motion & Lifecycle Suite:** Create `e2e/motion-lifecycle.spec.ts` to test every modal, drawer, and tab:
   - Verify modal opens with `.active` and computed opacity `1`.
   - Verify close trigger adds `.is-closing` and modal remains visible during out-animation (e.g. at 50ms).
   - Verify modal receives `.hidden` and computed opacity `0` only after out-animation completes (at 250ms).
   - Verify keyboard focus is trapped during open and returned to trigger upon close.
2. **Reduced Motion Gating Test:** Emulate `prefers-reduced-motion: reduce` in Playwright and verify computed animation durations are ≤1ms.
3. **Static Checks & CSS Audit:** Run `npm run check` and verify zero new TypeScript/lint errors.

### Manual Verification
1. Open and close all 12 modals/sheets on mobile viewport (390×844) and desktop (1280px). Verify silky smooth enter and exit curves.
2. Switch tabs in `TabbedLinks`, `InspirationVault`, and `Theory`. Verify zero instant layout jumps.
3. Play music in `AudioPlayer`. Observe stylus drop, vinyl spin, dynamic waveform bars, and smooth deceleration on pause.
4. Open tuner on `/tuner`. Verify green correctness zone visual dwell progression and in-tune alignment lock pop.
