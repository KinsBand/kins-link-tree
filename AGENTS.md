# AGENTS.md: Design System & Application Architecture Specification

This document serves as the single source of truth (SSOT) for all automated agents, engineers, and LLMs generating or refactoring code across the Kins Official Web Platform. Strict adherence to the tokens, architectural layouts, hydration directives, and lifecycle state behaviors defined below is mandatory.

---

## 1. Core Directives & Agent Execution Rules

1. **Semantic Role-Based Token Enforcement:** Never hardcode raw hex, RGB, HSL, or arbitrary pixel values in components or scripts. Never name tokens after literal colors (e.g. `--btn-green` or `--text-dark`). Always use role-based semantic tokens (`--btn-brand-primary`, `--text-on-light`, `--surface-card`, `--brand-accent-primary`).
2. **1:1 Theme Parity Matrix:** Every UI element created must have an explicit 1:1 Light Mode (`:root`) and Dark Mode (`[data-theme="dark"]`) pairing defined via semantic tokens. Light mode utilizes Electric Neon Yellow (`#f2fd43`), while Dark Mode utilizes Muted Warm Gold (`#d4af37`) against deep slate surfaces to prevent eye fatigue.
3. **Accessibility (WCAG AA Standard):** Maintain a minimum 4.5:1 contrast ratio for normal text and 3:1 for large text and graphical UI controls across both light and dark themes.
4. **5-State Completeness:** Every interactive component must handle 5 states: `Default`, `Hover`, `Active/Pressed` (via `.brutal-press`), `Focus-Visible` (2px solid outline ring with 2px offset), and `Disabled` (`opacity: 0.5; cursor: not-allowed;`).
5. **Zero Secrets in Client Bundles:** Webhook URLs, bot tokens, service-role keys, and private API credentials must NEVER appear in client bundles (`src/components/**` or `src/scripts/**`). All privileged operations must route through SSR `/api/*` endpoints.
6. **Strict Client/Server Supabase Isolation:** Client scripts MUST ONLY import `getSupabaseBrowserClient()` from `src/lib/supabase.ts` (using `PUBLIC_SUPABASE_*` keys). `src/lib/supabaseServer.ts` uses `SUPABASE_SERVICE_ROLE_KEY` and is strictly reserved for `/api/*` server routes.
7. **Performance & 60fps Mobile Budget:** Animate `transform` and `opacity` ONLY. Wildcard `transition: all` is **strictly forbidden**. Maximum 1 active `backdrop-filter` per viewport.
8. **Astro Island Hydration Discipline:** Never default to `client:load`. Apply deliberate client directives:
   - `client:load`: Strictly for critical above-the-fold interactive UI (e.g. top navigation theme toggle).
   - `client:idle`: For secondary non-blocking tools below the fold (e.g. newsletter subscribe forms).
   - `client:visible`: For heavy interactive modules, reels, and overlays (e.g. fan wall, audio players, gig maps).
   - Dynamic `import()` / Browser-Only: For hardware-dependent Web Audio and AudioWorklet modules (`/metronome`, `/tuner`) that rely on browser globals (`AudioContext`, `MediaStream`, `navigator.mediaDevices`).
9. **View Transitions & Lifecycle Teardown Contract:** When navigation occurs via Astro transitions, standard window unmount events do not fire. All controllers must register lifecycle hooks with `astro:page-load` for setup and `astro:before-swap` (or route teardown) for resource cleanup.
10. **Strict Serverless Input Validation (Zod):** All `/api/*` endpoints must parse and validate `request.json()` and query parameters with Zod schemas before handling database queries or webhook dispatches.

---

## 2. Physical Repository Folder Structure

