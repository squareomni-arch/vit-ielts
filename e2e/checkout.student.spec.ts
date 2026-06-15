import { test, expect } from "@playwright/test";

/**
 * Phase 1 — subscription → checkout flow for a logged-in student.
 *
 * Stops short of placing a real order (that mutates orders + emails the user).
 * Covers: navigating from the plans page to checkout, the order summary
 * rendering, and coupon validation (invalid + valid). `FREEBYE` is a seeded
 * active 100%-off coupon in the local DB.
 */

const CHECKOUT_URL = "/account/checkout?type=single&months=2&skill=listening";

test.describe("subscription · plans → checkout", () => {
  test("navigates from a plan CTA to the checkout page", async ({ page }) => {
    await page.goto("/subscription");
    const checkoutLink = page.locator('a[href*="/account/checkout"]').first();
    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();
    await expect(page).toHaveURL(/\/account\/checkout/);
  });
});

test.describe("checkout · order summary + coupon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CHECKOUT_URL);
    // Config loads client-side before the form renders.
    await expect(
      page.getByRole("heading", { name: "Checkout" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: "Order summary" })
    ).toBeVisible();
  });

  test("rejects an invalid coupon", async ({ page }) => {
    await page.getByPlaceholder("Nhập mã giảm giá").fill("NOPE-INVALID-123");
    await page.getByRole("button", { name: "Áp dụng" }).click();

    // react-toastify error toast (message text comes from the API; assert kind).
    await expect(page.locator(".Toastify__toast--error")).toBeVisible();
    // Input is still there — no applied-coupon box.
    await expect(page.getByPlaceholder("Nhập mã giảm giá")).toBeVisible();
  });

  test("applies a valid coupon and shows the discount", async ({ page }) => {
    await page.getByPlaceholder("Nhập mã giảm giá").fill("FREEBYE");
    await page.getByRole("button", { name: "Áp dụng" }).click();

    // Applied-coupon box replaces the input; a remove ("Xóa") button appears.
    await expect(page.getByText("FREEBYE", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xóa" })).toBeVisible();
    // Discount line item references the coupon.
    await expect(page.getByText(/Giảm giá \(FREEBYE\)/)).toBeVisible();
  });
});
