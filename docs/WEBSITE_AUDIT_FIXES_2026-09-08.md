# KINS website audit fixes — 8 September 2026

Implemented the seven findings from `WEBSITE_AUDIT_2026-09-07.md` in the local working tree. Existing metronome work and feature gates were preserved. These changes have not been deployed.

| Audit finding | Implemented change |
| --- | --- |
| Shared Supabase service client could acquire a user's session | Google credential verification uses a fresh public-key auth client for each request. Privileged database operations retain the separate cached service client. |
| Notification diagnostic endpoint could send mail without configured authentication | Both methods require a configured bearer token and enforce rate limiting. GET is read-only; sending requires POST with a strict Zod-validated body. Responses are not cached. |
| Upload allowance exceeded the function request limit | UI, browser validation, and API share a 4 MB file limit. The API also rejects oversized declared request bodies before parsing. |
| Early metronome clicks were lost during loading | Controls remain disabled until initialization completes. Failed loading offers a reload action; generation guards cancel stale initialization and teardown tolerates repeated calls. |
| Hidden covers search remained keyboard-accessible | The closed dialog is inert and hidden from accessibility tools. Opening moves focus inside; keyboard navigation stays inside; closing restores focus. Lifecycle teardown removes listeners. A first click during lazy loading is preserved. |
| Inspiration labels failed contrast requirements | Semantic muted-card text tokens now satisfy the normal-text contrast threshold in both themes. |
| Type errors were bypassed by production builds | Corrected DOM, callback, API, and configuration types, including theory cards that referenced nonexistent data fields. `npm run build` now runs `astro check` before producing deployment output. |

## Operational changes

- Set `HEALTHCHECK_TOKEN` on the server before using `/api/notify-health`; `NOTIFY_HEALTH_TOKEN` remains an accepted fallback. An unset token disables diagnostics with HTTP 503. Send `Authorization: Bearer <token>`; tokens in URLs are no longer accepted.
- GET returns diagnostics. POST with JSON `{ "mode": "single" }` sends one probe; `"full"` sends three. The endpoint permits five requests per minute per IP, using the existing per-instance rate limiter. Examples are in `SETUP-CHECKLIST.md`.
- Google sign-in needs the public Supabase key as well as the service-role key used by privileged database operations.
- Fan uploads are limited to 4 MB (4,194,304 bytes), with room for multipart overhead. Larger videos require a future direct-to-storage upload flow.

## Verification

- Production build passed with 0 type errors and 0 warnings. Astro still reports 128 non-blocking hints.
- Public build scan found no Discord webhook URLs. Source scan found no `transition: all`. Storage accesses inspected were protected by safe-storage helpers or try/catch.
- New API tests use synthetic credentials and intercept all service fetches. They verify auth isolation, fail-closed diagnostics, POST validation and rate limits, and oversized uploads without contacting live services.
- Browser regressions cover delayed controller imports, metronome load failure and recovery, repeated route teardown, search keyboard focus, and both-theme contrast.
- Mobile browser inspection at 390 × 844 confirmed the metronome and search layouts, focus restoration, and readable light-theme inspiration labels.

Final smoke-suite results are recorded below after verification completes.

## Limits of verification

The currently disabled tuner, theory, live, store, and EPK features were not enabled. Tests gated by those settings remain skipped. Real Google credentials, live email delivery, production uploads, and physical microphone/MIDI devices were not exercised. The original audit's deferred content and infrastructure backlog remains outside these seven fixes.
