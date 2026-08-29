# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\store.spec.ts >> tier1 smoke — store page >> adding a product to the cart shows ADDED feedback, updates drawer and quantities
- Location: e2e\tier1-smoke\store.spec.ts:64:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.store-product-card[data-product-id="kins-apparel-hoodie"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.store-product-card[data-product-id="kins-apparel-hoodie"]')

```

```yaml
- banner:
  - button "Subscribe to Kins": 
  - button "Search cover videos":  search covers...
  - button "Share page": 
- complementary:
  - img "Kins logo banner"
  - text: INDEPENDENT 4-PIECE ROCK BAND  NEWCASTLE, AUSTRALIA  UPCOMING RELEASE
  - heading "New music is on the way" [level=4]
  - paragraph: First official cover coming soon...
  - button "STREAMS"
  - button "SOCIALS"
  - button "COMMUNITY"
  - link " Instagram ":
    - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
  - link " TikTok ":
    - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
  - link " YouTube ":
    - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
  - link " Facebook ":
    - /url: https://www.facebook.com/share/1LU7GTyCBW/
  - link " Twitter / X ":
    - /url: https://x.com/KinsBandOfficial
  - link " Threads ":
    - /url: https://www.threads.com/@kinsbandofficial
  - link " Snapchat ":
    - /url: https://snapchat.com/add/KinsBandOfficial
  - link " LinkedIn ":
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
  - button "Download KINS TOOLS app for offline use"
  - article:
    - heading "METRONOME" [level=4]
    - paragraph: Tap tempo · 4/4, 6/8, 7/8 · Accents
    - link "Launch Metronome → - Open METRONOME":
      - /url: /metronome
      - text: Open Metro →
  - group "Toggle Display Theme":
    - text: Light
    - radiogroup "Select theme mode":
      - button "Light Mode" [pressed]
      - button "Dark Mode"
    - text: Mode
  - text: "@2026 KINS."
  - navigation "Site Links and Legal Navigation":
    - button "FEEDBACK"
    - button "LEGAL"
- dialog "Search Cover Videos":
  - text: 
  - textbox "Search covers by title, artist, or tag..."
  - button "Close cover search": 
  - button "All Covers"
  - button "Full Band"
  - button "Acoustic"
  - button "Shorts"
  - heading "Latest Releases" [level=3]
- text: INSPIRATION
- img
- img "Album cover 1"
- img "Album cover 2"
- text:  WHAT INSPIRES US! listen to what inspires KINS
- button "Auto-mix inspiration songs": 
- button "Tour dates & Gig Map (Coming Soon)": GIG MAP  COMING SOON
```

```
Error: apiRequestContext._wrapApiCall: ENOENT: no such file or directory, open 'C:\Users\trai\.gemini\antigravity\scratch\kins-official-website\test-results\.playwright-artifacts-8\traces\resources\page@cf1ac89b881edb3418745d47c1179d12-1787988240576.jpeg'
```