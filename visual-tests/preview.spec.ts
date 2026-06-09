import { test, expect } from "@playwright/test";

/**
 * Gate-3 baseline: the design-system gallery (`pages/preview.tsx`).
 *
 * This is the canonical visual check while we rebuild primitives — every
 * atom/molecule/organism is rendered there, so a single snapshot catches
 * unintended token/primitive drift. Add per-screen specs as screens are rebuilt.
 *
 * First run creates baselines:  pnpm test:visual:update
 * Subsequent runs diff vs. baseline: pnpm test:visual
 */
test.describe("Design system — preview gallery", () => {
  test("full gallery matches baseline", async ({ page }) => {
    await page.goto("/preview");
    // Wait for webfonts (Noto Sans / Nunito) so glyph metrics are stable.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("preview-gallery.png", {
      fullPage: true,
    });
  });
});
