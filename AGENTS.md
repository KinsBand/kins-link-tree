# AGENTS.md — Master Context for AI Assistants

Read this fully before changing anything. It encodes hard lessons from real bugs,
security leaks and perf regressions found in this codebase. Follow the rules;
when a rule conflicts with something you see in older code, the rule wins —
older code is being migrated toward these standards.

---

## 1. What this project is

Official band website ("link-in-bio" hub) for **Kins**: fan hub `/`, live stream hub `/live`, press kit `/epk`, plus serverless API routes. Live: `https://kinsband-hub.vercel.app`.

| Layer | Tech |
|---|---|
| Framework | **Astro 4**, `output: 'hybrid'` (static pages + server endpoints), zero UI framework |
| Hosting | **Vercel** serverless (`@astrojs/vercel`), Node 24 |
| Client JS | Vanilla ES modules in `src/scripts/controllers/` (~25 files). No hydration framework |
| Server JS | TypeScript strict (`astro/tsconfigs/strict`) for `src/lib/*` and `src/pages/api/*` |
| Styling | Plain CSS, design-token system (`src/styles/tokens/variables.css`). No Tailwind/Sass |
| Data/auth | Supabase — browser client (`PUBLIC_*` keys) + physically separate service-role module |
| Notifications | Discord webhooks — **server-side proxies only** (see §3) |
| Tests | Playwright, tiered: `e2e/tier1-smoke` … `tier4-integration` |

## 2. Where things live

```
src/
  layouts/BaseLayout.astro        head, fonts/icons loading, theme+low-power detector, SW registration
  middleware.ts                   security headers (incl. CSP Report-Only) on all SSR responses
  pages/api/*.ts                  subscribe, unsubscribe/substack-webhook, feedback, request-song,
                                  community-submission  ← ALL Discord traffic goes through here
  lib/supabase.ts                 BROWSER client (PUBLIC_* env only, lazy back-compat export)
  lib/supabaseServer.ts           SERVICE-ROLE client — server code ONLY, never import client-side
  lib/discord.ts                  bot role management (env-configured)
  lib/rateLimit.ts                per-IP limiter + getClientIp (reuse for new endpoints)
  lib/sanitize.ts                 sanitizeText (control chars, @mention neutralizing, caps),
                                  isValidHttpUrl  ← reuse for any user input reaching Discord
  scripts/controllers/*.js        vanilla client controllers
  settings/*.config.ts            SINGLE SOURCE OF TRUTH for content/dates/flags (re-exported via index.ts)
  styles/global.css               site-wide CSS incl. runtime-DOM styles + anim gating rules
public/sw.js                      service worker (CACHE_NAME must stay in sync with shareModal.js)
vercel.json                       static-asset headers/caching
supabase_rls_hardening.sql        DB policy migration (applied manually by owner)
```

## 3. Security rules (non-negotiable)

1. **No secrets in anything imported by client code.** Webhook URLs, tokens, API keys never appear in `src/components/**` or `src/scripts/controllers/**`. All Discord posts go through a `/api/*` route reading `import.meta.env.X || process.env.X`. Before finishing ANY task: build, then grep the output:
   ```
   rg "discord(app)?\.com/api/webhooks" .vercel/output/static   # must be 0 hits
   ```
2. **Server/browser Supabase split is load-bearing.** Client controllers import `getSupabaseBrowserClient()` from `lib/supabase.ts`. NEVER import `supabaseServer.ts` from anything under `src/scripts/` or `src/components/` — one static import ships the master key.
3. **Never trust the client.** Verify Google credentials server-side (see `verifyGoogleCredential` in `subscribe.ts`), sanitize every string entering a Discord payload (`sanitizeText`), validate URLs (`isValidHttpUrl`), rate-limit every public endpoint (`isRateLimited`), cap lengths (Discord embed description dies silently >4096 chars).
4. **Honest responses only.** If the DB write or delivery failed, the endpoint returns a non-200 and the client shows an error toast and keeps the form usable. Fake-success bugs existed here before; do not reintroduce them.
5. **Escape every dynamic interpolation into HTML.** Local `escapeHtml(str)` helper per controller is the established pattern (see `liveChatController.js`). For messages/status text prefer `textContent`. This includes external data (iTunes API fields were an XSS vector).
6. **`sw.js` never caches `/api/*`** (auth/session risk) and only allow-listed prefixes (`/_astro/`, icons). If you add cached origins, update the CDN_CACHE_RULES structure deliberately.

