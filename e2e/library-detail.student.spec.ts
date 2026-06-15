import { test, expect } from "@playwright/test";

/**
 * Phase 2 — practice-library detail page: the "Copy link" share action.
 * Runs as a logged-in student (the quiz is pro-only; devtest is is_pro).
 */
test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const PRACTICE_SLUG = "com-game-theory-6jwxh";

test.describe("library · detail copy-link", () => {
  test("copy link gives feedback", async ({ page }) => {
    await page.goto(`/ielts-practice-library/${PRACTICE_SLUG}`);

    const copy = page.getByRole("button", { name: "Copy link" }).first();
    await expect(copy).toBeVisible({ timeout: 20_000 });
    await copy.click();

    // Either the inline "Copied!" label or the toast confirmation.
    await expect(page.getByText(/Copied/i).first()).toBeVisible();
  });
});