```
kins-official-website/
├── docs/                         # Architecture references & page maps
│   └── PAGE_FILE_MAP.md          # Exhaustive per-page file mapping
├── public/                       # Static public assets & AudioWorklets
│   ├── worklets/
│   │   └── click-worklet.js      # Sample-accurate metronome AudioWorklet processor
│   ├── tuner-worklet.js          # High-precision pitch detection AudioWorklet processor
│   ├── sw.js                     # Service Worker (PWA cache rules)
│   ├── manifest.json             # PWA web manifest
│   ├── robots.txt                # Crawler directives
│   └── sitemap.xml               # Canonical XML sitemap
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # Master HTML shell, fonts, theme detector, SW register
│   ├── middleware.ts             # SSR security headers & CSP Report-Only
│   ├── pages/                    # Astro routes & Serverless API endpoints
│   │   ├── index.astro           # Fan hub homepage
│   │   ├── live.astro            # Live concert streaming portal
│   │   ├── metronome.astro       # Metronome & musician coach
│   │   ├── tuner.astro           # Chromatic instrument tuner
│   │   ├── theory.astro          # Music theory cheat sheets
│   │   ├── epk.astro             # Electronic press kit (gated)
│   │   ├── 404.astro             # Brutalist 404 status page
│   │   └── api/                  # SSR Serverless API endpoints (Vercel Node 24)
│   │       ├── subscribe.ts, unsubscribe.ts, request-song.ts, feedback.ts
│   │       ├── fan-wall.ts, fan-upload.ts, live-tips.ts, tip-shoutout.ts
│   │       ├── vote.ts, checkin.ts, song-bpm.ts, kofi-webhook.ts, substack-webhook.ts
│   ├── components/               # Astro UI component templates
│   │   ├── navigation/           # TopNav.astro, SiteFooter.astro
│   │   ├── sections/             # HeroBanner, ProfileSection, TabbedLinks, MerchSection, etc.
│   │   ├── live/                 # MasterStreamPlayer, FanCamsReel, LiveFanWall, LiveChatReactions, etc.
│   │   ├── metronome/            # Metronome-specific subcomponents & modals
│   │   ├── epk/                  # EPK sections (bio, members, repertoire, tech specs)
│   │   ├── modals/               # ShareModal, GigMapSheet, CoversSearchOverlay, FeedbackModal, etc.
│   │   └── ui/                   # ToastContainer, AudioPlayer, ToolIcon
│   ├── lib/                      # Pure backend & SSR utilities (Zero secrets to client)
│   │   ├── discord.ts            # Discord webhook embed formatting & dispatch
│   │   ├── rateLimit.ts          # In-memory IP token-bucket rate limiter
│   │   ├── sanitize.ts           # Text sanitization & Discord @everyone neutralizer
│   │   ├── supabase.ts           # BROWSER client (PUBLIC_* env only)
│   │   └── supabaseServer.ts     # SERVICE-ROLE SSR client (API routes ONLY)
│   ├── scripts/                  # Client-side JavaScript (Vanilla ES modules)
│   │   ├── controllers/          # Modular controllers (audioPlayer, gigMap, liveChat, toast, etc.)
│   │   │   ├── metronome/        # Metronome engine (audioEngine, coachEngine, metroState, midi, uiBindings)
│   │   │   └── tuner/            # Tuner engine (audioEngine, pitchDetector, safetyMonitor, tunerState)
│   │   └── utils/                # Client utilities (emailValidator.js, safeStorage.js)
│   ├── settings/                 # SINGLE SOURCE OF TRUTH configuration files
│   │   ├── site.config.ts, hero.config.ts, links.config.ts, members.config.ts
│   │   ├── gigs.config.ts, rehearsal.config.ts, live.config.ts, theme.config.ts
│   │   └── index.ts              # Central re-exporter for all config modules
│   └── styles/                   # Plain CSS styling architecture (No Tailwind, No Sass)
│       ├── tokens/
│       │   ├── variables.css     # Semantic design tokens (:root & [data-theme="dark"])
│       │   └── animations.css    # Keyframe definitions & timing curve tokens
│       ├── base/
│       │   ├── reset.css         # Modern reset
│       │   └── layout.css        # Responsive base containers & scroll clipping
│       └── global.css            # Site-wide rules, runtime DOM classes, animation gating
└── e2e/                          # Playwright test suite
    └── tier1-smoke/              # home.spec.ts, metronome.spec.ts, tuner.spec.ts
```

---

## 3. Information Architecture & Site Map