## 4. Performance rules (target: 60fps on LOW-end phones)

These exist because profiling found each one causing real jank:

1. **Animate `transform` and `opacity` only.** No `width`/`height`/`left`/`top`/`margin`/`box-shadow`/`filter` in keyframes or per-frame JS writes. Progress bars → `scaleX(origin left)`; sliders/needles → `translateX(px)` computed from a cached rect.
2. **Backdrop-filter budget: max ONE blurred layer visible per screen; never over a playing `<video>`; never as an always-on fixed layer.** Backgrounds ≥0.9 alpha don't need blur — use solid. Modal-scoped blurs are acceptable.
3. **No DOM queries inside animation loops.** Cache NodeLists/rects; invalidate caches on play/pause/state-class changes (see `getCachedVinylThumbs` + invalidation hooks in `audioPlayer.js`). Same for `getBoundingClientRect` in event handlers — reuse the resize-maintained cache.
4. **Listeners:** scroll/resize/pointermove → `{ passive: true }` + rAF coalescing. Search inputs → ~150 ms debounce. Non-passive `touchmove` (preventDefault) attaches ONLY while the gesture is active and detaches on end.
5. **Bounded DOM & timers:** cap growing lists (chat = last 100). Store interval IDs; guard against double-init; clear on expiry; skip ticks when `document.hidden`.
6. **Motion respect:** everything honors `prefers-reduced-motion` (global kill-switch in global.css) and `html.low-power-mode` (set by the detector in BaseLayout for ≤4 cores / ≤4 GB / saveData / slow 2G). Extend the detector instead of inventing per-feature opt-outs.
7. **Off-screen gating:** infinite CSS animations live inside `[data-anim-gated]` sections (IntersectionObserver in index.astro toggles `.offscreen` → `animation-play-state: paused`). Below-fold heavy sections use `content-visibility: auto`.
8. `will-change:` only for `transform`/`opacity`, only on things actually animating.
9. **JS payload discipline:** interaction-gated/heavy controllers load via idle-time dynamic `import()` (pattern in ShareModal/GigMapSheet/AudioPlayer/CoversSearchOverlay/SubscribeSection). Don't convert them back to static imports; don't add new eager heavyweight deps to page bundles (the 217 KB Supabase chunk loads post-LCP for a reason).

## 5. Correctness patterns (bugs that shipped here before)

- **Single source of truth:** dates/counters/flag values come from `src/settings/*.config.ts`. Never re-hardcode a value inline in a controller (a duplicated gig date froze the homepage countdown for months).
- **Timezones:** venue times are Australia/Sydney. Use the DST-aware conversion helper in `heroFeatureController.js` (`venueLocalTimeToMs`). Naive `new Date('YYYY-MM-DDTHH:mm')` parses viewer-local — wrong for everyone.
- **Async toggle races:** rapid play/pause-style toggles need a generation counter captured before an await and verified after (see `vinylStopGeneration` in `audioPlayer.js`). Any code path whose continuation calls pause()/stop() MUST be guarded.
- **Storage access throws** in private-mode/locked-down Safari. Wrap every `localStorage` call in try/catch helpers (`storageGet/Set/Remove` pattern).
- **No implicit globals:** `elementId` window named-access breaks under bundling/refactors — always `getElementById` (this bit us: `sheetDragHandle`).
- **Dead features get deleted or clearly gated.** Shipping stubs with empty datasets, undefined functions, or fake downloads ("coming soon" buttons wired to nothing, `.zip` files that are txt) is how this repo accumulated 5k lines of landmines. Check `functionality.config.ts` flags — note most flags are currently decorative; wire or remove.
- **Client-side "payments"/perks are theater.** Tip superchats, subscriber gates, poll results are cosmetic. Never imply money moved; never attach real perks to forgeable client state without server enforcement.
- **Runtime-created DOM cannot use Astro component `<style>` scopes** (no data-astro-cid attr). Such styles belong in `global.css` (see reaction-particle classes).

