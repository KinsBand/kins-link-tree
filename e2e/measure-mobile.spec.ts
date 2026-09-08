import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'iPhone-SE', width: 375, height: 667 },
  { name: 'iPhone-13', width: 390, height: 844 },
  { name: 'Small-Android', width: 360, height: 740 },
  { name: 'Compact-Android', width: 360, height: 640 },
  { name: 'Short-Mobile', width: 390, height: 600 },
];

for (const vp of viewports) {
  test(`screenshot and measure: ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/metronome', { waitUntil: 'domcontentloaded' });
    try {
      await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    } catch (e) {}

    // Wait for metronome dial to be visible
    await page.waitForSelector('#metroDial');

    const screenshotPath = `test-results/mobile-${vp.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const metrics = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const metroPage = document.querySelector('.metro-page');
      const metroView = document.querySelector('.metro-view');
      const dial = document.querySelector('.metro-dial');
      const coachBtn = document.querySelector('#metroCoachBtn');
      const bottom = document.querySelector('.metro-bottom');
      const topbar = document.querySelector('.metro-topbar');

      const dialBox = dial?.getBoundingClientRect();
      const coachBox = coachBtn?.getBoundingClientRect();
      const bottomBox = bottom?.getBoundingClientRect();
      const topbarBox = topbar?.getBoundingClientRect();
      const viewBox = metroView?.getBoundingClientRect();

      return {
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        docScrollHeight: docEl.scrollHeight,
        docScrollWidth: docEl.scrollWidth,
        bodyScrollHeight: body.scrollHeight,
        metroPageHeight: metroPage ? metroPage.getBoundingClientRect().height : 0,
        viewBox: viewBox ? { top: viewBox.top, bottom: viewBox.bottom, height: viewBox.height } : null,
        topbarBox: topbarBox ? { top: topbarBox.top, bottom: topbarBox.bottom, height: topbarBox.height } : null,
        dialBox: dialBox ? { top: dialBox.top, bottom: dialBox.bottom, height: dialBox.height } : null,
        bottomBox: bottomBox ? { top: bottomBox.top, bottom: bottomBox.bottom, height: bottomBox.height } : null,
        coachBox: coachBox ? { top: coachBox.top, bottom: coachBox.bottom, height: coachBox.height } : null,
      };
    });

    console.log(`[${vp.name}] win=${metrics.windowWidth}x${metrics.windowHeight}, scrollH=${metrics.docScrollHeight}, viewBoxBottom=${metrics.viewBox?.bottom?.toFixed(1)}, coachBottom=${metrics.coachBox?.bottom?.toFixed(1)}, dialH=${metrics.dialBox?.height?.toFixed(1)}`);
  });
}
