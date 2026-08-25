# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tmp-load-check.spec.ts >> page loads fully + changes present: /live
- Location: e2e\tmp-load-check.spec.ts:4:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "HTTP 503 http://localhost:4321/api/fan-wall",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - link "Back to Bio Page" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e6]: 
      - status [ref=e8]:
        - generic [ref=e10]: LIVE
        - generic [ref=e11]: •
        - generic [ref=e12]: 0 watching
      - generic [ref=e13]:
        - button "Toggle show alerts" [ref=e14] [cursor=pointer]:
          - generic [ref=e15]: 
        - button "Share live stream" [ref=e16] [cursor=pointer]:
          - generic [ref=e17]: 
    - main [ref=e18]:
      - region "Stream offline" [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: 
          - text: OFF AIR • STANDBY
        - heading "KINS GOES LIVE HERE" [level=2] [ref=e22]
        - paragraph [ref=e23]: No stream right now. We broadcast from the room on every show night — master soundboard feed, live setlist, lyrics and chat. Subscribe and you'll get pinged the second we're on air.
        - generic [ref=e24]:
          - link " GET SHOW ALERTS" [ref=e25] [cursor=pointer]:
            - /url: /#subscribeFormSection
            - generic [ref=e26]: 
            - generic [ref=e27]: GET SHOW ALERTS
          - link " HUB" [ref=e28] [cursor=pointer]:
            - /url: /
            - generic [ref=e29]: 
            - generic [ref=e30]: HUB
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e33]: 
            - generic [ref=e34]: Watch Else Where
          - generic [ref=e35]:
            - link " YT" [ref=e36] [cursor=pointer]:
              - /url: https://youtube.com/@kinsbandofficial/live
              - generic [ref=e37]:
                - generic [ref=e38]: 
                - generic [ref=e39]: YT
            - link " TTV" [ref=e40] [cursor=pointer]:
              - /url: https://twitch.tv/kinsbandofficial
              - generic [ref=e41]:
                - generic [ref=e42]: 
                - generic [ref=e43]: TTV
            - link " KICK" [ref=e44] [cursor=pointer]:
              - /url: https://kick.com/kinsband
              - generic [ref=e45]:
                - generic [ref=e46]: 
                - generic [ref=e47]: KICK
            - link " TK" [ref=e48] [cursor=pointer]:
              - /url: https://tiktok.com/@kinsbandofficial/live
              - generic [ref=e49]:
                - generic [ref=e50]: 
                - generic [ref=e51]: TK
            - link " FB" [ref=e52] [cursor=pointer]:
              - /url: https://facebook.com/kinsbandofficial/live
              - generic [ref=e53]:
                - generic [ref=e54]: 
                - generic [ref=e55]: FB
            - link " X" [ref=e56] [cursor=pointer]:
              - /url: https://x.com/kinsbandofficial
              - generic [ref=e57]:
                - generic [ref=e58]: 
                - generic [ref=e59]: X
      - region "Live Fan Wall" [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]: 
            - generic [ref=e65]:
              - heading "LIVE FAN WALL" [level=2] [ref=e66]
              - paragraph [ref=e67]: Live concert photos, pit videos & merch drops
          - 'button " ADD YOUR SHOT #KINSLIVE " [ref=e68] [cursor=pointer]':
            - generic [ref=e69]: 
            - generic [ref=e71]:
              - generic [ref=e72]: ADD YOUR SHOT
              - generic [ref=e73]: "#KINSLIVE"
            - generic [ref=e74]: 
        - tablist "Filter Fan Wall by category" [ref=e75]:
          - tab "All ( 0 )" [selected] [ref=e76] [cursor=pointer]:
            - generic [ref=e77]: All
            - text: (
            - generic [ref=e78]: "0"
            - text: )
          - tab "Photos ( 0 )" [ref=e79] [cursor=pointer]:
            - generic [ref=e80]: Photos
            - text: (
            - generic [ref=e81]: "0"
            - text: )
          - tab "Pit Shots ( 0 )" [ref=e82] [cursor=pointer]:
            - generic [ref=e83]: Pit Shots
            - text: (
            - generic [ref=e84]: "0"
            - text: )
          - tab "Videos ( 0 )" [ref=e85] [cursor=pointer]:
            - generic [ref=e86]: Videos
            - text: (
            - generic [ref=e87]: "0"
            - text: )
          - tab "Merch ( 0 )" [ref=e88] [cursor=pointer]:
            - generic [ref=e89]: Merch
            - text: (
            - generic [ref=e90]: "0"
            - text: )
        - status [ref=e92]:
          - generic [ref=e93]: 
          - heading "No posts in this category yet" [level=3] [ref=e95]
          - paragraph [ref=e96]: Be the first to share your concert shots from the crowd!
          - button "UPLOAD THE FIRST SHOT" [ref=e97] [cursor=pointer]:
            - generic [ref=e98]: +
    - contentinfo [ref=e100]:
      - generic [ref=e101]:
        - generic [ref=e102]:
          - generic [ref=e103]: 
          - generic [ref=e104]: KINS OFFICIAL CONCERT BROADCAST • THE CAMBRIDGE HOTEL
        - link "Back to Bio Tree" [ref=e105] [cursor=pointer]:
          - /url: /
    - button "Upload live photo or video to fan wall" [ref=e106] [cursor=pointer]:
      - generic [ref=e107]:
        - generic [ref=e108]: 
        - generic [ref=e109]: +
      - generic [ref=e111]:
        - generic [ref=e112]: UPLOAD SHOT
        - generic [ref=e113]: "#KINSLIVE"
  - generic [ref=e116]:
    - button [ref=e117]
    - button [ref=e123]
    - button [ref=e127]
    - button [ref=e132]
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