```
/ (Root — Kins Official Web Platform)
├── / (Fan Hub & Link-in-Bio Homepage)
│   ├── HeroBanner (Live badge, headline & brand deck)
│   ├── ProfileSection (Follower counter & verified band badge)
│   ├── HeroFeatureCard (Next Gig Countdown / Live Stream / Latest Release)
│   ├── TabbedLinks (Music, Gigs, Rehearsal, Community, Socials)
│   ├── MembersSection & KinsCrewSpotlight (Band profiles & crew credits)
│   ├── MerchSection & InspirationVault (Audio Player & vinyl track preview)
│   ├── KinsToolsSection (Quick Launcher: Metronome, Tuner, Theory)
│   ├── SubscribeSection (Google One Tap & Email newsletter signup)
│   └── Modal Host Container (Share, GigMap, Covers Search, Feedback)
├── /live (Concert Live Streaming Portal)
│   ├── MasterStreamPlayer (HLS / YouTube / Twitch live stream player)
│   ├── FanCamsReel & LiveFanWall (Direct fan uploads & live comments)
│   ├── LiveChatReactions & LiveSetlistStage (Real-time song tracklist)
│   └── LiveTipJarModal & TipShoutout (Ko-fi & direct live tipping)
├── /metronome (Sample-Accurate Metronome & Musician Coach)
│   ├── AudioWorklet Clock Scheduler (`public/worklets/click-worklet.js`)
│   ├── Tactile Tempo Dial, Stepper, Tap Tempo & Polyrhythm Subdivisions
│   ├── Coach Engine (Speed trainer & bar-mute practice routines)
│   ├── Sheet Music Viewer & PDF Bar Scanner (IndexedDB sheet store)
│   └── Web MIDI Pedal / Footswitch Integration
├── /tuner (High-Precision Chromatic Instrument Tuner)
│   ├── AudioWorklet Pitch Engine (`public/tuner-worklet.js`)
│   ├── Autocorrelation & YIN Pitch Detection Algorithm
│   ├── Dynamic Needle Meter, Strobe Visualizer & Headstock Peg Art
│   └── String Tension & Breakage Safety Monitor
├── /theory (Music Theory Cheat Sheets & Instrument Tools)
│   ├── Guitar Fretboard Diagrams, Scales & CAGED System Matrix
│   └── Drum Groove, Rudiment Notation & Tempo Guide Sheets
├── /epk (Electronic Press Kit — Gated / On-Demand)
│   └── Press Bio, High-Res Media Deck, Tech Specs, Repertoire & Booking Matrix
├── /404 (Neo-Brutalist Not-Found Status Page)
└── /api/* (Serverless Endpoints — Vercel Node 24 SSR)
    ├── /api/subscribe & /api/unsubscribe (Newsletter & Google One Tap)
    ├── /api/fan-wall & /api/fan-upload (Fan photos, uploads & moderations)
    ├── /api/request-song & /api/vote (Song requests & live setlist voting)
    ├── /api/live-tips & /api/tip-shoutout (Live stream tip feed & alerts)
    ├── /api/kofi-webhook & /api/substack-webhook (External payment/sync webhooks)
    ├── /api/song-bpm (iTunes / MusicBrainz BPM metadata query proxy)
    └── /api/feedback & /api/checkin (Feedback proxy & gig attendance check-ins)
```

### Layout Hierarchy & Shell Constraints

* **Header / TopNav (`TopNav.astro` / `LiveNav.astro`):** Fixed/sticky top bar with 56px–64px height; persistent brand logo, theme switcher, quick-subscribe trigger, and navigation menu.
* **Content Container (`.site-container` / `.app-wrapper`):** Fluid responsive layout with boundary capping at `max-w-7xl` (1280px) and standard horizontal padding (`16px` mobile, `24px` tablet, `32px` desktop).
* **Protected Horizontal Scroll Containers (`.artist-filter-scroll-container`, `.fan-cams-reel-container`, `.fan-wall-filter-bar`):** Isolated horizontal scroll regions with hidden scrollbars, `-webkit-overflow-scrolling: touch`, and strict boundary clipping.
* **Modal & Overlay Host (`ShareModal`, `GigMapSheet`, `CoversSearchOverlay`, `LiveUploadModal`):** Bottom-sheet drawer on viewports `< 768px`; centered modal dialog with hard offset brutalist shadow on viewports `≥ 768px`.

---

## 4. Design Tokens & Theme Matrix (Semantic Role-Based)

### 4.1 Surface & Container Tokens

| Semantic Token Name | Light Mode Value | Dark Mode Value | Semantic Role Application |
| :--- | :--- | :--- | :--- |
| `--surface-canvas` | `#141416` (Deep Charcoal) | `#0e0e12` (True Dark Surface) | Page root background |
| `--surface-base` | `#1c1c20` (Card Base) | `#15151a` (Layer 1 Surface) | Navigation bars, main containers |
| `--surface-elevated` | `#24242a` (Elevated) | `#1e1e24` (Layer 2 Surface) | Dropdowns, search inputs, pills |
| `--surface-card` | `#18181c` | `#141418` | Standard dark neo-brutalist cards |
| `--surface-card-panel` | `#f5f4ef` (Warm Chalk) | `#1c1c22` (Dark Card Panel) | High-contrast light card panels |
| `--surface-card-panel-hover` | `#ffffff` (Pure White) | `#26262e` | Hovered card panel surface |
| `--surface-tape` | `rgba(245, 245, 240, 0.95)` | `rgba(38, 38, 46, 0.95)` | Skewed tape overlay badges |
| `--surface-input` | `#ffffff` | `#141418` | Form field background |
| `--surface-input-border` | `#000000` | `#33333f` | Form field outline border |
| `--surface-overlay` | `rgba(0, 0, 0, 0.75)` | `rgba(0, 0, 0, 0.85)` | Modal backdrop & sheet masks |

### 4.2 Typography & Text Tokens

