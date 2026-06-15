import { test } from "@playwright/test";
import { PUBLIC_ROUTES } from "./routes";
import { checkRoute } from "./lib/check-route";

/**
 * Phase 0 smoke — public routes load without crashing for a guest (no session).
 * One test per route so failures pinpoint the broken page.
 */
test.describe("smoke · public routes (guest)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      await checkRoute(page, route);
    });
  }
});
