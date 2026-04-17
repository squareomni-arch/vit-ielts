# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run tests (Vitest)
npm run test:watch # Watch mode for tests
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