| Semantic Token Name | Light Mode Value | Dark Mode Value | Semantic Role & Typography Specs |
| :--- | :--- | :--- | :--- |
| `--text-on-dark` | `#f5f5f7` | `#f5f5f7` | Primary text on dark surfaces |
| `--text-on-light` | `#0a0a0c` | `#f4f4f6` | Primary high-contrast text on card panels |
| `--text-muted` | `#8e8e93` | `#a1a1aa` | Captions, subtitles & helper hints |
| `--text-card-primary` | `#000000` | `#f4f4f6` | Main title text inside card panels |
| `--text-card-secondary` | `#4b4b4b` | `#a1a1aa` | Secondary body text inside card panels |
| `--font-display` | `'Cinzel', 'Syne', Georgia, serif` | Display titles (700 Bold, 28–44px) |
| `--font-heading` | `'Syne', 'Outfit', sans-serif` | Brutalist headers H1–H4 (600/700, 18–32px) |
| `--font-primary` | `'Space Grotesk', 'Outfit', sans-serif` | UI labels & body text (400/500, 14–16px) |
| `--font-mono` | `ui-monospace, monospace` | BPM, pitch cents & technical readout |

### 4.3 Interactive, Brand & State Tokens

| Semantic Token Name | Light Mode Value | Dark Mode Value | Semantic Role & Usage Context |
| :--- | :--- | :--- | :--- |
| `--btn-brand-primary` | `#f2fd43` (Electric Neon) | `#d4af37` (Muted Warm Gold) | Primary CTA buttons & active badges |
| `--btn-brand-hover` | `#faff60` | `#e5c07b` | Hovered primary CTA state |
| `--btn-brand-text` | `#000000` | `#000000` | Text color on primary brand CTA buttons |
| `--brand-accent-primary` | `#f2fd43` (Electric Neon) | `#d4af37` (Muted Warm Gold) | Active icons, status highlights, glow |
| `--brand-accent-glow` | `rgba(242, 253, 67, 0.35)` | `rgba(212, 175, 55, 0.22)` | Focus rings & active card glows |
| `--status-danger` | `#ef4444` (Crimson Red) | `#ef4444` (Crimson Red) | Live stream dots & destructive actions |
| `--drop-target-bg` | `rgba(242, 253, 67, 0.18)` | `rgba(212, 175, 55, 0.18)` | Drag-and-drop placeholder slots |

> [!NOTE]
> **Token Migration Aliases:** For backward compatibility, legacy tokens are mapped to semantic role tokens in CSS: `--btn-green` $\to$ `var(--btn-brand-primary)`, `--accent-neon-yellow` $\to$ `var(--brand-accent-primary)`, `--text-dark` $\to$ `var(--text-on-light)`, and `--text-white` $\to$ `var(--text-on-dark)`. All new code must strictly use the semantic tokens.

### 4.4 Audio Visualizer & Level Palette (Metronome / Tuner)

| Token Name | Hex Value | RGBA Fill / Glow | Visual / Audio Meaning |
| :--- | :--- | :--- | :--- |
| `--level-low` | `#FF9F1C` (Deep Amber) | `rgba(255, 159, 28, 0.16)` | Sub / Bass frequency & Beat Subdivisions |
| `--level-mid` | `#2EC4B6` (Vivid Teal) | `rgba(46, 196, 182, 0.16)` | Body / Primary tones & Standard Accents |
| `--level-high` | `#53FC18` (Neon Green) | `rgba(83, 252, 24, 0.16)` | In-Tune / Perfect Pitch & Downbeat Claps |
| `--beat-muted-border` | `#9A9688` (Greige Dashed) | `rgba(82, 82, 80, 0.38)` | Rest / Muted Beat Indicator (desaturated) |

### 4.5 Brutalist Borders, Radii & Shadows

| Token Name | Value (Light Mode) | Value (Dark Mode) | Usage Context |
| :--- | :--- | :--- | :--- |
| `--border-brutal` | `3px solid #000000` | `3px solid #000000` | Standard neo-brutalist card & button border |
| `--border-brutal-sm` | `2px solid #000000` | `2px solid #000000` | Subtle inputs, tags & sub-buttons |
| `--border-brutal-lg` | `4px solid #000000` | `4px solid #000000` | Hero feature cards & master stream frame |
| `--radius-sm` / `--radius-md`| `6px` / `10px` | `6px` / `10px` | Tactile rounded corners |
| `--radius-pill` | `9999px` | `9999px` | Badges, filter chips & pill buttons |
| `--shadow-brutal-black` | `3px 3px 0px #000000` | `3px 3px 0px #000000` | Default button & card offset shadow |
| `--shadow-brutal-black-lg`| `4px 4px 0px #000000` | `4px 4px 0px #000000` | Elevated cards & active modal dialogs |
| `--shadow-brutal-yellow` | `3px 3px 0px #f2fd43` | `3px 3px 0px #000000` | Neon glowing card accents (Light theme) |

---

## 5. UI Component Specifications

### 5.1 Button Hierarchy

