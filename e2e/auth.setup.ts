import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Logs in the local `devtest` account and saves the authenticated session
 * to `e2e/.auth/student.json`. Runs once (the `setup` project); every authed
 * spec reuses the storageState instead of logging in again.
 *
 * Credentials come from env so the file carries no secrets:
 *   E2E_STUDENT_EMAIL    (default: devtest@vit.vn)
 *   E2E_STUDENT_PASSWORD (default: DevTest@123)
 * Defaults match the seeded local-Supabase test account.
 */

const STORAGE_STATE = path.join(__dirname, ".auth/student.json");

const EMAIL = process.env.E2E_STUDENT_EMAIL || "devtest@vit.vn";
const PASSWORD = process.env.E2E_STUDENT_PASSWORD || "DevTest@123";

setup("authenticate student", async ({ page }) => {
  // Log in with an explicit redirect so we can assert a deterministic landing.
  await page.goto("/account/login?redirect=%2Faccount%2Fdashboard");

  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.getByRole("button", { name: "Log in", exact: true }).click();

  // signIn() does a hard `window.location.href` redirect on success.
  await page.waitForURL("**/account/dashboard", { timeout: 20_000 });

  // Sanity: we should not be bounced back to the login page.
  await expect(page).not.toHaveURL(/\/account\/login/);

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
