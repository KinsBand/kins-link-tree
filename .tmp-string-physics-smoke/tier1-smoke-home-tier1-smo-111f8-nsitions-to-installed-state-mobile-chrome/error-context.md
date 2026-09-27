# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\home.spec.ts >> tier1 smoke — home hub >> share modal PWA button renders minimalist CTA and transitions to installed state
- Location: e2e\tier1-smoke\home.spec.ts:438:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#shareModal')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#shareModal')
    13 × locator resolved to <div role="dialog" id="shareModal" aria-modal="true" data-astro-cid-5x2zp4gg="" class="modal-backdrop hidden" data-track-container="modal:share" aria-label="Share Kins Official Page">…</div>
       - unexpected value "hidden"

```

```yaml
- banner:
  - button "Subscribe to Kins": 
  - button "Search cover videos":  search covers...
  - button "Share page": 
- complementary:
  - img "Kins logo banner"
  - text: INDEPENDENT 4-PIECE ROCK BAND NEWCASTLE, AUSTRALIA  UPCOMING RELEASE
  - heading "New music is on the way" [level=4]
  - paragraph: First official cover coming soon...
  - tablist:
    - tab "STREAMS"
    - tab "SOCIALS" [selected]
    - tab "COMMUNITY"
  - tabpanel:
    - link " Instagram":
      - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
    - link " TikTok":
      - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
    - link " YouTube":
      - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
    - link " Facebook":
      - /url: https://www.facebook.com/share/1LU7GTyCBW/
    - link " Twitter / X":
      - /url: https://x.com/KinsBandOfficial
    - link " Threads":
      - /url: https://www.threads.com/@kinsbandofficial
    - link " Snapchat":
      - /url: https://snapchat.com/add/KinsBandOfficial
    - link " LinkedIn":
      - /url: https://linkedin.com/company/KinsBandOfficial
    - button "Toggle all social channels":   Other (+2) 
  - region "Fan Club Subscription (Coming Soon)":
    - heading "Subscribe to Kins!" [level=3]
    - text: Under Works
    - paragraph: Fan club drops & newsletter engine currently under works. Stay tuned!
    - button "Subscribe with Google (Coming Soon)": Google Coming Soon
    - text: OR WITH EMAIL
    - textbox "Fan club drops launching soon..."
    - button "Join Kins Fan Club (Coming Soon)": SOON ➔
    - button "Fan club subscription coming soon. Tap for more info."
  - text:  Official Contacts & Feedback
  - button " HelloKinsFan@gmail.com General Chat, Help & Site Suggestions Copy email HelloKinsFan@gmail.com Send email to HelloKinsFan@gmail.com":
    - text:  HelloKinsFan@gmail.com General Chat, Help & Site Suggestions
    - button "Copy email HelloKinsFan@gmail.com": Copy email
    - link "Send email to HelloKinsFan@gmail.com":
      - /url: mailto:HelloKinsFan@gmail.com?subject=Kins%20Inquiry%20%26%20Feedback
      - text: Go to mail app
  - button " BookingsKinsBand@gmail.com Shows, Tours & Live Booking Copy email BookingsKinsBand@gmail.com Send email to BookingsKinsBand@gmail.com":
    - text:  BookingsKinsBand@gmail.com Shows, Tours & Live Booking
    - button "Copy email BookingsKinsBand@gmail.com": Copy email
    - link "Send email to BookingsKinsBand@gmail.com":
      - /url: mailto:BookingsKinsBand@gmail.com?subject=Kins%20Booking%20Inquiry
      - text: Go to mail app
  - button "Suggest improvement or report issue": Suggest Feedback
  - button "Tip or support Kins": Tip / Support Kins