* **Primary Neo-Brutalist Action (`.green-link-btn` / `.btn-primary`):**
  * Background: `var(--btn-brand-primary)` (Hover: `var(--btn-brand-hover)`)
  * Text: `var(--btn-brand-text)` (`#000000`), Font: `var(--font-heading)`, Weight: `700`
  * Border: `var(--border-brutal)` (`3px solid #000000`)
  * Shadow: `var(--shadow-brutal-black)` (`3px 3px 0px #000000`)
  * Tactile Micro-Press: `.brutal-press` (`active: translate(2px, 2px) scale(0.985)`, `box-shadow: 1px 1px 0px #000000`)
* **Secondary Card Action (`.card-action-btn`):**
  * Background: `var(--surface-card-panel)` (Hover: `var(--surface-card-panel-hover)`)
  * Text: `var(--text-card-primary)`
  * Border: `var(--border-brutal-sm)` (`2px solid #000000`)
  * Hover: Translate `-2px, -2px`, shadow `4px 4px 0px #000000`
* **Destructive Action:**
  * Background: `var(--status-danger)` (`#ef4444`)
  * Text: `#FFFFFF`, Border: `var(--border-brutal-sm)`
* **Focus State (All Interactive Elements):** `outline: 2px solid var(--brand-accent-primary); outline-offset: 2px;`

### 5.2 Form Fields & Inputs

* **Container:** Height `44px` (Desktop & Mobile touch target standard), Padding `0 14px`.
* **Surfaces:** Background `var(--surface-input)`, Border `var(--border-brutal-sm)` or `1px solid var(--surface-input-border)`.
* **Radius:** `var(--radius-sm)` (`6px`).
* **Interactive States:**
  * *Hover:* Border color changes to `#000000` with subtle shadow lift.
  * *Focus:* Outline `2px solid var(--brand-accent-primary)`, background `var(--surface-input)`.
  * *Error:* Border `var(--status-danger)`, helper caption in red text.
  * *Disabled:* Opacity `0.5`, cursor `not-allowed`.

### 5.3 Container / Card Blueprint

```html
<article class="brutal-card brutal-press" data-anim-gated>
  <!-- Skewed Tape Accent / Status Badge -->
  <div class="tape-badge">LIVE REHEARSAL</div>
  
  <header class="card-header">
    <h3 class="card-title">Next Single Premiere</h3>
    <p class="card-subtitle">Broadcast direct from Kins Studio</p>
  </header>
  
  <div class="card-body">
    <!-- Main content slot -->
  </div>
  
  <footer class="card-footer">
    <button class="green-link-btn brutal-press">
      <span>Join Stream</span>
      <i class="btn-arrow-slide" aria-hidden="true">→</i>
    </button>
  </footer>
</article>
```

**Card Specs:**
* Background: `var(--surface-card)` or `var(--surface-card-panel)`
* Border: `var(--border-brutal)` (`3px solid #000000`)
* Corner Radius: `var(--radius-md)` (`10px`)
* Shadow: `var(--shadow-brutal-black)` (`3px 3px 0px #000000`)
* Padding: `16px` (Mobile) / `24px` (Desktop)

### 5.4 Modal & Drawer Overlays

* **Backdrop:** `var(--surface-overlay)` with explicit opacity transition (Maximum 1 `backdrop-filter` layer).
* **Dialog Container:** Solid background `var(--surface-base)`, `3px solid #000000` border, `4px 4px 0px #000000` drop shadow.
* **Dismiss Pattern:** Close button in top-right (`.brutal-press`), ESC key listener, and outside-click dismissal.

---

## 6. Astro Hydration & Lifecycle State Management

### 6.1 Astro Island Client Hydration Matrix

| UI Component / Section | Directive Strategy | Rationale & Execution |
| :--- | :--- | :--- |
| `TopNav.astro` (Theme switcher, nav menu) | `client:load` | Critical above-the-fold interactive element; must respond immediately. |
| `HeroBanner.astro` / `HeroFeatureCard.astro` | `client:load` | Essential gig countdown & live status banner. |
| `SubscribeSection.astro` (Newsletter & One Tap) | `client:idle` | Hydrates during browser idle time; eliminates Total Blocking Time. |
| `KinsCrewSpotlight.astro` | `client:idle` | Secondary interactive credits and clipboard triggers. |
| `InspirationVault.astro` / `AudioPlayer.astro` | `client:visible` | Heavy audio chunk; loads only when scrolled into the viewport. |
| `LiveFanWall.astro` / `FanCamsReel.astro` | `client:visible` | Photo grid and live comment wall; defer until visible. |
| `GigMapSheet.astro`, `ShareModal.astro` | `client:visible` | Dynamic `import()` on user trigger or when modal opens. |
| `/metronome` & `/tuner` Hardware Engines | Dynamic `import()` (Browser-Only) | Hardware audio controllers depend on `AudioContext` and `MediaStream`; must NEVER evaluate in SSR. |

### 6.2 View Transitions & Audio Lifecycle Teardown Contract

