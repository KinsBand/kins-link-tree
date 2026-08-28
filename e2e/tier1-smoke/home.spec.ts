import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — home hub', () => {
  test('home renders hero, members and subscribe sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#subscribeFormSection')).toBeVisible();
    await expect(page.locator('.members-scroll-container .member-card').first()).toBeVisible();
  });

  test('tuner page loads with instrument tabs', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page.locator('#tunerReadoutPanel')).toBeVisible();
    await expect(page.locator('#tunerMicBtn')).toBeVisible();
  });

  test('epk is hidden and direct navigation redirects to homepage when disabled', async ({ page }) => {
    await page.goto('/');
    
    // Top nav EPK button should not exist
    const epkTopNavBtn = page.locator('.top-nav-epk-btn');
    await expect(epkTopNavBtn).toBeHidden();

    // Footer nav EPK link should not exist
    const epkFooterLink = page.locator('a[data-track="footer:nav_epk"]');
    await expect(epkFooterLink).toBeHidden();

    // Direct navigation to /epk redirects away to homepage
    await page.goto('/epk');
    await expect(page).not.toHaveURL(/\/epk/);
    await expect(page).toHaveURL(/\/$/);
  });

  test('live page resolves (offline or live mode, never 404)', async ({ page }) => {
    const res = await page.goto('/live');
    expect(res?.status() ?? 200).toBeLessThan(400);
  });

  test('home footer renders theme toggle first and toggles theme', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.site-footer .footer-inner-card');
    await expect(footer).toBeVisible();

    // Verify first element inside footer-inner-card is footer-theme-toggle-wrap
    const firstChild = footer.locator('> *:first-child');
    await expect(firstChild).toHaveClass(/footer-theme-toggle-wrap/);

    // Test Theme Switcher
    const darkBtn = footer.locator('#themePillDarkBtn');
    const lightBtn = footer.locator('#themePillLightBtn');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
  });

  test('share modal opens with bottom sheet layout, interactive copy rows, dual asset deck, and fast export', async ({ page }) => {
    await page.goto('/');

    const shareBtn = page.locator('#shareBtn');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    const shareModal = page.locator('#shareModal');
    await expect(shareModal).toBeVisible();

    // Verify floating pill header above sheet
    const floatingPill = page.locator('#shareFloatingPillHeader');
    await expect(floatingPill).toBeVisible();
    await expect(floatingPill.locator('.sheet-pill-title')).toContainText('SHARE');
    await expect(floatingPill.locator('#closeShareModal')).toBeVisible();

    // Verify copy rows
    const copyUrlRow = page.locator('#copyUrlRow');
    const copyHandleRow = page.locator('#copyHandleRow');
    await expect(copyUrlRow).toBeVisible();
    await expect(copyHandleRow).toBeVisible();

    // Verify vanity link display
    await expect(copyUrlRow.locator('.copy-row-primary')).toHaveText('kinsband-hub.vercel.app');
    await expect(copyHandleRow.locator('.copy-row-primary')).toHaveText('@KinsBandOfficial');

    // Test tap-to-copy URL row feedback (icon transitions to checkmark tick)
    await copyUrlRow.click();
    const urlIcon = page.locator('#copyUrlIcon');
    await expect(urlIcon).toHaveClass(/fa-check/);

    // Verify dual asset deck (QR Code & Band Logo) and install CTA
    await expect(page.locator('#qrAssetCard')).toBeVisible();
    await expect(page.locator('#logoAssetCard')).toBeVisible();
    await expect(page.locator('#downloadPwaCtaBtn')).toBeVisible();

    // Open QR Code fullscreen lightbox
    const qrWrapper = page.locator('#qrcodeCanvasWrapper');
    await qrWrapper.click();
    const qrFullscreenModal = page.locator('#qrFullscreenModal');
    await expect(qrFullscreenModal).toBeVisible();

    // Verify floating pill header and click close
    const qrPill = page.locator('#qrFullscreenFloatingPillHeader');
    await expect(qrPill).toBeVisible();
    await expect(qrPill.locator('.sheet-pill-title')).toContainText('QR CODE');
    const closeQrFullscreenBtn = qrPill.locator('#closeQrFullscreenBtn');
    await expect(closeQrFullscreenBtn).toBeVisible();
    await closeQrFullscreenBtn.click();
    await expect(qrFullscreenModal).toBeHidden();

    // Open Logo download format modal
    const openLogoBtn = page.locator('#openLogoDownloadModalBtn');
    await openLogoBtn.click();
    const logoFormatModal = page.locator('#logoDownloadFormatModal');
    await expect(logoFormatModal).toBeVisible();

    // Verify logo floating pill header and close modal
    const logoPill = page.locator('#logoDownloadFloatingPillHeader');
    await expect(logoPill).toBeVisible();
    await expect(logoPill.locator('.sheet-pill-title')).toContainText('EXPORT LOGO');
    const closeLogoBtn = logoPill.locator('#closeLogoFormatModalBtn');
    await expect(closeLogoBtn).toBeVisible();
    await closeLogoBtn.click();
    await expect(logoFormatModal).toBeHidden();

    // Close main share modal
    await page.keyboard.press('Escape');
    await expect(shareModal).toBeHidden();
  });

  test('feedback modal opens with floating pill header and closes cleanly', async ({ page }) => {
    await page.goto('/');

    const feedbackBtn = page.locator('#openFeedbackFooterBtn');
    await expect(feedbackBtn).toBeVisible();
    await feedbackBtn.click();

    const feedbackModal = page.locator('#feedbackModal');
    await expect(feedbackModal).toBeVisible();

    // Verify floating pill header
    const pill = page.locator('#feedbackFloatingPillHeader');
    await expect(pill).toBeVisible();
    await expect(pill.locator('#feedbackPillTitle')).toContainText('FEEDBACK');

    // Close via close button in floating pill
    const closeBtn = pill.locator('#closeFeedbackModal');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(feedbackModal).toBeHidden();
  });

  test('legal modal opens with floating pill header and closes cleanly', async ({ page }) => {
    await page.goto('/');

    const legalBtn = page.locator('#openLegalFooterBtn');
    await expect(legalBtn).toBeVisible();
    await legalBtn.click();

    const legalModal = page.locator('#legalModal');
    await expect(legalModal).toBeVisible();

    // Verify floating pill header
    const pill = page.locator('#legalFloatingPillHeader');
    await expect(pill).toBeVisible();
    await expect(pill.locator('#legalPillTitle')).toContainText('LEGAL');

    // Close via close button in floating pill
    const closeBtn = pill.locator('#closeLegalModalBtn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(legalModal).toBeHidden();
  });
});
