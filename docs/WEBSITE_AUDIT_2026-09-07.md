# KINS website audit — 7 September 2026

**Follow-up:** The findings below describe the pre-fix state. See [the implementation and verification report](WEBSITE_AUDIT_FIXES_2026-09-08.md) for the fixes made on 8 September.

Reviewed the current local working tree, including existing uncommitted metronome changes. This is an analysis of the local website and source, not a certification of the deployed production environment. No application source was changed and no live email, payment, upload, or database write was submitted.

## Findings, in priority order

### 1. P1 — Google sign-in changes the identity of the shared privileged database client

**Location:** [subscribe.ts:49](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/api/subscribe.ts:49), [supabaseServer.ts:23](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/lib/supabaseServer.ts:23).

`verifyGoogleCredential()` calls `auth.signInWithIdToken()` on the cached service-role client. A successful sign-in stores the user's session in that client even with `persistSession: false`. Subsequent database requests on that instance use the user's bearer token instead of the service-role key. This affects both the subscription write and other API requests sharing the warm server instance; operations that require service privileges can fail or become restricted to that user's RLS permissions.

**Evidence:** An offline reproduction using the installed Supabase SDK and a fully mocked fetch changed the outgoing Authorization header from `Bearer synthetic-service-key` to `Bearer synthetic-user-token`. No real credentials or network requests were used. Run `node audit-supabase-session.mjs` to reproduce. This behavior is also documented by [Supabase](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z).

**Fix:** Verify sign-in on a separate client created for that request. Keep the shared service-role client completely separate from user authentication sessions. The homepage subscription form is currently marked coming soon, but the API route itself remains defined.

### 2. P1 — Diagnostic email sending fails open when no health-check token is configured

**Location:** [notify-health.ts:72](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/api/notify-health.ts:72).

`GET /api/notify-health?check=send` only rejects an invalid token when an expected token is nonempty. If Resend is configured but both health token variables are absent, an unauthenticated request can send a test email; `mode=full` sends three. This endpoint also has no rate limiter. Repeated requests could fill the notification inbox and consume the email quota. A GET request should not trigger this operation.

**Evidence:** Confirmed from control flow. The sending endpoint was deliberately not invoked, and production token configuration was not inspected.

**Fix:** Require authentication unconditionally, reject missing server configuration, move sending to POST, validate inputs, and apply rate limits. Restrict detailed diagnostics to authorized operators.

### 3. P2 — Fan uploads advertise 80 MB, but the Vercel function cannot accept that size

**Location:** [fan-upload.ts:16](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/api/fan-upload.ts:16), [liveUploadController.js:44](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/liveUploadController.js:44).

The server accepts files up to 80 MB in its validation, while the browser posts the entire multipart file through `/api/fan-upload`. Vercel Functions have a 4.5 MB request-body limit. Larger photos and videos therefore receive a platform-level 413 before this route can validate or store them. Multipart overhead also counts toward the limit. The live page is currently gated; resolve this before enabling uploads for fans.

