import { Page, expect } from "@playwright/test";

/** A reading + practice + published quiz; reading skips the audio gate. */
export const READING_QUIZ_SLUG = "com-game-theory-6jwxh";

/**
 * Drives the take-the-test flow end to end for a logged-in student and returns
 * the created result id. Navigating to the slug auto-creates a draft, so no
 * seeding is needed. Caller should delete the `test_results` row afterward.
 */
export async function submitQuickTest(
  page: Page,
  slug: string = READING_QUIZ_SLUG
): Promise<string> {
  await page.goto(`/take-the-test/${slug}`);
  await expect(
    page.getByText(/Read the text and answer questions/i)
  ).toBeVisible({ timeout: 60_000 });

  // Best-effort single answer (submit works with partial answers).
  const firstChoice = page
    .locator(".ant-radio-wrapper, .ant-checkbox-wrapper")
    .first();
  if (await firstChoice.count()) {
    await firstChoice.click().catch(() => {});
  }

  await page.getByTestId("exam-submit").click();
  await page.getByRole("button", { name: "Submit and Review Answers" }).click();

  await page.waitForURL(/\/test-result\/[0-9a-f-]+/i, { timeout: 30_000 });
  const match = page.url().match(/\/test-result\/([0-9a-f-]+)/i);
  const resultId = match?.[1];
  if (!resultId) throw new Error("Could not resolve result id from URL");
  return resultId;
}
