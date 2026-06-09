# Phase 0 — Discovery & Confirmation Report

**Project:** `D:\Projects\00-vitielts\IELTS-Prediction`
**Branch:** `main` · **Date:** 2026-06-09
**Status:** Awaiting human confirmation before Phase 1.

This report replaces every `<<...>>` placeholder in `AGENT_UI_REBUILD_GUIDE.md` with real, verified values from the codebase. No code was changed.

> **Headline:** This is **not a greenfield rebuild — it is a migration already in progress.** A Figma-derived design system (tokens + atoms/molecules/organisms) already exists in `src/shared/ui/ds/`, and a governing rules file (`UI_MIGRATION_RULES.md`) already exists. The guide's plan should be reconciled with what is already here, not run as if from zero. See "Important deviations" at the end.

---

## 1. Stack

| Layer | Resolved value |
|---|---|
| Framework | **Next.js 15** (`next ^15.5.9`), **Pages Router** (`/pages`) |
| Language | **TypeScript 5.8**, `"strict": true`, `noEmit: true` (tsconfig.json) |
| UI runtime | **React 19** (`react ^19.1.0`) |
| Styling (user-facing) | **Tailwind CSS v4** (`tailwindcss ^4.1.2`, `@tailwindcss/postcss`). No `tailwind.config.*` file — config is CSS-first via the `@theme` block in `globals.css`. |
| Styling (admin only) | **Ant Design v5** (`antd ^5.24.6`) + `@ant-design/v5-patch-for-react-19` |
| Client state | **Zustand 5** |
| Server state | **Supabase** client, queried directly in `getServerSideProps` (SSR-only, no client-side initial fetch) |
| Backend / DB | **Supabase (PostgreSQL)** + Auth + RLS; sensitive ops via `supabaseAdmin` (service role) in API routes; **Nodemailer** for SMTP |
| Tests | **Vitest 4** |
| Package manager | **pnpm 10.5.2** (`.npmrc`: `shamefully-hoist=true`) |
| Architecture | **Feature-Sliced Design**: `appx`, `pages`, `widgets`, `features`, `entities`, `shared` |

---

## 2. Exact paths

### Do-not-touch (logic / data / API) — import-only

```
/services/**.ts            # Supabase query layer (quiz, sample-essay, test-flow, user,
                           # scoring, email, post, order, coupon, affiliate, classroom, cms-config, ...)
/services/types/**         # DB/response data models
/lib/supabase/**           # client / server / admin / admin-client / getMasterData
/lib/server/**             # email-helper (server-only)
/lib/admin-auth.ts, /lib/rate-limit.ts, /lib/parseRoles.ts, /lib/vps-upload.ts
/pages/api/**              # all Next.js API routes (admin, webhooks, orders, test-flow, ...)
/middleware.ts             # auth/session middleware
/src/shared/types/**, /src/types/**   # global + API response types
/tests/**                  # all test files (16 *.test.ts, incl. *-live.test.ts)
```

### Protected pages (do not restyle)

```
pages/take-the-test/**     # the exam-taking flow — change NOTHING
pages/admin/**             # admin dashboard — stays Ant Design
pages/preview.tsx          # design-system gallery tool — keep as-is (use it as the visual check)
```

### Design tokens — **two sources exist (see flag #1)**

```
src/appx/styles/globals.css   → @theme { ... }   # CANONICAL for Tailwind utilities.
                                                  # oklch color scales (primary/secondary/tertiary/
                                                  # quaternary), font vars, breakpoints. These are what
                                                  # `bg-primary-500`, `text-default` etc. actually resolve to.
src/shared/ui/ds/design-tokens.css                # Figma hex primitives + semantic aliases,
                                                  # imported via src/shared/ui/ds/styles.css → loaded in _app.tsx.
```

### Primitives (the design system) — build screens from these

```
src/shared/ui/ds/atoms/       # avatar, badge, button, divider, input, part-tag, spinner, tag
src/shared/ui/ds/molecules/   # blog-card, breadcrumb, category-card, form-field, nav-link,
                              # pricing-card, stat-card, test-card
src/shared/ui/ds/organisms/   # cta-banner, footer, header, hero-banner
src/shared/ui/ds/index.ts     # barrel export
```

Atoms are already migrated to Tailwind-only and tagged with their Figma node IDs (e.g. `button.tsx` → `@figma ... node 1076-2183`).

