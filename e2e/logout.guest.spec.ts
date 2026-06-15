import { test, expect } from "@playwright/test";
import { createConfirmedUser, deleteUserByEmail } from "./lib/supabase-admin";

/**
 * Phase 1 — logout flow.
 *
 * Self-contained on purpose: it creates a throwaway user, logs in via the UI,
 * then logs out. The app's signOut() revokes sessions globally for that user,
 * so it must NOT reuse the shared `devtest` storageState — otherwise it would
 * kill the session out from under other concurrent student specs. Hence this
 * lives in the `guest` project (no storageState).
 */
test.describe("auth · logout", () => {
  let email: string | null = null;

  test.afterEach(async () => {
    if (email) {
      await deleteUserByEmail(email);
      email = null;
    }
  });

  test("logs out via the sidebar and lands on login", async ({ page }) => {
    const user = await createConfirmedUser();
    email = user.email;

    // Log in via the UI, landing on an AppShell page that has the sidebar.
    await page.goto("/account/login?redirect=%2Faccount%2Fdashboard");
    await page.fill("#login-email", user.email);
    await page.fill("#login-password", user.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL("**/account/dashboard", { timeout: 20_000 });

    // Desktop sidebar (visible at 1440px) holds the Logout button.
    await page.getByRole("button", { name: "Logout" }).click();

    await page.waitForURL("**/account/login", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/account\/login/);
  });
});
