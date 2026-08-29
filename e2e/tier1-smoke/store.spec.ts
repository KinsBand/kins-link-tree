import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — store page', () => {
  test('store renders navigation with HOME STORE EPK, ticker, filter bar, and product cards', async ({ page }) => {
    await page.goto('/store');
    
    // Verify Navigation & Brand
    await expect(page.locator('#storeNavHeader')).toBeVisible();
    await expect(page.locator('.store-nav-brand-link')).toBeVisible();
    await expect(page.locator('#storeNavCartBtn')).toBeVisible();

    // Verify Announcement Ticker
    await expect(page.locator('.store-announcement-strip')).toBeVisible();

    // Verify Filter Bar & Products
    await expect(page.locator('.store-filter-bar-container')).toBeVisible();
    await expect(page.locator('.store-product-card').first()).toBeVisible();

    // Verify Merch Lab Trigger
    await expect(page.locator('.store-lab-trigger-section')).toBeVisible();
  });

  test('category filter switching filters catalog and updates active pill', async ({ page }) => {
    await page.goto('/store');

    const musicPill = page.locator('.store-category-pill[data-category="music"]');
    await expect(musicPill).toBeVisible();
    await musicPill.click();

    await expect(musicPill).toHaveClass(/active/);
    
    // Verify only music products are visible
    const visibleCards = page.locator('.store-product-card:not(.hidden-by-filter)');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThan(0);
    await expect(visibleCards.first()).toHaveAttribute('data-category', 'music');

    // Switch back to all
    const allPill = page.locator('.store-category-pill[data-category="all"]');
    await allPill.click();
    await expect(allPill).toHaveClass(/active/);
    const allCards = page.locator('.store-product-card:not(.hidden-by-filter)');
    const totalCount = await allCards.count();
    expect(totalCount).toBeGreaterThan(count);
  });

  test('search input filters store items in real time', async ({ page }) => {
    await page.goto('/store');

    const searchInput = page.locator('#storeSearchInput');
    await searchInput.fill('hoodie');

    const visibleCards = page.locator('.store-product-card:not(.hidden-by-filter)');
    await expect(visibleCards).toHaveCount(1);
    await expect(visibleCards.first()).toHaveAttribute('data-title', /Hoodie/i);

    // Clear search
    const clearBtn = page.locator('#storeSearchClearBtn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('adding a product to the cart shows ADDED feedback, updates drawer and quantities', async ({ page }) => {
    await page.goto('/store');

    // Find the hoodie product's Add to Bag button
    const firstCard = page.locator('.store-product-card[data-product-id="kins-apparel-hoodie"]');
    await expect(firstCard).toBeVisible();
    
    const addBtn = firstCard.locator('.btn-add-to-cart');
    await addBtn.click();

    // Verify Cart Drawer opens
    const drawer = page.locator('#storeCartDrawer');
    await expect(drawer).toHaveClass(/is-open/);

    // Verify Line Item exists
    const lineItem = page.locator('.cart-line-item');
    await expect(lineItem).toHaveCount(1);
    await expect(lineItem.locator('.cart-item-title')).toContainText('Tour Hoodie');

    // Verify Nav Badge updated
    const navBadge = page.locator('#storeNavBadgeCount');
    await expect(navBadge).toBeVisible();
    await expect(navBadge).toHaveText('1');

    // Test Quantity Stepper (+)
    const plusBtn = lineItem.locator('[data-action="qty-plus"]');
    await plusBtn.click();
    await expect(lineItem.locator('.cart-qty-value')).toHaveText('2');
    await expect(navBadge).toHaveText('2');

    // Test Promo Code Application
    const promoInput = page.locator('#cartPromoInput');
    const promoSubmit = page.locator('#cartPromoSubmitBtn');
    await promoInput.fill('KINSVIP2026');
    await promoSubmit.click();

    const discountRow = page.locator('#cartDiscountRow');
    await expect(discountRow).toBeVisible();
    await expect(discountRow.locator('#cartDiscountAmount')).toContainText('-$');

    // Close Drawer via Close Button
    const closeDrawerBtn = page.locator('#closeCartDrawerBtn');
    await closeDrawerBtn.click();
    await expect(drawer).not.toHaveClass(/is-open/);
  });

  test('merch lab bottom sheet modal opens, submits fan concept, and shows confirmation', async ({ page }) => {
    await page.goto('/store');

    // Open modal via trigger button
    const openBtn = page.locator('#openMerchIdeaModalBtn');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    const modal = page.locator('#merchIdeaModal');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(page.locator('#merchIdeaPillTitle')).toBeVisible();

    // Select a category chip
    const pinChip = page.locator('#modalCategoryChipsGrid .category-chip[data-category="Small Swag & Pins"]');
    await pinChip.click();
    await expect(pinChip).toHaveClass(/active/);

    // Fill form
    await page.locator('#modalIdeaTitle').fill('Vintage Stage Plot Enamel Pin');
    await page.locator('#modalIdeaDesc').fill('A mini gold-plated pin of the drum kit with glowing green cymbal details.');
    await page.locator('#modalIdeaContact').fill('@superfan_drummer');

    // Mock API response
    await page.route('/api/merch-idea', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Concept logged!' })
      });
    });

    await page.locator('#modalSubmitConceptBtn').click();

    // Verify success view
    const successView = page.locator('#modalIdeaSuccessView');
    await expect(successView).not.toHaveClass(/hidden/);
    await expect(successView).toContainText('CONCEPT LOGGED IN THE VAULT');

    // Close via Done button
    await page.locator('#modalDoneBtn').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('quick view modal opens with product details and closes cleanly', async ({ page }) => {
    await page.goto('/store');

    const firstCard = page.locator('.store-product-card').first();
    const quickViewImg = firstCard.locator('.product-card-img-wrap').first();
    await quickViewImg.click();

    const modal = page.locator('#productQuickViewModal');
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator('#quickViewTitle')).toBeVisible();
    await expect(modal.locator('#quickViewAddBtn')).toBeVisible();

    // Close modal via ESC key
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/is-open/);
  });

  test('store footer toggles display theme cleanly', async ({ page }) => {
    await page.goto('/store');

    const footer = page.locator('.site-footer');
    await expect(footer).toBeVisible();

    const darkBtn = footer.locator('#themePillDarkBtn');
    const lightBtn = footer.locator('#themePillLightBtn');

    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
  });
});
