# AGENTS.md — Master Context & Engineering Standards

Read this fully before modifying anything in this codebase. It encodes hard lessons from real production bugs, security leaks, Web Audio quirks, and mobile performance regressions. Follow these rules strictly; when a rule conflicts with legacy code, the rule wins — legacy code is actively being migrated toward these standards.

---

## 1. What This Project Is

Official band website and direct-to-fan platform for **Kins Band** (`https://kinsband-hub.vercel.app`).

The site combines a high-performance link-in-bio fan hub, live stream concert portal, interactive musician utility suite (standalone metronome & chromatic tuner), electronic press kit, and serverless fan-capture APIs.

| Layer | Tech & Details |
|---|---|
| **Framework** | **Astro 4**, `output: 'hybrid'` (pre-rendered static pages + on-demand serverless endpoints), zero UI framework overhead |
| **Hosting & Runtime** | **Vercel** serverless (`@astrojs/vercel`), Node 24 |
| **Pages & Routes** | `/` (Fan hub), `/live` (Live stream portal), `/metronome` (Metronome & coach), `/tuner` (Chromatic tuner), `/epk` (Press kit, gated), `/404` |
| **Client JS** | Vanilla ES modules in `src/scripts/controllers/` (modular, zero-framework, dynamic `import()` for heavy chunks) |
| **Audio Engine** | Web Audio API + dedicated AudioWorklets (`public/worklets/click-worklet.js`, `public/tuner-worklet.js`) |
| **Server JS** | TypeScript strict (`astro/tsconfigs/strict`) for `src/lib/*` and `src/pages/api/*` |
| **Styling** | Plain CSS with neo-brutalist design tokens (`src/styles/tokens/variables.css`). No Tailwind, no Sass |
| **Data & Auth** | Supabase — browser client (`PUBLIC_*` keys) + physically separate service-role client for SSR |
| **Notifications** | Discord webhooks — **server-side proxies only** (see §3) |
| **Testing** | Playwright, tiered: `e2e/tier1-smoke/` (`home.spec.ts`, `metronome.spec.ts`, `tuner.spec.ts`) |

> **Navigation & Architecture Reference**: Consult `docs/PAGE_FILE_MAP.md` for the exact mapping of components, controllers, worklets, and APIs per page.

---

## 2. Codebase Layout

```
src/
  layouts/
    BaseLayout.astro              HTML shell, fonts/icons loading, theme & low-power detector, SW register
  middleware.ts                   Security headers (CSP Report-Only, HSTS, X-Frame-Options) on SSR
  pages/
    index.astro                   Fan hub homepage
    live.astro                    Live concert streaming hub
    metronome.astro               Standalone metronome, practice coach & sheet viewer
    tuner.astro                   Standalone chromatic instrument tuner
    epk.astro                     Electronic press kit (gated)
    404.astro                     Brutalist not-found page
    api/*.ts                      Serverless endpoints (subscribe, fan-wall, feedback, request-song, etc.)
  components/
    epk/                          EPK sections (hero, bio, members, repertoire, specs, contact)
    live/                         Live portal widgets (stream player, fan wall, chat reactions, setlist)
    metronome/                    Metronome-specific subcomponents & modals
    modals/                       Site-wide overlays (share, gig map, covers search, feedback, terms)
    navigation/                   Top navigation bar and menu
    sections/                     Homepage sections (hero, links, members, crew, merch, inspiration)
    ui/                           Shared UI primitives (ToastContainer, AudioPlayer, ToolIcon)
  lib/
    discord.ts                    Discord webhook formatting and role dispatch
    rateLimit.ts                  In-memory token bucket rate limiter & IP resolver
    sanitize.ts                   Text sanitization, Discord @mention neutralizer, URL validator
    supabase.ts                   BROWSER client (PUBLIC_* env only)
    supabaseServer.ts             SERVICE-ROLE client — server code ONLY, never import client-side
  scripts/
    controllers/
      metronome/                  Metronome engine (audioEngine, coachEngine, metroState, uiBindings, midi)
      tuner/                      Tuner engine (audioEngine, pitchDetector, safetyMonitor, tunerState)
      *.js                        Vanilla client controllers (audioPlayer, gigMap, liveChat, toast, etc.)
    utils/
      emailValidator.js           Email syntax and domain check
  settings/
    *.config.ts                   SINGLE SOURCE OF TRUTH for dates, gigs, links, members, features
    index.ts                      Re-exports all configuration modules
  styles/
    tokens/                       Design tokens (variables.css, animations.css)
    base/                         Base styles and responsive layout resets
    global.css                    Site-wide styles, runtime DOM classes, animation gating rules
public/
  sw.js                           Service worker (cache rules; keep CACHE_NAME in sync with shareModal.js)
  worklets/
    click-worklet.js              Sample-accurate metronome AudioWorklet processor
  tuner-worklet.js                High-precision pitch detection AudioWorklet processor
  manifest.json                   PWA web manifest
docs/
  PAGE_FILE_MAP.md                Exact file map for every page and API route
supabase_rls_hardening.sql        Supabase DB Row Level Security policies
```

