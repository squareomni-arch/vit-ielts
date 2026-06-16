/**
 * Static route manifest for the smoke sweep.
 *
 * Only routes with NO required path params live here — dynamic detail pages
 * (`/take-the-test/[slug]`, `/blog/[slug]`, `/test-result/[id]`, …) need real
 * IDs seeded from the DB and are covered by dedicated flow specs in later
 * phases (see e2e/README.md).
 *
 * Mirrors `src/shared/routes/index.ts`. Keep in sync when routes change.
 */

/** Public pages reachable without a session. */
export const PUBLIC_ROUTES: string[] = [
  "/",
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/help",
  "/subscription",
  "/contact",
  "/blog",
  "/ielts-exam-library",
  "/ielts-exam-library?skill=listening",
  "/ielts-exam-library?skill=reading",
  "/ielts-practice-library",
  "/vit-ielts",
  "/privacy-policy",
  "/terms-of-use",
  // Sample-essay archives (served via the [...slug] catch-all).
  "/ielts-speaking-sample",
  "/ielts-writing-sample",
  "/ielts-reading-sample",
  "/ielts-listening-sample",
];

/** Pages that require a logged-in subscriber (the `devtest` student account). */
export const STUDENT_ROUTES: string[] = [
  "/account/dashboard",
  "/account/my-profile",
  "/account/order-history",
  "/account/affiliate",
  "/account/settings",
  "/account/checkout",
  "/my-progress",
  "/study-plan",
  "/vocabulary",
  "/community",
  "/classroom/my-assignments",
];

/**
 * Teacher-only pages — NOT exercised in Phase 0 (the devtest account is a
 * subscriber, not a teacher). Phase 3 adds a teacher storageState for these.
 */
export const TEACHER_ROUTES: string[] = [
  "/classroom",
  "/classroom/overview",
  "/classroom/students",
  "/classroom/collaborators",
];
