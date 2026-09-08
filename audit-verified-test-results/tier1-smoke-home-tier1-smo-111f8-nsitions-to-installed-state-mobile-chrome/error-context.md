# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\home.spec.ts >> tier1 smoke — home hub >> share modal PWA button renders minimalist CTA and transitions to installed state
- Location: e2e\tier1-smoke\home.spec.ts:434:3

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
  - button "Downloading…"
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
  342 | 
  343 |     // Verify primary socials exist
  344 |     await expect(socialsTab.locator('a[data-platform="instagram"]')).toBeVisible();
  345 |     await expect(socialsTab.locator('a[data-platform="tiktok"]')).toBeVisible();
  346 | 
  347 |     // Switch to Streams tab
  348 |     await streamsBtn.click();
  349 |     await expect(streamsBtn).toHaveClass(/active/);
  350 |     await expect(socialsBtn).not.toHaveClass(/active/);
  351 |     await expect(communityBtn).not.toHaveClass(/active/);
  352 |     await expect(streamsTab).toBeVisible();
  353 |     await expect(socialsTab).toBeHidden();
  354 |     await expect(communityTab).toBeHidden();
  355 |     await expect(streamsTab.locator('a[data-platform="spotify"]')).toBeVisible();
  356 | 
  357 |     // Switch to Community tab
  358 |     await communityBtn.click();
  359 |     await expect(communityBtn).toHaveClass(/active/);
  360 |     await expect(streamsBtn).not.toHaveClass(/active/);
  361 |     await expect(socialsBtn).not.toHaveClass(/active/);
  362 |     await expect(communityTab).toBeVisible();
  363 |     await expect(streamsTab).toBeHidden();
  364 |     await expect(socialsTab).toBeHidden();
  365 |     await expect(communityTab.locator('a[data-platform="discord"]')).toBeVisible();
  366 |     await expect(communityTab.locator('a[data-platform="reddit"]')).toBeVisible();
  367 |     await expect(communityTab.locator('a[data-platform="patreon"]')).toBeVisible();
  368 |     await expect(communityTab.locator('a[data-platform="pinterest"]')).toBeVisible();
  369 | 
  370 |     // Switch back to Socials tab
  371 |     await socialsBtn.click();
  372 |     await expect(socialsBtn).toHaveClass(/active/);
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
> 442 |     await expect(shareModal).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
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
  473 |     await expect(overlay).toHaveClass(/active/);
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
```