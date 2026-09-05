import { test, expect } from '@playwright/test';
import { heroConfig } from '../../src/settings/hero.config';

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

    // Verify initial default theme is dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Test Theme Switcher
    const darkBtn = footer.locator('#themePillDarkBtn');
    const lightBtn = footer.locator('#themePillLightBtn');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('footer FAQ button renders centered pill, expands scrollable tray, and closes cleanly', async ({ page }) => {
    await page.goto('/');
    const faqBtn = page.locator('#footerFaqToggleBtn');
    const faqTray = page.locator('#footerFaqTray');

    await expect(faqBtn).toBeVisible();
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(faqTray).toHaveClass(/hidden/);

    // Verify 6 Qs badge is removed for a cleaner header
    await expect(faqBtn.locator('.faq-pill-count')).toHaveCount(0);

    // Verify FAQ button title and chevron are in a single horizontal row and chevron is strictly inside button border
    const btnBox = await faqBtn.boundingBox();
    const titleBox = await faqBtn.locator('.faq-title').boundingBox();
    const chevronBox = await faqBtn.locator('.faq-chevron').boundingBox();
    expect(btnBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(chevronBox).not.toBeNull();
    if (btnBox && titleBox && chevronBox) {
      const titleCenterY = titleBox.y + titleBox.height / 2;
      const chevronCenterY = chevronBox.y + chevronBox.height / 2;
      expect(Math.abs(titleCenterY - chevronCenterY)).toBeLessThanOrEqual(6);
      expect(chevronBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
      // Chevron must be strictly INSIDE the right boundary of the button
      expect(chevronBox.x + chevronBox.width).toBeLessThanOrEqual(btnBox.x + btnBox.width);
    }

    // Open FAQ
    await faqBtn.click();
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(faqTray).not.toHaveClass(/hidden/);

    // Verify chevron rotated but remains strictly inside button bounds when open
    const openBtnBox = await faqBtn.boundingBox();
    const openChevronBox = await faqBtn.locator('.faq-chevron').boundingBox();
    if (openBtnBox && openChevronBox) {
      expect(openChevronBox.x + openChevronBox.width).toBeLessThanOrEqual(openBtnBox.x + openBtnBox.width);
    }

    // Verify 6 questions are present as collapsible accordion items
    const items = faqTray.locator('.faq-accordion-item');
    await expect(items).toHaveCount(6);
    
    // Verify all 6 are collapsed by default
    for (let i = 0; i < 6; i++) {
      await expect(items.nth(i)).not.toHaveAttribute('open', '');
    }

    // Click first question summary to open it
    const firstSummary = items.first().locator('.faq-accordion-summary');
    await firstSummary.click();
    await expect(items.first()).toHaveAttribute('open', '');
    await expect(items.first().locator('.faq-answer-content')).toBeVisible();
    await expect(items.first().locator('.faq-answer-content')).toContainText('KINS is an Australian four-piece');

    // Click second question summary to open it as well
    const secondSummary = items.nth(1).locator('.faq-accordion-summary');
    await secondSummary.click();
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await expect(items.nth(1).locator('.faq-answer-content')).toBeVisible();

    // Verify BOTH first and second questions remain open simultaneously
    await expect(items.nth(0)).toHaveAttribute('open', '');
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await expect(items.nth(0).locator('.faq-answer-content')).toBeVisible();
    await expect(items.nth(1).locator('.faq-answer-content')).toBeVisible();

    // Collapse first question
    await firstSummary.click();
    await expect(items.first()).not.toHaveAttribute('open', '');
    // Second question still remains open
    await expect(items.nth(1)).toHaveAttribute('open', '');
    await secondSummary.click();
    await expect(items.nth(1)).not.toHaveAttribute('open', '');

    // Verify clutter text is removed
    await expect(faqTray).not.toContainText('QUICK ANSWERS & CONTEXT');
    await expect(faqTray).not.toContainText('Scroll down for all 6 questions');
    await expect(faqTray).not.toContainText('Indexed for AI Search & Schema.org');

    // Verify Bottom Close Button has both text 'Close' and icon
    const closeBtn = faqTray.locator('#closeFooterFaqBtn');
    await expect(closeBtn).toBeVisible();
    await expect(closeBtn).toHaveText(/Close/);
    await expect(closeBtn).not.toHaveText(/FAQ/);
    await expect(closeBtn.locator('i.fa-xmark')).toBeVisible();

    // Verify 1:1 Theme Parity: Switch to Light mode while open
    const lightBtn = page.locator('#themePillLightBtn');
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'standard');
    await expect(faqTray).not.toHaveClass(/hidden/);

    // Switch back to Dark mode
    const darkBtn = page.locator('#themePillDarkBtn');
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(faqTray).not.toHaveClass(/hidden/);

    // Test closing via top header button / chevron arrow
    await faqBtn.click();
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(faqTray).toHaveClass(/hidden/);
    await expect(page.locator('#footerFaqCard')).not.toHaveClass(/is-open/);

    // Reopen and test closing via bottom button
    await faqBtn.click();
    await expect(faqTray).not.toHaveClass(/hidden/);
    await expect(page.locator('#footerFaqCard')).toHaveClass(/is-open/);
    await closeBtn.click();
    await expect(faqBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(faqTray).toHaveClass(/hidden/);
    await expect(page.locator('#footerFaqCard')).not.toHaveClass(/is-open/);
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
    await expect(streamsBtn).toContainText('STREAMS');
    await expect(socialsBtn).toBeVisible();
    await expect(socialsBtn).toContainText('SOCIALS');
    await expect(communityBtn).toBeVisible();
    await expect(communityBtn).toContainText('COMMUNITY');

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
    await expect(shareBtn).toBeVisible();
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

  test('covers search menu opens with mock data, filters by category and search, and triggers video modal', async ({ page }) => {
    await page.goto('/');

    const searchBtn = page.locator('#headerSearchPillBtn');
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const overlay = page.locator('#coversSearchOverlay');
    await expect(overlay).toHaveClass(/active/);

    const resultsList = page.locator('#coversResultsList');
    await expect(resultsList).toBeVisible();

    // Verify Currently Learning card: Just Like Heaven by The Cure
    const learningSection = page.locator('#coversLearningSection');
    await expect(learningSection).toBeVisible();
    await expect(learningSection.locator('.learning-song-title')).toContainText('Just Like Heaven');
    await expect(learningSection.locator('.learning-artist-line')).toContainText('The Cure');

    // Verify tabs button is present and setlist button is removed
    const learningTabsBtn = learningSection.locator('#learningSongsterrBtn');
    await expect(learningTabsBtn).toBeVisible();
    await expect(learningTabsBtn).toContainText('Tabs');
    await expect(learningSection.locator('#learningVoteBtn')).toHaveCount(0);

    // 1. Verify Category Buttons: "All" label exists, styled with 2px solid border, and never squeezed
    const allPill = page.locator('.cover-category-pill[data-category="all"]');
    await expect(allPill).toBeVisible();
    await expect(allPill).toHaveText('All');
    await expect(allPill).toHaveClass(/active/);

    // Verify button does not get squeezed when clicked or active
    const allBoxBefore = await allPill.boundingBox();
    expect(allBoxBefore?.width).toBeGreaterThan(40);

    const acousticPill = page.locator('.cover-category-pill[data-category="acoustic"]');
    await acousticPill.click();
    await expect(acousticPill).toHaveClass(/active/);
    await expect(allPill).not.toHaveClass(/active/);

    await allPill.click();
    await expect(allPill).toHaveClass(/active/);
    const allBoxAfter = await allPill.boundingBox();
    expect(allBoxAfter?.width).toBeGreaterThan(40);

    // 2. Verify Search Input
    const searchInput = page.locator('#overlaySearchInput');
    await searchInput.fill('The Cure');
    await expect(searchInput).toHaveValue('The Cure');

    // Clear search text
    const clearBtn = page.locator('#clearSearchInputBtn');
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');

    // 3. Verify Empty State when no covers released yet
    const emptyCard = resultsList.locator('.empty-search-card');
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard.locator('.empty-search-title')).toContainText(/no (covers|released covers)/i);

    // 4. Verify "Request a Cover!" Button & Modal
    const emptyRequestBtn = emptyCard.locator('#emptyRequestTriggerBtn');
    await expect(emptyRequestBtn).toBeVisible();
    await expect(emptyRequestBtn).toContainText('Request a Cover!');

    // Click "Request a Cover!" button to open Request Song Modal
    await emptyRequestBtn.click();

    const requestModal = page.locator('#requestSongModal');
    await expect(requestModal).toBeVisible();
    await expect(requestModal).toHaveClass(/active/);
    await expect(page.locator('#requestSongPillTitle')).toContainText(/request a cover/i);

    // Verify toggle buttons (side-by-side in full view, normal text, no icons)
    const reqVideoBtn = page.locator('#reqTypeVideoBtn');
    const reqSetlistBtn = page.locator('#reqTypeSetlistBtn');
    await expect(reqVideoBtn).toBeVisible();
    await expect(reqSetlistBtn).toBeVisible();
    await expect(reqVideoBtn).toContainText('Cover Video');
    await expect(reqSetlistBtn).toContainText('Request as Setlist');

    // Verify modal elements
    const modalTitleInput = page.locator('#modalReqSongTitle');
    const modalArtistInput = page.locator('#modalReqArtist');
    await expect(modalTitleInput).toBeVisible();
    await expect(modalArtistInput).toBeVisible();

    // Close Request Song Modal
    const closeReqBtn = page.locator('#closeRequestSongModalBtn');
    await closeReqBtn.click();
    await expect(requestModal).not.toHaveClass(/active/);

    // Verify search overlay is still intact and open behind it
    await expect(overlay).toHaveClass(/active/);

    // Close Covers Search Overlay
    const closeOverlayBtn = page.locator('#closeSearchOverlayBtn');
    await closeOverlayBtn.click();
    await expect(overlay).not.toHaveClass(/active/);
  });

  test('featured card on homepage renders active state (release video or upcoming teaser)', async ({ page }) => {
    await page.goto('/');

    if (heroConfig.activeState === 'upcoming') {
      const upcomingTeaser = page.locator('#varUpcomingMinimalTeaser');
      await expect(upcomingTeaser).toBeVisible();
      await expect(upcomingTeaser.locator('.upcoming-teaser-badge')).toContainText('UPCOMING RELEASE');
      await expect(upcomingTeaser.locator('.upcoming-teaser-title')).toContainText('New music is on the way');
      await expect(upcomingTeaser.locator('.upcoming-teaser-desc')).toContainText('First official cover coming soon');
      return;
    }

    const heroCard = page.locator('#varReleaseCoverVideo');
    await expect(heroCard).toBeVisible();

    // 1. Verify "PLAY NOW" button is removed
    const playNowBtn = heroCard.locator('button', { hasText: 'PLAY NOW' });
    await expect(playNowBtn).toHaveCount(0);

    // 2. Verify Share button is icon-only (no text)
    const shareBtn = heroCard.locator('.hero-icon-share-btn');
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toHaveText('');
    await expect(shareBtn.locator('i.fa-share-nodes')).toBeVisible();

    // 3. Verify video player frame and controls overlay exist
    const videoWrapper = heroCard.locator('#heroVideoWrapper');
    await expect(videoWrapper).toBeVisible();

    const qualityBtn = heroCard.locator('#heroVideoQualityBtn');
    const fullscreenBtn = heroCard.locator('#heroVideoFullscreenBtn');
    const playPauseBtn = heroCard.locator('#heroVideoPlayPauseBtn');

    await expect(qualityBtn).toBeVisible();
    await expect(fullscreenBtn).toBeVisible();
    await expect(playPauseBtn).toBeVisible();

    // 4. Click play button - video plays in place and NO modal pops up
    await playPauseBtn.click();

    const videoModal = page.locator('#coverVideoModal');
    await expect(videoModal).not.toHaveClass(/active/);

    // Verify iframe receives src
    const iframe = heroCard.locator('#heroCoverVideoIframe');
    await expect(iframe).toHaveAttribute('src', /youtube\.com\/embed/);

    // Verify play icon switches to pause
    // 5. Verify YouTube button in footer to the left of footer text
    const footerYtBtn = heroCard.locator('.hero-cover-footer .hero-footer-yt-btn');
    await expect(footerYtBtn).toBeVisible();
    await expect(footerYtBtn.locator('i.fa-youtube')).toBeVisible();
    const footerText = heroCard.locator('.hero-cover-footer .hero-footer-text');
    await expect(footerText).toBeVisible();
    await expect(footerText).toContainText('First official cover');

    // 6. Verify bottom controls bar has hint and fullscreen button
    const bottomBar = heroCard.locator('.video-overlay-bottom-bar');
    await expect(bottomBar.locator('.video-overlay-hint')).toBeVisible();
    await expect(bottomBar.locator('#heroVideoFullscreenBtn')).toBeVisible();

    // 7. Verify footer layout: YouTube icon on left, footer text centered
    const ytBox = await footerYtBtn.boundingBox();
    const textBox = await footerText.boundingBox();
    expect(ytBox).not.toBeNull();
    expect(textBox).not.toBeNull();
    if (ytBox && textBox) {
      const ytCenter = ytBox.x + ytBox.width / 2;
      const textCenter = textBox.x + textBox.width / 2;
      expect(ytCenter).toBeLessThan(textCenter);
    }
    await expect(footerText).toHaveCSS('text-align', 'center');

    // 8. Verify play/pause dual icons exist for smooth morphing animation
    await expect(playPauseBtn.locator('.icon-play')).toHaveCount(1);
    await expect(playPauseBtn.locator('.icon-pause')).toHaveCount(1);

    // 9. Verify quality button opens dropdown
    await qualityBtn.click();
    const qualityDropdown = heroCard.locator('#heroVideoQualityDropdown');
    await expect(qualityDropdown).not.toHaveClass(/hidden/);

    // 10. Verify tap on video overlay toggles controls-hidden simultaneously on top actions, center play, and bottom bar
    const overlay = heroCard.locator('#heroVideoControlsOverlay');
    await overlay.click({ position: { x: 50, y: 150 } });
    await expect(videoWrapper).toHaveClass(/controls-hidden/);

    // 11. Tap again to reveal controls
    await overlay.click({ position: { x: 50, y: 150 } });
    await expect(videoWrapper).not.toHaveClass(/controls-hidden/);

    // 12. Verify Share button triggers share modal cleanly
    await shareBtn.click();
    const shareModal = page.locator('#shareModal');
    await expect(shareModal).toHaveClass(/active/);
  });

  test('bottom audio deck renders groove rail, handles playback, and pauses cleanly without errors', async ({ page }) => {
    await page.goto('/');

    const audioBar = page.locator('#bottomAudioBar');
    await expect(audioBar).toBeVisible();

    const grooveRail = page.locator('#deckTimelineGroove');
    await expect(grooveRail).toBeAttached();
    await expect(grooveRail).toHaveAttribute('role', 'slider');

    const stylus = page.locator('#vinylStylusWrapper');
    await expect(stylus).toHaveAttribute('aria-hidden', 'true');

    const idleView = page.locator('#deckIdleView');
    await expect(idleView).toBeVisible();

    // Trigger playback via window.playTrackPreview
    await page.evaluate(async () => {
      const w = window as any;
      if (w.playTrackPreview) {
        await w.playTrackPreview({
          artist: 'The Cure',
          title: 'Just Like Heaven',
          previewUrl: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
        });
      }
    });

    const activeView = page.locator('#deckActiveView');
    await expect(activeView).toBeVisible();
    await expect(page.locator('#audioBarTitle')).toContainText('Just Like Heaven');

    // Toggle pause cleanly
    const toggleBtn = page.locator('#audioBarToggleBtn');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Check button icon switched to play
    await expect(toggleBtn.locator('.fa-play')).toBeVisible();

    // Open stream drawer panel
    const streamBtn = page.locator('#audioBarStreamBtn');
    await expect(streamBtn).toBeVisible();
    await streamBtn.click();

    const drawer = page.locator('#streamDrawerPanel');
    await expect(drawer).toBeVisible();

    // Verify only the 6 approved streaming platforms are present
    await expect(page.locator('#streamLinkSpotify')).toBeAttached();
    await expect(page.locator('#streamLinkApple')).toBeAttached();
    await expect(page.locator('#streamLinkYoutube')).toBeAttached();
    await expect(page.locator('#streamLinkAmazon')).toBeAttached();
    await expect(page.locator('#streamLinkSoundcloud')).toBeAttached();
    await expect(page.locator('#streamLinkBandcamp')).toBeAttached();
    await expect(page.locator('#streamLinkDeezer')).not.toBeAttached();
    await expect(page.locator('#streamLinkTidal')).not.toBeAttached();
    await expect(page.locator('#streamLinkAudiomack')).not.toBeAttached();
    await expect(page.locator('#streamLinkQobuz')).not.toBeAttached();

    // Verify song title copy button
    const songCopyBtn = page.locator('#streamDrawerSongBtn');
    await expect(songCopyBtn).toBeVisible();
    const currentTitle = await page.locator('#audioBarTitle').textContent();
    if (currentTitle && currentTitle.trim().length > 0) {
      await expect(songCopyBtn).toContainText(currentTitle.trim());
    } else {
      await expect(songCopyBtn).toHaveText(/.+/);
    }
    await expect(page.locator('#streamDrawerCopyIcon')).toBeVisible();

    // Click song copy button
    await songCopyBtn.click();
    await expect(songCopyBtn).toHaveClass(/is-copied/);
  });

  test('bottom audio deck scrubbing stimulates song-specific groove engine with radial inner-groove physics', async ({ page }) => {
    await page.goto('/');

    const audioBar = page.locator('#bottomAudioBar');
    await expect(audioBar).toBeVisible();

    // Verify groove engine profiles can be loaded and evaluated in browser context
    const profiles = await page.evaluate(async () => {
      const mod = await import('/src/scripts/controllers/vinylGrooveEngine.js');
      const cure = mod.deriveGrooveProfile('The Cure', 'Just Like Heaven');
      const sonic = mod.deriveGrooveProfile('Sonic Youth', 'Unmade Bed');
      const weezer = mod.deriveGrooveProfile('Weezer', 'Do You Wanna Get High');
      const randomSong = mod.deriveGrooveProfile('Unknown Indie Band', 'Late Night Jams');

      return { cure, sonic, weezer, randomSong };
    });

    // Verify distinct song-specific acoustic groove characteristics
    expect(profiles.cure.key).toBe('A');
    expect(profiles.cure.tonicFreq).toBe(220);
    expect(profiles.cure.brightness).toBeGreaterThan(1.0);

    expect(profiles.sonic.key).toBe('F#');
    expect(profiles.sonic.tonicFreq).toBe(185);
    expect(profiles.sonic.grooveExcursion).toBe('heavy');
    expect(profiles.sonic.grit).toBeGreaterThan(0.7);

    expect(profiles.weezer.key).toBe('Eb');
    expect(profiles.weezer.tonicFreq).toBe(155);
    expect(profiles.weezer.vinylWeight).toBe(180);

    // Verify procedural generator deterministically assigns key and properties to arbitrary songs
    expect(profiles.randomSong.tonicFreq).toBeGreaterThan(0);
    expect(profiles.randomSong.vinylWeight).toBeGreaterThanOrEqual(120);

    // Test real scrubbing interaction on the timeline
    const grooveRail = page.locator('#deckTimelineGroove');
    const box = await grooveRail.boundingBox();
    if (box) {
      // Start scrub at 10% across rail (outer rim)
      await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5);
      await page.mouse.down();

      // Drag forward to 70% (inner groove)
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
      await page.waitForTimeout(50);

      // Verify stylus responds
      const stylus = page.locator('#vinylStylusWrapper');
      await expect(stylus).toBeAttached();

      await page.mouse.up();
    }
  });
});


