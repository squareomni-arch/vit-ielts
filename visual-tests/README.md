# Visual regression (gate 3)

Pixel-level checks for the UI rebuild, using Playwright. Separate from Vitest
(`/tests`), which covers behaviour/units.

## One-time setup

```bash
pnpm install                      # picks up @playwright/test from package.json
pnpm exec playwright install      # download browser binaries (chromium)
```

## Run

```bash
pnpm test:visual                  # diff current UI vs. committed baselines
pnpm test:visual:update           # regenerate baselines (do this on purpose only)
pnpm exec playwright show-report  # open the HTML diff report
```

`pnpm dev` is started automatically by the config (or reuses a running one).

## Conventions

- One spec per screen/component; name snapshots after the Figma frame.
- Always `await document.fonts.ready` + `networkidle` before snapshotting so
  webfont metrics are stable.
- Baseline PNGs are committed. Review diffs as a hard gate — never update
  baselines just to make a run pass; update only when the change is intended
  and matches Figma.
- Start from `preview.spec.ts` (the DS gallery). Add screen specs leaf-to-root
  as screens are rebuilt.
