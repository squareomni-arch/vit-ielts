import { test, expect } from "@playwright/test";
import { supabaseAdmin } from "./lib/supabase-admin";

/**
 * Phase 1 — the test-taking flow for a logged-in student.
 *
 * Navigating to /take-the-test/[slug] makes getServerSideProps auto-create a
 * `test_results` draft row, so no manual seeding is needed. We render the test,
 * answer a question, submit via the confirm modal, and land on /test-result.
 *
 * Uses a READING practice quiz so there's no listening "Play" audio gate
 * (reading auto-sets isReady). The quiz is pro-only; devtest is is_pro=true.
 */

const QUIZ_SLUG = "com-game-theory-6jwxh"; // reading · practice · published

test.describe("take-the-test", () => {
  // The test-taking screen is heavy (DnD + splitter + antd); under parallel
  // load the dev server's first Turbopack compile can be slow, so give this
  // flow extra headroom.
  test.setTimeout(120_000);

  let resultIdToCleanup: string | null = null;

  test.afterEach(async () => {
    // Remove the test_results row(s) this run created to keep the local DB tidy.
    if (resultIdToCleanup) {
      await supabaseAdmin.from("test_results").delete().eq("id", resultIdToCleanup);
      resultIdToCleanup = null;
    }
  });

  test("renders the test, answers a question, and submits to a result", async ({
    page,
  }) => {
    await page.goto(`/take-the-test/${QUIZ_SLUG}`);

    // Test UI rendered: passage instruction box is present. Generous timeout
    // absorbs cold Turbopack compile of this heavy page under parallel load.
    await expect(
      page.getByText(/Read the text and answer questions/i)
    ).toBeVisible({ timeout: 60_000 });

    // Answer the first available choice (best-effort — submit is allowed with
    // partial answers, so this never blocks the flow). antd hides the native
    // input behind a clickable wrapper label.
    const firstChoice = page
      .locator(".ant-radio-wrapper, .ant-checkbox-wrapper")
      .first();
    if (await firstChoice.count()) {
      await firstChoice.click().catch(() => {});
    }

    // Open the submit confirm modal, then confirm.
    await page.getByTestId("exam-submit").click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByText("Are you sure you want to submit?")).toBeVisible();
    await page
      .getByRole("button", { name: "Submit and Review Answers" })
      .click();

    // Lands on the result page.
    await page.waitForURL(/\/test-result\/[0-9a-f-]+/i, { timeout: 30_000 });

    const match = page.url().match(/\/test-result\/([0-9a-f-]+)/i);
    resultIdToCleanup = match?.[1] ?? null;
    expect(resultIdToCleanup).not.toBeNull();
  });
});
