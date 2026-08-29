# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tier1-smoke\store.spec.ts >> tier1 smoke — store page >> merch lab bottom sheet modal opens, submits fan concept, and shows confirmation
- Location: e2e\tier1-smoke\store.spec.ts:110:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#openMerchIdeaModalBtn')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#openMerchIdeaModalBtn')

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
- img "Album cover 3"
- text: WHAT INSPIRES US! listen to what inspires KINS
- button "Auto-mix inspiration songs": 
- button "Tour dates & Gig Map (Coming Soon)": GIG MAP  COMING SOON
```

# Test source

```ts
  15  |     // Verify Filter Bar & Products
  16  |     await expect(page.locator('.store-filter-bar-container')).toBeVisible();
  17  |     await expect(page.locator('.store-product-card').first()).toBeVisible();
  18  | 
  19  |     // Verify Merch Lab Trigger
  20  |     await expect(page.locator('.store-lab-trigger-section')).toBeVisible();
  21  |   });
  22  | 
  23  |   test('category filter switching filters catalog and updates active pill', async ({ page }) => {
  24  |     await page.goto('/store');
  25  | 
  26  |     const musicPill = page.locator('.store-category-pill[data-category="music"]');
  27  |     await expect(musicPill).toBeVisible();
  28  |     await musicPill.click();
  29  | 
  30  |     await expect(musicPill).toHaveClass(/active/);
  31  |     
  32  |     // Verify only music products are visible
  33  |     const visibleCards = page.locator('.store-product-card:not(.hidden-by-filter)');
  34  |     const count = await visibleCards.count();
  35  |     expect(count).toBeGreaterThan(0);
  36  |     await expect(visibleCards.first()).toHaveAttribute('data-category', 'music');
  37  | 
  38  |     // Switch back to all
  39  |     const allPill = page.locator('.store-category-pill[data-category="all"]');
  40  |     await allPill.click();
  41  |     await expect(allPill).toHaveClass(/active/);
  42  |     const allCards = page.locator('.store-product-card:not(.hidden-by-filter)');
  43  |     const totalCount = await allCards.count();
  44  |     expect(totalCount).toBeGreaterThan(count);
  45  |   });
  46  | 
  47  |   test('search input filters store items in real time', async ({ page }) => {
  48  |     await page.goto('/store');
  49  | 
  50  |     const searchInput = page.locator('#storeSearchInput');
  51  |     await searchInput.fill('hoodie');
  52  | 
  53  |     const visibleCards = page.locator('.store-product-card:not(.hidden-by-filter)');
  54  |     await expect(visibleCards).toHaveCount(1);
  55  |     await expect(visibleCards.first()).toHaveAttribute('data-title', /Hoodie/i);
  56  | 
  57  |     // Clear search
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
> 115 |     await expect(openBtn).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
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
  158 |     await quickViewImg.click();
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