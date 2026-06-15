# E2E functional tests

Playwright suite that drives **real user flows** — clicking buttons, filling
forms, navigating — to verify the app's behaviour. This is separate from:

- `tests/` — Vitest unit/service tests (backend logic)
- `visual-tests/` — Playwright **visual regression** (pixel diffs only)

## Prerequisites

1. **Local Supabase running** (ports 5433x) — these tests hit the local stack,
   never cloud. Do **not** `supabase db reset`.
2. **Dev server**: `pnpm dev` on `http://localhost:3000` (the config will boot
   one automatically and reuse a running one).
3. Seeded `devtest` account (`devtest@vit.vn` / `DevTest@123`).

## Run

```bash
pnpm test:e2e                 # all e2e specs
pnpm test:e2e -- smoke        # just the smoke sweep
pnpm test:e2e:headed          # watch the browser
pnpm test:e2e:ui              # Playwright UI mode
```

Override the test account via env if needed:
`E2E_STUDENT_EMAIL`, `E2E_STUDENT_PASSWORD`.

## How it's wired

- **`auth.setup.ts`** (project `setup`) logs in once and saves the session to
  `e2e/.auth/student.json` (gitignored). Authed specs reuse it via storageState.
- Specs are split by required session, via filename suffix → Playwright project:
  - `*.guest.spec.ts`  → project `guest`  (no session)
  - `*.student.spec.ts` → project `student` (logged-in subscriber)
- `routes.ts` is the static-route manifest for the smoke sweep, mirroring
  `src/shared/routes/index.ts`.
- `lib/check-route.ts` asserts a route loads healthily (HTTP < 400, no uncaught
  JS error, body rendered).

## Status / roadmap

Scope agreed: **P1 → P3 user-facing** (admin excluded for now).

- [x] **Phase 0** — config, auth storageState, smoke sweep of all static routes.
- [x] **Phase 1** — flows:
  - [x] auth — login (valid/invalid), register (+cleanup), forgot-password
        (`auth.guest.spec.ts`); logout, self-contained throwaway user
        (`logout.guest.spec.ts`).
  - [x] take-the-test — render → answer → submit modal → /test-result
        (`take-the-test.student.spec.ts`; cleans up the test_results row).
  - [x] subscription + checkout — plan CTA → checkout, order summary, coupon
        invalid/valid (`checkout.student.spec.ts`; stops before placing an order).

### Gotchas learned

- **logout must be isolated.** The app's `signOut()` revokes the user's
  sessions *globally* (server-side). A logout test sharing the `devtest`
  storageState kills the session for every concurrent student spec. Keep
  logout on a throwaway user (`createConfirmedUser`), in the `guest` project.
- **take-the-test is heavy.** First Turbopack compile under parallel load is
  slow — that spec sets a 120s test timeout / 60s render wait.
- Reaching `/take-the-test/[slug]` while logged in auto-creates a draft; no
  manual seeding needed. Use a **reading** quiz to skip the listening audio gate.
- [x] **Phase 2** — flows:
  - [x] account — settings (notification toggle + sessions modal), my-profile
        (edit-mode/cancel, real name save, avatar upload), order-history table,
        affiliate state (`account.student.spec.ts`).
  - [x] library — exam-library skill filter + toolbar search → URL
        (`library.guest.spec.ts`); practice detail copy-link
        (`library-detail.student.spec.ts`).
  - [x] test-result — submit → result page → Review Mode
        (`test-result.student.spec.ts`; reuses `lib/take-test.ts`).
- [x] **Phase 3** — flows:
  - [x] classroom (teacher) — teacher view + create class
        (`classroom.teacher.spec.ts`).
  - [x] classroom join — student joins by invite code
        (`classroom-join.student.spec.ts`; seeds a class via `lib/classroom-seed.ts`).
  - [x] classroom assignment + tracking — teacher creates an assignment (2-step
        modal on the detail page's `?tab=assignments`) and views the tracking
        table with an enrolled student (`classroom-manage.teacher.spec.ts`).
  - [x] community — open/cancel the new-post composer (`community.student.spec.ts`).
  - [x] vocabulary — add-word modal open/close (`vocabulary.student.spec.ts`).
  - [ ] not covered (low value / mutation-heavy): study-plan task toggle,
        my-progress (read-only — covered by smoke).

## Projects / auth

- `setup` → student storageState (`auth.setup.ts`, devtest).
- `teacher-setup` → teacher storageState (`auth.teacher.setup.ts`). Ensures a
  stable `e2e-teacher@vit.test` account with `roles: ["teacher"]` via the admin
  client (`ensureTeacherUser`), then logs in.
- Spec suffix → project: `*.guest.spec.ts` / `*.student.spec.ts` / `*.teacher.spec.ts`.

### Dynamic routes (deferred)

Detail pages need real IDs/slugs from the DB:
`/take-the-test/[slug]`, `/ielts-exam-library/[slug]`,
`/ielts-practice-library/[slug]`, `/blog/[slug]`, `/test-result/[id]`, …
These are covered by their flow specs (Phase 1+), which seed/resolve IDs via the
service-role client (see `tests/fixtures/supabase-live.ts` for the pattern),
not by the static smoke sweep.
