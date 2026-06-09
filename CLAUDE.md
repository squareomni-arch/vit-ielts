# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev        # Start dev server with Turbopack
pnpm run build      # Production build
pnpm run lint       # ESLint
pnpm run test       # Run tests (Vitest)
pnpm run test:watch # Watch mode for tests
```

## Architecture

**Stack**: Next.js 15 (Pages Router), React 19, TypeScript 5, Supabase (PostgreSQL), TailwindCSS 4, Ant Design 5, Zustand 5, Vitest.

**Routing**: File-based via `pages/` directory. All route strings are centralized in `src/shared/routes/index.ts`.

**Data fetching**: SSR-only via `getServerSideProps` — no client-side data fetching for initial page load. Server Supabase client: `createServerSupabase(context)` from `~supabase/server`. Browser client: `createClient()` from `~supabase/client`.

**Services layer**: All Supabase queries live in `/services/*.ts` (quiz, sample-essay, test-flow, user, scoring, email, cms-config). Services receive a Supabase client as first argument; they are used both server-side (in `getServerSideProps`) and client-side (with the browser client).

**HOCs**: Pages use `withMasterData`, `withAuth`, `withMultipleWrapper` to compose SSR wrappers.

**State**: Global auth via `useAuth()` (from `@/appx/providers`). Global master data via `AppProvider`. Page-level state via `useState`/`useContext`.

## Code Organization (Feature-Sliced Design)

```
src/
  pages/{page-name}/
    api/         # TypeScript types + legacy query constants
    ui/          # Page components
      index.tsx  # Main page component (exported)
      single/    # Detail page sub-components
    index.tsx    # getServerSideProps + re-exports
  shared/
    ui/ds/       # Design system: atoms/, molecules/, organisms/
    ui/icons/    # SVG icon components
    routes/      # Route constants
    lib/         # Shared utilities
    hoc/         # Higher-order components
    types/       # Global TypeScript types
  widgets/       # Large reusable blocks (layouts, header, footer)
  entities/      # Domain UI components (avatar, star-rating, practice-test)
  appx/          # App-level providers and global styles
services/        # Supabase query functions
lib/supabase/    # Supabase client factories (client, server, admin)
```

## Path Aliases

```
@/*       → src/*
~services/* → services/*
~supabase/* → lib/supabase/*
~lib/*    → lib/*
~server/* → lib/server/*
```

## Naming Conventions

- **Folders**: kebab-case (`ielts-practice-library`)
- **Components**: kebab-case files, PascalCase exports (`PageSampleEssay`)
- **Utilities**: camelCase (`calculateScore.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`ROUTES`, `QUESTION_FORMS`)
- **Interfaces**: prefixed with `I` (`IPracticeSingle`, `IUser`)

## Detail Page Pattern

All detail pages use a 3-column sticky layout:

- **Left sidebar** (220px): sticky title, description, copy-link button, share button
- **Middle column** (flex-1): featured image, main content
- **Right sidebar** (280px): sticky "Có thể bạn quan tâm" (related items)

Copy link uses `navigator.clipboard.writeText` with a textarea fallback and `setCopied` state that resets after 2 seconds. Share opens Facebook's sharer URL in a new tab.

## Styling

- TailwindCSS utility classes (primary color `#D94A56`, text `#2D3142`, muted `#6A7282`)
- Ant Design for complex UI (modals, forms, Anchor TOC)
- Material Symbols Rounded icons via `<span className="material-symbols-rounded">`
- No CSS modules — Tailwind + antd only

## Key Supabase Tables

`sample_essays`, `quiz` (practice/prediction tests), `test_sessions`, `test_answers`, `users`, `blog_posts`. RLS policies protect user data. Custom RPC functions for view counters (`increment_sample_essay_views`, `increment_quiz_views`).

---

## UI Rebuild — Agent Rules (non-negotiable)

> Resolved from `AGENT_UI_REBUILD_GUIDE.md` Phase 0 (see `PHASE0_DISCOVERY_REPORT.md`). These two documents — together with `DESIGN_SYSTEM_REBUILD.md` — are now the **single source of truth** for the UI rebuild. The previous migration docs (`UI_MIGRATION_RULES.md`, `implementation_plan.md`, `CODE_CONVENTIONS.md`, `AGENTS.md`) have been removed — do not reference them.

**Prime directive.** Rebuild the **UI only** to match Figma. Backend logic, data fetching, and business rules must stay behavior-identical. If a task seems to require changing logic, **stop and ask the human** — do not change it.

**Do-not-touch (import-only — never edit/move/rename/refactor):**

```
/services/**            /services/types/**
/lib/supabase/**        /lib/server/**        /lib/admin-auth.ts  /lib/rate-limit.ts
/pages/api/**           /middleware.ts
/src/shared/types/**    /src/types/**
/tests/**
```

**Protected pages (do not restyle):** `pages/take-the-test/**`, `pages/admin/**`, `pages/preview.tsx`.

**Design-system rules.**
- **No magic values.** Every color, font size, weight, spacing, radius, shadow, breakpoint must reference a design token. Canonical token source = the `@theme` block in `src/appx/styles/globals.css` (drives Tailwind utilities), re-extracted from Figma. `src/shared/ui/ds/design-tokens.css` is being retired — see `DESIGN_SYSTEM_REBUILD.md`. Raw hex / arbitrary px/rem / one-off colors are forbidden.
- **Reuse primitives** from `src/shared/ui/ds/` (atoms → molecules → organisms). Do not re-implement a primitive inline.
- **Match Figma via the Dev Mode MCP server**, not screenshots. If MCP data and a screenshot disagree, MCP wins. *(MCP not yet connected — connect before token/Figma work.)*
- If a needed token or primitive doesn't exist, **stop and flag it** — do not invent a value.

**Component contract rules.**
- Screens receive data/callbacks via **props**; preserve existing prop signatures and the hooks/services they connect to. Logic stays in `getServerSideProps` + `/services`; `src/pages/{name}/ui/**` stays presentational.
- Do not add data fetching or business logic inside components.

**Scope & process.** One screen (or one component) per task. Work leaf-to-root: primitives → composites → screens. All three gates must pass before "done".

**Verification gates (must pass; never weaken a test or loosen a type to pass):**
1. **Behavior** — `pnpm test` green (exclude `*-live.test.ts` from the UI gate).
2. **Types** — `pnpm typecheck` clean (`tsc --noEmit`).
3. **Visual** — `pnpm test:visual` green (Playwright; baseline = `pages/preview.tsx` gallery) **and** a manual side-by-side vs. the Figma frame for screen-level tasks.
