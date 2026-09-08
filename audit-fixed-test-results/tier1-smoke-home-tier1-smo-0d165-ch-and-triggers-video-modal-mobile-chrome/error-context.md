# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\home.spec.ts >> tier1 smoke — home hub >> covers search menu opens with mock data, filters by category and search, and triggers video modal
- Location: e2e\tier1-smoke\home.spec.ts:465:3

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#coversSearchOverlay')
Expected pattern: /active/
Received string:  "covers-search-overlay"
Timeout: 5000ms

Call log:
  - Expect "toHaveClass" with timeout 5000ms
  - waiting for locator('#coversSearchOverlay')
    - locator resolved to <div inert="" role="dialog" aria-modal="true" aria-hidden="true" id="coversSearchOverlay" data-astro-cid-qynqgdv5="" class="covers-search-overlay" aria-label="Search Cover Videos" data-track-container="modal:covers_search">…</div>
    13 × unexpected value "covers-search-overlay"
       - locator resolved to <div inert="" role="dialog" aria-modal="true" aria-hidden="true" id="coversSearchOverlay" data-search-ready="true" data-astro-cid-qynqgdv5="" class="covers-search-overlay" aria-label="Search Cover Videos" data-track-container="modal:covers_search">…</div>
    - unexpected value "covers-search-overlay"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Subscribe to Kins" [ref=e6] [cursor=pointer]:
          - generic: 
          - generic: SOON
        - button "Search cover videos" [active] [ref=e7] [cursor=pointer]:
          - generic: 
          - generic: search covers...
        - button "Share page" [ref=e8] [cursor=pointer]:
          - generic: 
    - complementary [ref=e9]:
      - generic:
        - img "Kins logo banner"
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: INDEPENDENT 4-PIECE ROCK BAND
          - generic [ref=e14]:
            - generic [ref=e15]: 
            - generic [ref=e16]: NEWCASTLE, AUSTRALIA
            - generic "Australia Flag" [ref=e17]
        - text: 
      - generic [ref=e34]:
        - generic [ref=e37]:
          - generic [ref=e38]: 
          - generic [ref=e40]:
            - generic [ref=e41]: UPCOMING RELEASE
            - heading "New music is on the way" [level=4] [ref=e42]
            - paragraph [ref=e43]: First official cover coming soon...
        - text:                                                                             
      - generic [ref=e44]:
        - tablist [ref=e45]:
          - tab "STREAMS" [ref=e46] [cursor=pointer]
          - tab "SOCIALS" [selected] [ref=e47] [cursor=pointer]
          - tab "COMMUNITY" [ref=e48] [cursor=pointer]
        - text:               
        - tabpanel [ref=e49]:
          - generic [ref=e50]:
            - link " Instagram" [ref=e51] [cursor=pointer]:
              - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
              - generic [ref=e52]:
                - generic [ref=e53]: 
                - generic [ref=e55]: Instagram
            - link " TikTok" [ref=e56] [cursor=pointer]:
              - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
              - generic [ref=e57]:
                - generic [ref=e58]: 
                - generic [ref=e60]: TikTok
            - link " YouTube" [ref=e61] [cursor=pointer]:
              - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
              - generic [ref=e62]:
                - generic [ref=e63]: 
                - generic [ref=e65]: YouTube
            - link " Facebook" [ref=e66] [cursor=pointer]:
              - /url: https://www.facebook.com/share/1LU7GTyCBW/
              - generic [ref=e67]:
                - generic [ref=e68]: 
                - generic [ref=e70]: Facebook
            - link " Twitter / X" [ref=e71] [cursor=pointer]:
              - /url: https://x.com/KinsBandOfficial
              - generic [ref=e72]:
                - generic [ref=e73]: 
                - generic [ref=e75]: Twitter / X
            - link " Threads" [ref=e76] [cursor=pointer]:
              - /url: https://www.threads.com/@kinsbandofficial
              - generic [ref=e77]:
                - generic [ref=e78]: 
                - generic [ref=e80]: Threads
          - generic [ref=e81]:
            - link " Snapchat" [ref=e82] [cursor=pointer]:
              - /url: https://snapchat.com/add/KinsBandOfficial
              - generic [ref=e83]:
                - generic [ref=e84]: 
                - generic [ref=e86]: Snapchat
            - link " LinkedIn" [ref=e87] [cursor=pointer]:
              - /url: https://linkedin.com/company/KinsBandOfficial
              - generic [ref=e88]:
                - generic [ref=e89]: 
                - generic [ref=e91]: LinkedIn
          - button "Toggle all social channels" [ref=e92] [cursor=pointer]:
            - generic [ref=e93]:
              - generic "Snapchat" [ref=e94]: 
              - generic "LinkedIn" [ref=e96]: 
            - generic [ref=e98]: Other (+2)
            - generic [ref=e99]: 
        - text:      
      - generic [ref=e101]:
        - region "Fan Club Subscription (Coming Soon)" [ref=e102]:
          - generic:
            - generic:
              - generic:
                - heading "Subscribe to Kins!" [level=3]
                - generic:
                  - generic: 
                  - text: Under Works
              - paragraph: Fan club drops & newsletter engine currently under works. Stay tuned!
            - generic:
              - button "Subscribe with Google (Coming Soon)":
                - generic: Google
                - generic "Coming Soon":
                  - generic:
                    - generic: 
                    - text: Coming Soon
            - generic: OR WITH EMAIL
            - generic:
              - generic:
                - textbox "Fan club drops launching soon..."
                - button "Join Kins Fan Club (Coming Soon)":
                  - generic: SOON ➔
          - generic: COMING SOON • UNDER WORKS
          - button "Fan club subscription coming soon. Tap for more info." [ref=e103] [cursor=pointer]
        - text:  
        - generic [ref=e104]:
          - generic [ref=e105]:
            - generic [ref=e106]: 
            - generic [ref=e107]: Official Contacts & Feedback
          - generic [ref=e108]:
            - button " HelloKinsFan@gmail.com General Chat, Help & Site Suggestions Copy email HelloKinsFan@gmail.com Send email to HelloKinsFan@gmail.com" [ref=e109] [cursor=pointer]:
              - generic [ref=e110]: 
              - generic [ref=e112]:
                - generic [ref=e113]: HelloKinsFan@gmail.com
                - generic [ref=e114]: General Chat, Help & Site Suggestions
              - generic [ref=e115]:
                - button "Copy email HelloKinsFan@gmail.com" [ref=e116]:
                  - generic [ref=e117]: 
                  - generic [ref=e118]: Copy email
                - link "Send email to HelloKinsFan@gmail.com" [ref=e119]:
                  - /url: mailto:HelloKinsFan@gmail.com?subject=Kins%20Inquiry%20%26%20Feedback
                  - generic [ref=e120]: 
                  - generic [ref=e121]: Go to mail app
            - button " BookingsKinsBand@gmail.com Shows, Tours & Live Booking Copy email BookingsKinsBand@gmail.com Send email to BookingsKinsBand@gmail.com" [ref=e122] [cursor=pointer]:
              - generic [ref=e123]: 
              - generic [ref=e125]:
                - generic [ref=e126]: BookingsKinsBand@gmail.com
                - generic [ref=e127]: Shows, Tours & Live Booking
              - generic [ref=e128]:
                - button "Copy email BookingsKinsBand@gmail.com" [ref=e129]:
                  - generic [ref=e130]: 
                  - generic [ref=e131]: Copy email
                - link "Send email to BookingsKinsBand@gmail.com" [ref=e132]:
                  - /url: mailto:BookingsKinsBand@gmail.com?subject=Kins%20Booking%20Inquiry
                  - generic [ref=e133]: 
                  - generic [ref=e134]: Go to mail app
          - generic [ref=e135]:
            - button "Suggest improvement or report issue" [ref=e136] [cursor=pointer]:
              - generic [ref=e137]: 
              - generic [ref=e138]: Suggest Feedback
            - button "Tip or support Kins" [ref=e139] [cursor=pointer]:
              - generic [ref=e140]: 
              - generic [ref=e141]: Tip / Support Kins
    - main [ref=e142]:
      - generic [ref=e143]:
        - generic [ref=e144]:
          - heading " Band Members" [level=3] [ref=e145]:
            - generic [ref=e146]: 
            - text: Band Members
          - generic:
            - button "Scroll members left" [disabled]:
              - generic: 
            - button "Scroll members right":
              - generic: 
        - generic [ref=e147]:
          - generic [ref=e148]:
            - generic [ref=e149]:
              - generic [ref=e150]: V
              - generic [ref=e151]: 
              - generic [ref=e152]: VOCALS & GUITAR
            - generic [ref=e153]:
              - heading "Vivian" [level=4] [ref=e154]
              - paragraph [ref=e155]: Melodies & guitar hooks.
          - generic [ref=e156]:
            - generic [ref=e157]:
              - generic [ref=e158]: C
              - generic [ref=e159]: 
              - generic [ref=e160]: GUITAR & VOCALS
            - generic [ref=e161]:
              - heading "Charlie" [level=4] [ref=e162]
              - paragraph [ref=e163]: Lyrics, guitar & band energy.
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e166]: O
              - generic [ref=e167]: 
              - generic [ref=e168]: BASS
            - generic [ref=e169]:
              - heading "Oscar" [level=4] [ref=e170]
              - paragraph [ref=e171]: Basslines & vintage synths.
          - generic [ref=e172]:
            - generic [ref=e173]:
              - generic [ref=e174]: T
              - generic [ref=e175]: 
              - generic [ref=e176]: DRUMS
            - generic [ref=e177]:
              - heading "Trai" [level=4] [ref=e178]
              - paragraph [ref=e179]: Drums & driving heartbeat.
      - text:     +   +   +   +   +
      - generic [ref=e180]:
        - heading " What Inspires Us" [level=3] [ref=e182]:
          - generic [ref=e183]: 
          - text: What Inspires Us
        - tablist "Band Member Inspiration Tabs" [ref=e184]:
          - tab "ALL" [selected] [ref=e185] [cursor=pointer]
          - tab "TRAI" [ref=e186] [cursor=pointer]
          - tab "VIVIAN" [ref=e187] [cursor=pointer]
          - tab "OSCAR" [ref=e188] [cursor=pointer]
          - tab "CHARLIE" [ref=e189] [cursor=pointer]
        - generic [ref=e190]:
          - generic [ref=e191] [cursor=pointer]:
            - generic [ref=e192]:
              - text: 
              - img "Turnip Farm" [ref=e193]
            - generic [ref=e194]:
              - generic [ref=e195]: Turnip Farm
              - generic [ref=e197]: Dinosaur Jr.
              - generic [ref=e198]:
                - generic [ref=e199]: Grunge
                - generic "Curated by Charlie" [ref=e201]: C
            - button "Play song" [ref=e202]:
              - generic [ref=e203]: 
          - generic [ref=e204] [cursor=pointer]:
            - generic [ref=e205]:
              - text: 
              - img "(David Bowie I Love You) Since I Was Six" [ref=e206]
            - generic [ref=e207]:
              - generic [ref=e208]: (David Bowie I Love You) Since I Was Six
              - generic [ref=e210]: The Brian Jonestown Massacre
              - generic [ref=e211]:
                - generic [ref=e212]: Neo-Psychedelia
                - generic "Curated by Charlie" [ref=e214]: C
            - button "Play song" [ref=e215]:
              - generic [ref=e216]: 
          - generic [ref=e217] [cursor=pointer]:
            - generic [ref=e218]:
              - text: 
              - img "Underwear" [ref=e219]
            - generic [ref=e220]:
              - generic [ref=e221]: Underwear
              - generic [ref=e223]: Pulp
              - generic [ref=e224]:
                - generic [ref=e225]: Britpop
                - generic "Curated by Charlie" [ref=e227]: C
            - button "Play song" [ref=e228]:
              - generic [ref=e229]: 
          - generic [ref=e230] [cursor=pointer]:
            - generic [ref=e231]:
              - text: 
              - img "Unmade Bed" [ref=e232]
            - generic [ref=e233]:
              - generic [ref=e234]: Unmade Bed
              - generic [ref=e236]: Sonic Youth
              - generic [ref=e237]:
                - generic [ref=e238]: Noise Rock
                - generic "Curated by Charlie" [ref=e240]: C
            - button "Play song" [ref=e241]:
              - generic [ref=e242]: 
        - generic [ref=e243]:
          - button "Previous Page" [disabled] [ref=e244]:
            - generic [ref=e245]: 
          - generic [ref=e246]:
            - button "Page 1" [ref=e247] [cursor=pointer]
            - button "Page 2" [ref=e248] [cursor=pointer]
            - button "Page 3" [ref=e249] [cursor=pointer]
            - button "Page 4" [ref=e250] [cursor=pointer]
            - button "Page 5" [ref=e251] [cursor=pointer]
          - button "Next Page" [ref=e252] [cursor=pointer]:
            - generic [ref=e253]: 
      - generic [ref=e255]:
        - generic [ref=e256]:
          - generic [ref=e257]:
            - generic [ref=e258]: 
            - generic [ref=e260]:
              - heading "KINS TOOLS" [level=3] [ref=e261]
              - paragraph [ref=e262]: Offline-ready browser tools for musicians.
          - button "Downloading…" [ref=e263] [cursor=pointer]:
            - generic [ref=e264]: 
        - article [ref=e266]:
          - generic [ref=e267]:
            - heading "METRONOME" [level=4] [ref=e276]
            - paragraph [ref=e277]: Tap tempo · 4/4, 6/8, 7/8 · Accents
            - link "Launch Metronome → - Open METRONOME" [ref=e279] [cursor=pointer]:
              - /url: /metronome
              - generic [ref=e280]: Open Metro →
      - region "About KINS Band, Discography, and Booking" [ref=e281]:
        - heading "About KINS (@KinsBandOfficial)" [level=2] [ref=e282]
        - paragraph [ref=e283]: KINS is an Australian four-piece post-punk and alternative rock band hailing from Newcastle, New South Wales (Hunter Region, East Coast Australia, roughly 2 hours north of Sydney). Formed in 2024, KINS delivers high-voltage hooks, driving rhythm section urgency, atmospheric wall-of-sound guitar tones, and visceral live performance energy.
        - paragraph [ref=e284]: "Recommended If You Like (RIYL): Fontaines D.C., IDLES, The Murder Capital, The Cure, and Gang of Youths."
        - heading "Band Members & Instrumentation" [level=3] [ref=e285]
        - list [ref=e286]:
          - listitem [ref=e287]:
            - strong [ref=e288]: "Vivian:"
            - text: Lead Vocals & Rhythm Electric Guitar
          - listitem [ref=e289]:
            - strong [ref=e290]: "Charlie:"
            - text: Lead Electric Guitar & Backing Vocals
          - listitem [ref=e291]:
            - strong [ref=e292]: "Oscar:"
            - text: Bass Guitar & Synthesizers
          - listitem [ref=e293]:
            - strong [ref=e294]: "Trai:"
            - text: Drums & Percussion
        - heading "Official Music Streaming & Booking" [level=3] [ref=e295]
        - paragraph [ref=e296]: Stream KINS music officially on Spotify, Apple Music, YouTube Music, Bandcamp, and SoundCloud. For concert bookings and tour inquiries, contact BookingsKinsBand@gmail.com.
      - generic [ref=e298]:
        - generic [ref=e299]:
          - button "Light Mode" [ref=e300] [cursor=pointer]:
            - generic [ref=e301]: 
          - generic [ref=e302]:
            - generic [ref=e303]: 
            - generic [ref=e304]: "@2026 KINS."
          - button "Dark Mode" [pressed] [ref=e305] [cursor=pointer]:
            - generic [ref=e306]: 
        - navigation "Site Links and Legal Navigation" [ref=e307]:
          - button "FEEDBACK" [ref=e308] [cursor=pointer]
          - generic [ref=e309]: •
          - button "LEGAL" [ref=e310] [cursor=pointer]
        - button "BAND FAQ" [ref=e313] [cursor=pointer]:
          - generic [ref=e314]:
            - generic [ref=e315]: 
            - generic [ref=e316]: BAND FAQ
          - generic [ref=e317]: 
  - dialog:
    - generic:
      - generic:
        - generic:
          - generic: 
          - textbox:
            - /placeholder: Search covers by title, artist, or tag...
          - text: 
        - button:
          - generic: 
      - generic:
        - generic:
          - button: All
          - button: Full Band
          - button: Acoustic
          - button: Shorts
      - generic:
        - region:
          - generic:
            - generic: CURRENTLY LEARNING
            - generic:
              - heading [level=4]: Just Like Heaven
              - paragraph:
                - text: Original by
                - strong: The Cure
            - generic:
              - link:
                - /url: https://www.songsterr.com/a/wa/search?pattern=The%20Cure%20Just%20Like%20Heaven
                - generic: 
                - generic: Tabs ↗
        - generic:
          - heading [level=3]: Latest Covers
  - text: "              #         "
  - generic:
    - text:        
    - generic [ref=e319]:
      - generic [ref=e320]:
        - generic [ref=e321]: INSPIRATION
        - slider "Audio playback progress"
        - generic [ref=e322] [cursor=pointer]:
          - generic [ref=e323]:
            - generic [ref=e324]:
              - img "The Cure - Just Like Heaven" [ref=e325]
              - text: 
            - generic [ref=e326]:
              - img "Weezer - Do You Wanna Get High?" [ref=e327]
              - text: 
            - generic [ref=e328]:
              - img "Pulp - Common People" [ref=e329]
              - text: 
          - generic [ref=e330]:
            - generic [ref=e331]: WHAT INSPIRES US!
            - generic [ref=e332]: listen to what inspires KINS
          - button "Auto-mix inspiration songs" [ref=e333]:
            - generic [ref=e334]: 
        - text:   
      - button "Tour dates & Gig Map (Coming Soon)" [ref=e335] [cursor=pointer]:
        - generic [ref=e336]: GIG MAP
        - generic [ref=e337]: 
        - generic: COMING SOON
