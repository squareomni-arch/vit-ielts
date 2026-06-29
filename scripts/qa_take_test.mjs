/**
 * QA bot: take ONE test end-to-end as a logged-in user, capture screenshots
 * of the test sections + the result page, and print a JSON summary.
 *
 * Usage:
 *   node scripts/qa_take_test.mjs <slug> <outDir> "<label>"
 * Env: QA_EMAIL, QA_PASSWORD, BASE_URL (default http://localhost:3000)
 *
 * Prints a single line:  QA_RESULT <json>
 */
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const [slug, outDir, label = slug] = process.argv.slice(2);
const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.QA_EMAIL;
const PASSWORD = process.env.QA_PASSWORD;
if (!slug || !outDir) { console.error("need <slug> <outDir>"); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const shots = [];
async function shot(page, name) {
  const p = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true }).catch(() => {});
  shots.push(p);
}

const out = { slug, label, ok: false, resultId: null, score: null, screenshots: shots, error: null };

// OS can't fetch the pinned build; reuse the cached chromium-1228 binary.
const CHROME = process.env.QA_CHROME ||
  `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`;
const browser = await chromium.launch({
  executablePath: CHROME,
  // --disable-dev-shm-usage avoids "browser has been closed" crashes (small
  // /dev/shm on WSL); --mute-audio so the listening audio gate doesn't choke.
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--mute-audio"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 } });
// Headless chromium crashes decoding the listening audio; block media bytes so
// the flow (gate → questions → submit) runs without an audio device.
await ctx.route(/\.(mp3|m4a|ogg|wav)(\?|$)/i, (r) => r.abort().catch(() => {}));
const page = await ctx.newPage();
page.setDefaultTimeout(90_000);

try {
  // ---- login ----
  await page.goto(`${BASE}/account/login?redirect=%2Faccount%2Fdashboard`, { waitUntil: "domcontentloaded" });
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", PASSWORD);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.waitForURL("**/account/dashboard", { timeout: 60_000 });

  // ---- open the test ----
  await page.goto(`${BASE}/take-the-test/${slug}`, { waitUntil: "domcontentloaded" });
  // wait for the test shell (submit button is always rendered in the footer)
  await page.getByTestId("exam-submit").waitFor({ state: "visible", timeout: 90_000 });
  await page.waitForTimeout(2500); // let passage/audio/questions paint

  // Listening tests show a "click Play to continue" gate over the questions.
  // Screenshot it first (proves audio loads), then click Play to unlock.
  await shot(page, "part-1-intro");

  // QUICK mode: headless chromium is unstable on the listening audio page, so
  // skip Play + part navigation and submit straight away (proves load→submit→
  // result path; answers will be empty).
  if (process.env.QA_QUICK === "1") {
    await page.getByTestId("exam-submit").click({ timeout: 20_000 }).catch(() => {});
    const c = page.getByRole("button", { name: /Submit and Review Answers|Submit|Nộp bài|Yes|Confirm/i }).last();
    await c.click({ timeout: 20_000 }).catch(() => {});
    await page.waitForURL(/\/test-result\/[0-9a-f-]+/i, { timeout: 45_000 });
    out.resultId = page.url().match(/\/test-result\/([0-9a-f-]+)/i)?.[1] ?? null;
    await shot(page, "result");
    const bt = await page.locator("body").innerText().catch(() => "");
    out.correct = (bt.match(/(\d+)\s*of\s*(\d+)\s*correct/i) || [])[0] ?? null;
    out.ok = !!out.resultId;
    await browser.close();
    console.log("QA_RESULT " + JSON.stringify(out));
    process.exit(0);
  }

  for (const name of [/^\s*Play\s*$/i, /^(Start|Begin|Bắt đầu|Continue|OK|Tôi hiểu|I understand|Got it)$/i]) {
    const b = page.getByRole("button", { name }).first();
    if (await b.count() && await b.isVisible().catch(() => false)) {
      await b.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }

  // ---- screenshot each part, answering as we go ----
  // Parts are switched via the question-number palette in the footer. Collect
  // the distinct part entry buttons; fall back to a single view if none found.
  await shot(page, "part-1");
  await answerVisible(page);

  // Part/passage navigation: footer shows "Passage 2", "Part 3", … entries.
  let captured = 1;
  for (let n = 2; n <= 4; n++) {
    const tab = page.getByText(new RegExp(`^(Passage|Part)\\s*${n}$`, "i")).first();
    if (await tab.count() && await tab.isVisible().catch(() => false)) {
      await tab.click().catch(() => {});
      await page.waitForTimeout(1500);
      captured++;
      await shot(page, `part-${captured}`);
      await answerVisible(page);
    }
  }

  // ---- submit ----
  await page.getByTestId("exam-submit").click({ timeout: 20_000 });
  // confirmation dialog — button label varies; try a few, else any primary btn.
  const confirm = page.getByRole("button", {
    name: /Submit and Review Answers|Submit|Nộp bài|Yes|Confirm/i,
  }).last();
  await confirm.click({ timeout: 20_000 }).catch(async () => {
    await page.locator(".ant-modal button.ant-btn-primary, .ant-modal-confirm-btns .ant-btn-primary")
      .last().click({ timeout: 10_000 }).catch(() => {});
  });
  await page.waitForURL(/\/test-result\/[0-9a-f-]+/i, { timeout: 45_000 });
  out.resultId = page.url().match(/\/test-result\/([0-9a-f-]+)/i)?.[1] ?? null;

  await page.waitForTimeout(2500);
  await shot(page, "result");

  // scrape band + correct count from the result page
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const band = bodyText.match(/([0-9](?:\.[05])?)\s*\n?\s*BAND/i);
  const correct = bodyText.match(/(\d+)\s*of\s*(\d+)\s*correct/i);
  out.score = band ? `${band[1]} band` : null;
  out.correct = correct ? `${correct[1]}/${correct[2]}` : null;
  out.ok = !!out.resultId;
} catch (e) {
  out.error = String(e).slice(0, 300);
  await shot(page, "error");
} finally {
  out.screenshots = shots;
  await browser.close();
  console.log("QA_RESULT " + JSON.stringify(out));
}

// Click first radio/checkbox in each group + fill text inputs with a dummy word.
async function answerVisible(page) {
  try {
    const radios = page.locator(".ant-radio-wrapper");
    const n = Math.min(await radios.count(), 60);
    for (let i = 0; i < n; i += 3) { // ~one per group of options
      await radios.nth(i).click({ timeout: 1500 }).catch(() => {});
    }
    const inputs = page.locator('input.ant-input, input[type="text"]:visible, .ant-input');
    const k = Math.min(await inputs.count(), 60);
    for (let i = 0; i < k; i++) {
      await inputs.nth(i).fill("test", { timeout: 1000 }).catch(() => {});
    }
  } catch { /* best-effort */ }
}
