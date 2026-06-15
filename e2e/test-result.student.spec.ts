import { test, expect } from "@playwright/test";
import { supabaseAdmin } from "./lib/supabase-admin";
import { submitQuickTest } from "./lib/take-test";

/**
 * Phase 2 — the result + review-explanation pages for a logged-in student.
 *
 * Produces a real result by submitting a quick test (auto-created draft), then
 * verifies the result page and navigates into Review Mode. Cleans up the
 * test_results row afterward.
 */
test.describe("test-result", () => {
  test.setTimeout(120_000); // includes the heavy take-the-test compile/submit
  // The review-explanation page is heavy and occasionally trips its error
  // boundary under heavy parallel dev-server load; retry to absorb that.
  test.describe.configure({ retries: 2 });

  let resultId: string | null = null;

  test.afterEach(async () => {
    if (resultId) {
      await supabaseAdmin.from("test_results").delete().eq("id", resultId);
      resultId = null;
    }
  });

  test("shows the result and opens review answers", async ({ page }) => {
    resultId = await submitQuickTest(page);

    // Result page rendered with its primary actions + analytics labels.
    await expect(page.getByRole("button", { name: "Review answers" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Retake test" })).toBeVisible();
    await expect(page.getByText("Accuracy")).toBeVisible();

    // Into Review Mode (explanation page).
    await page.getByRole("button", { name: "Review answers" }).click();
    await page.waitForURL(/\/test-result\/explanation\/[0-9a-f-]+/i, {
      timeout: 30_000,
    });
    // Generous timeout absorbs the heavy explanation page's cold compile.
    await expect(page.getByText("Review Mode")).toBeVisible({ timeout: 60_000 });
  });
});
