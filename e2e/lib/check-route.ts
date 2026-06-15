import { Page, expect } from "@playwright/test";

/**
 * Navigates to `route` and asserts the page is healthy:
 *   - the main document responds < 400
 *   - no uncaught JS exception (pageerror) fires during load
 *   - the document actually rendered a <body> with content
 *
 * Console errors are collected and returned (not failed on) — many are
 * third-party/font noise. Callers can inspect them if they want stricter gates.
 */
export async function checkRoute(
  page: Page,
  route: string
): Promise<{ consoleErrors: string[] }> {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (err) => pageErrors.push(err));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const response = await page.goto(route, { waitUntil: "domcontentloaded" });

  // Next.js SSR returns a response for the document; follow-on redirects
  // (e.g. auth bounce) resolve to their final 200.
  expect(response, `no response for ${route}`).not.toBeNull();
  expect(
    response!.status(),
    `${route} returned HTTP ${response!.status()}`
  ).toBeLessThan(400);

  // Body should have rendered something.
  await expect(page.locator("body")).not.toBeEmpty();

  expect(
    pageErrors,
    `${route} threw uncaught error(s): ${pageErrors.map((e) => e.message).join(" | ")}`
  ).toHaveLength(0);

  return { consoleErrors };
}
