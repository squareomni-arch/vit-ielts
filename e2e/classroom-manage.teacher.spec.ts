import { test, expect } from "@playwright/test";
import { findAuthUserIdByEmail } from "./lib/supabase-admin";
import {
  getTeacherId,
  getAnyPublishedQuizId,
  seedClassroom,
  addActiveStudent,
  seedAssignment,
  deleteClassroom,
} from "./lib/classroom-seed";

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || "devtest@vit.vn";

/**
 * Phase 3 — teacher manages a class: creating assignments and viewing the
 * tracking table. Each test seeds its own class and tears it down.
 */
test.describe("classroom · teacher manage", () => {
  let classroomId: string | null = null;

  test.afterEach(async () => {
    if (classroomId) {
      await deleteClassroom(classroomId);
      classroomId = null;
    }
  });

  test("creates an assignment via the assign modal", async ({ page }) => {
    const teacherId = await getTeacherId();
    const seeded = await seedClassroom(teacherId, `E2E Assign ${Date.now()}`);
    classroomId = seeded.id;

    // Assignment management is a tab inside the class detail page.
    await page.goto(`/classroom/${seeded.id}?tab=assignments`);
    await expect(
      page.getByRole("button", { name: "Assign tests" })
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Assign tests" }).click();

    // Step 1 — pick the first quiz (default skill tab "reading" has quizzes).
    const firstQuiz = page.locator(".ant-modal .overflow-y-auto button").first();
    await expect(firstQuiz).toBeVisible({ timeout: 20_000 });
    await firstQuiz.click();
    await page.getByRole("button", { name: /Continue/ }).click();

    // Step 2 — confirm (assigned to all students by default).
    await page.getByRole("button", { name: /^Assign \d+ test/ }).click();

    await expect(page.getByText(/Assigned \d+ test/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("tracking lists an enrolled student", async ({ page }) => {
    const teacherId = await getTeacherId();
    const studentId = await findAuthUserIdByEmail(STUDENT_EMAIL);
    expect(studentId).not.toBeNull();
    const quizId = await getAnyPublishedQuizId();

    const seeded = await seedClassroom(teacherId, `E2E Track ${Date.now()}`);
    classroomId = seeded.id;
    // Tracking rows require both an active student AND an assignment.
    await addActiveStudent(seeded.id, studentId!);
    await seedAssignment(seeded.id, quizId, teacherId);

    await page.goto(`/classroom/${seeded.id}/tracking`);
    await expect(page.getByText(/Results/).first()).toBeVisible({
      timeout: 20_000,
    });
    // The enrolled student's email appears in the score table.
    await expect(page.getByText(STUDENT_EMAIL).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