When navigating between routes via Astro Client Transitions (`<ClientRouter />`), controllers must bind to `astro:page-load` and `astro:before-swap` to prevent memory leaks, unreleased microphone streams, and orphaned Web Audio scheduler clocks:

```javascript
// Lifecycle Registration Pattern for Controllers
let activeStream = null;
let activeAudioContext = null;
let animationFrameId = null;
let asyncGenerationCounter = 0;

export function initController() {
  // Teardown any existing instances before initializing
  teardownController();
  
  asyncGenerationCounter++;
  const currentGen = asyncGenerationCounter;

  // Initialize event listeners and audio worklets...
}

export function teardownController() {
  // 1. Invalidate pending async calls
  asyncGenerationCounter++;

  // 2. Cleanly release hardware microphone streams
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }

  // 3. Suspend / close Web Audio contexts
  if (activeAudioContext && activeAudioContext.state !== 'closed') {
    activeAudioContext.close().catch(() => {});
    activeAudioContext = null;
  }

  // 4. Cancel active requestAnimationFrame loops
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // 5. Clear interval and timeout clocks
  // (Clear all active timers registered in state)
}

// Bind to Astro lifecycle events
document.addEventListener('astro:page-load', initController);
document.addEventListener('astro:before-swap', teardownController);
```

---

## 7. UX & Micro-Interaction Guidelines

### 7.1 Responsive Breakpoints & Shell Constraints

* **`sm` (640px):** Single-column stacked layouts; modals convert to full-width bottom action sheets.
* **`md` (768px):** Navigation transitions to expanded top bar; multi-column link grids activate.
* **`lg` (1024px):** Live stage dual-panel layout (Stream + Live Chat / Fan Wall split view).
* **`xl` (1280px):** Max container boundary capping (`.site-container` reaches 1280px).

### 7.2 Motion & Animation Principles

* **Tactile Spring Press:** `160ms cubic-bezier(0.2, 0.8, 0.2, 1)` (`--ease-tactile`) applied to `.brutal-press`.
* **Snappy UI Feedback:** `160ms cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-snappy`) for dialog appearances and tab switches.
* **Spring Transitions:** `200ms cubic-bezier(0.175, 0.885, 0.32, 1.15)` (`--ease-spring`) for hover arrow slides (`.btn-arrow-slide`).
* **Explicit Transitions Only:** Wildcard `transition: all` is **strictly prohibited**. Enumerate exact properties:
  ```css
  transition: transform 0.16s var(--ease-tactile), background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
  ```
* **Reduced Motion:** When `@media (prefers-reduced-motion: reduce)` is active, all animations and transforms are collapsed to `0ms` duration.

### 7.3 Web Audio & AudioWorklet Guidelines

1. **User Gesture Unlock:** Browsers suspend `AudioContext` until the first explicit user interaction (click/touch). All audio controllers must check `audioContext.state === 'suspended'` and execute `await audioContext.resume()` inside the user gesture handler before scheduling notes.
2. **Sample-Accurate Timing:** Never use `setInterval` or `setTimeout` for musical beats or metronome clicks. Use `AudioContext.currentTime` scheduling or dedicated AudioWorklets (`public/worklets/click-worklet.js`, `public/tuner-worklet.js`).
3. **Hardware Stream Cleanup:** When stopping the chromatic tuner or tearing down audio input, always iterate over all microphone tracks and stop them (`stream.getTracks().forEach(t => t.stop())`) and close/suspend the `AudioContext`.

### 7.4 Off-Screen Animation Gating

* Wrap infinite CSS animations (e.g. vinyl spin, equalizer bars) inside `[data-anim-gated]` containers.
* The IntersectionObserver in `index.astro` / `live.astro` toggles `.offscreen` to apply `animation-play-state: paused` when elements leave the viewport.

### 7.5 Empty, Loading, and Error States

* **Loading:** Use shimmer skeleton blocks mirroring the target layout footprint; never display raw blocking spinners.
* **Empty State:** Centered container with brutalist icon badge, `--font-heading` title, `--text-muted` helper text, and a primary CTA.
* **Error States & Toasts:** Dispatch actionable user feedback via `showToast('Error message', 'error')`.

---

## 8. Serverless API Standards & Zod Validation

All `/api/*` endpoints run as serverless functions on Vercel Node 24. Every endpoint must strictly enforce rate limiting, Zod schema validation, text sanitization, and structured JSON responses.

### 8.1 Zod Request Validation Blueprint

