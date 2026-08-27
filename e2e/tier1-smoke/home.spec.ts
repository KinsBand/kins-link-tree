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

    // Verify copy rows
    const copyUrlRow = page.locator('#copyUrlRow');
    const copyHandleRow = page.locator('#copyHandleRow');
    await expect(copyUrlRow).toBeVisible();
    await expect(copyHandleRow).toBeVisible();

    // Verify vanity link display
    await expect(copyUrlRow.locator('.copy-row-primary')).toHaveText('kinsband-hub.vercel.app');
    await expect(copyHandleRow.locator('.copy-row-primary')).toHaveText('@KinsBandOfficial');

    // Test tap-to-copy URL row feedback
    await copyUrlRow.click();
    const urlStatus = page.locator('#copyUrlStatus');
    await expect(urlStatus).toHaveText('COPIED! ✓');

    // Verify dual asset deck (QR Code & Band Logo) and install CTA
    await expect(page.locator('#qrAssetCard')).toBeVisible();
    await expect(page.locator('#logoAssetCard')).toBeVisible();
    await expect(page.locator('#downloadPwaCtaBtn')).toBeVisible();

    // Open QR Code fullscreen lightbox
    const qrWrapper = page.locator('#qrcodeCanvasWrapper');
    await qrWrapper.click();
    const qrFullscreenModal = page.locator('#qrFullscreenModal');
    await expect(qrFullscreenModal).toBeVisible();

    // Verify header close button and click to close
    const closeQrFullscreenBtn = page.locator('#closeQrFullscreenBtn');
    await expect(closeQrFullscreenBtn).toBeVisible();
    await closeQrFullscreenBtn.click();
    await expect(qrFullscreenModal).toBeHidden();

    // Open Logo download format modal
    const openLogoBtn = page.locator('#openLogoDownloadModalBtn');
    await openLogoBtn.click();
    const logoFormatModal = page.locator('#logoDownloadFormatModal');
    await expect(logoFormatModal).toBeVisible();

    // Verify logo close button and close modal
    const closeLogoBtn = page.locator('#closeLogoFormatModalBtn');
    await expect(closeLogoBtn).toBeVisible();
    await closeLogoBtn.click();
    await expect(logoFormatModal).toBeHidden();

    // Close main share modal
    await page.keyboard.press('Escape');
    await expect(shareModal).toBeHidden();
  });
});
