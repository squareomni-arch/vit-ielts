import { test, expect } from "@playwright/test";

/**
 * Phase 3 — community compose box (logged-in student).
 * Exercises opening the "New post" composer without actually posting (no
 * mutation): assert the form appears, then cancel back to the collapsed state.
 */
test.describe("community · compose", () => {
  test("opens and cancels the new-post composer", async ({ page }) => {
    await page.goto("/community");

    await page.getByRole("button", { name: "New post" }).click();

    // Composer revealed.
    await expect(page.getByPlaceholder("Post title")).toBeVisible();
    await expect(page.getByPlaceholder("What's on your mind?")).toBeVisible();

    // Filling both enables the Post button (still not submitting).
    await page.getByPlaceholder("Post title").fill("E2E draft title");
    await page.getByPlaceholder("What's on your mind?").fill("E2E draft body");
    await expect(page.getByRole("button", { name: "Post" })).toBeEnabled();

    // Cancel — back to the collapsed trigger, nothing persisted.
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "New post" })).toBeVisible();
  });
});
