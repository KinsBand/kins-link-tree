# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\home.spec.ts >> tier1 smoke — home hub >> feedback modal opens with floating pill header and closes cleanly
- Location: e2e\tier1-smoke\home.spec.ts:272:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#feedbackModal')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#feedbackModal')
    13 × locator resolved to <div role="dialog" aria-modal="true" id="feedbackModal" data-astro-cid-iwnlxswx="" class="modal-backdrop hidden" aria-labelledby="feedbackPillTitle" data-track-container="modal:feedback">…</div>
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
  180 |     const darkBtn = page.locator('#themePillDarkBtn');
  181 |     await darkBtn.click();
  182 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  183 |     await expect(faqTray).not.toHaveClass(/hidden/);
  184 | 
  185 |     // Test closing via top header button / chevron arrow
  186 |     await faqBtn.click();
  187 |     await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
  188 |     await expect(faqTray).toHaveClass(/hidden/);
  189 |     await expect(page.locator('#footerFaqCard')).not.toHaveClass(/is-open/);
  190 | 
  191 |     // Reopen and test closing via bottom button
  192 |     await faqBtn.click();
  193 |     await expect(faqTray).not.toHaveClass(/hidden/);
  194 |     await expect(page.locator('#footerFaqCard')).toHaveClass(/is-open/);
  195 |     await closeBtn.click();
  196 |     await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
  197 |     await expect(faqTray).toHaveClass(/hidden/);
  198 |     await expect(page.locator('#footerFaqCard')).not.toHaveClass(/is-open/);
  199 |   });
  200 | 
  201 |   test('share modal opens with bottom sheet layout, interactive copy rows, dual asset deck, and fast export', async ({ page }) => {
  202 |     await page.goto('/');
  203 | 
  204 |     const shareBtn = page.locator('#shareBtn');
  205 |     await expect(shareBtn).toBeVisible();
  206 |     await shareBtn.click();
  207 | 
  208 |     const shareModal = page.locator('#shareModal');
  209 |     await expect(shareModal).toBeVisible();
  210 | 
  211 |     // Verify floating pill header above sheet
  212 |     const floatingPill = page.locator('#shareFloatingPillHeader');
  213 |     await expect(floatingPill).toBeVisible();
  214 |     await expect(floatingPill.locator('.sheet-pill-title')).toContainText('SHARE');
  215 |     await expect(floatingPill.locator('#closeShareModal')).toBeVisible();
  216 | 
  217 |     // Verify copy rows
  218 |     const copyUrlRow = page.locator('#copyUrlRow');
  219 |     const copyHandleRow = page.locator('#copyHandleRow');
  220 |     await expect(copyUrlRow).toBeVisible();
  221 |     await expect(copyHandleRow).toBeVisible();
  222 | 
  223 |     // Verify vanity link display
  224 |     await expect(copyUrlRow.locator('.copy-row-primary')).toHaveText('kinsband-hub.vercel.app');
  225 |     await expect(copyHandleRow.locator('.copy-row-primary')).toHaveText('@KinsBandOfficial');
  226 | 
  227 |     // Test tap-to-copy URL row feedback (icon transitions to checkmark tick)
  228 |     await copyUrlRow.click();
  229 |     const urlIcon = page.locator('#copyUrlIcon');
  230 |     await expect(urlIcon).toHaveClass(/fa-check/);
  231 | 
  232 |     // Verify dual asset deck (QR Code & Band Logo) and install CTA
  233 |     await expect(page.locator('#qrAssetCard')).toBeVisible();
  234 |     await expect(page.locator('#logoAssetCard')).toBeVisible();
  235 |     await expect(page.locator('#downloadPwaCtaBtn')).toBeVisible();
  236 | 
  237 |     // Open QR Code fullscreen lightbox
  238 |     const qrWrapper = page.locator('#qrcodeCanvasWrapper');
  239 |     await qrWrapper.click();
  240 |     const qrFullscreenModal = page.locator('#qrFullscreenModal');
  241 |     await expect(qrFullscreenModal).toBeVisible();
  242 | 
  243 |     // Verify floating pill header and click close
  244 |     const qrPill = page.locator('#qrFullscreenFloatingPillHeader');
  245 |     await expect(qrPill).toBeVisible();
  246 |     await expect(qrPill.locator('.sheet-pill-title')).toContainText('QR CODE');
  247 |     const closeQrFullscreenBtn = qrPill.locator('#closeQrFullscreenBtn');
  248 |     await expect(closeQrFullscreenBtn).toBeVisible();
  249 |     await closeQrFullscreenBtn.click();
  250 |     await expect(qrFullscreenModal).toBeHidden();
  251 | 
  252 |     // Open Logo download format modal
  253 |     const openLogoBtn = page.locator('#openLogoDownloadModalBtn');
  254 |     await openLogoBtn.click();
  255 |     const logoFormatModal = page.locator('#logoDownloadFormatModal');
  256 |     await expect(logoFormatModal).toBeVisible();
  257 | 
  258 |     // Verify logo floating pill header and close modal
  259 |     const logoPill = page.locator('#logoDownloadFloatingPillHeader');
  260 |     await expect(logoPill).toBeVisible();
  261 |     await expect(logoPill.locator('.sheet-pill-title')).toContainText('EXPORT LOGO');
  262 |     const closeLogoBtn = logoPill.locator('#closeLogoFormatModalBtn');
  263 |     await expect(closeLogoBtn).toBeVisible();
  264 |     await closeLogoBtn.click();
  265 |     await expect(logoFormatModal).toBeHidden();
  266 | 
  267 |     // Close main share modal
  268 |     await page.keyboard.press('Escape');
  269 |     await expect(shareModal).toBeHidden();
  270 |   });
  271 | 
  272 |   test('feedback modal opens with floating pill header and closes cleanly', async ({ page }) => {
  273 |     await page.goto('/');
  274 | 
  275 |     const feedbackBtn = page.locator('#openFeedbackFooterBtn');
  276 |     await expect(feedbackBtn).toBeVisible();
  277 |     await feedbackBtn.click();
  278 | 
  279 |     const feedbackModal = page.locator('#feedbackModal');
> 280 |     await expect(feedbackModal).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  281 | 
  282 |     // Verify floating pill header
  283 |     const pill = page.locator('#feedbackFloatingPillHeader');
  284 |     await expect(pill).toBeVisible();
  285 |     await expect(pill.locator('#feedbackPillTitle')).toContainText('FEEDBACK');
  286 | 
  287 |     // Close via close button in floating pill
  288 |     const closeBtn = pill.locator('#closeFeedbackModal');
  289 |     await expect(closeBtn).toBeVisible();
  290 |     await closeBtn.click();
  291 |     await expect(feedbackModal).toBeHidden();
  292 |   });
  293 | 
  294 |   test('legal modal opens with floating pill header and closes cleanly', async ({ page }) => {
  295 |     await page.goto('/');
  296 | 
  297 |     const legalBtn = page.locator('#openLegalFooterBtn');
  298 |     await expect(legalBtn).toBeVisible();
  299 |     await legalBtn.click();
  300 | 
  301 |     const legalModal = page.locator('#legalModal');
  302 |     await expect(legalModal).toBeVisible();
  303 | 
  304 |     // Verify floating pill header
  305 |     const pill = page.locator('#legalFloatingPillHeader');
  306 |     await expect(pill).toBeVisible();
  307 |     await expect(pill.locator('#legalPillTitle')).toContainText('LEGAL');
  308 | 
  309 |     // Close via close button in floating pill
  310 |     const closeBtn = pill.locator('#closeLegalModalBtn');
  311 |     await expect(closeBtn).toBeVisible();
  312 |     await closeBtn.click();
  313 |     await expect(legalModal).toBeHidden();
  314 |   });
  315 | 
  316 |   test('tabbed links renders Streams, Socials (default active), and Community tabs and switches smoothly', async ({ page }) => {
  317 |     await page.goto('/');
  318 | 
  319 |     const tabSwitcher = page.locator('.tabbed-links-section .brutal-tab-switcher');
  320 |     await expect(tabSwitcher).toBeVisible();
  321 | 
  322 |     const streamsBtn = page.locator('#tabStreamsBtn');
  323 |     const socialsBtn = page.locator('#tabSocialsBtn');
  324 |     const communityBtn = page.locator('#tabCommunityBtn');
  325 | 
  326 |     // Verify all 3 tab buttons are present and ordered
  327 |     await expect(streamsBtn).toBeVisible();
  328 |     await expect(streamsBtn).toContainText('STREAMS');
  329 |     await expect(socialsBtn).toBeVisible();
  330 |     await expect(socialsBtn).toContainText('SOCIALS');
  331 |     await expect(communityBtn).toBeVisible();
  332 |     await expect(communityBtn).toContainText('COMMUNITY');
  333 | 
  334 |     // Verify Socials is the default active tab
  335 |     await expect(socialsBtn).toHaveClass(/active/);
  336 |     await expect(streamsBtn).not.toHaveClass(/active/);
  337 |     await expect(communityBtn).not.toHaveClass(/active/);
  338 | 
  339 |     const socialsTab = page.locator('#socialsTab');
  340 |     const streamsTab = page.locator('#streamsTab');
  341 |     const communityTab = page.locator('#communityTab');
  342 | 
  343 |     await expect(socialsTab).toBeVisible();
  344 |     await expect(streamsTab).toBeHidden();
  345 |     await expect(communityTab).toBeHidden();
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
```