- main:
  - heading " Band Members" [level=3]
  - button "Scroll members left" [disabled]: 
  - button "Scroll members right": 
  - text: V  VOCALS & GUITAR
  - heading "Vivian" [level=4]
  - paragraph: Melodies & guitar hooks.
  - text: C  GUITAR & VOCALS
  - heading "Charlie" [level=4]
  - paragraph: Lyrics, guitar & band energy.
  - text: O  BASS
  - heading "Oscar" [level=4]
  - paragraph: Basslines & vintage synths.
  - text: T  DRUMS
  - heading "Trai" [level=4]
  - paragraph: Drums & driving heartbeat.
  - heading " What Inspires Us" [level=3]
  - tablist "Band Member Inspiration Tabs":
    - tab "ALL" [selected]
    - tab "TRAI"
    - tab "VIVIAN"
    - tab "OSCAR"
    - tab "CHARLIE"
  - img "Turnip Farm"
  - text: Turnip Farm Dinosaur Jr. Grunge C
  - button "Play song": 
  - img "(David Bowie I Love You) Since I Was Six"
  - text: (David Bowie I Love You) Since I Was Six The Brian Jonestown Massacre Neo-Psychedelia C
  - button "Play song": 
  - img "Underwear"
  - text: Underwear Pulp Britpop C
  - button "Play song": 
  - img "Unmade Bed"
  - text: Unmade Bed Sonic Youth Noise Rock C
  - button "Play song": 
  - button "Previous Page" [disabled]: 
  - button "Page 1"
  - button "Page 2"
  - button "Page 3"
  - button "Page 4"
  - button "Page 5"
  - button "Next Page": 
  - heading "KINS TOOLS" [level=3]
  - paragraph: Offline-ready browser tools for musicians.
  - button "App downloaded and ready offline"
  - article:
    - heading "TUNER" [level=4]
    - paragraph: Guided + chromatic · Precision modes · Calibrated input
    - link "Launch Tuner → - Open TUNER":
      - /url: /tuner
      - text: Open Tuner →
  - article:
    - heading "METRONOME" [level=4]
    - paragraph: Tap tempo · 4/4, 6/8, 7/8 · Accents
    - link "Launch Metronome → - Open METRONOME":
      - /url: /metronome
      - text: Open Metro →
  - region "About KINS Band, Discography, and Booking":
    - heading "About KINS (@KinsBandOfficial)" [level=2]
    - paragraph: KINS is an Australian four-piece post-punk and alternative rock band hailing from Newcastle, New South Wales (Hunter Region, East Coast Australia, roughly 2 hours north of Sydney). Formed in 2024, KINS delivers high-voltage hooks, driving rhythm section urgency, atmospheric wall-of-sound guitar tones, and visceral live performance energy.
    - paragraph: "Recommended If You Like (RIYL): Fontaines D.C., IDLES, The Murder Capital, The Cure, and Gang of Youths."
    - heading "Band Members & Instrumentation" [level=3]
    - list:
      - listitem:
        - strong: "Vivian:"
        - text: Lead Vocals & Rhythm Electric Guitar
      - listitem:
        - strong: "Charlie:"
        - text: Lead Electric Guitar & Backing Vocals
      - listitem:
        - strong: "Oscar:"
        - text: Bass Guitar & Synthesizers
      - listitem:
        - strong: "Trai:"
        - text: Drums & Percussion
    - heading "Official Music Streaming & Booking" [level=3]
    - paragraph: Stream KINS music officially on Spotify, Apple Music, YouTube Music, Bandcamp, and SoundCloud. For concert bookings and tour inquiries, contact BookingsKinsBand@gmail.com.
  - button "Light Mode"
  - text: "@2026 KINS."
  - button "Dark Mode" [pressed]
  - navigation "Site Links and Legal Navigation":
    - button "FEEDBACK"
    - button "LEGAL"
  - button "BAND FAQ"
