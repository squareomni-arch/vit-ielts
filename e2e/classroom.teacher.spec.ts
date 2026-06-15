import { test, expect } from "@playwright/test";
import { supabaseAdmin } from "./lib/supabase-admin";

/**
 * Phase 3 — teacher classroom flow (teacher storageState).
 * Verifies the teacher view and creates a class end to end (createClassroom →
 * navigate to the new class detail). Cleans up the created rows afterward.
 */
test.describe("classroom · teacher", () => {
  let classroomId: string | null = null;

  test.afterEach(async () => {
    if (classroomId) {
      await supabaseAdmin
        .from("classroom_members")
        .delete()
        .eq("classroom_id", classroomId);
      await supabaseAdmin.from("classrooms").delete().eq("id", classroomId);
      classroomId = null;
    }
  });

  test("shows the teacher view and creates a class", async ({ page }) => {
    await page.goto("/classroom");
    await expect(
      page.getByRole("heading", { name: "Class management" })
    ).toBeVisible({ timeout: 20_000 });

    // Open the create-class modal.
    await page.getByRole("button", { name: "Create class" }).first().click();
    await expect(page.getByText("Create new class")).toBeVisible();

    const name = `E2E Class ${Date.now()}`;
    await page.getByPlaceholder(/IELTS Academic/).fill(name);
    // "Create" (exact) is the modal submit, distinct from "Create class".
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // Lands on the new class detail page (uuid path).
    await page.waitForURL(/\/classroom\/[0-9a-f]{8}-[0-9a-f-]+/i, {
      timeout: 30_000,
    });
    const match = page.url().match(/\/classroom\/([0-9a-f]{8}-[0-9a-f-]+)/i);
    classroomId = match?.[1] ?? null;
    expect(classroomId).not.toBeNull();

    // The new class name is shown on its detail page.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  });
});
