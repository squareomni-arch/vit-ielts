import { test, expect } from "@playwright/test";

/**
 * Phase 3 — vocabulary "Add word" modal (logged-in student).
 * Opens the add-word modal and closes it (no word created → no mutation).
 */
test.describe("vocabulary · add-word modal", () => {
  test("opens and closes the add-word modal", async ({ page }) => {
    await page.goto("/vocabulary");

    // Only the page-level "Add word" button exists before the modal opens.
    await page.getByRole("button", { name: "Add word" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByText("Add to Vocabulary")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. ubiquitous")).toBeVisible();

    // Close via the antd modal header X.
    await page.locator(".ant-modal-close").click();
    await expect(dialog).toBeHidden();
  });
});
