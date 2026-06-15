import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { ensureTeacherUser } from "./lib/supabase-admin";

/**
 * Ensures a teacher-role account exists, logs it in, and saves the session to
 * `e2e/.auth/teacher.json` for the `teacher` project. Separate from the student
 * setup so teacher specs run with teacher capabilities (e.g. creating classes).
 */
const STORAGE_STATE = path.join(__dirname, ".auth/teacher.json");

setup("authenticate teacher", async ({ page }) => {
  const { email, password } = await ensureTeacherUser();

  await page.goto("/account/login?redirect=%2Fclassroom");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();

  await page.waitForURL("**/classroom", { timeout: 20_000 });
  await expect(page).not.toHaveURL(/\/account\/login/);

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
