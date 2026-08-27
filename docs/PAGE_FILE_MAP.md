# Page → File Map

Copy-paste reference: every page and the files that power it.
Paths are prefixed with `@` so you can drop them straight into chat/agent context.

---

## Shared (every page)

- @src/layouts/BaseLayout.astro — head, fonts, theme + low-power detector, SW registration
- @src/middleware.ts — security headers / CSP Report-Only on SSR responses
- @src/styles/global.css — site-wide CSS incl. runtime-DOM styles & animation gating
- @src/styles/tokens/variables.css — design tokens (colors, typography, spacing, shadows)
- @src/styles/tokens/animations.css — keyframe definitions & timing tokens
- @src/styles/base/layout.css — base layout and responsive resets
- @src/components/ui/ToastContainer.astro — toast notification host (all pages)
- @public/sw.js — service worker (keep `CACHE_NAME` in sync with `shareModal.js`)
- @public/manifest.json — Web app manifest
- @public/robots.txt — crawler rules and sitemap pointer
- @public/sitemap.xml — canonical pages XML sitemap
- @vercel.json — static asset headers, routing, and cache policies

---

## `/` — Fan hub homepage

**Page:** @src/pages/index.astro

**Components (in import / render order):**
- @src/components/navigation/TopNav.astro
- @src/components/navigation/SiteFooter.astro
- @src/components/sections/HeroBanner.astro
- @src/components/sections/ProfileSection.astro
- @src/components/sections/HeroFeatureCard.astro
- @src/components/sections/TabbedLinks.astro
- @src/components/sections/MembersSection.astro
- @src/components/sections/KinsCrewSpotlight.astro
- @src/components/sections/MerchSection.astro
- @src/components/sections/InspirationVault.astro
- @src/components/sections/KinsToolsSection.astro
- @src/components/ui/ToolIcon.astro
- @src/components/sections/SubscribeSection.astro
- @src/components/modals/ShareModal.astro
- @src/components/modals/GigMapSheet.astro
- @src/components/modals/CoversSearchOverlay.astro
- @src/components/modals/CoverVideoModal.astro
- @src/components/modals/CommunitySubmissionModal.astro
- @src/components/modals/LegalModal.astro
- @src/components/modals/FeedbackModal.astro
- @src/components/live/LiveUploadModal.astro
- @src/components/ui/AudioPlayer.astro
- @src/components/ui/PagePreloader.astro

**Controllers (page-level & dynamic imports):**
- Top-level / shell: @src/scripts/controllers/themeController.js · @src/scripts/controllers/pwaInstall.js · @src/scripts/controllers/analyticsTelemetry.js
- HeroFeatureCard → @src/scripts/controllers/heroFeatureController.js (+ liveUploadController.js, videoModalController.js)
- TopNav → @src/scripts/controllers/subscribeController.js
- ProfileSection → @src/scripts/controllers/followers.js
- TabbedLinks → @src/scripts/controllers/tabs.js
- SubscribeSection → @src/scripts/controllers/socialAuth.js · subscribeController.js · clipboard.js
- KinsCrewSpotlight → @src/scripts/controllers/clipboard.js
- InspirationVault → @src/scripts/controllers/inspirationVault.js · audioPlayer.js
- AudioPlayer → @src/scripts/controllers/audioPlayer.js (+ inspirationVault.js)
- ShareModal → @src/scripts/controllers/shareModal.js
- GigMapSheet → @src/scripts/controllers/gigMap.js (+ fanIdentity.js)
- CoversSearchOverlay → @src/scripts/controllers/coversSearchEngine.js (+ videoModalController.js, requestSongController.js)
- CoverVideoModal → @src/scripts/controllers/videoModalController.js
- KinsToolsSection → @src/scripts/controllers/toast.js

**API routes used from here:**
- @src/pages/api/subscribe.ts · unsubscribe.ts · request-song.ts · feedback.ts · community-submission.ts · vote.ts · checkin.ts · fan-wall.ts · fan-upload.ts · tip-shoutout.ts · live-tips.ts

**Settings:**
- @src/settings/site.config.ts · hero.config.ts · links.config.ts · members.config.ts · gigs.config.ts · rehearsal.config.ts · functionality.config.ts · theme.config.ts

---

## `/live` — Live stream hub

**Page:** @src/pages/live.astro (markup + styles + controller init)

