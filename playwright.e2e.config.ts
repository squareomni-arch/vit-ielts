import { defineConfig, devices } from "@playwright/test";
import path from "path";

/**
 * Functional E2E config (separate from the visual-regression config in
 * `playwright.config.ts`). This suite drives real user flows — clicking
 * buttons, filling forms, navigating — against a running dev server backed
 * by the LOCAL Supabase stack (ports 5433x). It never touches cloud data.
 *
 * Run:
 *   pnpm test:e2e                 # all e2e specs
 *   pnpm test:e2e -- smoke        # just the smoke sweep
 *   pnpm test:e2e:headed          # watch it click
 *
 * Auth: `auth.setup.ts` logs in the `devtest` account once and saves the
 * session to `e2e/.auth/student.json`; authed specs reuse it via storageState.
 */

const STORAGE_STATE = path.join(__dirname, "e2e/.auth/student.json");
const TEACHER_STORAGE_STATE = path.join(__dirname, "e2e/.auth/teacher.json");

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Keep workers modest — flows seed/cleanup shared local DB rows.
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report/e2e" }],
    ["list"],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // 1. Authenticate once, persist session for authed projects.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "teacher-setup", testMatch: /auth\.teacher\.setup\.ts/ },

    // 2. Guest flows + public-route smoke (no session).
    {
      name: "guest",
      testMatch: /.*\.guest\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // 3. Logged-in (student) flows + authed-route smoke.
    {
      name: "student",
      testMatch: /.*\.student\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
    },

    // 4. Logged-in teacher (teacher role) flows.
    {
      name: "teacher",
      testMatch: /.*\.teacher\.spec\.ts/,
      dependencies: ["teacher-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: TEACHER_STORAGE_STATE,
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: process.env.BASE_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
