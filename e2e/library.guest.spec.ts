import { test, expect } from "@playwright/test";

/**
 * Phase 2 — IELTS exam library filtering/search (public, so runs as guest).
 *
 * The toolbar filter chips and search box write to a react-hook-form store that
 * is synced to the URL via a non-shallow router.push (triggers SSR refetch), so
 * the URL query is the reliable signal that a control took effect.
 */
test.describe("library · exam library filters", () => {
  test("filters by skill via the chip dropdown", async ({ page }) => {
    await page.goto("/ielts-exam-library");

    // Open the Skill chip-dropdown and pick Listening.
    await page.getByRole("button", { name: "Skill" }).click();
    await page.locator('label:has-text("Listening")').first().click();

    await expect(page).toHaveURL(/skill=listening/);
  });

  test("searches via the toolbar search box", async ({ page }) => {
    await page.goto("/ielts-exam-library");

    const search = page.getByPlaceholder("Search tests…");
    await search.fill("reading");
    await search.press("Enter");

    await expect(page).toHaveURL(/search=reading/);
  });
});