**Components:**
- @src/components/live/LiveNav.astro
- @src/components/live/FanCamsReel.astro
- @src/components/live/MasterStreamPlayer.astro
- @src/components/live/NativeAppsGrid.astro
- @src/components/live/LiveSetlistStage.astro
- @src/components/live/LiveLyricsStage.astro
- @src/components/live/LiveChatReactions.astro
- @src/components/live/LiveFanWall.astro
- @src/components/live/LiveFloatingUploadBtn.astro
- @src/components/live/LiveUploadModal.astro
- @src/components/live/LiveTabsLyricsModal.astro
- @src/components/live/LiveStreamSettingsModal.astro
- @src/components/live/LiveTipJarModal.astro
- @src/components/live/LiveAlertsModal.astro
- @src/components/live/LiveMediaLightbox.astro

**Controllers (initialized in live.astro):**
- @src/scripts/controllers/themeController.js
- @src/scripts/controllers/liveStreamController.js
- @src/scripts/controllers/liveChatController.js
- @src/scripts/controllers/liveReactionsController.js
- @src/scripts/controllers/liveSetlistController.js
- @src/scripts/controllers/liveFanWallController.js (+ @src/scripts/controllers/liveUploadController.js)

**API routes used from here:**
- @src/pages/api/fan-wall.ts · fan-upload.ts · vote.ts · live-tips.ts · tip-shoutout.ts · checkin.ts · kofi-webhook.ts

**Settings:**
- @src/settings/live.config.ts · theme.config.ts · site.config.ts

---

## `/metronome` — Metronome & Rehearsal Companion

**Page:** @src/pages/metronome.astro (markup + all metronome UI styles inline)

**Modals & UI Components:**
- @src/components/ui/ToastContainer.astro
- @src/components/modals/FeedbackModal.astro
- @src/components/modals/PrivacyModal.astro
- @src/components/modals/TermsModal.astro

**Controllers (@src/scripts/controllers/metronome/):**
- @src/scripts/controllers/metronome/index.js — lifecycle entry (`initMetronome`)
- @src/scripts/controllers/metronome/uiBindings.js — event listeners, dial gestures, stepper, tap tempo, coach UI, setlist, modal bindings
- @src/scripts/controllers/metronome/metroState.js — central state store & local storage persistence
- @src/scripts/controllers/metronome/audioEngine.js — Web Audio API / AudioWorklet clock scheduler, polyrhythms, sound synthesizers
- @src/scripts/controllers/metronome/coachEngine.js — speed trainer & bar mute practice engine
- @src/scripts/controllers/metronome/mediaSessionManager.js — lock-screen media controls & audio focus (MediaSession API)
- @src/scripts/controllers/metronome/midiManager.js — Web MIDI controller support (pedals / footswitches)
- @src/scripts/controllers/metronome/sheetController.js — sheet music viewer & PDF bar follower
- @src/scripts/controllers/metronome/sheetStore.js — local sheet music store (IndexedDB / localStorage)
- @src/scripts/controllers/metronome/pdfBarScanner.js — PDF measure/bar detection

**Worklets:**
- @public/worklets/click-worklet.js — high-precision sample-accurate click AudioWorklet processor

**API routes used from here:**
- @src/pages/api/song-bpm.ts — iTunes / MusicBrainz BPM lookup
- @src/pages/api/feedback.ts — bug report / feature suggestion feedback

**Settings:**
- @src/settings/metronome.config.ts — tempo markings, default time signatures, subdivisions, sound presets, default setlists

---

## `/tuner` — Chromatic tuner

**Page:** @src/pages/tuner.astro (markup + all tuner CSS inline)

**Modals & UI Components:**
- @src/components/ui/ToastContainer.astro
- @src/components/modals/FeedbackModal.astro
- @src/components/modals/PrivacyModal.astro
- @src/components/modals/TermsModal.astro

**Controllers (@src/scripts/controllers/tuner/):**
- @src/scripts/controllers/tuner/index.js — entry (`initTuner`)
- @src/scripts/controllers/tuner/uiBindings.js — needle animation, strobe, preset selector, settings sheet
- @src/scripts/controllers/tuner/tunerState.js — tuner configuration and state management
- @src/scripts/controllers/tuner/pitchDetector.js — autocorrelation & YIN pitch detection algorithm
- @src/scripts/controllers/tuner/audioEngine.js — microphone input stream & Web Audio processing
- @src/scripts/controllers/tuner/safetyMonitor.js — string tension / breakage safety warnings
- @src/scripts/controllers/tuner/instrumentArt.js — instrument headstock / peg visualizer
- @src/scripts/controllers/tuner/notesUtil.js — note frequency calculations & cents deviation helpers