## 6. UI/UX consistency (do not drift)

1. **Design tokens first** (`tokens/variables.css`): colors (`--accent-neon-yellow #F2FD43`, `--btn-green #53FC18`, surface/text scales), fonts (`--font-heading` Syne / `--font-display` Cinzel / `--font-secondary` Space Grotesk), easings (`--ease-snappy`, `--ease-tactile`), radii. No new one-off hex values unless matching the existing brutalist palette exactly.
2. **Neo-brutalist language:** solid `#000` borders (2–3 px), hard offset shadows (`3px 3px 0px #000`), pill badges, uppercase Space Grotesk labels with letter-spacing. Copy an existing sibling component's styling before inventing markup (e.g., mirror `MembersSection` card patterns, nav button patterns in TopNav).
3. **Transitions enumerate their properties explicitly.** `transition: all` is banned (style-recalc blowups); typical set: `transform var(--ease-tactile) .16s, background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease`.
4. **Micro-interactions:** press feedback via existing `brutal-press` class; hover lifts `translate(-Npx,-Npx)` + shadow grow; icon pops via scale keyframes. Durations 0.12–0.35 s; longer only for deliberate sequences (song-change wipe 850 ms, curtain).
5. **Feedback contract:** every action ends in either success state or an actionable error toast (`showToast`), never silence, never fake success. Loading states disable the submit control and show spinner (copy an existing handler).
6. **Dark theme + reduced motion are first-class:** verify changes under `[data-theme="dark"]`, `prefers-reduced-motion`, and `html.low-power-mode`.

## 7. Process expectations

- **Take your time.** Read the surrounding code and both sides of a contract (caller+callee, HTML id ↔ JS selector, CSS class ↔ controller) before editing. Several past bugs came from edits that ignored the other half of a pair (form submit + button click both firing send).
- **Verify claims by reading code, not assuming.** Grep for listeners before deleting events; check both pages sharing a chunk before moving exports.
- **Match established patterns over cleverness.** When three controllers define local `escapeHtml`, follow suit rather than introducing a util import mid-file-set — or migrate all of them in one dedicated pass.
- **Windows shell note:** PowerShell blocks `npm.ps1`; use `npm.cmd run build`.
- **Finish every task with §8 verification.** Report what changed concisely; flag anything deferred instead of silently skipping.

## 8. Verification checklist (run before declaring done)

```powershell
npm.cmd run build                      # must pass
rg "discord(app)?\.com/api/webhooks" .vercel/output/static   # 0 hits, ALWAYS
rg "transition:\s*all" src             # should stay at/near current count (≈18 legacy; don't add)
rg "backdrop-filter" src               # only modal-scoped additions allowed
rg "(?<!safe)(Storage\.)?(get|set|remove)Item" src/scripts   # new bare localStorage calls are a smell
```
Plus: eyeball new/changed chunk sizes in build output against baseline (eager home JS ≈ 65 KB raw / 20 KB gz — growth needs justification), and run `npx playwright test e2e/tier1-smoke` when touching interactive flows.

## 9. Known deferred items (don't rediscover, just know)

- `KINS_COVERS_DATA = []` — covers search has no data yet (owner must supply)
- EPK download buttons generate placeholder text files labeled .zip/.pdf (page disabled)
- CSP is Report-Only pending violation review; enforcing requires nonce migration of inline scripts
- `epk.css` (~49 KB) leaks into `/` via shared chunk graph (Vite artifact, minor)
- Font-weight trimming postponed pending per-rule audit (faux-bold regression risk)
- In-memory rate limits are per-serverless-instance — move to durable store if abuse appears
