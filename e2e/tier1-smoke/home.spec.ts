import { test, expect } from '@playwright/test';

test.describe('tier1 smoke — home hub', () => {
  test('home renders hero, members and subscribe sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#subscribeFormSection')).toBeVisible();
    await expect(page.locator('.members-scroll-container .member-card').first()).toBeVisible();
  });

  test('tuner is hidden and direct navigation redirects to homepage when disabled', async ({ page }) => {
    await page.goto('/tuner');
    await expect(page).not.toHaveURL(/\/tuner/);
    await expect(page).toHaveURL(/\/$/);
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

  test('store is hidden and direct navigation redirects to homepage when disabled', async ({ page }) => {
    await page.goto('/');
    
    // Top nav Store button should not exist
    const storeTopNavBtn = page.locator('.top-nav-store-btn');
    await expect(storeTopNavBtn).toBeHidden();

    // Footer nav Store link should not exist
    const storeFooterLink = page.locator('a[data-track="footer:nav_store"]');
    await expect(storeFooterLink).toBeHidden();

    // Merch Section on homepage should not exist
    const merchSection = page.locator('#merch-section');
    await expect(merchSection).toBeHidden();

    // Direct navigation to /store redirects away to homepage
    await page.goto('/store');
    await expect(page).not.toHaveURL(/\/store/);
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

  test('tabbed links renders Streams, Socials (default active), and Community tabs and switches smoothly', async ({ page }) => {
    await page.goto('/');

    const tabSwitcher = page.locator('.tabbed-links-section .brutal-tab-switcher');
    await expect(tabSwitcher).toBeVisible();

    const streamsBtn = page.locator('#tabStreamsBtn');
    const socialsBtn = page.locator('#tabSocialsBtn');
    const communityBtn = page.locator('#tabCommunityBtn');

    // Verify all 3 tab buttons are present and ordered
    await expect(streamsBtn).toBeVisible();
    await expect(streamsBtn).toHaveText('STREAMS');
    await expect(socialsBtn).toBeVisible();
    await expect(socialsBtn).toHaveText('SOCIALS');
    await expect(communityBtn).toBeVisible();
    await expect(communityBtn).toHaveText('COMMUNITY');

    // Verify Socials is the default active tab
    await expect(socialsBtn).toHaveClass(/active/);
    await expect(streamsBtn).not.toHaveClass(/active/);
    await expect(communityBtn).not.toHaveClass(/active/);

    const socialsTab = page.locator('#socialsTab');
    const streamsTab = page.locator('#streamsTab');
    const communityTab = page.locator('#communityTab');

    await expect(socialsTab).toBeVisible();
    await expect(streamsTab).toBeHidden();
    await expect(communityTab).toBeHidden();

    // Verify primary socials exist
    await expect(socialsTab.locator('a[data-platform="instagram"]')).toBeVisible();
    await expect(socialsTab.locator('a[data-platform="tiktok"]')).toBeVisible();

    // Switch to Streams tab
    await streamsBtn.click();
    await expect(streamsBtn).toHaveClass(/active/);
    await expect(socialsBtn).not.toHaveClass(/active/);
    await expect(communityBtn).not.toHaveClass(/active/);
    await expect(streamsTab).toBeVisible();
    await expect(socialsTab).toBeHidden();
    await expect(communityTab).toBeHidden();
    await expect(streamsTab.locator('a[data-platform="spotify"]')).toBeVisible();

    // Switch to Community tab
    await communityBtn.click();
    await expect(communityBtn).toHaveClass(/active/);
    await expect(streamsBtn).not.toHaveClass(/active/);
    await expect(socialsBtn).not.toHaveClass(/active/);
    await expect(communityTab).toBeVisible();
    await expect(streamsTab).toBeHidden();
    await expect(socialsTab).toBeHidden();
    await expect(communityTab.locator('a[data-platform="discord"]')).toBeVisible();
    await expect(communityTab.locator('a[data-platform="reddit"]')).toBeVisible();
    await expect(communityTab.locator('a[data-platform="patreon"]')).toBeVisible();
    await expect(communityTab.locator('a[data-platform="pinterest"]')).toBeVisible();

    // Switch back to Socials tab
    await socialsBtn.click();
    await expect(socialsBtn).toHaveClass(/active/);
    await expect(socialsTab).toBeVisible();
    await expect(streamsTab).toBeHidden();
    await expect(communityTab).toBeHidden();
  });

  test('referral routing matrix opens Streams tab and highlights recommendations for ?ref=spotify', async ({ page }) => {
    await page.goto('/?ref=spotify');

    const streamsBtn = page.locator('#tabStreamsBtn');
    const socialsBtn = page.locator('#tabSocialsBtn');
    const streamsTab = page.locator('#streamsTab');
    const socialsTab = page.locator('#socialsTab');
    const communityTab = page.locator('#communityTab');

    // Verify Streams tab is opened by default for spotify origin
    await expect(streamsBtn).toHaveClass(/active/);
    await expect(socialsBtn).not.toHaveClass(/active/);
    await expect(streamsTab).toBeVisible();
    await expect(socialsTab).toBeHidden();

    // Verify recommended stream platforms have .is-recommended and minimalist ★ badge
    const appleMusicCard = streamsTab.locator('a[data-name="Apple Music"]');
    const ytMusicCard = streamsTab.locator('a[data-name="YT Music"]');
    await expect(appleMusicCard).toHaveClass(/is-recommended/);
    await expect(appleMusicCard.locator('.rec-star-badge')).toBeVisible();
    await expect(ytMusicCard).toHaveClass(/is-recommended/);
    await expect(ytMusicCard.locator('.rec-star-badge')).toBeVisible();

    // Switch to Socials tab and check recommended socials (Instagram, TikTok)
    await socialsBtn.click();
    const instaCard = socialsTab.locator('a[data-name="Instagram"]');
    const tikTokCard = socialsTab.locator('a[data-name="TikTok"]');
    await expect(instaCard).toHaveClass(/is-recommended/);
    await expect(tikTokCard).toHaveClass(/is-recommended/);

    // Switch to Community tab and check recommended community (Discord, Reddit)
    const communityBtn = page.locator('#tabCommunityBtn');
    await communityBtn.click();
    const discordCard = communityTab.locator('a[data-name="Discord"]');
    const redditCard = communityTab.locator('a[data-name="Reddit"]');
    await expect(discordCard).toHaveClass(/is-recommended/);
    await expect(redditCard).toHaveClass(/is-recommended/);
  });

  test('referral routing matrix opens Community tab and highlights recommendations for ?ref=discord', async ({ page }) => {
    await page.goto('/?ref=discord');

    const communityBtn = page.locator('#tabCommunityBtn');
    const communityTab = page.locator('#communityTab');

    // Verify Community tab is opened by default for discord origin
    await expect(communityBtn).toHaveClass(/active/);
    await expect(communityTab).toBeVisible();

    // Verify recommended community platforms for Discord (Reddit, Substack)
    const redditCard = communityTab.locator('a[data-name="Reddit"]');
    const substackCard = communityTab.locator('a[data-name="Substack"]');
    await expect(redditCard).toHaveClass(/is-recommended/);
    await expect(substackCard).toHaveClass(/is-recommended/);
  });

  test('share modal PWA button renders minimalist CTA and transitions to installed state', async ({ page }) => {
    await page.goto('/');

    const shareBtn = page.locator('#shareBtn');
    await shareBtn.click();

    const shareModal = page.locator('#shareModal');
    await expect(shareModal).toBeVisible();

    // Verify PWA installation group
    const pwaGroup = page.locator('#pwaInstallFieldGroup');
    await expect(pwaGroup).toBeVisible();

    const pwaBtn = page.locator('#downloadPwaCtaBtn');
    await expect(pwaBtn).toBeVisible();
    await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('Install App');
    await expect(pwaBtn.locator('#pwaProgressStatus')).toBeVisible();

    // Trigger mock global install event to verify reactive state transition
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('kins:pwa-installed', { detail: { stage: 2 } }));
    });

    // Verify button updates to installed state
    await expect(pwaBtn).toHaveClass(/download-complete/);
    await expect(pwaBtn.locator('#pwaBtnLabel')).toHaveText('App Installed');
    await expect(pwaBtn.locator('#pwaProgressStatus')).toHaveText('INSTALLED ✓');
    await expect(pwaBtn.locator('#pwaBtnIcon')).toHaveClass(/fa-circle-check/);
  });
});


