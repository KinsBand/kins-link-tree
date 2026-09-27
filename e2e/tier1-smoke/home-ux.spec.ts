import { test, expect, type Page } from '@playwright/test';
import { heroConfig } from '../../src/settings/hero.config';

/**
 * UX regression guards for the homepage: touch targets, readable text, heading
 * outline, no unfinished-feature placeholders, only real profile links, and a
 * working signup path. Runs at phone, tablet and desktop widths.
 */

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const MIN_TAP = 44;
const MIN_FONT_PX = 12;
const SEARCH_URL = /\/search(\/|$|\?)|[?&](q|term)=/;

async function loadHome(page: Page) {
  await page.goto('/');
  // Inspiration cards render client-side; wait so they are measured too.
  await page.locator('.music-card').first().waitFor({ state: 'attached', timeout: 10_000 }).catch(() => {});
}

for (const vp of VIEWPORTS) {
  test.describe(`home UX guards — ${vp.name} ${vp.width}px`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('no horizontal overflow', async ({ page }) => {
      await loadHome(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`every visible control is at least ${MIN_TAP}x${MIN_TAP}px`, async ({ page }) => {
      await loadHome(page);
      const undersized = await page.evaluate((min) => {
        // Visible to the user: ignores sr-only helpers and closed overlays.
        const shown = (el: Element) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return false;
          return !el.closest('.sr-only, [hidden], [aria-hidden="true"], [inert], .hidden, dialog:not([open])');
        };
        return [...document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="tab"], summary')]
          .filter(shown)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return { el, w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter(({ w, h }) => w < min || h < min)
          .map(({ el, w, h }) => `${w}x${h} ${el.tagName.toLowerCase()}#${el.id}.${[...el.classList].join('.')}`);
      }, MIN_TAP);
      expect(undersized).toEqual([]);
    });

    test(`no visible text smaller than ${MIN_FONT_PX}px`, async ({ page }) => {
      await loadHome(page);
      const tiny = await page.evaluate((min) => {
        // Visible to the user: ignores sr-only helpers and closed overlays.
        const shown = (el: Element) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') return false;
          return !el.closest('.sr-only, [hidden], [aria-hidden="true"], [inert], .hidden, dialog:not([open])');
        };
        return [...document.querySelectorAll('body *')]
          .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 1))
          .filter(shown)
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < min)
          .map((el) => `${getComputedStyle(el).fontSize} ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 30)}"`);
      }, MIN_FONT_PX);
      expect(tiny).toEqual([]);
    });
  });
}

test.describe('home UX guards — content & structure', () => {
  test('exactly one h1 and section headings are h2', async ({ page }) => {
    await loadHome(page);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const id of ['#members-section', '#subscribeFormSection', '#contactsSection']) {
      await expect(page.locator(`${id} h2`).first()).toBeAttached();
    }
  });

  test('unfinished features are hidden, not shown as disabled placeholders', async ({ page }) => {
    await loadHome(page);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/under works/i);
    await expect(page.locator('[class*="soon-diagonal"], .coming-soon-pill, .coming-soon-tag, #subscribeSoonInterceptor')).toHaveCount(0);
    await expect(page.locator('#topSubscribeBtn .bell-soon-diagonal-banner')).toHaveCount(0);
  });

  test('inactive hero variants do not ship in the page', async ({ page }) => {
    await loadHome(page);
    const html = await page.content();
    const activeKey = `${heroConfig.activeState}`;
    const inactiveTitles = [
      heroConfig.tour.sold_out.title,
      heroConfig.milestones.follower_milestone.title,
      heroConfig.spotlight.member_spotlight.name,
    ];
    // Guard only applies while none of these are the configured variant.
    if (!['tour', 'milestones', 'spotlight'].includes(activeKey) && !heroConfig.carousel?.enabled) {
      for (const title of inactiveTitles) {
        expect(html).not.toContain(title);
      }
    }
    await expect(page.locator('.hero-card-state')).toHaveCount(heroConfig.carousel?.enabled ? heroConfig.carousel.slides.length : 1);
  });

  test('link tabs and structured data point only at real profiles', async ({ page }) => {
    await loadHome(page);
    const tabHrefs = await page.locator('.tabbed-links-section a[href]').evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(tabHrefs.filter((href) => SEARCH_URL.test(href))).toEqual([]);

    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}');
    const group = (ld['@graph'] ?? []).find((node: { '@type'?: string }) => node['@type'] === 'MusicGroup');
    expect(group).toBeTruthy();
    expect((group.sameAs as string[]).filter((url) => SEARCH_URL.test(url))).toEqual([]);
  });
});

test.describe('home UX guards — signup path', () => {
  test('Join pill focuses the email field and the form submits to /api/subscribe', async ({ page }) => {
    let postedEmail = '';
    await page.route('**/api/subscribe', async (route) => {
      postedEmail = (route.request().postDataJSON() as { email?: string }).email ?? '';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'success', message: "You're subscribed!" }) });
    });

    await loadHome(page);
    await page.locator('#headerJoinPillBtn').click();
    await expect(page.locator('#emailInput')).toBeFocused();

    await page.keyboard.type('kins.fan.test@gmail.com');
    await page.keyboard.press('Enter');

    await expect(page.locator('#subscribeSuccessContainer')).toBeVisible({ timeout: 15_000 });
    expect(postedEmail).toBe('kins.fan.test@gmail.com');
  });

  test('a paused signup backend shows its message and keeps the form usable', async ({ page }) => {
    await page.route('**/api/subscribe', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'Signups are paused right now. Please try again soon.' }) }));

    await loadHome(page);
    await page.locator('#emailInput').fill('kins.fan.test@gmail.com');
    await page.locator('#subscribeSubmitBtn').click();

    await expect(page.locator('.toast .toast-text-content').first()).toHaveText(/Signups are paused/);
    await expect(page.locator('#subscribeFormContainer')).toBeVisible();
    await expect(page.locator('#subscribeSubmitBtn')).toBeEnabled();
  });
});

test.describe('home UX guards — floating dock', () => {
  test('dock tucks away on scroll down and returns on scroll up', async ({ page }) => {
    await loadHome(page);
    const body = page.locator('body');
    await page.mouse.wheel(0, 900);
    await expect(body).toHaveClass(/dock-tucked/);
    await page.mouse.wheel(0, -300);
    await expect(body).not.toHaveClass(/dock-tucked/);
  });
});