**Evidence:** Confirmed the browser-to-function upload path and checked [Vercel's documented limit](https://vercel.com/docs/functions/limitations). No large upload was sent.

**Fix:** Use an authenticated, narrowly scoped signed upload URL to send media directly to storage, followed by server-side finalization and moderation. Alternatively, reduce the advertised limit below the platform ceiling.

### 4. P2 — Metronome controls accept clicks before their controller is ready

**Location:** [metronome.astro:8224](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/metronome.astro:8224), [uiBindings.js:4022](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/metronome/uiBindings.js:4022).

The page sets `initialized = true` before its dynamic import resolves and before control listeners are attached. The visible buttons remain enabled during that interval. The document click fallback returns because `initialized` is already true, so an early click is lost. Import failure also leaves this flag true, preventing a normal retry.

**Evidence:** The full smoke run failed 9 metronome tests: playback, time signature, subdivision, setlist selection/search, coach controls, settings, and background playback. Several failed immediately after the first click, with the expected sheet still hidden or the play button still stopped. Manual playback worked after the page settled. A focused single-worker rerun of playback and time signature passed both tests. These results support a timing-dependent initialization problem; they do not establish that all 9 failures have the same cause.

**Fix:** Track loading and ready states separately. Keep controls disabled until listeners are bound, or explicitly preserve the first requested action. Reset state on import failure and guard pending initialization against teardown. Add a regression check with deliberately delayed controller loading.

### 5. P2 — Closed cover search remains keyboard-focusable and exposed as a modal

**Location:** [CoversSearchOverlay.astro:10](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/CoversSearchOverlay.astro:10), [CoversSearchOverlay.astro:69](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/modals/CoversSearchOverlay.astro:69), [coversSearchEngine.js:450](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/coversSearchEngine.js:450).

The closed dialog uses only `opacity: 0` and `pointer-events: none`. Its input and buttons remain in the tab order and accessibility tree, with `aria-modal="true"`. Keyboard users can lose their visible focus inside an apparently absent interface. Closing also does not restore focus to the opener.

**Evidence:** On the mobile homepage, pressing Tab from the closed “Band FAQ” button focused `overlaySearchInput` while the search overlay's computed opacity was `0`. The accessibility tree also included its closed dialog and controls.

**Fix:** Make the closed dialog hidden/inert, synchronize accessibility state with visibility, contain focus while it is open, and restore focus when it closes. Prefer native dialog behavior where appropriate.

### 6. P2 — Inspiration filter labels fail text contrast in both themes

**Location:** [InspirationVault.astro:112](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/components/sections/InspirationVault.astro:112), [variables.css:47](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/styles/tokens/variables.css:47), [variables.css:194](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/styles/tokens/variables.css:194).

Inactive member tabs use the same muted text token in both themes. Their measured computed text/background colors yield **3.51:1 in dark mode** and **4.39:1 in light mode**, below the repository's 4.5:1 minimum. The inspected label was 11.84 px bold, so the large-text exemption does not apply. These are enabled controls, not disabled controls.

**Evidence:** Measured the “TRAI” tab's computed styles at a 390 × 844 viewport in both themes and calculated relative-luminance contrast. Dark: `rgb(113,113,122)` on `rgb(28,28,34)`. Light: the same text on `rgb(245,244,239)`.

**Fix:** Give the muted label token sufficiently contrasting values in each theme, and verify other components sharing that token.

### 7. P2 — Production build success conceals a failing type check

**Location:** [package.json:9](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/package.json:9), [audit-check.log](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/audit-check.log).

`npm.cmd run check` reports **99 errors across 206 inspected files**, plus 135 hints. Examples include DOM typing errors in TabbedLinks, incorrect inferred toast argument types, and incompatible chord-fret comparisons. `npm.cmd run build` runs only `astro build` and succeeds independently, so a successful build is not evidence that the code passes static checks.

**Fix:** Resolve the diagnostics and require type checking in the release pipeline. Preserve the distinction between static errors and observed browser failures; the 99 errors do not mean there are 99 demonstrated runtime bugs.

## Verification results

| Check | Result |
| --- | --- |
| Production build | Passed |
| Astro type check | 99 errors, 135 hints; 206 files inspected |
| Full existing mobile smoke suite | 26 passed, 9 failed, 19 skipped |
| Focused metronome rerun, one worker | Playback and time-signature tests both passed |
| Existing SEO verification script | Passed its built-in checks; not an independent search-ranking or full SEO audit |
| Discord webhook URL scan of generated static output | No matches |
| `transition: all` scan of source | No matches |
| Browser storage scan | Matches reviewed; calls use wrappers or try/catch |
| Browser review | Homepage at desktop and 390 × 844 mobile, theme switching, keyboard focus, metronome playback |
| Supabase session reproduction | Confirmed offline using synthetic data |

Full smoke evidence: [audit-tests.log](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/audit-tests.log). Focused rerun: [audit-recheck.log](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/audit-recheck.log). Build output: [audit-build.log](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/audit-build.log).

## Scope and observations

- Newsletter signup, gig map, and several content areas visibly use coming-soon states. Store, theory, tuner, EPK, and live features are disabled by configuration. These were treated as intentional launch decisions rather than automatically counted as defects. Their disabled state explains the 19 skipped tests and limits coverage of those features.
- Many components still contain raw colors, pixel values, and legacy aliases despite the stricter AGENTS.md specification. This is design-system maintenance debt; the contrast finding above is a measured user-visible consequence.
- CSP report-only mode and per-instance in-memory rate limiting are already listed as deferred work in AGENTS.md. Neither was presented as a newly discovered incident.
- Production secrets, RLS policies, real microphone/MIDI hardware, Safari behavior, live integrations, and every external link were not validated. No claim is made that this review found every issue.

Recommended order: isolate the privileged Supabase client; lock down diagnostic sending; correct startup and focus behavior; fix contrast; then resolve upload architecture and restore a clean release check.