### Screens & composite UI (in-scope to rebuild)

```
src/pages/{name}/index.tsx    # getServerSideProps (logic) + re-export — DO NOT put rendering here
src/pages/{name}/ui/          # presentational page component (this is what you rebuild)
src/widgets/**                # large reusable blocks (layouts, header, footer, seo, ...)
src/entities/**               # domain UI (avatar, star-rating, practice-test)
src/features/**               # admin-post, admin-quiz (admin — generally out of scope)
```

---

## 3. Commands

| Purpose | Command | Notes |
|---|---|---|
| Test (gate 1) | `pnpm test` | = `vitest run`. Watch: `pnpm test:watch`. **Caveat:** `*-live.test.ts` hit live Supabase — keep those separate from the UI gate. |
| Type-check (gate 2) | `pnpm exec tsc --noEmit` | **No `typecheck` script exists** — added here. `tsconfig.json` already sets `noEmit: true`, so `tsc` alone works too. *(Recommend adding `"typecheck": "tsc --noEmit"` to package.json.)* |
| Build | `pnpm build` | = `next build` |
| Lint | `pnpm lint` | = `next lint` |
| Visual snapshot (gate 3) | **— none —** | **No Playwright / Storybook / Chromatic / snapshot tooling installed.** Gate 3 cannot be automated today. Interim: manual side-by-side via `pages/preview.tsx` + Figma frame. See flag #2. |

---

## 4. UI / logic entanglement assessment

**Verdict: cleanly separated already. The seam the guide wants to establish in Phase 1 largely exists.**

Evidence (e.g. `src/pages/ielts-prediction/index.tsx`):

- All data fetching lives in `getServerSideProps`, composed through HOCs (`withMasterData`, `withMultipleWrapper`, `withAuth`) and the `/services` layer.
- The page's `index.tsx` only wires SSR + re-exports the component; the rendering component lives in `./ui` and receives data via **props**.
- Services take a Supabase client as their first argument and are reused server- and client-side — no fetch logic embedded in presentational components.

**Implication for Phase 1:** No large behavior-preserving refactor is expected. Phase 1 reduces to *documenting the existing prop contract per screen* (the `ui/types.ts` files already define many of these). Spot-check each screen for stray client-side fetching before rebuilding it, but the architecture is sound.

---

## Important deviations from the guide (require a human decision)

1. **Two token systems coexist — RESOLVED (2026-06-09).** `globals.css` `@theme` (oklch, wired into Tailwind) and `ds/design-tokens.css` (Figma hex) were both live. Decision: **`@theme` is the single canonical source, re-extracted from Figma**; `design-tokens.css` is retired (deleted or reduced to aliases). See `DESIGN_SYSTEM_REBUILD.md`.

2. **No visual-regression tooling — RESOLVED (2026-06-09).** Playwright was installed for gate 3: `playwright.config.ts` + `visual-tests/` (baseline = `pages/preview.tsx`). Run `pnpm install && pnpm exec playwright install`, then `pnpm test:visual:update`. Scripts: `pnpm test:visual`, `pnpm test:visual:update`.

3. **The design system already exists** (`src/shared/ui/ds/`), partially Figma-mapped. Phase 2 ("port the design system") is **partly done** — it becomes an audit/gap-fill (which atoms/molecules/organisms are missing vs. Figma), not a from-scratch build.

4. **~~A governing rules doc already exists~~ — RESOLVED (2026-06-09):** the previous migration docs (`UI_MIGRATION_RULES.md`, `implementation_plan.md`, `CODE_CONVENTIONS.md`, `AGENTS.md`) have been **deleted** by decision. `AGENT_UI_REBUILD_GUIDE.md` + this report + the rules section in `CLAUDE.md` are now the single source of truth. (History remains in git if any rule needs to be recovered.) Note: stale links in `tasks/*.md` were repointed to `CLAUDE.md`, and `TESTING_PLAN.md` was flagged outdated (testing to be re-planned for the UI rebuild).

5. **Figma Dev Mode MCP server is NOT connected** in this session, and the `frontend-design` skill is **not installed**. Both are prerequisites the guide calls critical. Tokens already appear Figma-extracted, but any new extraction/verification needs the MCP connected first.

---

## Phase 0 gate

Placeholders are filled and verified against the codebase. **Recommend the human confirm decisions on flags #1 and #2 before Phase 1**, since both block token/primitive work.
                           