**Worklets:**
- @public/tuner-worklet.js — pitch detection AudioWorklet

**API routes used from here:**
- @src/pages/api/feedback.ts — feedback submission

**Settings:**
- @src/settings/tuner.config.ts — instrument tuning presets, temperaments, concert pitch offsets

---

## `/theory` — Music Theory Cheat Sheets (Guitar & Drums)

**Page:** @src/pages/theory.astro (markup + topbar, dual pill tabs, expandable search & all theory CSS inline)

**Modals & UI Components:**
- @src/components/ui/ToastContainer.astro

**Settings:**
- @src/settings/rehearsal.config.ts — tools list entry

---

## `/epk` — Press kit (page currently disabled)

**Page:** @src/pages/epk.astro

**Components (imported by page):**
- @src/components/epk/EpkNav.astro
- @src/components/epk/EpkHero.astro
- @src/components/epk/EpkMembers.astro
- @src/components/epk/EpkRepertoire.astro
- @src/components/epk/EpkBio.astro
- @src/components/epk/EpkPhotos.astro
- @src/components/epk/EpkContactMatrix.astro
- @src/components/epk/EpkDownloadDeck.astro
- @src/components/epk/EpkFooter.astro

**Controllers:**
- @src/scripts/controllers/themeController.js
- @src/scripts/controllers/epkController.js

**Settings:**
- @src/settings/epk.config.ts · contact.config.ts · members.config.ts

**Styling note:** EPK styles leak into `/` via shared chunk graph (known Vite artifact, see AGENTS.md §9).

---

## `/404` — Not found

**Page:** @src/pages/404.astro (BaseLayout + brutalist 404 message)

---

## Serverless API Routes (`/api/*`)

All API routes run in SSR/serverless mode on Vercel Node 24. All user inputs are sanitized and rate-limited.

| Endpoint | File | Purpose |
|---|---|---|
| `/api/subscribe` | @src/pages/api/subscribe.ts | Google One Tap & email newsletter signup + Discord notification |
| `/api/unsubscribe` | @src/pages/api/unsubscribe.ts | Unsubscribe token handler |
| `/api/substack-webhook` | @src/pages/api/substack-webhook.ts | Substack subscriber sync webhook |
| `/api/kofi-webhook` | @src/pages/api/kofi-webhook.ts | Ko-fi tip & donation webhook with Discord alert |
| `/api/tip-shoutout` | @src/pages/api/tip-shoutout.ts | Live stream tip shoutout trigger |
| `/api/live-tips` | @src/pages/api/live-tips.ts | Live stream tip feed reader |
| `/api/request-song` | @src/pages/api/request-song.ts | Cover song request submission with Discord alert |
| `/api/feedback` | @src/pages/api/feedback.ts | Bug report / feature suggestion feedback proxy |
| `/api/community-submission` | @src/pages/api/community-submission.ts | Fan art & community submission proxy |
| `/api/vote` | @src/pages/api/vote.ts | Live setlist and poll voting |
| `/api/checkin` | @src/pages/api/checkin.ts | Gig attendance check-in counter |
| `/api/fan-wall` | @src/pages/api/fan-wall.ts | Live fan photo & comment wall fetch/post |
| `/api/fan-upload` | @src/pages/api/fan-upload.ts | Direct fan photo/media upload handler |
| `/api/song-bpm` | @src/pages/api/song-bpm.ts | iTunes / MusicBrainz BPM metadata query proxy |

---

## Cross-cutting & Core Infrastructure

- **Settings index / Single Source of Truth:** @src/settings/index.ts (re-exports all `*.config.ts`)
- **Supabase browser client:** @src/lib/supabase.ts — `PUBLIC_*` env keys only, never imports master key
- **Supabase service-role client:** @src/lib/supabaseServer.ts — server code ONLY (`/api/*`), never imported by client
- **Rate limiting:** @src/lib/rateLimit.ts — in-memory per-IP token bucket rate limiter
- **Sanitization:** @src/lib/sanitize.ts — text sanitization, Discord @mention neutralizing, URL validator
- **Discord Bot / Webhook Helper:** @src/lib/discord.ts — Discord webhook dispatch & role management
- **Email Validation:** @src/scripts/utils/emailValidator.js — client-side regex + DNS format check
- **DB RLS Hardening:** @supabase_rls_hardening.sql — row level security policies for Supabase tables
