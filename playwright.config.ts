import { defineConfig, devices } from "@playwright/test";

/**
 * Visual-regression config for the UI rebuild (gate 3).
 *
 * Snapshots live next to their specs under `visual-tests/`. Baselines are
 * committed; CI/local runs diff against them. Update intentionally with:
 *   pnpm test:visual:update
 *
 * NOTE: keep this separate from Vitest (`/tests`). Vitest = behaviour/unit;
 * Playwright = pixel/visual only.
 */
export default defineConfig({
  testDir: "./visual-tests",
  // Stories/screens are deterministic; allow a tiny AA/subpixel tolerance.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    // Lock viewport so snapshots are stable across machines.
    viewport: { width: 1440, height: 900 },
    // Brand font is loaded from Google Fonts; wait for network idle in specs.
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Boot the app for the test run. Reuse an already-running dev server locally.
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
