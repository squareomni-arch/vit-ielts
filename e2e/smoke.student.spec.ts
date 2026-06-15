import { test } from "@playwright/test";
import { STUDENT_ROUTES } from "./routes";
import { checkRoute } from "./lib/check-route";

/**
 * Phase 0 smoke — authed routes load without crashing for a logged-in
 * subscriber (devtest). Uses the `student` storageState from auth.setup.ts.
 * One test per route so failures pinpoint the broken page.
 */
test.describe("smoke · authed routes (student)", () => {
  for (const route of STUDENT_ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      await checkRoute(page, route);
    });
  }
});
