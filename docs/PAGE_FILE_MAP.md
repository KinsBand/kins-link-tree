# Page → File Map

Copy-paste reference: every page and the files that power it.
Paths are prefixed with `@` so you can drop them straight into chat/agent context.

## Shared (every page)

- @src/layouts/BaseLayout.astro — head, fonts, theme + low-power detector, SW registration
- @src/middleware.ts — security headers / CSP on SSR responses
- @src/styles/global.css — site-wide CSS incl. runtime-DOM styles
- @src/styles/tokens/variables.css — design tokens
- @src/styles/tokens/animations.css
- @src/styles/base/layout.css
- @src/components/ui/ToastContainer.astro — toast host (all pages)
- @public/sw.js — service worker (keep CACHE_NAME in sync with shareModal.js)
- @vercel.json — static asset headers/caching

## `/` — Fan hub homepage

**Page:** @src/pages/index.astro

**Components (in import order):**
- @src/components/navigation/TopNav.astro
- @src/components/sections/HeroBanner.astro
- @src/components/sections/ProfileSection.astro
- @src/components/sections/HeroFeatureCard.astro
- @src/components/sections/TabbedLinks.astro
- @src/components/sections/MembersSection.astro
- @src/components/sections/KinsCrewSpotlight.astro
- @src/components/sections/MerchSection.astro
- @src/components/sections/InspirationVault.astro
- @src/components/sections/RehearsalUtilitiesSection.astro
- @src/components/sections/SubscribeSection.astro
- @src/components/modals/ShareModal.astro
- @src/components/modals/GigMapSheet.astro
- @src/components/modals/CoversSearchOverlay.astro
- @src/components/modals/CoverVideoModal.astro
- @src/components/modals/CommunitySubmissionModal.astro
- @src/components/modals/PrivacyModal.astro
- @src/components/modals/TermsModal.astro
- @src/components/modals/FeedbackModal.astro
- @src/components/live/LiveUploadModal.astro
- @src/components/ui/AudioPlayer.astro
- @src/components/ui/PagePreloader.astro

**Controllers (page-level):**
- @src/scripts/controllers/themeController.js

**Controllers (loaded by components):**
- HeroFeatureCard → @src/scripts/controllers/heroFeatureController.js (+ liveUploadController.js, videoModalController.js)
- TopNav → @src/scripts/controllers/subscribeController.js
- ProfileSection → @src/scripts/controllers/followers.js
- TabbedLinks → @src/scripts/controllers/tabs.js
- SubscribeSection → @src/scripts/controllers/socialAuth.js, subscribeController.js, clipboard.js
- KinsCrewSpotlight → @src/scripts/controllers/clipboard.js
- InspirationVault → @src/scripts/controllers/inspirationVault.js, audioPlayer.js
- AudioPlayer → @src/scripts/controllers/audioPlayer.js (+ inspirationVault.js)
- ShareModal → @src/scripts/controllers/shareModal.js
- GigMapSheet → @src/scripts/controllers/gigMap.js (+ fanIdentity.js)
- CoversSearchOverlay → @src/scripts/controllers/coversSearchEngine.js (+ videoModalController.js, requestSongController.js)
- CoverVideoModal → @src/scripts/controllers/videoModalController.js
- RehearsalUtilitiesSection → @src/scripts/controllers/toast.js

**API routes used from here:**
- @src/pages/api/subscribe.ts · unsubscribe.ts · request-song.ts · feedback.ts · community-submission.ts · vote.ts · checkin.ts · fan-wall.ts · fan-upload.ts · tip-shoutout.ts · live-tips.ts

**Settings:** @src/settings/site.config.ts · hero.config.ts · links.config.ts · members.config.ts · gigs.config.ts · rehearsal.config.ts · functionality.config.ts · theme.config.ts

**Lib (server/shared):** @src/lib/supabase.ts · supabaseServer.ts · rateLimit.ts · sanitize.ts · discord.ts

## `/live` — Live stream hub

**Page:** @src/pages/live.astro (large single file: markup + styles + controller init inline)

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

**API routes:** @src/pages/api/fan-wall.ts · fan-upload.ts · vote.ts · live-tips.ts · tip-shoutout.ts · checkin.ts

**Settings:** @src/settings/live.config.ts · theme.config.ts

## `/tuner` — Chromatic tuner

**Page:** @src/pages/tuner.astro (markup + all tuner CSS inline)

**Controllers (@src/scripts/controllers/tuner/):**
- @src/scripts/controllers/tuner/index.js — entry (`initTuner`)
- @src/scripts/controllers/tuner/uiBindings.js
- @src/scripts/controllers/tuner/tunerState.js
- @src/scripts/controllers/tuner/pitchDetector.js
- @src/scripts/controllers/tuner/audioEngine.js
- @src/scripts/controllers/tuner/safetyMonitor.js
- @src/scripts/controllers/tuner/instrumentArt.js

**Settings:** @src/settings/tuner.config.ts

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

**Settings:** @src/settings/epk.config.ts · contact.config.ts · members.config.ts

**Styling note:** EPK styles leak into `/` via shared chunk graph (known Vite artifact, see AGENTS.md §9).

## `/404`

- @src/pages/404.astro (BaseLayout only)

## Cross-cutting

- **Settings index / source of truth:** @src/settings/index.ts (all *.config.ts above re-export here)
- **Supabase browser client:** @src/lib/supabase.ts — never import supabaseServer client-side
- **Supabase service-role:** @src/lib/supabaseServer.ts — server code ONLY
- **Rate limiting:** @src/lib/rateLimit.ts · **Sanitization:** @src/lib/sanitize.ts
- **DB policies:** @supabase_rls_hardening.sql
