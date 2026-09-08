# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-regressions.spec.ts >> inspiration labels meet text contrast in both themes
- Location: e2e\audit-regressions.spec.ts:46:1

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 4.5
Received:    3.2481760558762454
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Subscribe to Kins":
          - generic: 
          - generic: SOON
        - button "Search cover videos":
          - generic: 
          - generic: search covers...
        - button "Share page":
          - generic: 
    - complementary [ref=e6]:
      - generic:
        - img "Kins logo banner"
      - generic [ref=e7]:
        - generic [ref=e8]:
          - generic [ref=e9]: INDEPENDENT 4-PIECE ROCK BAND
          - generic [ref=e11]:
            - generic [ref=e12]: 
            - generic [ref=e13]: NEWCASTLE, AUSTRALIA
            - generic "Australia Flag" [ref=e14]
        - text: 
      - generic [ref=e31]:
        - generic [ref=e34]:
          - generic [ref=e35]: 
          - generic [ref=e37]:
            - generic [ref=e38]: UPCOMING RELEASE
            - heading "New music is on the way" [level=4] [ref=e39]
            - paragraph [ref=e40]: First official cover coming soon...
        - text:                                                                             
      - generic [ref=e41]:
        - tablist [ref=e42]:
          - tab "STREAMS" [ref=e43] [cursor=pointer]
          - tab "SOCIALS" [selected] [ref=e44] [cursor=pointer]
          - tab "COMMUNITY" [ref=e45] [cursor=pointer]
        - text:               
        - tabpanel [ref=e46]:
          - generic [ref=e47]:
            - link " Instagram" [ref=e48] [cursor=pointer]:
              - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
              - generic [ref=e49]:
                - generic [ref=e50]: 
                - generic [ref=e52]: Instagram
            - link " TikTok" [ref=e53] [cursor=pointer]:
              - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
              - generic [ref=e54]:
                - generic [ref=e55]: 
                - generic [ref=e57]: TikTok
            - link " YouTube" [ref=e58] [cursor=pointer]:
              - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
              - generic [ref=e59]:
                - generic [ref=e60]: 
                - generic [ref=e62]: YouTube
            - link " Facebook" [ref=e63] [cursor=pointer]:
              - /url: https://www.facebook.com/share/1LU7GTyCBW/
              - generic [ref=e64]:
                - generic [ref=e65]: 
                - generic [ref=e67]: Facebook
            - link " Twitter / X" [ref=e68] [cursor=pointer]:
              - /url: https://x.com/KinsBandOfficial
              - generic [ref=e69]:
                - generic [ref=e70]: 
                - generic [ref=e72]: Twitter / X
            - link " Threads" [ref=e73] [cursor=pointer]:
              - /url: https://www.threads.com/@kinsbandofficial
              - generic [ref=e74]:
                - generic [ref=e75]: 
                - generic [ref=e77]: Threads
          - generic [ref=e78]:
            - link " Snapchat" [ref=e79] [cursor=pointer]:
              - /url: https://snapchat.com/add/KinsBandOfficial
              - generic [ref=e80]:
                - generic [ref=e81]: 
                - generic [ref=e83]: Snapchat
            - link " LinkedIn" [ref=e84] [cursor=pointer]:
              - /url: https://linkedin.com/company/KinsBandOfficial
              - generic [ref=e85]:
                - generic [ref=e86]: 
                - generic [ref=e88]: LinkedIn
          - button "Toggle all social channels" [ref=e89] [cursor=pointer]:
            - generic [ref=e90]:
              - generic "Snapchat" [ref=e91]: 
              - generic "LinkedIn" [ref=e93]: 
            - generic [ref=e95]: Other (+2)
            - generic [ref=e96]: 
        - text:      
      - generic [ref=e98]:
        - region "Fan Club Subscription (Coming Soon)" [ref=e99]:
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
          - button "Fan club subscription coming soon. Tap for more info." [ref=e100] [cursor=pointer]
        - text:  
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]: 
            - generic [ref=e104]: Official Contacts & Feedback
          - generic [ref=e105]:
            - button " HelloKinsFan@gmail.com General Chat, Help & Site Suggestions Copy email HelloKinsFan@gmail.com Send email to HelloKinsFan@gmail.com" [ref=e106] [cursor=pointer]:
              - generic [ref=e107]: 
              - generic [ref=e109]:
                - generic [ref=e110]: HelloKinsFan@gmail.com
                - generic [ref=e111]: General Chat, Help & Site Suggestions
              - generic [ref=e112]:
                - button "Copy email HelloKinsFan@gmail.com" [ref=e113]:
                  - generic [ref=e114]: 
                  - generic [ref=e115]: Copy email
                - link "Send email to HelloKinsFan@gmail.com" [ref=e116]:
                  - /url: mailto:HelloKinsFan@gmail.com?subject=Kins%20Inquiry%20%26%20Feedback
                  - generic [ref=e117]: 
                  - generic [ref=e118]: Go to mail app
            - button " BookingsKinsBand@gmail.com Shows, Tours & Live Booking Copy email BookingsKinsBand@gmail.com Send email to BookingsKinsBand@gmail.com" [ref=e119] [cursor=pointer]:
              - generic [ref=e120]: 
              - generic [ref=e122]:
                - generic [ref=e123]: BookingsKinsBand@gmail.com
                - generic [ref=e124]: Shows, Tours & Live Booking
              - generic [ref=e125]:
                - button "Copy email BookingsKinsBand@gmail.com" [ref=e126]:
                  - generic [ref=e127]: 
                  - generic [ref=e128]: Copy email
                - link "Send email to BookingsKinsBand@gmail.com" [ref=e129]:
                  - /url: mailto:BookingsKinsBand@gmail.com?subject=Kins%20Booking%20Inquiry
                  - generic [ref=e130]: 
                  - generic [ref=e131]: Go to mail app
          - generic [ref=e132]:
            - button "Suggest improvement or report issue" [ref=e133] [cursor=pointer]:
              - generic [ref=e134]: 
              - generic [ref=e135]: Suggest Feedback
            - button "Tip or support Kins" [ref=e136] [cursor=pointer]:
              - generic [ref=e137]: 
              - generic [ref=e138]: Tip / Support Kins
    - main [ref=e139]:
      - generic [ref=e140]:
        - generic [ref=e141]:
          - heading " Band Members" [level=3] [ref=e142]:
            - generic [ref=e143]: 
            - text: Band Members
          - generic:
            - button "Scroll members left" [disabled]:
              - generic: 
            - button "Scroll members right":
              - generic: 
        - generic [ref=e144]:
          - generic [ref=e145]:
            - generic [ref=e146]:
              - generic [ref=e147]: V
              - generic [ref=e148]: 
              - generic [ref=e149]: VOCALS & GUITAR
            - generic [ref=e150]:
              - heading "Vivian" [level=4] [ref=e151]
              - paragraph [ref=e152]: Melodies & guitar hooks.
          - generic [ref=e153]:
            - generic [ref=e154]:
              - generic [ref=e155]: C
              - generic [ref=e156]: 
              - generic [ref=e157]: GUITAR & VOCALS
            - generic [ref=e158]:
              - heading "Charlie" [level=4] [ref=e159]
              - paragraph [ref=e160]: Lyrics, guitar & band energy.
          - generic [ref=e161]:
            - generic [ref=e162]:
              - generic [ref=e163]: O
              - generic [ref=e164]: 
              - generic [ref=e165]: BASS
            - generic [ref=e166]:
              - heading "Oscar" [level=4] [ref=e167]
              - paragraph [ref=e168]: Basslines & vintage synths.
          - generic [ref=e169]:
            - generic [ref=e170]:
              - generic [ref=e171]: T
              - generic [ref=e172]: 
              - generic [ref=e173]: DRUMS
            - generic [ref=e174]:
              - heading "Trai" [level=4] [ref=e175]
              - paragraph [ref=e176]: Drums & driving heartbeat.
      - text:     +   +   +   +   +
      - generic [ref=e177]:
        - heading " What Inspires Us" [level=3] [ref=e179]:
          - generic [ref=e180]: 
          - text: What Inspires Us
        - tablist "Band Member Inspiration Tabs" [ref=e181]:
          - tab "ALL" [selected] [ref=e182] [cursor=pointer]
          - tab "TRAI" [ref=e183] [cursor=pointer]
          - tab "VIVIAN" [ref=e184] [cursor=pointer]
          - tab "OSCAR" [ref=e185] [cursor=pointer]
          - tab "CHARLIE" [ref=e186] [cursor=pointer]
        - generic [ref=e187]:
          - generic [ref=e188] [cursor=pointer]:
            - generic [ref=e189]:
              - text: 
              - img "Turnip Farm" [ref=e190]
            - generic [ref=e191]:
              - generic [ref=e192]: Turnip Farm
              - generic [ref=e194]: Dinosaur Jr.
              - generic [ref=e195]:
                - generic [ref=e196]: Grunge
                - generic "Curated by Charlie" [ref=e198]: C
            - button "Play song" [ref=e199]:
              - generic [ref=e200]: 
          - generic [ref=e201] [cursor=pointer]:
            - generic [ref=e202]:
              - text: 
              - img "(David Bowie I Love You) Since I Was Six" [ref=e203]
            - generic [ref=e204]:
              - generic [ref=e205]: (David Bowie I Love You) Since I Was Six
              - generic [ref=e207]: The Brian Jonestown Massacre
              - generic [ref=e208]:
                - generic [ref=e209]: Neo-Psychedelia
                - generic "Curated by Charlie" [ref=e211]: C
            - button "Play song" [ref=e212]:
              - generic [ref=e213]: 
          - generic [ref=e214] [cursor=pointer]:
            - generic [ref=e215]:
              - text: 
              - img "Underwear" [ref=e216]
            - generic [ref=e217]:
              - generic [ref=e218]: Underwear
              - generic [ref=e220]: Pulp
              - generic [ref=e221]:
                - generic [ref=e222]: Britpop
                - generic "Curated by Charlie" [ref=e224]: C
            - button "Play song" [ref=e225]:
              - generic [ref=e226]: 
          - generic [ref=e227] [cursor=pointer]:
            - generic [ref=e228]:
              - text: 
              - img "Unmade Bed" [ref=e229]
            - generic [ref=e230]:
              - generic [ref=e231]: Unmade Bed
              - generic [ref=e233]: Sonic Youth
              - generic [ref=e234]:
                - generic [ref=e235]: Noise Rock
                - generic "Curated by Charlie" [ref=e237]: C
            - button "Play song" [ref=e238]:
              - generic [ref=e239]: 
        - generic [ref=e240]:
          - button "Previous Page" [disabled] [ref=e241]:
            - generic [ref=e242]: 
          - generic [ref=e243]:
            - button "Page 1" [ref=e244] [cursor=pointer]
            - button "Page 2" [ref=e245] [cursor=pointer]
            - button "Page 3" [ref=e246] [cursor=pointer]
            - button "Page 4" [ref=e247] [cursor=pointer]
            - button "Page 5" [ref=e248] [cursor=pointer]
          - button "Next Page" [ref=e249] [cursor=pointer]:
            - generic [ref=e250]: 
      - generic [ref=e252]:
        - generic [ref=e253]:
          - generic [ref=e254]:
            - generic [ref=e255]: 
            - generic [ref=e257]:
              - heading "KINS TOOLS" [level=3] [ref=e258]
              - paragraph [ref=e259]: Offline-ready browser tools for musicians.
          - button "Download KINS TOOLS app for offline use" [ref=e260] [cursor=pointer]:
            - generic [ref=e261]: 
        - article [ref=e263]:
          - generic [ref=e264]:
            - heading "METRONOME" [level=4] [ref=e273]
            - paragraph [ref=e274]: Tap tempo · 4/4, 6/8, 7/8 · Accents
            - link "Launch Metronome → - Open METRONOME" [ref=e276] [cursor=pointer]:
              - /url: /metronome
              - generic [ref=e277]: Open Metro →
      - region "About KINS Band, Discography, and Booking" [ref=e278]:
        - heading "About KINS (@KinsBandOfficial)" [level=2] [ref=e279]
        - paragraph [ref=e280]: KINS is an Australian four-piece post-punk and alternative rock band hailing from Newcastle, New South Wales (Hunter Region, East Coast Australia, roughly 2 hours north of Sydney). Formed in 2024, KINS delivers high-voltage hooks, driving rhythm section urgency, atmospheric wall-of-sound guitar tones, and visceral live performance energy.
        - paragraph [ref=e281]: "Recommended If You Like (RIYL): Fontaines D.C., IDLES, The Murder Capital, The Cure, and Gang of Youths."
        - heading "Band Members & Instrumentation" [level=3] [ref=e282]
        - list [ref=e283]:
          - listitem [ref=e284]:
            - strong [ref=e285]: "Vivian:"
            - text: Lead Vocals & Rhythm Electric Guitar
          - listitem [ref=e286]:
            - strong [ref=e287]: "Charlie:"
            - text: Lead Electric Guitar & Backing Vocals
          - listitem [ref=e288]:
            - strong [ref=e289]: "Oscar:"
            - text: Bass Guitar & Synthesizers
          - listitem [ref=e290]:
            - strong [ref=e291]: "Trai:"
            - text: Drums & Percussion
        - heading "Official Music Streaming & Booking" [level=3] [ref=e292]
        - paragraph [ref=e293]: Stream KINS music officially on Spotify, Apple Music, YouTube Music, Bandcamp, and SoundCloud. For concert bookings and tour inquiries, contact BookingsKinsBand@gmail.com.
      - generic [ref=e295]:
        - generic [ref=e296]:
          - button "Light Mode" [active] [pressed] [ref=e297] [cursor=pointer]:
            - generic [ref=e298]: 
          - generic [ref=e299]:
            - generic [ref=e300]: 
            - generic [ref=e301]: "@2026 KINS."
          - button "Dark Mode" [ref=e302] [cursor=pointer]:
            - generic [ref=e303]: 
        - navigation "Site Links and Legal Navigation" [ref=e304]:
          - button "FEEDBACK" [ref=e305] [cursor=pointer]
          - generic [ref=e306]: •
          - button "LEGAL" [ref=e307] [cursor=pointer]
        - button "BAND FAQ" [ref=e310] [cursor=pointer]:
          - generic [ref=e311]:
            - generic [ref=e312]: 
            - generic [ref=e313]: BAND FAQ
          - generic [ref=e314]: 
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
    - generic [ref=e316]:
      - generic [ref=e317]:
        - generic [ref=e318]: INSPIRATION
        - slider "Audio playback progress"
        - generic [ref=e319] [cursor=pointer]:
          - generic [ref=e320]:
            - generic [ref=e321]:
              - img "The Cure - Just Like Heaven" [ref=e322]
              - text: 
            - generic [ref=e323]:
              - img "Weezer - Do You Wanna Get High?" [ref=e324]
              - text: 
            - generic [ref=e325]:
              - img "Pulp - Common People" [ref=e326]
              - text: 
          - generic [ref=e327]:
            - generic [ref=e328]: WHAT INSPIRES US!
            - generic [ref=e329]: listen to what inspires KINS
          - button "Auto-mix inspiration songs" [ref=e330]:
            - generic [ref=e331]: 
        - text:   
      - button "Tour dates & Gig Map (Coming Soon)" [ref=e332] [cursor=pointer]:
        - generic [ref=e333]: GIG MAP
        - generic [ref=e334]: 
        - generic: COMING SOON
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('metronome waits for the delayed controller before enabling controls', async ({ page }) => {
  4  |   let releaseImport!: () => void;
  5  |   const holdImport = new Promise<void>(resolve => { releaseImport = resolve; });
  6  |   await page.route('**/src/scripts/controllers/metronome/index.js*', async route => {
  7  |     await holdImport;
  8  |     await route.continue();
  9  |   });
  10 |   await page.goto('/metronome', { waitUntil: 'domcontentloaded' });
  11 |   const play = page.locator('#metroPlayBtn');
  12 |   try {
  13 |     await expect(play).toBeDisabled();
  14 |     await expect(page.locator('#metroSettingsBtn')).toBeDisabled();
  15 |     await expect(page.locator('#metroView')).toHaveAttribute('aria-busy', 'true');
  16 |   } finally {
  17 |     releaseImport();
  18 |   }
  19 |   await play.click();
  20 |   await expect(play).toHaveAttribute('aria-label', 'Stop metronome');
  21 |   await play.click();
  22 |   await expect(play).toHaveAttribute('aria-label', 'Start metronome');
  23 | });
  24 | 
  25 | test('closed search leaves the tab order and opening/closing restores focus', async ({ page }) => {
  26 |   await page.goto('/');
  27 |   const overlay = page.locator('#coversSearchOverlay');
  28 |   const opener = page.locator('#headerSearchPillBtn');
  29 |   await expect(overlay).toHaveAttribute('inert', '');
  30 |   await page.locator('#footerFaqToggleBtn').focus();
  31 |   await page.keyboard.press('Tab');
  32 |   expect(await overlay.evaluate(el => el.contains(document.activeElement))).toBe(false);
  33 |   await expect(overlay).toHaveAttribute('data-search-ready', 'true');
  34 |   await opener.click();
  35 |   await expect(page.locator('#overlaySearchInput')).toBeFocused();
  36 |   await page.keyboard.press('Shift+Tab');
  37 |   expect(await overlay.evaluate(el => el.contains(document.activeElement))).toBe(true);
  38 |   await page.keyboard.press('Tab');
  39 |   await expect(page.locator('#overlaySearchInput')).toBeFocused();
  40 |   await page.keyboard.press('Escape');
  41 |   await expect(opener).toBeFocused();
  42 |   await expect(overlay).toHaveAttribute('inert', '');
  43 |   await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  44 | });
  45 | 
  46 | test('inspiration labels meet text contrast in both themes', async ({ page }) => {
  47 |   await page.goto('/');
  48 |   for (const theme of ['Light', 'Dark']) {
  49 |     await page.locator(`#themePill${theme}Btn`).click();
  50 |     const contrast = await page.locator('#memberFilterBar [role="tab"]:not(.active)').first().evaluate(el => {
  51 |       const style = getComputedStyle(el);
  52 |       const luminance = (color: string) => {
  53 |         const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255)
  54 |           .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  55 |         return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  56 |       };
  57 |       const values = [luminance(style.color), luminance(style.backgroundColor)].sort((a, b) => b - a);
  58 |       return (values[0] + 0.05) / (values[1] + 0.05);
  59 |     });
> 60 |     expect(contrast).toBeGreaterThanOrEqual(4.5);
     |                      ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  61 |   }
  62 | });
  63 | 
```