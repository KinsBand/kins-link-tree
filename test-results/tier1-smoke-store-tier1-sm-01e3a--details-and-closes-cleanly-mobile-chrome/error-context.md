# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\store.spec.ts >> tier1 smoke — store page >> quick view modal opens with product details and closes cleanly
- Location: e2e\tier1-smoke\store.spec.ts:153:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.store-product-card').first().locator('.product-card-img-wrap').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Subscribe to Kins" [ref=e6] [cursor=pointer]:
          - generic: 
          - generic: SOON
        - button "Search cover videos" [ref=e7] [cursor=pointer]:
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
        - text:                                                              
      - generic [ref=e44]:
        - generic [ref=e45]:
          - button "STREAMS" [ref=e46] [cursor=pointer]
          - button "SOCIALS" [ref=e47] [cursor=pointer]
          - button "COMMUNITY" [ref=e48] [cursor=pointer]
        - text:                         
        - generic [ref=e49]:
          - generic [ref=e50]:
            - link " Instagram " [ref=e51] [cursor=pointer]:
              - /url: https://www.instagram.com/kinsbandofficial?igsi=M21ycDZuemZ0bDIx
              - generic [ref=e52]:
                - generic [ref=e53]: 
                - generic [ref=e55]: Instagram
              - generic [ref=e56]: 
            - link " TikTok " [ref=e58] [cursor=pointer]:
              - /url: https://www.tiktok.com/@kinsbandofficial?_r=1&_t=ZS-995ASSdnVsQ
              - generic [ref=e59]:
                - generic [ref=e60]: 
                - generic [ref=e62]: TikTok
              - generic [ref=e63]: 
            - link " YouTube " [ref=e65] [cursor=pointer]:
              - /url: https://youtube.com/@kinsbandofficial?si=NYyLEYxEDcoH21XZ
              - generic [ref=e66]:
                - generic [ref=e67]: 
                - generic [ref=e69]: YouTube
              - generic [ref=e70]: 
            - link " Facebook " [ref=e72] [cursor=pointer]:
              - /url: https://www.facebook.com/share/1LU7GTyCBW/
              - generic [ref=e73]:
                - generic [ref=e74]: 
                - generic [ref=e76]: Facebook
              - generic [ref=e77]: 
            - link " Twitter / X " [ref=e79] [cursor=pointer]:
              - /url: https://x.com/KinsBandOfficial
              - generic [ref=e80]:
                - generic [ref=e81]: 
                - generic [ref=e83]: Twitter / X
              - generic [ref=e84]: 
            - link " Threads " [ref=e86] [cursor=pointer]:
              - /url: https://www.threads.com/@kinsbandofficial
              - generic [ref=e87]:
                - generic [ref=e88]: 
                - generic [ref=e90]: Threads
              - generic [ref=e91]: 
          - generic [ref=e93]:
            - link " Snapchat " [ref=e94] [cursor=pointer]:
              - /url: https://snapchat.com/add/KinsBandOfficial
              - generic [ref=e95]:
                - generic [ref=e96]: 
                - generic [ref=e98]: Snapchat
              - generic [ref=e99]: 
            - link " LinkedIn " [ref=e101] [cursor=pointer]:
              - /url: https://linkedin.com/company/KinsBandOfficial
              - generic [ref=e102]:
                - generic [ref=e103]: 
                - generic [ref=e105]: LinkedIn
              - generic [ref=e106]: 
          - button "Toggle all social channels" [ref=e108] [cursor=pointer]:
            - generic [ref=e109]:
              - generic "Snapchat" [ref=e110]: 
              - generic "LinkedIn" [ref=e112]: 
            - generic [ref=e114]: Other (+2)
            - generic [ref=e115]: 
        - text:            
      - generic [ref=e117]:
        - region "Fan Club Subscription (Coming Soon)" [ref=e118]:
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
          - button "Fan club subscription coming soon. Tap for more info." [ref=e119] [cursor=pointer]
        - text:  
        - generic [ref=e120]:
          - generic [ref=e121]:
            - generic [ref=e122]: 
            - generic [ref=e123]: Official Contacts & Feedback
          - generic [ref=e124]:
            - button " HelloKinsFan@gmail.com General Chat, Help & Site Suggestions Copy email HelloKinsFan@gmail.com Send email to HelloKinsFan@gmail.com" [ref=e125] [cursor=pointer]:
              - generic [ref=e126]: 
              - generic [ref=e128]:
                - generic [ref=e129]: HelloKinsFan@gmail.com
                - generic [ref=e130]: General Chat, Help & Site Suggestions
              - generic [ref=e131]:
                - button "Copy email HelloKinsFan@gmail.com" [ref=e132]:
                  - generic [ref=e133]: 
                  - generic [ref=e134]: Copy email
                - link "Send email to HelloKinsFan@gmail.com" [ref=e135]:
                  - /url: mailto:HelloKinsFan@gmail.com?subject=Kins%20Inquiry%20%26%20Feedback
                  - generic [ref=e136]: 
                  - generic [ref=e137]: Go to mail app
            - button " BookingsKinsBand@gmail.com Shows, Tours & Live Booking Copy email BookingsKinsBand@gmail.com Send email to BookingsKinsBand@gmail.com" [ref=e138] [cursor=pointer]:
              - generic [ref=e139]: 
              - generic [ref=e141]:
                - generic [ref=e142]: BookingsKinsBand@gmail.com
                - generic [ref=e143]: Shows, Tours & Live Booking
              - generic [ref=e144]:
                - button "Copy email BookingsKinsBand@gmail.com" [ref=e145]:
                  - generic [ref=e146]: 
                  - generic [ref=e147]: Copy email
                - link "Send email to BookingsKinsBand@gmail.com" [ref=e148]:
                  - /url: mailto:BookingsKinsBand@gmail.com?subject=Kins%20Booking%20Inquiry
                  - generic [ref=e149]: 
                  - generic [ref=e150]: Go to mail app
          - generic [ref=e151]:
            - button "Suggest improvement or report issue" [ref=e152] [cursor=pointer]:
              - generic [ref=e153]: 
              - generic [ref=e154]: Suggest Feedback
            - button "Tip or support Kins" [ref=e155] [cursor=pointer]:
              - generic [ref=e156]: 
              - generic [ref=e157]: Tip / Support Kins
    - main [ref=e158]:
      - generic [ref=e159]:
        - generic [ref=e160]:
          - heading " Band Members" [level=3] [ref=e161]:
            - generic [ref=e162]: 
            - text: Band Members
          - generic:
            - button "Scroll members left" [disabled]:
              - generic: 
            - button "Scroll members right":
              - generic: 
        - generic [ref=e163]:
          - generic [ref=e164]:
            - generic [ref=e165]:
              - generic [ref=e166]: V
              - generic [ref=e167]: 
              - generic [ref=e168]: VOCALS & GUITAR
            - generic [ref=e169]:
              - heading "Vivian" [level=4] [ref=e170]
              - paragraph [ref=e171]: Melodies & guitar hooks.
          - generic [ref=e172]:
            - generic [ref=e173]:
              - generic [ref=e174]: C
              - generic [ref=e175]: 
              - generic [ref=e176]: GUITAR & VOCALS
            - generic [ref=e177]:
              - heading "Charlie" [level=4] [ref=e178]
              - paragraph [ref=e179]: Lyrics, guitar & band energy.
          - generic [ref=e180]:
            - generic [ref=e181]:
              - generic [ref=e182]: O
              - generic [ref=e183]: 
              - generic [ref=e184]: BASS
            - generic [ref=e185]:
              - heading "Oscar" [level=4] [ref=e186]
              - paragraph [ref=e187]: Basslines & vintage synths.
          - generic [ref=e188]:
            - generic [ref=e189]:
              - generic [ref=e190]: T
              - generic [ref=e191]: 
              - generic [ref=e192]: DRUMS
            - generic [ref=e193]:
              - heading "Trai" [level=4] [ref=e194]
              - paragraph [ref=e195]: Drums & driving heartbeat.
      - text:     +   +   +   +   +
      - generic [ref=e196]:
        - heading " What Inspires Us" [level=3] [ref=e198]:
          - generic [ref=e199]: 
          - text: What Inspires Us
        - tablist "Band Member Inspiration Tabs" [ref=e200]:
          - tab "ALL" [selected] [ref=e201] [cursor=pointer]
          - tab "TRAI" [ref=e202] [cursor=pointer]
          - tab "VIVIAN" [ref=e203] [cursor=pointer]
          - tab "OSCAR" [ref=e204] [cursor=pointer]
          - tab "CHARLIE" [ref=e205] [cursor=pointer]
        - generic [ref=e206]:
          - generic [ref=e207] [cursor=pointer]:
            - generic [ref=e208]:
              - text: 
              - img "Turnip Farm" [ref=e209]
            - generic [ref=e210]:
              - generic [ref=e211]: Turnip Farm
              - generic [ref=e213]: Dinosaur Jr.
              - generic [ref=e214]:
                - generic [ref=e215]: Grunge
                - generic "Curated by Charlie" [ref=e217]: C
            - button "Play song" [ref=e218]:
              - generic [ref=e219]: 
          - generic [ref=e220] [cursor=pointer]:
            - generic [ref=e221]:
              - text: 
              - img "(David Bowie I Love You) Since I Was Six" [ref=e222]
            - generic [ref=e223]:
              - generic [ref=e224]: (David Bowie I Love You) Since I Was Six
              - generic [ref=e226]: The Brian Jonestown Massacre
              - generic [ref=e227]:
                - generic [ref=e228]: Neo-Psychedelia
                - generic "Curated by Charlie" [ref=e230]: C
            - button "Play song" [ref=e231]:
              - generic [ref=e232]: 
          - generic [ref=e233] [cursor=pointer]:
            - generic [ref=e234]:
              - text: 
              - img "Underwear" [ref=e235]
            - generic [ref=e236]:
              - generic [ref=e237]: Underwear
              - generic [ref=e239]: Pulp
              - generic [ref=e240]:
                - generic [ref=e241]: Britpop
                - generic "Curated by Charlie" [ref=e243]: C
            - button "Play song" [ref=e244]:
              - generic [ref=e245]: 
          - generic [ref=e246] [cursor=pointer]:
            - generic [ref=e247]:
              - text: 
              - img "Unmade Bed" [ref=e248]
            - generic [ref=e249]:
              - generic [ref=e250]: Unmade Bed
              - generic [ref=e252]: Sonic Youth
              - generic [ref=e253]:
                - generic [ref=e254]: Noise Rock
                - generic "Curated by Charlie" [ref=e256]: C
            - button "Play song" [ref=e257]:
              - generic [ref=e258]: 
        - generic [ref=e259]:
          - button "Previous Page" [disabled] [ref=e260]:
            - generic [ref=e261]: 
          - generic [ref=e262]:
            - button "Page 1" [ref=e263] [cursor=pointer]
            - button "Page 2" [ref=e264] [cursor=pointer]
            - button "Page 3" [ref=e265] [cursor=pointer]
            - button "Page 4" [ref=e266] [cursor=pointer]
            - button "Page 5" [ref=e267] [cursor=pointer]
          - button "Next Page" [ref=e268] [cursor=pointer]:
            - generic [ref=e269]: 
      - generic [ref=e271]:
        - generic [ref=e272]:
          - generic [ref=e273]:
            - generic [ref=e274]: 
            - generic [ref=e276]:
              - heading "KINS TOOLS" [level=3] [ref=e277]
              - paragraph [ref=e278]: Offline-ready browser tools for musicians.
          - button "Download KINS TOOLS app for offline use" [ref=e279] [cursor=pointer]:
            - generic [ref=e280]: 
        - article [ref=e282]:
          - generic [ref=e283]:
            - heading "METRONOME" [level=4] [ref=e292]
            - paragraph [ref=e293]: Tap tempo · 4/4, 6/8, 7/8 · Accents
            - link "Launch Metronome → - Open METRONOME" [ref=e295] [cursor=pointer]:
              - /url: /metronome
              - generic [ref=e296]: Open Metro →
      - generic [ref=e298]:
        - group "Toggle Display Theme" [ref=e300] [cursor=pointer]:
          - generic [ref=e301]: Light
          - radiogroup "Select theme mode" [ref=e302]:
            - button "Light Mode" [pressed] [ref=e303]:
              - generic [ref=e304]: 
            - button "Dark Mode" [ref=e305]:
              - generic [ref=e306]: 
          - generic [ref=e307]: Mode
        - generic [ref=e309]:
          - generic [ref=e310]: 
          - generic [ref=e311]: "@2026 KINS."
        - navigation "Site Links and Legal Navigation" [ref=e312]:
          - button "FEEDBACK" [ref=e313] [cursor=pointer]
          - generic [ref=e314]: •
          - button "LEGAL" [ref=e315] [cursor=pointer]
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
  - text: "       #           @                        "
  - generic:
    - text:           
    - generic [ref=e316]:
      - generic [ref=e317]:
        - generic [ref=e318]: INSPIRATION
        - generic [ref=e319] [cursor=pointer]:
          - generic [ref=e320]:
            - generic [ref=e321]:
              - img "Album cover 1" [ref=e322]
              - text: 
            - generic [ref=e323]:
              - img "Album cover 2" [ref=e324]
              - text: 
            - generic [ref=e325]:
              - img "Album cover 3" [ref=e326]
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
  58  |     const clearBtn = page.locator('#storeSearchClearBtn');
  59  |     await expect(clearBtn).toBeVisible();
  60  |     await clearBtn.click();
  61  |     await expect(searchInput).toHaveValue('');
  62  |   });
  63  | 
  64  |   test('adding a product to the cart shows ADDED feedback, updates drawer and quantities', async ({ page }) => {
  65  |     await page.goto('/store');
  66  | 
  67  |     // Find the hoodie product's Add to Bag button
  68  |     const firstCard = page.locator('.store-product-card[data-product-id="kins-apparel-hoodie"]');
  69  |     await expect(firstCard).toBeVisible();
  70  |     
  71  |     const addBtn = firstCard.locator('.btn-add-to-cart');
  72  |     await addBtn.click();
  73  | 
  74  |     // Verify Cart Drawer opens
  75  |     const drawer = page.locator('#storeCartDrawer');
  76  |     await expect(drawer).toHaveClass(/is-open/);
  77  | 
  78  |     // Verify Line Item exists
  79  |     const lineItem = page.locator('.cart-line-item');
  80  |     await expect(lineItem).toHaveCount(1);
  81  |     await expect(lineItem.locator('.cart-item-title')).toContainText('Tour Hoodie');
  82  | 
  83  |     // Verify Nav Badge updated
  84  |     const navBadge = page.locator('#storeNavBadgeCount');
  85  |     await expect(navBadge).toBeVisible();
  86  |     await expect(navBadge).toHaveText('1');
  87  | 
  88  |     // Test Quantity Stepper (+)
  89  |     const plusBtn = lineItem.locator('[data-action="qty-plus"]');
  90  |     await plusBtn.click();
  91  |     await expect(lineItem.locator('.cart-qty-value')).toHaveText('2');
  92  |     await expect(navBadge).toHaveText('2');
  93  | 
  94  |     // Test Promo Code Application
  95  |     const promoInput = page.locator('#cartPromoInput');
  96  |     const promoSubmit = page.locator('#cartPromoSubmitBtn');
  97  |     await promoInput.fill('KINSVIP2026');
  98  |     await promoSubmit.click();
  99  | 
  100 |     const discountRow = page.locator('#cartDiscountRow');
  101 |     await expect(discountRow).toBeVisible();
  102 |     await expect(discountRow.locator('#cartDiscountAmount')).toContainText('-$');
  103 | 
  104 |     // Close Drawer via Close Button
  105 |     const closeDrawerBtn = page.locator('#closeCartDrawerBtn');
  106 |     await closeDrawerBtn.click();
  107 |     await expect(drawer).not.toHaveClass(/is-open/);
  108 |   });
  109 | 
  110 |   test('merch lab bottom sheet modal opens, submits fan concept, and shows confirmation', async ({ page }) => {
  111 |     await page.goto('/store');
  112 | 
  113 |     // Open modal via trigger button
  114 |     const openBtn = page.locator('#openMerchIdeaModalBtn');
  115 |     await expect(openBtn).toBeVisible();
  116 |     await openBtn.click();
  117 | 
  118 |     const modal = page.locator('#merchIdeaModal');
  119 |     await expect(modal).not.toHaveClass(/hidden/);
  120 |     await expect(page.locator('#merchIdeaPillTitle')).toBeVisible();
  121 | 
  122 |     // Select a category chip
  123 |     const pinChip = page.locator('#modalCategoryChipsGrid .category-chip[data-category="Small Swag & Pins"]');
  124 |     await pinChip.click();
  125 |     await expect(pinChip).toHaveClass(/active/);
  126 | 
  127 |     // Fill form
  128 |     await page.locator('#modalIdeaTitle').fill('Vintage Stage Plot Enamel Pin');
  129 |     await page.locator('#modalIdeaDesc').fill('A mini gold-plated pin of the drum kit with glowing green cymbal details.');
  130 |     await page.locator('#modalIdeaContact').fill('@superfan_drummer');
  131 | 
  132 |     // Mock API response
  133 |     await page.route('/api/merch-idea', async (route) => {
  134 |       await route.fulfill({
  135 |         status: 200,
  136 |         contentType: 'application/json',
  137 |         body: JSON.stringify({ status: 'success', message: 'Concept logged!' })
  138 |       });
  139 |     });
  140 | 
  141 |     await page.locator('#modalSubmitConceptBtn').click();
  142 | 
  143 |     // Verify success view
  144 |     const successView = page.locator('#modalIdeaSuccessView');
  145 |     await expect(successView).not.toHaveClass(/hidden/);
  146 |     await expect(successView).toContainText('CONCEPT LOGGED IN THE VAULT');
  147 | 
  148 |     // Close via Done button
  149 |     await page.locator('#modalDoneBtn').click();
  150 |     await expect(modal).toHaveClass(/hidden/);
  151 |   });
  152 | 
  153 |   test('quick view modal opens with product details and closes cleanly', async ({ page }) => {
  154 |     await page.goto('/store');
  155 | 
  156 |     const firstCard = page.locator('.store-product-card').first();
  157 |     const quickViewImg = firstCard.locator('.product-card-img-wrap').first();
> 158 |     await quickViewImg.click();
      |                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  159 | 
  160 |     const modal = page.locator('#productQuickViewModal');
  161 |     await expect(modal).toHaveClass(/is-open/);
  162 |     await expect(modal.locator('#quickViewTitle')).toBeVisible();
  163 |     await expect(modal.locator('#quickViewAddBtn')).toBeVisible();
  164 | 
  165 |     // Close modal via ESC key
  166 |     await page.keyboard.press('Escape');
  167 |     await expect(modal).not.toHaveClass(/is-open/);
  168 |   });
  169 | 
  170 |   test('store footer toggles display theme cleanly', async ({ page }) => {
  171 |     await page.goto('/store');
  172 | 
  173 |     const footer = page.locator('.site-footer');
  174 |     await expect(footer).toBeVisible();
  175 | 
  176 |     const darkBtn = footer.locator('#themePillDarkBtn');
  177 |     const lightBtn = footer.locator('#themePillLightBtn');
  178 | 
  179 |     await darkBtn.click();
  180 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  181 | 
  182 |     await lightBtn.click();
  183 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
  184 |   });
  185 | });
  186 | 
```