```typescript
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { getClientIp, isRateLimited } from '../../lib/rateLimit';
import { sanitizeText } from '../../lib/sanitize';

export const prerender = false;

// 1. Strict Zod Schema Definition
const FeedbackRequestSchema = z.object({
  feedback: z.object({
    type: z.string().max(50).default('Improvement / Idea'),
    category: z.string().max(60).default('General Site'),
    details: z.string().min(1, 'Details required').max(2000),
    contact: z.string().max(200).optional(),
  }).optional(),
  feedbackType: z.string().max(50).optional(),
  category: z.string().max(60).optional(),
  details: z.string().max(2000).optional(),
  contact: z.string().max(200).optional(),
  viewportWithDpr: z.string().max(80).optional(),
  environment: z.string().max(120).optional(),
  url: z.string().max(300).optional(),
  screenshotDataUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/)
    .max(3_000_000)
    .nullable()
    .optional(),
});

function jsonError(message: string, status: number, details?: unknown): Response {
  return new Response(JSON.stringify({ status: 'error', message, details }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // 2. Token Bucket Rate Limiting
    const ip = getClientIp(request);
    if (isRateLimited(`feedback:${ip}`, 5, 60 * 1000)) {
      return jsonError('Too many requests. Please try again in a minute.', 429);
    }

    // 3. Safe Request Parsing & Zod Validation
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return jsonError('Invalid JSON payload.', 400);
    }

    const parseResult = FeedbackRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return jsonError('Validation failed.', 400, parseResult.error.format());
    }

    const data = parseResult.data;

    // 4. Text Sanitization (prevents markdown injection & Discord @everyone pings)
    const userDetails = sanitizeText(
      data.feedback?.details || data.details || '',
      2000
    );

    if (!userDetails) {
      return jsonError('Please provide feedback details.', 400);
    }

    // 5. Privileged SSR Execution (Database or Webhook dispatch)...

    return new Response(
      JSON.stringify({ status: 'success', message: 'Feedback submitted successfully.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[API Error]:', err);
    return jsonError('Internal server error.', 500);
  }
};
```

### 8.2 Security & Server Isolation Standards

1. **Zero Secrets in Client Bundles:** Never expose Discord webhook URLs, Supabase service-role keys, or private bot tokens to the client.
2. **Serverless API Rate Limiting:** All `/api/*` endpoints enforce rate limiting via `isRateLimited(ip, endpoint)` from `src/lib/rateLimit.ts`.
3. **Payload Sanitization:** All text stored in the database or dispatched to Discord must be sanitized using `sanitizeText()` from `src/lib/sanitize.ts` to prevent markdown injection and `@everyone` / `@here` pings.
4. **Service Worker Rules (`public/sw.js`):** Service worker must NEVER cache `/api/*` requests.

---

## 9. Code Style & Token Implementation (CSS Custom Properties)

