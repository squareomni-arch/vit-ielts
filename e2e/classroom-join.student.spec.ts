import { test, expect } from "@playwright/test";
import { getTeacherId, seedClassroom, deleteClassroom } from "./lib/classroom-seed";

/**
 * Phase 3 — student joins a class by invite code (real join RPC runs as the
 * student session). Seeds a teacher-owned class, then joins as devtest.
 */
test.describe("classroom · join by code", () => {
  let classroomId: string | null = null;

  test.afterEach(async () => {
    if (classroomId) {
      await deleteClassroom(classroomId);
      classroomId = null;
    }
  });

  test("joins via the invite code modal", async ({ page }) => {
    const teacherId = await getTeacherId();
    const seeded = await seedClassroom(teacherId, `E2E Join ${Date.now()}`);
    classroomId = seeded.id;

    await page.goto("/classroom");
    // Always-present student action (the "Join class" empty-state button only
    // shows when the student has zero classes).
    await page
      .getByRole("button", { name: "Join with code / invite link" })
      .click();

    await page.getByPlaceholder(/ABC123/).fill(seeded.inviteCode);
    await page.getByRole("button", { name: "Join", exact: true }).click();

    // Either "joined" (auto-active) or "request sent" (needs approval).
    await expect(
      page.getByText(/You have joined|Join request sent/i)
    ).toBeVisible({ timeout: 20_000 });
  });
});