---

## 3. Security Rules (Non-Negotiable)

1. **Zero Secrets in Client Bundles**:
   - Webhook URLs, bot tokens, service-role keys, and private API credentials must NEVER appear in `src/components/**` or `src/scripts/**`.
   - All Discord notifications, email dispatches, and privileged DB queries route through `/api/*` endpoints reading `import.meta.env.*` / `process.env.*`.
   - Always verify static build output before concluding tasks:
     ```powershell
     rg "discord(app)?\.com/api/webhooks" .vercel/output/static   # must be 0 hits
     ```
2. **Server / Browser Supabase Isolation**:
   - Client scripts MUST ONLY import `getSupabaseBrowserClient()` from `src/lib/supabase.ts` (using `PUBLIC_SUPABASE_*` keys).
   - `src/lib/supabaseServer.ts` uses the `SUPABASE_SERVICE_ROLE_KEY` and is strictly reserved for `src/pages/api/*`. Never import `supabaseServer.ts` into any file that Vite or Astro bundles for the browser.
3. **Never Trust the Client**:
   - Rate-limit every public API endpoint with `isRateLimited(ip, endpoint)` from `src/lib/rateLimit.ts`.
   - Sanitize all text sent to Discord or stored in Supabase with `sanitizeText()` (`src/lib/sanitize.ts`) to prevent markdown injection and `@everyone`/`@here` pings.
   - Validate URLs using `isValidHttpUrl()`.
   - Truncate payloads safely (Discord embed descriptions fail silently if >4096 characters).
   - Validate OAuth credentials server-side (e.g. Google One Tap via Google token info endpoint).
4. **Honest Responses & Error Handling**:
   - Do not return fake 200 HTTP status codes if an underlying database write or notification failed.
   - API endpoints must return descriptive error status codes (400, 429, 500) and client controllers must catch them and display actionable feedback via `showToast('Error message', 'error')`.
5. **Escape Dynamic HTML Interpolations**:
   - Always escape user or external data (e.g. iTunes search results, chat messages, fan wall comments) before injecting into HTML.
   - Use local `escapeHtml(str)` or prefer `element.textContent` over `element.innerHTML`.
6. **Service Worker Restrictions (`public/sw.js`)**:
   - `sw.js` must NEVER cache `/api/*` endpoints.
   - Only allow-listed static assets (`/_astro/`, fonts, static icons, SVG assets) belong in cache strategies.

---

## 4. Performance & Audio Architecture (Target: 60fps on Low-End Phones)

1. **Animation Rules**:
   - Animate `transform` and `opacity` ONLY. Avoid animating `width`, `height`, `left`, `top`, `margin`, `padding`, `box-shadow`, or `filter`.
   - Progress bars must use `transform: scaleX(...)` with `transform-origin: left`.
   - Sliders, vinyl needles, and gauges must use `transform: translateX(...)` or `transform: rotate(...)` calculated from cached dimensions.
2. **Backdrop-Filter Budget**:
   - Maximum **ONE** active blurred layer per screen.
   - NEVER place a `backdrop-filter` over playing `<video>` elements or as an always-on fixed header. Use solid background colors (e.g., alpha ≥ 0.95) instead.
3. **DOM & Layout Thrashing**:
   - Do not query the DOM or call `getBoundingClientRect()` inside `requestAnimationFrame`, scroll handlers, or audio tick loops.
   - Cache element references and bounding rects; invalidate only on window resize or view transitions.
4. **Event Listeners**:
   - Scroll, resize, and pointermove listeners must use `{ passive: true }` and coalesce work into `requestAnimationFrame`.
   - Input search listeners must debounce by at least 150ms.
5. **Web Audio & AudioWorklet Guidelines**:
   - **User Gesture Unlock**: Browsers suspend `AudioContext` until the first explicit user interaction (click/touch). All audio controllers must check `audioContext.state === 'suspended'` and call `await audioContext.resume()` inside the user gesture handler.
   - **Sample-Accurate Timing**: Never rely on `setInterval` or `setTimeout` for musical timing. Use `AudioContext.currentTime` scheduling or dedicated AudioWorklets (`click-worklet.js`).
   - **Hardware Stream Cleanup**: When stopping the chromatic tuner or unmounting its audio engine, always explicitly stop all tracks on the microphone `MediaStream` (`stream.getTracks().forEach(t => t.stop())`) and close or suspend the context.
6. **Motion & Low-Power Mode**:
   - Respect `prefers-reduced-motion` (kill-switch in `src/styles/global.css`).
   - Respect `html.low-power-mode` (automatically toggled by `BaseLayout.astro` when device memory ≤4GB, CPU cores ≤4, `saveData` is enabled, or network is 2G).
7. **Off-Screen Animation Gating**:
   - Infinite CSS animations belong inside `[data-anim-gated]` containers. The IntersectionObserver in `index.astro` toggles `.offscreen` to apply `animation-play-state: paused`.
   - Heavy below-the-fold sections must declare `content-visibility: auto; contain-intrinsic-size: ...`.