```css
/* ==========================================================================
   Kins Official — Neo-Brutalist Semantic Visual System Tokens
   ========================================================================== */

:root {
  /* Surfaces & System Containers */
  --md-sys-color-primary: #f2fd43;
  --md-sys-color-on-primary: #000000;
  --md-sys-color-surface: #141416;
  --md-sys-color-surface-container: #1c1c20;
  --md-sys-color-surface-container-high: #24242a;
  --surface-canvas: #141416;
  --surface-base: #1c1c20;
  --surface-elevated: #24242a;
  --surface-card: #18181c;
  --surface-card-panel: #f5f4ef;
  --surface-card-panel-hover: #ffffff;
  --surface-tape: rgba(245, 245, 240, 0.95);
  --surface-input: #ffffff;
  --surface-input-border: #000000;
  --surface-overlay: rgba(0, 0, 0, 0.75);

  /* Typography & Semantic Text */
  --text-on-dark: #f5f5f7;
  --text-on-light: #0a0a0c;
  --text-muted: #8e8e93;
  --text-card-primary: #000000;
  --text-card-secondary: #4b4b4b;

  /* Interactive & Brand CTAs */
  --btn-brand-primary: #f2fd43;
  --btn-brand-hover: #faff60;
  --btn-brand-shadow: 3px 3px 0px #000000;
  --btn-brand-text: #000000;
  --brand-accent-primary: #f2fd43;
  --brand-accent-glow: rgba(242, 253, 67, 0.35);
  --status-danger: #ef4444;
  --drop-target-bg: rgba(242, 253, 67, 0.18);

  /* Backward Compatibility Aliases */
  --btn-green: var(--btn-brand-primary);
  --btn-green-hover: var(--btn-brand-hover);
  --btn-text-color: var(--btn-brand-text);
  --accent-neon-yellow: var(--brand-accent-primary);
  --accent-neon-yellow-glow: var(--brand-accent-glow);
  --text-dark: var(--text-on-light);
  --text-white: var(--text-on-dark);
  --surface-card-light: var(--surface-card-panel);
  --surface-card-light-hover: var(--surface-card-panel-hover);

  /* Audio Level Palette */
  --level-low: #FF9F1C;
  --level-low-bg: rgba(255, 159, 28, 0.16);
  --level-low-border: rgba(255, 159, 28, 0.75);
  --level-mid: #2EC4B6;
  --level-mid-bg: rgba(46, 196, 182, 0.16);
  --level-mid-border: rgba(46, 196, 182, 0.75);
  --level-high: #53FC18;
  --level-high-bg: rgba(83, 252, 24, 0.16);
  --level-high-border: rgba(83, 252, 24, 0.75);

  /* Muted / Rest Beat */
  --beat-muted-bg: rgba(82, 82, 80, 0.38);
  --beat-muted-border: #9A9688;
  --beat-muted-opacity: 0.78;

  /* Brutalist Borders & Shadows */
  --border-brutal: 3px solid #000000;
  --border-brutal-sm: 2px solid #000000;
  --border-brutal-lg: 4px solid #000000;
  --radius-xs: 3px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-pill: 9999px;
  --shadow-brutal-black: 3px 3px 0px #000000;
  --shadow-brutal-black-lg: 4px 4px 0px #000000;
  --shadow-brutal-yellow: 3px 3px 0px #f2fd43;

  /* Typography */
  --font-display: 'Cinzel', 'Syne', Georgia, serif;
  --font-heading: 'Syne', 'Outfit', -apple-system, sans-serif;
  --font-primary: 'Space Grotesk', 'Outfit', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Motion Curves */
  --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.15);
  --ease-tactile: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Dark Theme Overrides — Anti-Fatigue Muted Warm Gold */
:root[data-theme="dark"],
html[data-theme="dark"],
body[data-theme="dark"],
[data-theme="dark"] {
  --md-sys-color-primary: #d4af37;
  --md-sys-color-surface: #0e0e12;
  --md-sys-color-surface-container: #15151a;
  --md-sys-color-surface-container-high: #1e1e24;
  --surface-canvas: #0e0e12;
  --surface-base: #15151a;
  --surface-elevated: #1e1e24;
  --surface-card: #141418;
  --surface-card-panel: #1c1c22;
  --surface-card-panel-hover: #26262e;
  --surface-tape: rgba(38, 38, 46, 0.95);
  --surface-input: #141418;
  --surface-input-border: #33333f;
  --surface-overlay: rgba(0, 0, 0, 0.85);

  --text-on-dark: #f5f5f7;
  --text-on-light: #f4f4f6;
  --text-card-primary: #f4f4f6;
  --text-card-secondary: #a1a1aa;
  --text-muted: #a1a1aa;

  --btn-brand-primary: #d4af37;
  --btn-brand-hover: #e5c07b;
  --brand-accent-primary: #d4af37;
  --brand-accent-glow: rgba(212, 175, 55, 0.22);
  --drop-target-bg: rgba(212, 175, 55, 0.18);
  --shadow-brutal-yellow: 3px 3px 0px #000000;
}
```

---

## 10. Verification Checklist for Agents

Before completing any task, execute this full verification suite:

```powershell
# 1. Full Production Build (must exit 0)
npm.cmd run build

# 2. Security Audit: Static Webhook & Secret Scan (must return 0 hits)
rg "discord(app)?\.com/api/webhooks" .vercel/output/static

# 3. CSS Performance Audit: Transition All (must not introduce new 'transition: all')
rg "transition:\s*all" src

# 4. Storage Safety Audit: Bare localStorage/sessionStorage calls (must use safeStorage/try-catch)
rg "(?<!safe)(Storage\.)?(get|set|remove)Item" src/scripts

# 5. Playwright Smoke Suite
npx.cmd playwright test e2e/tier1-smoke
```

### Manual & Architectural Verification Items
- [ ] **No Hardcoded Raw Colors:** All colors reference semantic tokens (`var(--token)`).
- [ ] **Theme Parity Check:** Toggling `data-theme="dark"` and `data-theme="light"` maintains high contrast and readability across all components.
- [ ] **5-State Completeness:** All buttons and interactive cards implement default, hover, active (`.brutal-press`), focus-visible, and disabled states.
- [ ] **Audio Safety & Hardware Release:** AudioContext unlocks only upon user interaction, and microphone streams stop immediately upon unmounting / `astro:before-swap`.
- [ ] **Single Source of Truth:** All dates, links, members, and gig schedules reside in `src/settings/*.config.ts`.
- [ ] **Zod Schema Validation:** All new or updated `/api/*` endpoints validate request bodies with Zod.

---

## 11. Known Deferred Items & Backlog

- `KINS_COVERS_DATA = []` in `src/settings/rehearsal.config.ts`: Covers catalog data pending band submission.
- EPK asset download deck generates placeholder files pending finalized high-res media package.
- CSP in `src/middleware.ts` runs in `Content-Security-Policy-Report-Only` mode pending inline script nonce migration.
- In-memory rate limits (`src/lib/rateLimit.ts`) are per serverless instance; migrate to Upstash / Redis if distributed abuse occurs.
