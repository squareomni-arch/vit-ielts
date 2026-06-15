import { test, expect } from "@playwright/test";
import { supabaseAdmin, findAuthUserIdByEmail } from "./lib/supabase-admin";

/**
 * Phase 2 — account area for a logged-in student (devtest storageState).
 *
 * Mutating tests restore the shared devtest row afterward so the account is
 * left exactly as found:
 *   - settings: toggle a notification switch, then toggle it back.
 *   - my-profile: a real name save is reverted via the admin client.
 */

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "devtest@vit.vn";

test.describe("account · settings", () => {
  test("toggles a notification switch and opens the sessions panel", async ({
    page,
  }) => {
    await page.goto("/account/settings");
    await expect(
      page.getByRole("heading", { name: "Settings" })
    ).toBeVisible({ timeout: 20_000 });

    // Toggle the "Weekly progress report" switch and assert state flips, then
    // restore it so devtest's persisted settings are unchanged.
    const sw = page.getByRole("switch", { name: "Weekly progress report" });
    const before = await sw.getAttribute("aria-checked");
    await sw.click();
    await expect(sw).not.toHaveAttribute("aria-checked", before || "");
    await sw.click(); // restore
    await expect(sw).toHaveAttribute("aria-checked", before || "");

    // Open the active-sessions modal, then close it.
    await page.getByRole("button", { name: "Manage" }).click();
    const dialog = page.getByRole("dialog", { name: "Manage active sessions" });
    await expect(dialog).toBeVisible();
    // Two "Close" affordances (header X + footer button); the X is first.
    await dialog.getByRole("button", { name: "Close" }).first().click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("account · my-profile", () => {
  test("enters edit mode and cancels without saving", async ({ page }) => {
    await page.goto("/account/my-profile");
    const editBtn = page.getByRole("button", { name: "Edit profile" });
    await expect(editBtn).toBeVisible({ timeout: 20_000 });

    await editBtn.click();
    // Save/Cancel appear; the name field becomes editable.
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
    const nameInput = page.getByPlaceholder("Enter your full name");
    await expect(nameInput).toBeEnabled();

    await page.getByRole("button", { name: "Cancel" }).click();
    // Back to view mode.
    await expect(editBtn).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save changes" })
    ).toBeHidden();
  });

  test("uploads a new avatar", async ({ page }) => {
    const userId = await findAuthUserIdByEmail(STUDENT_EMAIL);
    expect(userId).not.toBeNull();
    const { data: before } = await supabaseAdmin
      .from("users")
      .select("avatar_url")
      .eq("id", userId!)
      .single();
    const originalAvatar: string | null = before?.avatar_url ?? null;

    // 1×1 transparent PNG.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    try {
      await page.goto("/account/my-profile");
      await expect(
        page.getByRole("button", { name: "Edit profile" })
      ).toBeVisible({ timeout: 20_000 });

      // react-dropzone exposes a hidden file input; set it directly.
      await page.locator('input[type="file"]').setInputFiles({
        name: "e2e-avatar.png",
        mimeType: "image/png",
        buffer: png,
      });

      // Upload → users.avatar_url update → success toast.
      await expect(page.getByText("Avatar updated")).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await supabaseAdmin
        .from("users")
        .update({ avatar_url: originalAvatar })
        .eq("id", userId!);
    }
  });

  test("edits the full name and saves successfully", async ({ page }) => {
    const userId = await findAuthUserIdByEmail(STUDENT_EMAIL);
    expect(userId).not.toBeNull();
    const { data: original } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("id", userId!)
      .single();
    const originalName: string = original?.name ?? "DevTest";

    try {
      await page.goto("/account/my-profile");
      await page.getByRole("button", { name: "Edit profile" }).click();

      const nameInput = page.getByPlaceholder("Enter your full name");
      await expect(nameInput).toBeEnabled();
      const newName = `${originalName} E2E`;
      await nameInput.fill(newName);

      await page.getByRole("button", { name: "Save changes" }).click();

      // react-toastify success message.
      await expect(
        page.getByText("Profile updated successfully")
      ).toBeVisible();
      // Profile card header reflects the new name.
      await expect(page.getByText(newName, { exact: true })).toBeVisible();
    } finally {
      // Restore the original name regardless of assertion outcome.
      await supabaseAdmin
        .from("users")
        .update({ name: originalName })
        .eq("id", userId!);
    }
  });
});

test.describe("account · order history", () => {
  test("renders the orders table", async ({ page }) => {
    await page.goto("/account/order-history");
    // antd Table renders even with no orders (shows an empty state).
    await expect(page.locator(".ant-table")).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("account · affiliate", () => {
  test("renders in a valid state (CTA or dashboard)", async ({ page }) => {
    await page.goto("/account/affiliate");
    // Either "Become an Affiliate" (not enrolled) or "Affiliate Dashboard".
    await expect(
      page.getByRole("heading", { name: /Affiliate/ }).first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
