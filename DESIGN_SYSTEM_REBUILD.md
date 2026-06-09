# Design System Rebuild — Plan & Setup

**Goal:** rebuild the design system so there is **one consistent, Figma-accurate token source**, then rebuild primitives on top of it. Source of truth for tokens = re-extracted from Figma (decision: 2026-06-09).

This document is the Phase 2 plan referenced by `AGENT_UI_REBUILD_GUIDE.md` / `CLAUDE.md`. Do Phase 0 (`PHASE0_DISCOVERY_REPORT.md`) and Phase 1 (prop contracts) decisions still apply.

---

## ⚠️ Security — fix before anything else

`scripts/figma-extract-full.mjs` (and possibly the other `figma-*.mjs` scripts) contain a **hard-coded Figma personal access token** (`figd_...`) and the file key, committed to git. Before re-extracting:

1. **Rotate** the token in Figma (Settings → Security → Personal access tokens → revoke + create new).
2. Move it to `.env.local` as `FIGMA_TOKEN` and `FIGMA_FILE_KEY`; read via `process.env`. Never commit it.
3. The old token stays in git history even after editing — treat it as compromised and rotate regardless.

Do not run the existing extraction scripts with the committed token.

---

## Target architecture (single source of truth)

```
Figma file (JbK4p9yyXBjhu7B7VOIBhd)
        │  extract (Dev Mode MCP → variables/styles)
        ▼
src/appx/styles/globals.css  →  @theme { ... }      ← CANONICAL TOKENS
        │  (Tailwind v4 generates utilities from here)
        ▼
src/shared/ui/ds/atoms → molecules → organisms       ← PRIMITIVES (Tailwind-only, no magic values)
        ▼
src/pages/{name}/ui, widgets, entities                ← SCREENS
```

Decision points to lock when extraction lands:

- **`@theme` is the single token source.** Tailwind v4 only generates utilities from `@theme`, so canonical tokens must live there. `src/shared/ui/ds/design-tokens.css` (the older hex layer) is **retired**: either delete it, or reduce it to `var(--color-*)` aliases that point at `@theme` — no independent values. This removes the current oklch-vs-hex drift.
- Keep color, typography, spacing, radius, shadow, breakpoint scales all named after their Figma Variable/Style names (don't hand-rename).

---

## Re-extraction — two paths (use the MCP path)

The repo already has a **REST-API extraction** workflow (`scripts/figma-*.mjs` → `scripts/figma-data/*.json`, plus `_agents/skills/figma-to-code-design-system/FIGMA_REFERENCE.md` and `_agents/workflows/figma-extract.md`). That stays useful for **bulk asset/icon export**, but per the guide and your choice, **tokens are re-extracted via the Figma Dev Mode MCP server** (structured Variables/Styles, not screenshot-guessed).

When the MCP is connected, extract in this order and land into `@theme`:
1. Color Variables (node `14:137` palette as cross-check).
2. Typography styles (node `1076:2184`; font = Noto Sans).
3. Spacing / radius / effects (shadows).
4. Breakpoints.

Then diff the new `@theme` against the current one and reconcile primitives.

---

## Rebuild order (leaf-to-root, one unit per task)

1. **Tokens** → `@theme` (this is the gate for everything else).
2. **Atoms** (`src/shared/ui/ds/atoms`): avatar, badge, button, divider, input, part-tag, spinner, tag — re-verify each against its Figma node; remove any inline magic values.
3. **Molecules**: blog-card, breadcrumb, category-card, form-field, nav-link, pricing-card, stat-card, test-card.
4. **Organisms**: cta-banner, footer, header, hero-banner.
5. **Screens** (Phase 3) — compose from the above, wire to existing services via the Phase 1 prop contracts.

Each unit passes the three gates before "done":
- `pnpm test` (exclude `*-live.test.ts`)
- `pnpm typecheck`
- `pnpm test:visual` (baseline = `pages/preview.tsx` gallery; add per-unit snapshots)

The DS gallery `pages/preview.tsx` is the live visual check — render every new/changed primitive there.

---

## Status / blockers

- ✅ **Tokens ported (2026-06-09).** `@theme` in `globals.css` re-extracted from Figma node 3033-249: brand rebranded **red → green** (`--color-brand #B3E653`, `-hover #9AD534`, `-tint #F2FADD`, `-surface #E9F6D4`), ink/surface/border/accent tokens + a Figma type scale (`--text-display-l` … `--text-eyebrow`), fonts **Be Vietnam Pro** (display) + **Inter** (body). `--color-primary-*` (174 uses) remapped to the green ramp. `design-tokens.css` rebranded to match and marked **deprecated** (not deleted — still imported by atom/molecule CSS).
  - ⚠️ **Follow-up:** ~170 hardcoded `#D94A56` (old red) across ~35 screen/component files do NOT rebrand automatically — migrate to `text-primary-*`/`bg-brand` in the leaf-to-root screen tasks.
  - ⚠️ **Font switch is global** (body → Inter); verify admin (antd) still looks right.
- ✅ `typecheck` script added.
- ✅ Playwright visual-regression scaffold added (`playwright.config.ts`, `visual-tests/`). Run `pnpm install && pnpm exec playwright install`, then `pnpm test:visual:update` to create baselines.
- ✅ **Figma Dev Mode MCP connected** — used to extract the tokens above. (Still rotate the leaked `figd_` token, see Security.)
- ⛔ `frontend-design` skill not yet enabled (see SETUP).

---

## SETUP — tools you need to enable (cannot be done from this session)

### 1. Figma Dev Mode MCP server
- In the **Figma desktop app**: open the file → enable **Dev Mode** → Preferences → **Enable local MCP server** (Dev/Full seat required).
- In **Claude (desktop) → Settings → Connectors**: add the Figma Dev Mode MCP server (local endpoint, typically `http://127.0.0.1:3845/sse`).
- Verify by asking Claude to read a node (e.g. palette `14:137`). Once connected, MCP data wins over screenshots.

### 2. `frontend-design` skill
- **Settings → Capabilities** (skills) → enable `frontend-design`.
- Use it **for execution quality only** (CSS specificity discipline, responsive, focus states, reduced-motion) — **not** for inventing visuals. Figma is the brief.

### 3. Figma token hygiene
- Rotate the leaked `figd_...` token; move to `.env.local`; update `scripts/figma-*.mjs` to read `process.env.FIGMA_TOKEN`.