8. **Lazy Loading Discipline**:
   - Heavy, interaction-gated controllers (e.g., `ShareModal`, `GigMapSheet`, `AudioPlayer`, `CoversSearchOverlay`, `SubscribeSection`, `liveUploadController`) load via dynamic `import()` on demand or `requestIdleCallback`. Never revert them to eager static imports.

---

## 5. Correctness & State Patterns

1. **Single Source of Truth**:
   - All band dates, gig schedules, links, member profiles, cover songs, and feature flags MUST reside in `src/settings/*.config.ts` (re-exported via `src/settings/index.ts`). Never hardcode business data inline.
2. **Timezones & Date Parsing**:
   - Show dates and venue times are in Australia/Sydney (`Australia/Sydney`).
   - Naive `new Date('YYYY-MM-DDTHH:mm')` parses in the user's local browser timezone and breaks countdowns. Use the DST-aware helper `venueLocalTimeToMs` from `src/scripts/controllers/heroFeatureController.js`.
3. **Async Race Conditions**:
   - Audio toggles, media players, and modal transitions need generation counters captured before `await` and checked after (see `vinylStopGeneration` in `audioPlayer.js` or `metroState.js`).
4. **Resilient Local Storage**:
   - Safari in Private Mode or strict browser policies throw on `localStorage` access.
   - Wrap storage access in try/catch helpers (e.g. `storageGet`, `storageSet`, `storageRemove` / `safeStorage`).
5. **No Implicit Window Globals**:
   - Never reference DOM elements directly via global IDs (e.g. `window.myElement`). Always use `document.getElementById('myElement')` or `querySelector`.
6. **Runtime Dynamic DOM Styles**:
   - DOM elements created dynamically via JavaScript cannot use Astro component scoped `<style>` classes (they lack `data-astro-cid`). Place runtime styles in `src/styles/global.css`.

---

## 6. UI / Neo-Brutalist Design Tokens

1. **Design Tokens First (`src/styles/tokens/variables.css`)**:
   - **Colors**: `--accent-neon-yellow: #F2FD43`, `--btn-green: #53FC18`, `--bg-primary: #FAF8F5`, `--bg-surface: #FFFFFF`, `--text-primary: #0A0A0A`, `--border-color: #000000`.
   - **Typography**: `--font-heading: 'Syne', sans-serif`, `--font-display: 'Cinzel', serif`, `--font-secondary: 'Space Grotesk', monospace`.
   - **Borders & Shadows**: 2–3px solid `#000` borders, hard offset drop shadows (`3px 3px 0px #000` / `5px 5px 0px #000`).
2. **Explicit CSS Transitions**:
   - `transition: all` is **strictly banned** (causes heavy style recalcs and layout jumps).
   - Enumerate transition properties explicitly:
     ```css
     transition: transform 0.16s var(--ease-tactile), background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
     ```
3. **Tactile Micro-Interactions**:
   - Buttons and interactive cards should use the `.brutal-press` class: `active: translate(2px, 2px)` with reduced shadow.
   - Hover states: slight lift `translate(-2px, -2px)` with shadow expansion.

---

## 7. Workflow & Environment Notes

- **Windows Shell**: PowerShell restricts `.ps1` script execution. Always execute npm commands using `npm.cmd`:
  - Build: `npm.cmd run build`
  - Dev: `npm.cmd run dev`
  - Tests: `npx.cmd playwright test`
- **Verification Before Declaring Tasks Done**:
  - Run the checklist in §8.
  - Verify both sides of any interface contract (caller + callee, HTML ID ↔ JS controller, API schema ↔ request body).

---

## 8. Verification Checklist (Run Before Completion)

Run these checks to guarantee build correctness and security:

```powershell
# 1. Full Production Build (must exit 0)
npm.cmd run build

# 2. Security Audit: Static Webhook & Secret Scan (must return 0 hits)
rg "discord(app)?\.com/api/webhooks" .vercel/output/static

# 3. CSS Performance Audit: Transition All (must not introduce new 'transition: all')
rg "transition:\s*all" src

# 4. Storage Safety Audit: Bare localStorage/sessionStorage calls
rg "(?<!safe)(Storage\.)?(get|set|remove)Item" src/scripts

# 5. Playwright Smoke Suite (for UI / interactive changes)
npx.cmd playwright test e2e/tier1-smoke
```

---

## 9. Known Deferred Items & Backlog

- `KINS_COVERS_DATA = []` in `src/settings/rehearsal.config.ts`: Covers catalog data pending band submission.
- EPK asset download deck generates placeholder files pending finalized high-res media package.
- CSP in `src/middleware.ts` runs in `Content-Security-Policy-Report-Only` mode pending inline script nonce migration.
- In-memory rate limits (`src/lib/rateLimit.ts`) are per serverless instance; migrate to Upstash / Redis if distributed abuse occurs.