```

# Test source

```ts
  373 |     await expect(socialsTab).toBeVisible();
  374 |     await expect(streamsTab).toBeHidden();
  375 |     await expect(communityTab).toBeHidden();
  376 |   });
  377 | 
  378 |   test('referral routing matrix opens Streams tab and highlights recommendations for ?ref=spotify', async ({ page }) => {
  379 |     await page.goto('/?ref=spotify');
  380 | 
  381 |     const streamsBtn = page.locator('#tabStreamsBtn');
  382 |     const socialsBtn = page.locator('#tabSocialsBtn');
  383 |     const streamsTab = page.locator('#streamsTab');
  384 |     const socialsTab = page.locator('#socialsTab');
  385 |     const communityTab = page.locator('#communityTab');
  386 | 
  387 |     // Verify Streams tab is opened by default for spotify origin
  388 |     await expect(streamsBtn).toHaveClass(/active/);
  389 |     await expect(socialsBtn).not.toHaveClass(/active/);
  390 |     await expect(streamsTab).toBeVisible();
  391 |     await expect(socialsTab).toBeHidden();
  392 | 
  393 |     // Verify recommended stream platforms have .is-recommended and minimalist ★ badge
  394 |     const appleMusicCard = streamsTab.locator('a[data-name="Apple Music"]');
  395 |     const ytMusicCard = streamsTab.locator('a[data-name="YT Music"]');
  396 |     await expect(appleMusicCard).toHaveClass(/is-recommended/);
  397 |     await expect(appleMusicCard.locator('.rec-star-badge')).toBeVisible();
  398 |     await expect(ytMusicCard).toHaveClass(/is-recommended/);
  399 |     await expect(ytMusicCard.locator('.rec-star-badge')).toBeVisible();
  400 | 
  401 |     // Switch to Socials tab and check recommended socials (Instagram, TikTok)
  402 |     await socialsBtn.click();
  403 |     const instaCard = socialsTab.locator('a[data-name="Instagram"]');
  404 |     const tikTokCard = socialsTab.locator('a[data-name="TikTok"]');
  405 |     await expect(instaCard).toHaveClass(/is-recommended/);
  406 |     await expect(tikTokCard).toHaveClass(/is-recommended/);
  407 | 
  408 |     // Switch to Community tab and check recommended community (Discord, Reddit)
  409 |     const communityBtn = page.locator('#tabCommunityBtn');
  410 |     await communityBtn.click();
  411 |     const discordCard = communityTab.locator('a[data-name="Discord"]');
  412 |     const redditCard = communityTab.locator('a[data-name="Reddit"]');
  413 |     await expect(discordCard).toHaveClass(/is-recommended/);
  414 |     await expect(redditCard).toHaveClass(/is-recommended/);
  415 |   });
  416 | 
  417 |   test('referral routing matrix opens Community tab and highlights recommendations for ?ref=discord', async ({ page }) => {
  418 |     await page.goto('/?ref=discord');
  419 | 
  420 |     const communityBtn = page.locator('#tabCommunityBtn');
  421 |     const communityTab = page.locator('#communityTab');
  422 | 
  423 |     // Verify Community tab is opened by default for discord origin
  424 |     await expect(communityBtn).toHaveClass(/active/);
  425 |     await expect(communityTab).toBeVisible();
  426 | 
  427 |     // Verify recommended community platforms for Discord (Reddit, Substack)
  428 |     const redditCard = communityTab.locator('a[data-name="Reddit"]');
  429 |     const substackCard = communityTab.locator('a[data-name="Substack"]');
  430 |     await expect(redditCard).toHaveClass(/is-recommended/);
  431 |     await expect(substackCard).toHaveClass(/is-recommended/);
  432 |   });
  433 | 
  434 |   test('share modal PWA button renders minimalist CTA and transitions to installed state', async ({ page }) => {
  435 |     await page.goto('/');
  436 | 
  437 |     const shareBtn = page.locator('#shareBtn');
  438 |     await expect(shareBtn).toBeVisible();
  439 |     await shareBtn.click();
  440 | 
  441 |     const shareModal = page.locator('#shareModal');
  442 |     await expect(shareModal).toBeVisible();
  443 | 
  444 |     // Verify PWA installation group
  445 |     const pwaGroup = page.locator('#pwaInstallFieldGroup');
  446 |     await expect(pwaGroup).toBeVisible();
  447 | 
  448 |     const pwaBtn = page.locator('#downloadPwaCtaBtn');
  449 |     await expect(pwaBtn).toBeVisible();
  450 |     await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('Install App');
  451 |     await expect(pwaBtn.locator('#pwaProgressStatus')).toBeVisible();
  452 | 
  453 |     // Trigger mock global install event to verify reactive state transition
  454 |     await page.evaluate(() => {
  455 |       window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
  456 |     });
  457 | 
  458 |     // Verify button updates to installed state
  459 |     await expect(pwaBtn).toHaveClass(/download-complete/);
  460 |     await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('App Installed');
  461 |     await expect(pwaBtn.locator('#pwaProgressStatus')).toHaveText('INSTALLED ✓');
  462 |     await expect(pwaBtn.locator('#pwaBtnIcon')).toHaveClass(/fa-circle-check/);
  463 |   });
  464 | 
  465 |   test('covers search menu opens with mock data, filters by category and search, and triggers video modal', async ({ page }) => {
  466 |     await page.goto('/');
  467 | 
  468 |     const searchBtn = page.locator('#headerSearchPillBtn');
  469 |     await expect(searchBtn).toBeVisible();
  470 |     await searchBtn.click();
  471 | 
  472 |     const overlay = page.locator('#coversSearchOverlay');
> 473 |     await expect(overlay).toHaveClass(/active/);
      |                           ^ Error: expect(locator).toHaveClass(expected) failed
  474 | 
  475 |     const resultsList = page.locator('#coversResultsList');
  476 |     await expect(resultsList).toBeVisible();
  477 | 
  478 |     // Verify Currently Learning card: Just Like Heaven by The Cure
  479 |     const learningSection = page.locator('#coversLearningSection');
  480 |     await expect(learningSection).toBeVisible();
  481 |     await expect(learningSection.locator('.learning-song-title')).toContainText('Just Like Heaven');
  482 |     await expect(learningSection.locator('.learning-artist-line')).toContainText('The Cure');
  483 | 
  484 |     // Verify tabs button is present and setlist button is removed
  485 |     const learningTabsBtn = learningSection.locator('#learningSongsterrBtn');
  486 |     await expect(learningTabsBtn).toBeVisible();
  487 |     await expect(learningTabsBtn).toContainText('Tabs');
  488 |     await expect(learningSection.locator('#learningVoteBtn')).toHaveCount(0);
  489 | 
  490 |     // 1. Verify Category Buttons: "All" label exists, styled with 2px solid border, and never squeezed
  491 |     const allPill = page.locator('.cover-category-pill[data-category="all"]');
  492 |     await expect(allPill).toBeVisible();
  493 |     await expect(allPill).toHaveText('All');
  494 |     await expect(allPill).toHaveClass(/active/);
  495 | 
  496 |     // Verify button does not get squeezed when clicked or active
  497 |     const allBoxBefore = await allPill.boundingBox();
  498 |     expect(allBoxBefore?.width).toBeGreaterThan(40);
  499 | 
  500 |     const acousticPill = page.locator('.cover-category-pill[data-category="acoustic"]');
  501 |     await acousticPill.click();
  502 |     await expect(acousticPill).toHaveClass(/active/);
  503 |     await expect(allPill).not.toHaveClass(/active/);
  504 | 
  505 |     await allPill.click();
  506 |     await expect(allPill).toHaveClass(/active/);
  507 |     const allBoxAfter = await allPill.boundingBox();
  508 |     expect(allBoxAfter?.width).toBeGreaterThan(40);
  509 | 
  510 |     // 2. Verify Search Input
  511 |     const searchInput = page.locator('#overlaySearchInput');
  512 |     await searchInput.fill('The Cure');
  513 |     await expect(searchInput).toHaveValue('The Cure');
  514 | 
  515 |     // Clear search text
  516 |     const clearBtn = page.locator('#clearSearchInputBtn');
  517 |     await clearBtn.click();
  518 |     await expect(searchInput).toHaveValue('');
  519 | 
  520 |     // 3. Verify Empty State when no covers released yet
  521 |     const emptyCard = resultsList.locator('.empty-search-card');
  522 |     await expect(emptyCard).toBeVisible();
  523 |     await expect(emptyCard.locator('.empty-search-title')).toContainText(/no (covers|released covers)/i);
  524 | 
  525 |     // 4. Verify "Request a Cover!" Button & Modal
  526 |     const emptyRequestBtn = emptyCard.locator('#emptyRequestTriggerBtn');
  527 |     await expect(emptyRequestBtn).toBeVisible();
  528 |     await expect(emptyRequestBtn).toContainText('Request a Cover!');
  529 | 
  530 |     // Click "Request a Cover!" button to open Request Song Modal
  531 |     await emptyRequestBtn.click();
  532 | 
  533 |     const requestModal = page.locator('#requestSongModal');
  534 |     await expect(requestModal).toBeVisible();
  535 |     await expect(requestModal).toHaveClass(/active/);
  536 |     await expect(page.locator('#requestSongPillTitle')).toContainText(/request a cover/i);
  537 | 
  538 |     // Verify toggle buttons (side-by-side in full view, normal text, no icons)
  539 |     const reqVideoBtn = page.locator('#reqTypeVideoBtn');
  540 |     const reqSetlistBtn = page.locator('#reqTypeSetlistBtn');
  541 |     await expect(reqVideoBtn).toBeVisible();
  542 |     await expect(reqSetlistBtn).toBeVisible();
  543 |     await expect(reqVideoBtn).toContainText('Cover Video');
  544 |     await expect(reqSetlistBtn).toContainText('Request as Setlist');
  545 | 
  546 |     // Verify modal elements
  547 |     const modalTitleInput = page.locator('#modalReqSongTitle');
  548 |     const modalArtistInput = page.locator('#modalReqArtist');
  549 |     await expect(modalTitleInput).toBeVisible();
  550 |     await expect(modalArtistInput).toBeVisible();
  551 | 
  552 |     // Close Request Song Modal
  553 |     const closeReqBtn = page.locator('#closeRequestSongModalBtn');
  554 |     await closeReqBtn.click();
  555 |     await expect(requestModal).not.toHaveClass(/active/);
  556 | 
  557 |     // Verify search overlay is still intact and open behind it
  558 |     await expect(overlay).toHaveClass(/active/);
  559 | 
  560 |     // Close Covers Search Overlay
  561 |     const closeOverlayBtn = page.locator('#closeSearchOverlayBtn');
  562 |     await closeOverlayBtn.click();
  563 |     await expect(overlay).not.toHaveClass(/active/);
  564 |   });
  565 | 
  566 |   test('featured card on homepage renders active state (release video or upcoming teaser)', async ({ page }) => {
  567 |     await page.goto('/');
  568 | 
  569 |     if (heroConfig.activeState === 'upcoming') {
  570 |       const upcomingTeaser = page.locator('#varUpcomingMinimalTeaser');
  571 |       await expect(upcomingTeaser).toBeVisible();
  572 |       await expect(upcomingTeaser.locator('.upcoming-teaser-badge')).toContainText('UPCOMING RELEASE');
  573 |       await expect(upcomingTeaser.locator('.upcoming-teaser-title')).toContainText('New music is on the way');
```