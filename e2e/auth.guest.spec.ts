import { test, expect } from "@playwright/test";
import { deleteUserByEmail, uniqueTestEmail } from "./lib/supabase-admin";

/**
 * Phase 1 — authentication flows for a guest (no session).
 * Covers: login (valid + invalid), register (+ cleanup), forgot-password.
 */

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "devtest@vit.vn";
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || "DevTest@123";

test.describe("auth · login", () => {
  test("logs in with valid credentials and lands on the app", async ({
    page,
  }) => {
    await page.goto("/account/login?redirect=%2Faccount%2Fdashboard");
    await page.fill("#login-email", STUDENT_EMAIL);
    await page.fill("#login-password", STUDENT_PASSWORD);
    await page.getByRole("button", { name: "Log in", exact: true }).click();

    await page.waitForURL("**/account/dashboard", { timeout: 20_000 });
    await expect(page).not.toHaveURL(/\/account\/login/);
  });

  test("shows an error and stays put on invalid credentials", async ({
    page,
  }) => {
    await page.goto("/account/login");
    await page.fill("#login-email", "nobody@vit.test");
    await page.fill("#login-password", "WrongPassword!1");
    await page.getByRole("button", { name: "Log in", exact: true }).click();

    // signIn() catches the error and surfaces a field message; URL is unchanged.
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/account\/login/);
  });
});

test.describe("auth · register", () => {
  let createdEmail: string | null = null;

  test.afterEach(async () => {
    if (createdEmail) {
      await deleteUserByEmail(createdEmail);
      createdEmail = null;
    }
  });

  test("creates an account and signs the user in", async ({ page }) => {
    const email = uniqueTestEmail();
    createdEmail = email;
    const password = "E2ePass!23";

    await page.goto("/account/register");
    await page.fill("#register-name", "E2E Test User");
    await page.fill("#register-email", email);
    await page.fill("#register-password", password);
    await page.fill("#register-confirm-password", password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();

    // signUp → signIn → hard redirect to "/". Confirm we left the register page.
    await page.waitForURL((url) => !url.pathname.includes("/account/register"), {
      timeout: 20_000,
    });
    await expect(page).not.toHaveURL(/\/account\/register/);
  });

  test("blocks mismatched passwords client-side", async ({ page }) => {
    await page.goto("/account/register");
    await page.fill("#register-name", "Mismatch User");
    await page.fill("#register-email", uniqueTestEmail());
    await page.fill("#register-password", "Password!1");
    await page.fill("#register-confirm-password", "Password!2");
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
    await expect(page).toHaveURL(/\/account\/register/);
  });
});

test.describe("auth · forgot password", () => {
  test("submits the reset form and shows confirmation", async ({ page }) => {
    await page.goto("/account/forgot-password");
    await page.fill("#email", STUDENT_EMAIL);
    await page.getByRole("button", { name: "Send Reset Link" }).click();

    await expect(
      page.getByText("We've sent a password reset link to")
    ).toBeVisible();
  });
});
