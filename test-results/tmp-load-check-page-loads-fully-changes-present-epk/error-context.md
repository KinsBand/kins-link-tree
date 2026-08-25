# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tmp-load-check.spec.ts >> page loads fully + changes present: /epk
- Location: e2e\tmp-load-check.spec.ts:4:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   "HTTP 503 http://localhost:4321/api/vote?scope=hero-poll%3Arecording",
+   "HTTP 503 http://localhost:4321/api/vote?scope=hero-poll%3Asetlist",
+   "HTTP 503 http://localhost:4321/api/vote?scope=hero-poll%3Amerch",
+   "HTTP 503 http://localhost:4321/api/vote?scope=hero-poll%3Acity",
+   "HTTP 403 https://accounts.google.com/gsi/button?type=standard&theme=outline&size=large&shape=pill&text=continue_with&logo_alignment=left&is_fedcm_supported=true&client_id=852914057583-9u1smv7r8bbosgnpp6ajmmukpne54ru7.apps.googleusercontent.com&iframe_id=gsi_32332_441791&cas=mvmdZXWyRxaC959VyTNYDPK9czyR%2B00cSG2F6vLJwjE&hl=en-US",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Subscribe to Kins" [ref=e6] [cursor=pointer]:
          - generic: 
        - button "Search cover videos" [ref=e7] [cursor=pointer]:
          - generic: 
          - generic: search covers...
        - button "Share page" [ref=e8] [cursor=pointer]:
          - generic: 
      - text: 
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
        - text:                                                              
      - generic [ref=e44]:
        - generic [ref=e45]:
          - button "SOCIALS" [ref=e46] [cursor=pointer]
          - button "STREAMS" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - generic [ref=e49]:
            - link " Instagram " [ref=e50] [cursor=pointer]:
              - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
              - generic [ref=e51]:
                - generic [ref=e52]: 
                - generic [ref=e54]: Instagram
              - generic [ref=e55]: 
            - link " TikTok " [ref=e57] [cursor=pointer]:
              - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
              - generic [ref=e58]:
                - generic [ref=e59]: 
                - generic [ref=e61]: TikTok
              - generic [ref=e62]: 
            - link " YouTube " [ref=e64] [cursor=pointer]:
              - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
              - generic [ref=e65]:
                - generic [ref=e66]: 
                - generic [ref=e68]: YouTube
              - generic [ref=e69]: 
            - link " Facebook " [ref=e71] [cursor=pointer]:
              - /url: https://www.facebook.com/share/1LU7GTyCBW/
              - generic [ref=e72]:
                - generic [ref=e73]: 
                - generic [ref=e75]: Facebook
              - generic [ref=e76]: 
            - link " Twitter / X " [ref=e78] [cursor=pointer]:
              - /url: https://x.com/KinsBandOfficia
              - generic [ref=e79]:
                - generic [ref=e80]: 
                - generic [ref=e82]: Twitter / X
              - generic [ref=e83]: 
            - link " Discord " [ref=e85] [cursor=pointer]:
              - /url: https://discord.gg/Yu2npHUrH
              - generic [ref=e86]:
                - generic [ref=e87]: 
                - generic [ref=e89]: Discord
              - generic [ref=e90]: 
          - generic [ref=e92]:
            - link " Substack " [ref=e93] [cursor=pointer]:
              - /url: https://substack.com/@kinsbandoffical?utm_source=share&utm_medium=android&r=8uyitn
              - generic [ref=e94]:
                - generic [ref=e95]: 
                - generic [ref=e97]: Substack
              - generic [ref=e98]: 
            - link " Threads " [ref=e100] [cursor=pointer]:
              - /url: https://www.threads.com/@kinsbandofficial
              - generic [ref=e101]:
                - generic [ref=e102]: 
                - generic [ref=e104]: Threads
              - generic [ref=e105]: 
            - link " Reddit " [ref=e107] [cursor=pointer]:
              - /url: https://www.reddit.com/u/KinsBandOfficial/s/m8JXFDETij
              - generic [ref=e108]:
                - generic [ref=e109]: 
                - generic [ref=e111]: Reddit
              - generic [ref=e112]: 
            - link " Snapchat " [ref=e114] [cursor=pointer]:
              - /url: https://snapchat.com/add/KinsBandOfficial
              - generic [ref=e115]:
                - generic [ref=e116]: 
                - generic [ref=e118]: Snapchat
              - generic [ref=e119]: 
            - link " Patreon " [ref=e121] [cursor=pointer]:
              - /url: https://patreon.com/KinsBand
              - generic [ref=e122]:
                - generic [ref=e123]: 
                - generic [ref=e125]: Patreon
              - generic [ref=e126]: 
            - link " Twitch " [ref=e128] [cursor=pointer]:
              - /url: https://twitch.tv/KinsBandOfficial
              - generic [ref=e129]:
                - generic [ref=e130]: 
                - generic [ref=e132]: Twitch
              - generic [ref=e133]: 
            - link " Pinterest " [ref=e135] [cursor=pointer]:
              - /url: https://pinterest.com/KinsBandOfficial
              - generic [ref=e136]:
                - generic [ref=e137]: 
                - generic [ref=e139]: Pinterest
              - generic [ref=e140]: 
            - link " LinkedIn " [ref=e142] [cursor=pointer]:
              - /url: https://linkedin.com/company/KinsBandOfficial
              - generic [ref=e143]:
                - generic [ref=e144]: 
                - generic [ref=e146]: LinkedIn
              - generic [ref=e147]: 
          - button "Toggle all social channels" [ref=e149] [cursor=pointer]:
            - generic [ref=e150]:
              - generic "Substack" [ref=e151]: 
              - generic "Threads" [ref=e153]: 
              - generic "Reddit" [ref=e155]: 
              - generic "Snapchat" [ref=e157]: 
            - generic [ref=e159]: Other (+8)
            - generic [ref=e160]: 
        - text:                         
      - generic [ref=e162]:
        - generic [ref=e163]:
          - generic [ref=e164]:
            - generic [ref=e165]:
              - heading "Subscribe to Kins!" [level=3] [ref=e166]
              - generic [ref=e167]: ⚡ 1-Tap
            - paragraph [ref=e168]: Receive new music, behind-the-scenes & gig drops.
          - generic [ref=e171]:
            - button "Continue with Google. Opens in new tab" [ref=e173] [cursor=pointer]:
              - generic [ref=e175]: Continue with Google
            - iframe
          - generic [ref=e185]: OR WITH EMAIL
          - generic [ref=e190]:
            - textbox "Enter your email..." [ref=e191]
            - button "Join Kins Fan Club" [ref=e192] [cursor=pointer]:
              - generic [ref=e193]: JOIN ➔
        - text:   +
        - generic [ref=e194]:
          - generic [ref=e195]:
            - generic [ref=e196]: 
            - generic [ref=e197]: Official Contacts & Feedback
          - generic [ref=e198]:
            - button " hello@kinsband.com General Chat, Help & Site Suggestions Copy email hello@kinsband.com Send email to hello@kinsband.com" [ref=e199] [cursor=pointer]:
              - generic [ref=e200]: 
              - generic [ref=e202]:
                - generic [ref=e203]: hello@kinsband.com
                - generic [ref=e204]: General Chat, Help & Site Suggestions
              - generic [ref=e205]:
                - button "Copy email hello@kinsband.com" [ref=e206]:
                  - generic [ref=e207]: 
                  - generic [ref=e208]: Copy email
                - link "Send email to hello@kinsband.com" [ref=e209]:
                  - /url: mailto:hello@kinsband.com?subject=Kins%20Inquiry%20%26%20Feedback
                  - generic [ref=e210]: 
                  - generic [ref=e211]: Go to mail app
            - button " booking@kinsband.com Shows, Tours & Live Booking Copy email booking@kinsband.com Send email to booking@kinsband.com" [ref=e212] [cursor=pointer]:
              - generic [ref=e213]: 
              - generic [ref=e215]:
                - generic [ref=e216]: booking@kinsband.com
                - generic [ref=e217]: Shows, Tours & Live Booking
              - generic [ref=e218]:
                - button "Copy email booking@kinsband.com" [ref=e219]:
                  - generic [ref=e220]: 
                  - generic [ref=e221]: Copy email
                - link "Send email to booking@kinsband.com" [ref=e222]:
                  - /url: mailto:booking@kinsband.com?subject=Kins%20Booking%20Inquiry
                  - generic [ref=e223]: 
                  - generic [ref=e224]: Go to mail app
          - button " Suggest Improvement or Report Issue" [ref=e226] [cursor=pointer]:
            - generic [ref=e227]: 
            - generic [ref=e228]: Suggest Improvement or Report Issue
    - main [ref=e229]:
      - generic [ref=e230]:
        - generic [ref=e231]:
          - heading " Band Members" [level=3] [ref=e232]:
            - generic [ref=e233]: 
            - text: Band Members
          - generic [ref=e234]:
            - button "Scroll members left" [ref=e235] [cursor=pointer]:
              - generic [ref=e236]: 
            - button "Scroll members right" [ref=e237] [cursor=pointer]:
              - generic [ref=e238]: 
        - generic [ref=e239]:
          - generic [ref=e240]:
            - generic [ref=e241]:
              - generic [ref=e242]: V
              - generic [ref=e243]: 
              - generic [ref=e244]: VOCALS & GUITAR
            - generic [ref=e245]:
              - heading "Vivian" [level=4] [ref=e246]
              - paragraph [ref=e247]: Melodies & guitar hooks.
          - generic [ref=e248]:
            - generic [ref=e249]:
              - generic [ref=e250]: C
              - generic [ref=e251]: 
              - generic [ref=e252]: GUITAR & VOCALS
            - generic [ref=e253]:
              - heading "Charlie" [level=4] [ref=e254]
              - paragraph [ref=e255]: Lyrics, guitar & band energy.
          - generic [ref=e256]:
            - generic [ref=e257]:
              - generic [ref=e258]: O
              - generic [ref=e259]: 
              - generic [ref=e260]: BASS
            - generic [ref=e261]:
              - heading "Oscar" [level=4] [ref=e262]
              - paragraph [ref=e263]: Basslines & vintage synths.
          - generic [ref=e264]:
            - generic [ref=e265]:
              - generic [ref=e266]: T
              - generic [ref=e267]: 
              - generic [ref=e268]: DRUMS
            - generic [ref=e269]:
              - heading "Trai" [level=4] [ref=e270]
              - paragraph [ref=e271]: Drums & driving heartbeat.
      - generic [ref=e272]:
        - generic [ref=e273]:
          - heading " Community" [level=3] [ref=e275]:
            - generic [ref=e276]: 
            - text: Community
          - generic [ref=e277]:
            - button "Scroll community clips left" [ref=e278] [cursor=pointer]:
              - generic [ref=e279]: 
            - button "Scroll community clips right" [ref=e280] [cursor=pointer]:
              - generic [ref=e281]: 
        - generic [ref=e282]:
          - generic "Submit your Drum Cover to get featured!" [ref=e283] [cursor=pointer]:
            - generic [ref=e284]:
              - generic [ref=e285]: 
              - generic [ref=e287]: Spot Open
              - generic [ref=e289]:
                - generic [ref=e290]: +
                - generic [ref=e291]: Submit
              - generic [ref=e292]:
                - generic [ref=e293]:
                  - generic [ref=e294]: 
                  - text: Drum Cover
                - generic [ref=e295]: Your Video Here
                - generic [ref=e296]: Click to submit or tag @KinsBandOfficial
          - generic "Submit your Guitar & Bass to get featured!" [ref=e297] [cursor=pointer]:
            - generic [ref=e298]:
              - generic [ref=e299]: 
              - generic [ref=e301]: Spot Open
              - generic [ref=e303]:
                - generic [ref=e304]: +
                - generic [ref=e305]: Submit
              - generic [ref=e306]:
                - generic [ref=e307]:
                  - generic [ref=e308]: 
                  - text: Guitar & Bass
                - generic [ref=e309]: Your Video Here
                - generic [ref=e310]: Click to submit or tag @KinsBandOfficial
          - generic "Submit your Vocal Cover to get featured!" [ref=e311] [cursor=pointer]:
            - generic [ref=e312]:
              - generic [ref=e313]: 
              - generic [ref=e315]: Spot Open
              - generic [ref=e317]:
                - generic [ref=e318]: +
                - generic [ref=e319]: Submit
              - generic [ref=e320]:
                - generic [ref=e321]:
                  - generic [ref=e322]: 
                  - text: Vocal Cover
                - generic [ref=e323]: Your Video Here
                - generic [ref=e324]: Click to submit or tag @KinsBandOfficial
          - generic "Submit your Fan Edit to get featured!" [ref=e325] [cursor=pointer]:
            - generic [ref=e326]:
              - generic [ref=e327]: 
              - generic [ref=e329]: Spot Open
              - generic [ref=e331]:
                - generic [ref=e332]: +
                - generic [ref=e333]: Submit
              - generic [ref=e334]:
                - generic [ref=e335]:
                  - generic [ref=e336]: 
                  - text: Fan Edit
                - generic [ref=e337]: Your Video Here
                - generic [ref=e338]: Click to submit or tag @KinsBandOfficial
        - generic [ref=e339]:
          - generic [ref=e340]:
            - heading "SUBMISSIONS OPEN" [level=4] [ref=e341]
            - paragraph [ref=e342]:
              - text: Tag
              - button "@KinsBandOfficial " [ref=e343] [cursor=pointer]:
                - generic [ref=e344]: "@KinsBandOfficial"
                - generic [ref=e345]: 
              - text: or submit your link to get featured in these spots.
          - button "Submit Fan Clip +" [ref=e346] [cursor=pointer]:
            - generic [ref=e347]: Submit Fan Clip
            - generic [ref=e348]: +
      - text:   
      - generic [ref=e349]:
        - heading " What Inspires Us" [level=3] [ref=e351]:
          - generic [ref=e352]: 
          - text: What Inspires Us
        - tablist "Band Member Inspiration Tabs" [ref=e353]:
          - tab "ALL" [selected] [ref=e354] [cursor=pointer]
          - tab "TRAI" [ref=e355] [cursor=pointer]
          - tab "VIVIAN" [ref=e356] [cursor=pointer]
          - tab "OSCAR" [ref=e357] [cursor=pointer]
          - tab "CHARLIE" [ref=e358] [cursor=pointer]
        - generic [ref=e359]:
          - generic [ref=e360] [cursor=pointer]:
            - generic [ref=e361]:
              - text: 
              - img "Turnip Farm" [ref=e362]
            - generic [ref=e363]:
              - generic [ref=e364]: Turnip Farm
              - generic [ref=e366]: Dinosaur Jr.
              - generic [ref=e367]:
                - generic [ref=e368]: Grunge
                - generic "Curated by Charlie" [ref=e370]: C
            - button "Play song" [ref=e371]:
              - generic [ref=e372]: 
          - generic [ref=e373] [cursor=pointer]:
            - generic [ref=e374]:
              - text: 
              - img "(David Bowie I Love You) Since I Was Six" [ref=e375]
            - generic [ref=e376]:
              - generic [ref=e377]: (David Bowie I Love You) Since I Was Six
              - generic [ref=e379]: The Brian Jonestown Massacre
              - generic [ref=e380]:
                - generic [ref=e381]: Neo-Psychedelia
                - generic "Curated by Charlie" [ref=e383]: C
            - button "Play song" [ref=e384]:
              - generic [ref=e385]: 
          - generic [ref=e386] [cursor=pointer]:
            - generic [ref=e387]:
              - text: 
              - img "Underwear" [ref=e388]
            - generic [ref=e389]:
              - generic [ref=e390]: Underwear
              - generic [ref=e392]: Pulp
              - generic [ref=e393]:
                - generic [ref=e394]: Britpop
                - generic "Curated by Charlie" [ref=e396]: C
            - button "Play song" [ref=e397]:
              - generic [ref=e398]: 
          - generic [ref=e399] [cursor=pointer]:
            - generic [ref=e400]:
              - text: 
              - img "Unmade Bed" [ref=e401]
            - generic [ref=e402]:
              - generic [ref=e403]: Unmade Bed
              - generic [ref=e405]: Sonic Youth
              - generic [ref=e406]:
                - generic [ref=e407]: Noise Rock
                - generic "Curated by Charlie" [ref=e409]: C
            - button "Play song" [ref=e410]:
              - generic [ref=e411]: 
        - generic [ref=e412]:
          - button "Previous Page" [disabled] [ref=e413]:
            - generic [ref=e414]: 
          - generic [ref=e415]:
            - button "Page 1" [ref=e416] [cursor=pointer]
            - button "Page 2" [ref=e417] [cursor=pointer]
            - button "Page 3" [ref=e418] [cursor=pointer]
            - button "Page 4" [ref=e419] [cursor=pointer]
          - button "Next Page" [ref=e420] [cursor=pointer]:
            - generic [ref=e421]: 
      - generic [ref=e423]:
        - generic [ref=e425]:
          - generic [ref=e426]: 
          - generic [ref=e428]:
            - heading "KINS TOOLS" [level=3] [ref=e429]
            - paragraph [ref=e430]: Offline-ready browser tools for musicians.
        - generic [ref=e431]:
          - article [ref=e432]:
            - generic [ref=e433]:
              - generic [ref=e434]:
                - generic [ref=e435]: 
                - heading "TUNER" [level=4] [ref=e438]
              - paragraph [ref=e439]: Mic pitch detection · Standard/Drop D
              - link "Launch Tuner → - Open TUNER" [ref=e441] [cursor=pointer]:
                - /url: /tuner
                - generic [ref=e442]: Open Tuner →
          - article [ref=e443]:
            - generic [ref=e444]:
              - generic [ref=e445]:
                - generic [ref=e446]: 
                - heading "METRONOME" [level=4] [ref=e449]
              - paragraph [ref=e450]: Tap tempo · 4/4, 6/8, 7/8 · Accents
              - button "Launch Metronome → - METRONOME" [ref=e452] [cursor=pointer]:
                - generic [ref=e453]: Open Metronome →
          - article [ref=e454]:
            - generic [ref=e455]:
              - generic [ref=e456]:
                - generic [ref=e457]: 
                - heading "CHORDS" [level=4] [ref=e460]
                - generic [ref=e461]: Roadmap
              - paragraph [ref=e462]: CAGED fretboard maps & Capo converter
              - button "Preview - CHORDS" [ref=e464] [cursor=pointer]:
                - generic [ref=e465]: Preview
        - generic [ref=e467]:
          - generic [ref=e468]: 
          - generic [ref=e469]: Works offline in rehearsal basements
      - generic [ref=e471]:
        - generic [ref=e473]:
          - generic [ref=e474]: 
          - generic [ref=e475]: "@2026 KINS."
        - navigation "Legal & Feedback Links" [ref=e476]:
          - button "Privacy Policy" [ref=e477] [cursor=pointer]
          - generic [ref=e478]: •
          - button "Suggest Improvement" [ref=e479] [cursor=pointer]
          - generic [ref=e480]: •
          - button "Fan Submission Terms" [ref=e481] [cursor=pointer]
        - group "Toggle Display Theme" [ref=e483] [cursor=pointer]:
          - generic [ref=e484]: Light
          - radiogroup "Select theme mode" [ref=e485]:
            - button "Light Mode" [pressed] [ref=e486]:
              - generic [ref=e487]: 
            - button "Dark Mode" [ref=e488]:
              - generic [ref=e489]: 
          - generic [ref=e490]: Mode
  - dialog "Search Cover Videos":
    - generic:
      - generic:
        - generic:
          - generic: 
          - textbox "Search covers by title, artist, or tag..."
          - text: 
        - button "Close cover search":
          - generic: 
      - generic:
        - generic:
          - button "All Covers"
          - button "Full Band"
          - button "Acoustic"
          - button "Shorts"
        - generic:
          - heading "Latest Releases" [level=3]
  - text: "       #                 @                  "
  - generic:
    - text:           
    - generic [ref=e491]:
      - generic [ref=e492]:
        - generic [ref=e493]: INSPIRATION
        - generic [ref=e494] [cursor=pointer]:
          - generic [ref=e495]:
            - generic [ref=e496]:
              - img "Album cover 1" [ref=e497]
              - text: 
            - generic [ref=e498]:
              - img "Album cover 2" [ref=e499]
              - text: 
            - generic [ref=e500]:
              - img "Album cover 3" [ref=e501]
              - text: 
          - generic [ref=e502]:
            - generic [ref=e503]: WHAT INSPIRES US!
            - generic [ref=e504]: listen to what inspires KINS
          - button "Auto-mix inspiration songs" [ref=e505]:
            - generic [ref=e506]: 
        - text:   
      - button "Tour dates & Gig Map (Coming Soon)" [ref=e507] [cursor=pointer]:
        - generic [ref=e508]: GIG MAP
        - generic [ref=e509]: 
        - generic: COMING SOON
  - generic [ref=e513]:
    - button [ref=e514]
    - button [ref=e520]
    - button [ref=e524]
    - button [ref=e532]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | for (const path of ['/', '/tuner', '/live', '/epk']) {
  4  |   test(`page loads fully + changes present: ${path}`, async ({ page }) => {
  5  |     const failed: string[] = [];
  6  |     const consoleErrors: string[] = [];
  7  |     page.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
  8  |     page.on('response', (r) => { if (r.status() >= 400) failed.push('HTTP ' + r.status() + ' ' + r.url()); });
  9  |     page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  10 | 
  11 |     await page.goto(path, { waitUntil: 'load', timeout: 20000 });
  12 |     await page.waitForTimeout(1500);
  13 | 
  14 |     if (path === '/tuner') {
  15 |       const cta = page.locator('#tunerMicToggleBtn');
  16 |       await expect(cta).toBeVisible();
  17 |       await expect(cta).toContainText('START TUNING');
  18 |       const html = await page.content();
  19 |       expect(html).toContain('tunerMicToggleBtn');
  20 |     }
  21 | 
> 22 |     expect(failed.filter((u) => !u.includes('_vercel/insights'))).toEqual([]);
     |                                                                   ^ Error: expect(received).toEqual(expected) // deep equality
  23 |     expect(consoleErrors).toEqual([]);
  24 |   });
  25 | }
  26 | 
```