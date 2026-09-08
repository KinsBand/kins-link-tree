import { test, expect } from '@playwright/test';

test('compact settings and drum actions work in both themes', async ({ page }, info) => {
  await page.goto('/tuner');
  await expect(page.locator('#drumRemove')).toHaveAttribute('aria-label', 'Remove Rack tom');
  for (const theme of ['standard', 'dark']) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await page.locator('#tunerSettingsBtn').click();
    const count = page.locator('#tunerStringCount');
    for (const instrument of ['electric', 'acoustic', 'bass']) {
      await page.locator(`[data-sheet-instrument="${instrument}"]`).click();
      await count.fill('11'); await count.press('Enter');
      await expect(count).toHaveValue('11');
      await page.locator('#tunerStringsPlus').click(); await expect(count).toHaveValue('12');
      await expect(page.locator('#tunerStringsPlus')).toBeDisabled();
      await page.locator('#tunerStringsMinus').click(); await expect(count).toHaveValue('11');
      await count.fill('22'); await count.press('Escape'); await expect(count).toHaveValue('11');
      await expect(page.locator('#tunerFigure .tuner-peg')).toHaveCount(11);
    }
    const toggle = page.locator('#tunerSheetAutoAdvance');
    const before = await toggle.getAttribute('aria-pressed');
    await toggle.click(); await expect(toggle).toHaveAttribute('aria-pressed', String(before !== 'true'));
    const title = await page.locator('.tuner-sheet-title').boundingBox();
    const close = await page.locator('#tunerSheetClose').boundingBox();
    expect(Math.abs(title!.y + title!.height / 2 - close!.y - close!.height / 2)).toBeLessThan(2);
    expect(close!.x).toBeGreaterThan(title!.x + title!.width);
    await page.locator("#tunerPanelSettings").evaluate(el => { el.scrollTop = 0; });
    await page.screenshot({ path: info.outputPath(`settings-${theme}.png`) });
    await page.locator('#tunerSheetClose').click();
    await page.locator('[data-instrument="drums"]').click();
    const select = await page.locator('#drumSelect').boundingBox();
    const hz = await page.locator('#drumTargetHz').boundingBox();
    expect(Math.abs(select!.y - hz!.y)).toBeLessThan(2);
    const add = await page.locator('#drumAdd').boundingBox();
    const start = await page.locator('#tunerMicToggleBtn').boundingBox();
    const save = await page.locator('#drumSave').boundingBox();
    expect(add!.x).toBeLessThan(start!.x); expect(save!.x).toBeGreaterThan(start!.x);
    const options = await page.locator('#drumSelect option').count();
    await page.locator('#drumAdd').click(); await expect(page.locator('#drumSelect option')).toHaveCount(options + 1);
    await page.locator('#drumSave').click();
    await expect(page.locator('#drumNotice')).toHaveText('Kit saved');
    await page.screenshot({ path: info.outputPath(`drums-${theme}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