- text: INSPIRATION
- slider "Audio playback progress"
- img "The Cure - Just Like Heaven"
- img "Weezer - Do You Wanna Get High?"
- img "Pulp - Common People"
- text: WHAT INSPIRES US! listen to what inspires KINS
- button "Auto-mix inspiration songs": 
- button "Tour dates & Gig Map (Coming Soon)": GIG MAP  COMING SOON
```

# Test source

```ts
  346 | 
  347 |     // Verify primary socials exist
  348 |     await expect(socialsTab.locator('a[data-platform="instagram"]')).toBeVisible();
  349 |     await expect(socialsTab.locator('a[data-platform="tiktok"]')).toBeVisible();
  350 | 
  351 |     // Switch to Streams tab
  352 |     await streamsBtn.click();
  353 |     await expect(streamsBtn).toHaveClass(/active/);
  354 |     await expect(socialsBtn).not.toHaveClass(/active/);
  355 |     await expect(communityBtn).not.toHaveClass(/active/);
  356 |     await expect(streamsTab).toBeVisible();
  357 |     await expect(socialsTab).toBeHidden();
  358 |     await expect(communityTab).toBeHidden();
  359 |     await expect(streamsTab.locator('a[data-platform="spotify"]')).toBeVisible();
  360 | 
  361 |     // Switch to Community tab
  362 |     await communityBtn.click();
  363 |     await expect(communityBtn).toHaveClass(/active/);
  364 |     await expect(streamsBtn).not.toHaveClass(/active/);
  365 |     await expect(socialsBtn).not.toHaveClass(/active/);
  366 |     await expect(communityTab).toBeVisible();
  367 |     await expect(streamsTab).toBeHidden();
  368 |     await expect(socialsTab).toBeHidden();
  369 |     await expect(communityTab.locator('a[data-platform="discord"]')).toBeVisible();
  370 |     await expect(communityTab.locator('a[data-platform="reddit"]')).toBeVisible();
  371 |     await expect(communityTab.locator('a[data-platform="patreon"]')).toBeVisible();
  372 |     await expect(communityTab.locator('a[data-platform="pinterest"]')).toBeVisible();
  373 | 
  374 |     // Switch back to Socials tab
  375 |     await socialsBtn.click();
  376 |     await expect(socialsBtn).toHaveClass(/active/);
  377 |     await expect(socialsTab).toBeVisible();
  378 |     await expect(streamsTab).toBeHidden();
  379 |     await expect(communityTab).toBeHidden();
  380 |   });
  381 | 
  382 |   test('referral routing matrix opens Streams tab and highlights recommendations for ?ref=spotify', async ({ page }) => {
  383 |     await page.goto('/?ref=spotify');
  384 | 
  385 |     const streamsBtn = page.locator('#tabStreamsBtn');
  386 |     const socialsBtn = page.locator('#tabSocialsBtn');
  387 |     const streamsTab = page.locator('#streamsTab');
  388 |     const socialsTab = page.locator('#socialsTab');
  389 |     const communityTab = page.locator('#communityTab');
  390 | 
  391 |     // Verify Streams tab is opened by default for spotify origin
  392 |     await expect(streamsBtn).toHaveClass(/active/);
  393 |     await expect(socialsBtn).not.toHaveClass(/active/);
  394 |     await expect(streamsTab).toBeVisible();
  395 |     await expect(socialsTab).toBeHidden();
  396 | 
  397 |     // Verify recommended stream platforms have .is-recommended and minimalist ★ badge
  398 |     const appleMusicCard = streamsTab.locator('a[data-name="Apple Music"]');
  399 |     const ytMusicCard = streamsTab.locator('a[data-name="YT Music"]');
  400 |     await expect(appleMusicCard).toHaveClass(/is-recommended/);
  401 |     await expect(appleMusicCard.locator('.rec-star-badge')).toBeVisible();
  402 |     await expect(ytMusicCard).toHaveClass(/is-recommended/);
  403 |     await expect(ytMusicCard.locator('.rec-star-badge')).toBeVisible();
  404 | 
  405 |     // Switch to Socials tab and check recommended socials (Instagram, TikTok)
  406 |     await socialsBtn.click();
  407 |     const instaCard = socialsTab.locator('a[data-name="Instagram"]');
  408 |     const tikTokCard = socialsTab.locator('a[data-name="TikTok"]');
  409 |     await expect(instaCard).toHaveClass(/is-recommended/);
  410 |     await expect(tikTokCard).toHaveClass(/is-recommended/);
  411 | 
  412 |     // Switch to Community tab and check recommended community (Discord, Reddit)
  413 |     const communityBtn = page.locator('#tabCommunityBtn');
  414 |     await communityBtn.click();
  415 |     const discordCard = communityTab.locator('a[data-name="Discord"]');
  416 |     const redditCard = communityTab.locator('a[data-name="Reddit"]');
  417 |     await expect(discordCard).toHaveClass(/is-recommended/);
  418 |     await expect(redditCard).toHaveClass(/is-recommended/);
  419 |   });
  420 | 
  421 |   test('referral routing matrix opens Community tab and highlights recommendations for ?ref=discord', async ({ page }) => {
  422 |     await page.goto('/?ref=discord');
  423 | 
  424 |     const communityBtn = page.locator('#tabCommunityBtn');
  425 |     const communityTab = page.locator('#communityTab');
  426 | 
  427 |     // Verify Community tab is opened by default for discord origin
  428 |     await expect(communityBtn).toHaveClass(/active/);
  429 |     await expect(communityTab).toBeVisible();
  430 | 
  431 |     // Verify recommended community platforms for Discord (Reddit, Substack)
  432 |     const redditCard = communityTab.locator('a[data-name="Reddit"]');
  433 |     const substackCard = communityTab.locator('a[data-name="Substack"]');
  434 |     await expect(redditCard).toHaveClass(/is-recommended/);
  435 |     await expect(substackCard).toHaveClass(/is-recommended/);
  436 |   });
  437 | 
  438 |   test('share modal PWA button renders minimalist CTA and transitions to installed state', async ({ page }) => {
  439 |     await page.goto('/');
  440 | 
  441 |     const shareBtn = page.locator('#shareBtn');
  442 |     await expect(shareBtn).toBeVisible();
  443 |     await shareBtn.click();
  444 | 
  445 |     const shareModal = page.locator('#shareModal');
> 446 |     await expect(shareModal).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  447 | 
  448 |     // Verify PWA installation group
  449 |     const pwaGroup = page.locator('#pwaInstallFieldGroup');
  450 |     await expect(pwaGroup).toBeVisible();
  451 | 
  452 |     const pwaBtn = page.locator('#downloadPwaCtaBtn');
  453 |     await expect(pwaBtn).toBeVisible();
  454 |     await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('Install App');
  455 |     await expect(pwaBtn.locator('#pwaProgressStatus')).toBeVisible();
  456 | 
  457 |     // Trigger mock global install event to verify reactive state transition
  458 |     await page.evaluate(() => {
  459 |       window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
  460 |     });
  461 | 
  462 |     // Verify button updates to installed state
  463 |     await expect(pwaBtn).toHaveClass(/download-complete/);
  464 |     await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('App Installed');
  465 |     await expect(pwaBtn.locator('#pwaProgressStatus')).toHaveText('INSTALLED ✓');
  466 |     await expect(pwaBtn.locator('#pwaBtnIcon')).toHaveClass(/fa-circle-check/);
  467 |   });
  468 | 
  469 |   test('covers search menu opens with mock data, filters by category and search, and triggers video modal', async ({ page }) => {
  470 |     await page.goto('/');
  471 | 
  472 |     const searchBtn = page.locator('#headerSearchPillBtn');
  473 |     await expect(searchBtn).toBeVisible();
  474 |     await searchBtn.click();
  475 | 
  476 |     const overlay = page.locator('#coversSearchOverlay');
  477 |     await expect(overlay).toHaveClass(/active/);
  478 | 
  479 |     const resultsList = page.locator('#coversResultsList');
  480 |     await expect(resultsList).toBeVisible();
  481 | 
  482 |     // Verify Currently Learning card: Just Like Heaven by The Cure
  483 |     const learningSection = page.locator('#coversLearningSection');
  484 |     await expect(learningSection).toBeVisible();
  485 |     await expect(learningSection.locator('.learning-song-title')).toContainText('Just Like Heaven');
  486 |     await expect(learningSection.locator('.learning-artist-line')).toContainText('The Cure');
  487 | 
  488 |     // Verify tabs button is present and setlist button is removed
  489 |     const learningTabsBtn = learningSection.locator('#learningSongsterrBtn');
  490 |     await expect(learningTabsBtn).toBeVisible();
  491 |     await expect(learningTabsBtn).toContainText('Tabs');
  492 |     await expect(learningSection.locator('#learningVoteBtn')).toHaveCount(0);
  493 | 
  494 |     // 1. Verify Category Buttons: "All" label exists, styled with 2px solid border, and never squeezed
  495 |     const allPill = page.locator('.cover-category-pill[data-category="all"]');
  496 |     await expect(allPill).toBeVisible();
  497 |     await expect(allPill).toHaveText('All');
  498 |     await expect(allPill).toHaveClass(/active/);
  499 | 
  500 |     // Verify button does not get squeezed when clicked or active
  501 |     const allBoxBefore = await allPill.boundingBox();
  502 |     expect(allBoxBefore?.width).toBeGreaterThan(40);
  503 | 
  504 |     const acousticPill = page.locator('.cover-category-pill[data-category="acoustic"]');
  505 |     await acousticPill.click();
  506 |     await expect(acousticPill).toHaveClass(/active/);
  507 |     await expect(allPill).not.toHaveClass(/active/);
  508 | 
  509 |     await allPill.click();
  510 |     await expect(allPill).toHaveClass(/active/);
  511 |     const allBoxAfter = await allPill.boundingBox();
  512 |     expect(allBoxAfter?.width).toBeGreaterThan(40);
  513 | 
  514 |     // 2. Verify Search Input
  515 |     const searchInput = page.locator('#overlaySearchInput');
  516 |     await searchInput.fill('The Cure');
  517 |     await expect(searchInput).toHaveValue('The Cure');
  518 | 
  519 |     // Clear search text
  520 |     const clearBtn = page.locator('#clearSearchInputBtn');
  521 |     await clearBtn.click();
  522 |     await expect(searchInput).toHaveValue('');
  523 | 
  524 |     // 3. Verify Empty State when no covers released yet
  525 |     const emptyCard = resultsList.locator('.empty-search-card');
  526 |     await expect(emptyCard).toBeVisible();
  527 |     await expect(emptyCard.locator('.empty-search-title')).toContainText(/no (covers|released covers)/i);
  528 | 
  529 |     // 4. Verify "Request a Cover!" Button & Modal
  530 |     const emptyRequestBtn = emptyCard.locator('#emptyRequestTriggerBtn');
  531 |     await expect(emptyRequestBtn).toBeVisible();
  532 |     await expect(emptyRequestBtn).toContainText('Request a Cover!');
  533 | 
  534 |     // Click "Request a Cover!" button to open Request Song Modal
  535 |     await emptyRequestBtn.click();
  536 | 
  537 |     const requestModal = page.locator('#requestSongModal');
  538 |     await expect(requestModal).toBeVisible();
  539 |     await expect(requestModal).toHaveClass(/active/);
  540 |     await expect(page.locator('#requestSongPillTitle')).toContainText(/request a cover/i);
  541 | 
  542 |     // Verify toggle buttons (side-by-side in full view, normal text, no icons)
  543 |     const reqVideoBtn = page.locator('#reqTypeVideoBtn');
  544 |     const reqSetlistBtn = page.locator('#reqTypeSetlistBtn');
  545 |     await expect(reqVideoBtn).toBeVisible();
  546 |     await expect(reqSetlistBtn).toBeVisible();
```