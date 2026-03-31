---
name: figma-to-code-design-system
description: Quy trình chuẩn để chuyển đổi Figma design sang code theo phương pháp Components-First, đảm bảo nhất quán design system, responsive, và dễ maintain.
---

# Figma-to-Code Design System — Components-First Methodology

> Skill này là **quy trình bắt buộc** khi bất kỳ agent nào thực hiện chuyển đổi UI từ Figma sang code.
> Mọi component, page, và layout PHẢI tuân theo quy trình này để đảm bảo tính nhất quán, responsive, và khả năng maintain.

---

## ⭐ MANDATORY FIRST STEP — Đọc Figma Reference

Trước khi implement BẤT KỲ UI nào, agent **PHẢI** đọc file:

```
_agents/skills/figma-to-code-design-system/FIGMA_REFERENCE.md
```

File này chứa **tất cả design tokens chính xác** được extract trực tiếp từ Figma API:
- Color palette (20 colors với hex codes chính xác)
- Typography scale (font: Noto Sans, 9 text styles)
- Effects (box-shadow values)
- Component node IDs (để extract chi tiết khi cần)
- Page node IDs (để extract layout khi cần)
- Icon inventory (43 icons với node IDs)

### Figma API Scripts (trong `scripts/`)

| Script | Mục đích | Khi nào dùng |
|---|---|---|
| `figma-extract-full.mjs` | Extract toàn bộ file (styles, pages, node trees) | Cần sync lại từ Figma |
| `figma-extract.mjs node <id>` | Extract chi tiết 1 node cụ thể | Cần specs chính xác cho 1 element |
| `figma-find-node.mjs <id>` | Tìm node trong data đã download (offline, no API) | Tra cứu nhanh, tránh rate limit |
| `figma-export-icons.mjs` | Export icons/logos thành SVG riêng lẻ | Cần icon/logo files |
| `figma-export-images.mjs` | Export frames/pages thành PNG | Cần reference screenshots |

### Dữ liệu đã extract (trong `scripts/figma-data/`)

| File | Nội dung |
|---|---|
| `styles.json` | 30 shared styles (colors, typography, effects) — **source of truth** |
| `pages.json` | Danh sách 9 pages với frame IDs |
| `page_des_system.json` | Full node tree của Design System page |
| `page_home_page.json` | Full node tree của Home Page |
| `components.json` | Danh sách components và component sets |

### Workflow khi implement UI

```
1. Đọc FIGMA_REFERENCE.md → lấy colors, typography, effects
2. Xác định node ID của page/component cần implement
3. Chạy: node scripts/figma-find-node.mjs <node-id>
   → Nhận chính xác: fills, strokes, effects, typography, layout, spacing
4. Map values sang design tokens (--ds-*)
5. Implement component theo specs chính xác
```

> ⚠️ **KHÔNG BAO GIỜ đoán giá trị** từ screenshot. Luôn dùng API data.

---

## Mục lục

0. [Figma API Extraction (Phase 0)](#-mandatory-first-step--đọc-figma-reference)
1. [Tổng quan quy trình](#1-tổng-quan-quy-trình)
2. [Phase 1 — Design Token Extraction](#2-phase-1--design-token-extraction)
3. [Phase 2 — Atomic Component Architecture](#3-phase-2--atomic-component-architecture)
4. [Phase 3 — Component Implementation](#4-phase-3--component-implementation)
5. [Phase 4 — Page Assembly](#5-phase-4--page-assembly)
6. [Phase 5 — Responsive Adaptation](#6-phase-5--responsive-adaptation)
7. [Phase 6 — Quality Gate](#7-phase-6--quality-gate)
8. [Design Token Registry](#8-design-token-registry)
9. [Component Catalog](#9-component-catalog)
10. [Anti-patterns](#10-anti-patterns)
11. [File Conventions](#11-file-conventions)
12. [Checklist cho mỗi Component](#12-checklist-cho-mỗi-component)

---

## 1. Tổng quan quy trình

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIGMA-TO-CODE PIPELINE                        │
│                                                                  │
│  Figma Design                                                    │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────┐                                            │
│  │ Phase 1: Extract │ → Design Tokens (colors, typography,       │
│  │   Design Tokens  │   spacing, shadows, radii)                 │
│  └────────┬─────────┘                                            │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Phase 2: Map     │ → Atomic Hierarchy (atoms → molecules      │
│  │   Component Tree │   → organisms → templates)                 │
│  └────────┬─────────┘                                            │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Phase 3: Build   │ → Implement bottom-up (atoms first)        │
│  │   Components     │   Each component = .tsx + .css              │
│  └────────┬─────────┘                                            │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Phase 4: Assemble│ → Compose components into pages            │
│  │   Pages          │   Wire data + routing                      │
│  └────────┬─────────┘                                            │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Phase 5: Adapt   │ → Responsive breakpoints                   │
│  │   Responsive     │   Mobile → Tablet → Desktop                │
│  └────────┬─────────┘                                            │
│           ▼                                                      │
│  ┌──────────────────┐                                            │
│  │ Phase 6: QA Gate │ → Visual diff, accessibility, perf         │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Nguyên tắc vàng

1. **KHÔNG BAO GIỜ** hardcode giá trị (color, spacing, font-size) trực tiếp trong component. Luôn dùng design token.
2. **KHÔNG BAO GIỜ** tạo component mới nếu đã có component tương tự trong catalog. Extend hoặc compose.
3. **LUÔN** build bottom-up: Atoms → Molecules → Organisms → Pages.
4. **MỌI** component phải có responsive behavior được define rõ ràng.
5. **MỌI** component phải có typed props với JSDoc.

---

## 2. Phase 1 — Design Token Extraction

### 2.1 Đọc Figma Design (via API — KHÔNG đoán từ screenshot)

Khi nhận được UI task, agent PHẢI:

1. **Đọc `FIGMA_REFERENCE.md`** — lấy colors, typography, effects đã extract
2. **Chạy `figma-find-node.mjs <id>`** — lấy specs chi tiết cho node cụ thể
3. **Xác định Spacing Scale**: Từ API data → padding, margin, gap values
4. **Xác định Border Radii**: Từ API data → cornerRadius values
5. **Xác định Shadows**: Từ API data → effects array
6. **Xác định Breakpoints**: Responsive breakpoints (nếu có multiple viewport designs)

> ⚠️ **KHÔNG BAO GIỜ** dùng screenshot để đoán pixel values. Luôn dùng API data.

### 2.2 Token File Structure

Tất cả design tokens được quản lý tập trung tại:

```
src/
├── appx/styles/
│   ├── design-tokens.css       ← ⭐ SINGLE SOURCE OF TRUTH
│   ├── globals.css             ← Import design-tokens.css
│   └── admin-globals.css       ← Admin-specific tokens (existing)
```

### 2.3 Design Token Format

```css
/* ═══ src/appx/styles/design-tokens.css ═══ */

/* ── 1. Color Primitives ── */
:root {
  /* Brand colors — Extracted directly from Figma */
  --color-primary-50:  oklch(...);
  --color-primary-100: oklch(...);
  --color-primary-200: oklch(...);
  --color-primary-300: oklch(...);
  --color-primary-400: oklch(...);
  --color-primary-500: oklch(...);   /* ← Main brand color */
  --color-primary-600: oklch(...);
  --color-primary-700: oklch(...);
  --color-primary-800: oklch(...);
  --color-primary-900: oklch(...);
  --color-primary-950: oklch(...);

  /* Neutral / Gray scale */
  --color-neutral-50:  #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  --color-neutral-950: #0a0a0a;

  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error:   #ef4444;
  --color-info:    #3b82f6;

  /* ── 2. Typography ── */
  /* ⚠️ Figma chỉ dùng Noto Sans — KHÔNG có Nunito */
  --font-primary:   'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-secondary: 'Noto Sans', sans-serif;
  --font-serif:     'Noto Serif', serif;

  /* Font sizes — Mobile-first scale */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */

  /* Font weights */
  --font-light:    300;
  --font-regular:  400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
  --font-extrabold: 800;

  /* Line heights */
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose:  2;

  /* ── 3. Spacing ── */
  --space-0:   0;
  --space-1:   0.25rem;    /* 4px */
  --space-2:   0.5rem;     /* 8px */
  --space-3:   0.75rem;    /* 12px */
  --space-4:   1rem;       /* 16px */
  --space-5:   1.25rem;    /* 20px */
  --space-6:   1.5rem;     /* 24px */
  --space-8:   2rem;       /* 32px */
  --space-10:  2.5rem;     /* 40px */
  --space-12:  3rem;       /* 48px */
  --space-16:  4rem;       /* 64px */
  --space-20:  5rem;       /* 80px */
  --space-24:  6rem;       /* 96px */

  /* ── 4. Border Radius ── */
  --radius-none: 0;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-3xl:  24px;
  --radius-full: 9999px;

  /* ── 5. Shadows ── */
  --shadow-xs:  0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md:  0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

  /* ── 6. Motion / Transitions ── */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-fast:    150ms;
  --duration-base:    250ms;
  --duration-slow:    400ms;
  --duration-slower:  600ms;

  /* ── 7. Z-Index Scale ── */
  --z-dropdown:  1000;
  --z-sticky:    1100;
  --z-fixed:     1200;
  --z-overlay:   1300;
  --z-modal:     1400;
  --z-popover:   1500;
  --z-tooltip:   1600;

  /* ── 8. Layout ── */
  --container-sm:  640px;
  --container-md:  768px;
  --container-lg:  1024px;
  --container-xl:  1200px;
  --container-2xl: 1400px;

  --header-height: 64px;
  --footer-height: 60px;
  --sidebar-width: 260px;
}
```

### 2.4 Token Naming Convention

```
--ds-{category}-{property}-{variant}

Ví dụ:
--color-primary-500
--text-xl
--space-4
--radius-lg
--shadow-md
```

**Prefix `--ds-`** (Design System) giúp phân biệt với:
- `--color-*` (Tailwind v4 theme tokens hiện tại)
- `--admin-*` (Admin-specific tokens hiện tại)

### 2.5 Semantic Token Layer

Ngoài primitive tokens, tạo semantic tokens cho từng context:

```css
:root {
  /* Surface / Background */
  --bg-primary:     var(--color-neutral-50);
  --bg-secondary:   #ffffff;
  --bg-tertiary:    var(--color-neutral-100);
  --bg-inverse:     var(--color-neutral-900);
  --bg-brand:       var(--color-primary-500);

  /* Text */
  --text-primary:   var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --text-muted:     var(--color-neutral-400);
  --text-inverse:   #ffffff;
  --text-brand:     var(--color-primary-500);

  /* Border */
  --border-default: var(--color-neutral-200);
  --border-hover:   var(--color-neutral-300);
  --border-focus:   var(--color-primary-500);

  /* Interactive */
  --interactive-default:  var(--color-primary-500);
  --interactive-hover:    var(--color-primary-600);
  --interactive-active:   var(--color-primary-700);
  --interactive-disabled: var(--color-neutral-300);
}
```

---

## 3. Phase 2 — Atomic Component Architecture

### 3.1 Component Hierarchy (Atomic Design)

```
Atoms (smallest, independent)
├── Button
├── Input
├── Badge
├── Avatar
├── Icon
├── Tag
├── Logo
├── Skeleton
└── Spinner

Molecules (composed of atoms)
├── SearchBar (Input + Button + Icon)
├── NavLink (Icon + Text + Badge)
├── StatDisplay (Icon + Value + Label)
├── FormField (Label + Input + HelperText)
├── UserChip (Avatar + Name + Badge)
└── ScoreIndicator (Value + Label + Ring)

Organisms (complex, self-contained sections)
├── Header (Logo + NavLinks + SearchBar + UserChip)
├── Sidebar (Logo + NavLinks + UserInfo)
├── HeroBanner (Heading + Description + CTA buttons)
├── TestCard (Image + Title + Meta + Tags + CTA)
├── StatsGrid (StatDisplay × N)
├── Footer (Logo + Links + Social)
└── PricingCard (Title + Price + Features + CTA)

Templates (page-level layout)
├── MainLayout (Header + Sidebar? + Content + Footer)
├── AuthLayout (centered card)
├── DashboardLayout (header + sidebar + content)
└── ExamLayout (split panel)
```

### 3.2 Component Mapping from Figma

Khi phân tích Figma, agent PHẢI tạo component map:

```markdown
## Component Map — [Page Name]

### Atoms needed
- [ ] `Button` — CTA buttons (primary, secondary, ghost, link variants)
- [ ] `Input` — Text input fields
- [ ] `Badge` — Status badges (NEW, PRO, POPULAR)
- [ ] `Avatar` — User avatars (sizes: sm, md, lg)

### Molecules needed
- [ ] `SearchBar` — Search with filter dropdown
- [ ] `NavLink` — Navigation items with icon + label + badge count

### Organisms needed
- [ ] `Header` — Top navigation bar
- [ ] `HeroBanner` — Landing page hero section

### Existing components to reuse
- `Container` from `@/shared/ui/container`
- `LinkButton` from `@/shared/ui/link-button`
```

### 3.3 FSD Placement Rules

```
src/
├── shared/ui/ds/              ← ⭐ Design System components live here
│   ├── atoms/
│   │   ├── button/
│   │   │   ├── button.tsx
│   │   │   ├── button.css
│   │   │   └── index.ts
│   │   ├── input/
│   │   ├── badge/
│   │   └── index.ts          ← Re-exports all atoms
│   ├── molecules/
│   │   ├── search-bar/
│   │   ├── nav-link/
│   │   └── index.ts
│   ├── organisms/
│   │   ├── header/
│   │   ├── hero-banner/
│   │   └── index.ts
│   └── index.ts              ← Master re-export
│
├── widgets/                   ← Page-specific compositions
│   ├── layouts/
│   │   ├── main-layout/      ← Uses DS organisms
│   │   └── exam-layout/
│   └── ...
│
├── pages/                     ← Pages compose widgets + DS components
│   ├── home/
│   │   ├── ui/
│   │   │   ├── home-page.tsx  ← Composes HeroBanner, TestCard grid, etc.
│   │   │   └── home-page.css
│   │   └── index.ts
│   └── ...
```

---

## 4. Phase 3 — Component Implementation

### 4.1 Component File Template

Mỗi DS component PHẢI tuân theo template này:

```tsx
// ═══ src/shared/ui/ds/atoms/button/button.tsx ═══

import './button.css';

/**
 * Design System Button
 *
 * @figma https://figma.com/file/xxx — Button component
 * @variants primary | secondary | ghost | link | danger
 * @sizes sm | md | lg
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  /** Button variant matching Figma design */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state — shows spinner and disables interaction */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Children content */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = '',
}: ButtonProps) => {
  const classNames = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full',
    loading && 'button--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className="button__spinner" />}
      {!loading && leftIcon && <span className="button__icon button__icon--left">{leftIcon}</span>}
      <span className="button__label">{children}</span>
      {!loading && rightIcon && <span className="button__icon button__icon--right">{rightIcon}</span>}
    </button>
  );
};
```

### 4.2 Component CSS Template

```css
/* ═══ src/shared/ui/ds/atoms/button/button.css ═══ */

/* ── Base ── */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-default),
    color var(--duration-fast) var(--ease-default),
    box-shadow var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
  white-space: nowrap;
  user-select: none;
  line-height: var(--leading-tight);
  position: relative;
  overflow: hidden;
}

.button:active:not(:disabled) {
  transform: scale(0.98);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Sizes ── */
.button--sm {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.button--md {
  height: 40px;
  padding: 0 var(--space-4);
  font-size: var(--text-sm);
}

.button--lg {
  height: 48px;
  padding: 0 var(--space-6);
  font-size: var(--text-base);
}

/* ── Variants ── */
.button--primary {
  background: var(--interactive-default);
  color: var(--text-inverse);
  box-shadow: var(--shadow-xs);
}

.button--primary:hover:not(:disabled) {
  background: var(--interactive-hover);
  box-shadow: var(--shadow-sm);
}

.button--secondary {
  background: transparent;
  color: var(--interactive-default);
  border: 1px solid var(--border-default);
}

.button--secondary:hover:not(:disabled) {
  background: var(--color-primary-50);
  border-color: var(--interactive-default);
}

.button--ghost {
  background: transparent;
  color: var(--text-secondary);
}

.button--ghost:hover:not(:disabled) {
  background: var(--color-neutral-100);
  color: var(--text-primary);
}

.button--link {
  background: transparent;
  color: var(--interactive-default);
  padding: 0;
  height: auto;
}

.button--link:hover:not(:disabled) {
  color: var(--interactive-hover);
  text-decoration: underline;
}

.button--danger {
  background: var(--color-error);
  color: var(--text-inverse);
}

.button--danger:hover:not(:disabled) {
  background: #dc2626;
}

/* ── Modifiers ── */
.button--full {
  width: 100%;
}

/* ── Loading Spinner ── */
.button--loading {
  pointer-events: none;
}

.button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Icon ── */
.button__icon {
  display: flex;
  align-items: center;
  font-size: 1.1em;
}
```

### 4.3 Component Index Export

```typescript
// ═══ src/shared/ui/ds/atoms/button/index.ts ═══
export { Button } from './button';
export type { ButtonProps } from './button';
```

```typescript
// ═══ src/shared/ui/ds/atoms/index.ts ═══
export * from './button';
export * from './input';
export * from './badge';
// ... all atoms
```

```typescript
// ═══ src/shared/ui/ds/index.ts ═══
export * from './atoms';
export * from './molecules';
export * from './organisms';
```

### 4.4 Naming Rules

| Element | Convention | Example |
|---------|-----------|---------|
| Component Name | `DS` prefix + PascalCase | `Button`, `SearchBar`, `Header` |
| File Name | kebab-case with `ds-` prefix | `button.tsx`, `search-bar.tsx` |
| CSS Class | BEM with `ds-` prefix | `.button`, `.button--primary`, `.button__icon` |
| CSS Variable | `--ds-` prefix | `--color-primary-500` |
| Type Name | `DS` prefix + PascalCase + `Props` | `ButtonProps` |
| Folder Name | kebab-case with `ds-` prefix | `button/`, `search-bar/` |

### 4.5 CSS Architecture Rules

```
⚠️ QUAN TRỌNG: Khi nào dùng Vanilla CSS vs Tailwind

1. DESIGN SYSTEM components (src/shared/ui/ds/**)
   → ✅ LUÔN dùng Vanilla CSS (.css files)
   → ✅ LUÔN dùng design tokens (--ds-*)
   → ❌ KHÔNG dùng Tailwind inline classes cho DS components
   → Lý do: DS components phải self-contained, không phụ thuộc Tailwind config

2. PAGE-LEVEL compositions (src/pages/**/ui/*)
   → ✅ CÓ THỂ dùng Tailwind cho layout (flex, grid, spacing)
   → ✅ LUÔN dùng DS components cho UI elements
   → ❌ KHÔNG tạo custom styles cho things DS covers

3. WIDGET compositions (src/widgets/**)
   → ✅ Mix Tailwind + CSS modules nếu cần
   → ✅ LUÔN dùng DS components cho UI elements
```

### 4.6 BEM Naming Convention for CSS

```css
/* Block */
.card { }

/* Element (part of the block) */
.card__header { }
.card__body { }
.card__footer { }
.card__title { }

/* Modifier (variation of block or element) */
.card--elevated { }
.card--bordered { }
.card__header--compact { }

/* State (interactive states) */
.card.is-loading { }
.card.is-selected { }
.card.is-disabled { }
```

---

## 5. Phase 4 — Page Assembly

### 5.1 Page Composition Pattern

```tsx
// ═══ src/pages/home/ui/home-page.tsx ═══

import { Button } from '@/shared/ui/ds/atoms';
import { SearchBar } from '@/shared/ui/ds/molecules';
import { Header, HeroBanner, Footer } from '@/shared/ui/ds/organisms';
import { Container } from '@/shared/ui/container';
import { TestCard } from './test-card'; // Page-specific component
import './home-page.css';

type HomePageProps = {
  heroBanner: HeroBannerData;
  featuredTests: TestData[];
  masterData: MasterData;
};

export const HomePage = ({ heroBanner, featuredTests, masterData }: HomePageProps) => {
  return (
    <div className="home-page">
      <Header config={masterData.header} />

      <main className="home-page__main">
        <HeroBanner data={heroBanner} />

        <section className="home-page__featured">
          <Container>
            <h2 className="home-page__section-title">Featured Tests</h2>
            <div className="home-page__test-grid">
              {featuredTests.map(test => (
                <TestCard key={test.id} data={test} />
              ))}
            </div>
          </Container>
        </section>
      </main>

      <Footer config={masterData.footer} />
    </div>
  );
};
```

### 5.2 Page-Specific Components

Components dùng **chỉ** cho 1 page → đặt trong `src/pages/{page-name}/ui/`:

```
src/pages/home/
├── ui/
│   ├── home-page.tsx       ← Main page component
│   ├── home-page.css       ← Page-specific styles
│   ├── test-card.tsx        ← Used only on home page
│   └── testimonial-section.tsx
├── api/
│   └── index.ts             ← Data types + fetching
└── index.ts                 ← Public export
```

### 5.3 Shared vs Page-Specific Decision Rule

```
Is this component used on MORE THAN ONE page?
  ├── YES → Place in src/shared/ui/ds/ (atoms/molecules/organisms)
  └── NO  → Place in src/pages/{page-name}/ui/
              BUT still use DS tokens and DS atoms/molecules
```

---

## 6. Phase 5 — Responsive Adaptation

### 6.1 Breakpoint System

Sử dụng breakpoints đã define trong `globals.css`:

```css
/* Breakpoints (from Tailwind v4 @theme) */
--breakpoint-xs:  350px;
--breakpoint-sm:  550px;
--breakpoint-md:  850px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1200px;
--breakpoint-xxl: 1536px;
```

### 6.2 Mobile-First CSS Pattern

```css
/* ═══ Mobile-first approach ═══ */

/* Base = Mobile (< 550px) */
.hero {
  padding: var(--space-6) var(--space-4);
  text-align: center;
}

.hero__title {
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

/* Tablet (≥ 550px) */
@media (min-width: 550px) {
  .hero {
    padding: var(--space-8) var(--space-6);
  }

  .hero__title {
    font-size: var(--text-3xl);
  }

  .hero__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .hero {
    padding: var(--space-16) var(--space-8);
    text-align: left;
  }

  .hero__title {
    font-size: var(--text-5xl);
  }

  .hero__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 6.3 Responsive Utility Classes (Optional)

Nếu cần responsive nhanh trong page composition, CÓ THỂ dùng Tailwind:

```tsx
// ✅ OK: Tailwind cho layout composition ở page level
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {items.map(item => (
    <TestCard key={item.id} data={item} /> // DS component, no Tailwind inside
  ))}
</div>

// ❌ SAI: Tailwind inside DS component
// Bên trong <TestCard>, KHÔNG dùng Tailwind classes
```

### 6.4 Responsive Component Props

```tsx
// Cho components cần responsive behavior via props:
type ContainerProps = {
  /** Max width of container */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
};

// CSS handles the responsive mapping
.container--lg {
  max-width: var(--container-lg);
}

@media (min-width: 1200px) {
  .container--lg {
    max-width: var(--container-xl);
  }
}
```

---

## 7. Phase 6 — Quality Gate

### 7.1 Visual Consistency Checklist

Mỗi component/page PHẢI pass:

- [ ] **Token compliance**: Mọi color/spacing/font-size đều dùng `--ds-*` tokens
- [ ] **Figma accuracy**: Visual output match Figma design ≥ 95%
- [ ] **Responsive**: Tested ở mobile (350px), tablet (768px), desktop (1200px)
- [ ] **Interactive states**: hover, focus, active, disabled đều được define
- [ ] **Dark mode ready**: Component sẽ hoạt động nếu thêm dark theme tokens sau

### 7.2 Code Quality Checklist

- [ ] **TypeScript types**: Props typed đầy đủ, không `any`
- [ ] **JSDoc**: Component có JSDoc mô tả + `@figma` reference
- [ ] **Export**: Component được export qua index.ts chain
- [ ] **CSS BEM**: Class names tuân theo BEM với prefix `ds-`
- [ ] **No hardcoded values**: Không có magic numbers trong CSS
- [ ] **Accessibility**: Semantic HTML, ARIA labels nếu cần

### 7.3 Browser Testing

```bash
# Verify rendering at key breakpoints
# Agent nên dùng browser tool để kiểm tra tại các breakpoints:
# - 375px (iPhone SE)
# - 768px (iPad)
# - 1200px (Desktop)
# - 1536px (Large Desktop)
```

---

## 8. Design Token Registry

### 8.1 Token Tracking Document

Agent PHẢI maintain một registry file:

```
src/shared/ui/ds/REGISTRY.md
```

Format:

```markdown
# Design System — Component Registry

## Last Updated: YYYY-MM-DD

## Design Tokens
| Token | Value | Figma Reference |
|-------|-------|-----------------|
| --color-primary-500 | oklch(60.987% 0.17833 19.421) | Brand Red |
| --text-base | 1rem (16px) | Body text |
| ... | ... | ... |

## Components

### Atoms
| Component | Status | Figma | File |
|-----------|--------|-------|------|
| Button | ✅ Done | Frame "Button" | src/shared/ui/ds/atoms/button/ |
| Input | 🔄 WIP | Frame "Input Field" | src/shared/ui/ds/atoms/input/ |
| Badge | ⬜ TODO | Frame "Badge" | — |

### Molecules
| Component | Status | Figma | File |
|-----------|--------|-------|------|
| SearchBar | ⬜ TODO | Frame "Search" | — |

### Organisms
| Component | Status | Figma | File |
|-----------|--------|-------|------|
| Header | ⬜ TODO | Frame "Header" | — |
```

---

## 9. Component Catalog

### 9.1 Core Atoms Specification

Các atoms CẦN THƯỜNG XUYÊN nhất:

| Atom | Variants | Sizes | States |
|------|----------|-------|--------|
| `Button` | primary, secondary, ghost, link, danger | sm, md, lg | default, hover, active, disabled, loading |
| `Input` | default, search, password, textarea | sm, md, lg | default, focus, error, disabled |
| `Badge` | default, success, warning, error, info, brand | sm, md | — |
| `Avatar` | image, initials, icon | xs, sm, md, lg, xl | — |
| `Icon` | wraps Material Symbols / Lucide | sm, md, lg | — |
| `Tag` | default, primary, outlined | sm, md | removable |
| `Skeleton` | text, circular, rectangular | custom | animated |
| `Spinner` | — | sm, md, lg | — |
| `Divider` | horizontal, vertical | — | — |

### 9.2 Core Molecules Specification

| Molecule | Composed of | Purpose |
|----------|-------------|---------|
| `FormField` | Input + Label + HelperText | Form input with label and validation |
| `NavLink` | Icon + Text + Badge | Navigation item |
| `StatDisplay` | Icon + Value + Label + Trend | Dashboard metric |
| `UserChip` | Avatar + Name + Role | User identity display |
| `EmptyState` | Illustration + Title + Description + CTA | Empty content placeholder |
| `Breadcrumb` | Links + Separators | Navigation breadcrumb |

### 9.3 Core Organisms Specification

| Organism | Composed of | Purpose |
|----------|-------------|---------|
| `Header` | Logo + NavLink[] + SearchBar + UserChip | Top navigation |
| `Sidebar` | Logo + NavLink[] + UserChip | Side navigation |
| `Footer` | Logo + Link groups + Social links | Page footer |
| `HeroBanner` | Title + Description + CTA + Image/Illustration | Landing hero |
| `Card` | Header + Body + Footer (flexible slots) | Content card |
| `Modal` | Overlay + Header + Body + Footer + Close | Dialog/modal |
| `Table` | Header + Rows + Pagination | Data table |

---

## 10. Anti-patterns

### ❌ TUYỆT ĐỐI KHÔNG LÀM

```css
/* ❌ Hardcoded values */
.my-button {
  background: #d94a56;         /* → Dùng var(--interactive-default) */
  padding: 12px 24px;          /* → Dùng var(--space-3) var(--space-6) */
  font-size: 14px;             /* → Dùng var(--text-sm) */
  border-radius: 8px;          /* → Dùng var(--radius-md) */
  box-shadow: 0 2px 4px ...;   /* → Dùng var(--shadow-sm) */
}

/* ❌ Non-BEM class names */
.button-primary { }     /* → .button--primary */
.cardHeader { }          /* → .card__header */
.big-title { }           /* → .hero__title */

/* ❌ !important overrides */
.button { color: red !important; }

/* ❌ Deep nesting (> 3 levels) */
.card .card__header .card__title span { }
```

```tsx
// ❌ Inline styles in DS components
<button style={{ backgroundColor: '#d94a56', padding: '12px' }}>

// ❌ Mixing Tailwind in DS components
<button className="bg-red-500 px-4 py-2 rounded-lg">

// ❌ Creating duplicate components
// Already have Button → Don't create PrimaryButton, RedButton, etc.

// ❌ Props that bypass design system
<Button color="#ff0000" fontSize={18}> // Don't allow arbitrary values

// ❌ Not using DS prefix
export const Button = () => { };      // → export const Button = () => { };
export const SearchBar = () => { };   // → export const SearchBar = () => { };
```

---

## 11. File Conventions

### 11.1 Integration with Existing Project

```
⚠️ BACKWARD COMPATIBILITY:

1. KHÔNG xóa hoặc sửa existing components ngay lập tức
2. Tạo DS components MỚI song song
3. Migrate page-by-page: thay thế old component bằng DS component
4. Khi TẤT CẢ pages đã migrate → xóa old component

Migration flow:
  Old Component → [DEPRECATED] → DS Component replaces → Remove Old
```

### 11.2 Import Order

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. Third-party libraries
import { twMerge } from 'tailwind-merge';

// 3. Design System components (⭐ NEW)
import { Button, Badge } from '@/shared/ui/ds/atoms';
import { SearchBar } from '@/shared/ui/ds/molecules';
import { Header } from '@/shared/ui/ds/organisms';

// 4. Shared utilities
import { useAuth } from '@/appx/providers';
import { ROUTES } from '@/shared/routes';

// 5. Page/feature-specific
import { TestCard } from './test-card';
import type { HomePageProps } from '../api';

// 6. Styles (always last)
import './home-page.css';
```

### 11.3 Complete Directory Structure

```
src/shared/ui/ds/
├── design-tokens.css          ← Centralized tokens
├── index.ts                   ← Master export
├── REGISTRY.md                ← Component tracking
│
├── atoms/
│   ├── button/
│   │   ├── button.tsx
│   │   ├── button.css
│   │   └── index.ts
│   ├── input/
│   │   ├── input.tsx
│   │   ├── input.css
│   │   └── index.ts
│   ├── badge/
│   ├── avatar/
│   ├── icon/
│   ├── tag/
│   ├── skeleton/
│   ├── spinner/
│   ├── divider/
│   └── index.ts               ← export * from all atoms
│
├── molecules/
│   ├── form-field/
│   ├── nav-link/
│   ├── stat-display/
│   ├── user-chip/
│   ├── empty-state/
│   ├── breadcrumb/
│   └── index.ts
│
└── organisms/
    ├── header/
    ├── sidebar/
    ├── footer/
    ├── hero-banner/
    ├── card/
    ├── modal/
    ├── table/
    └── index.ts
```

---

## 12. Checklist cho mỗi Component

Trước khi agent đánh dấu component là **Done**, PHẢI pass TẤT CẢ:

```markdown
### Component: [ComponentName]

#### Design
- [ ] Matches Figma design accurately
- [ ] All variants implemented (e.g., primary/secondary/ghost)
- [ ] All sizes implemented (e.g., sm/md/lg)
- [ ] Interactive states: hover, focus, active, disabled
- [ ] Loading state (if applicable)

#### Code Quality
- [ ] TypeScript props fully typed (no `any`)
- [ ] JSDoc with @figma reference
- [ ] BEM CSS class naming with `ds-` prefix
- [ ] All values use design tokens (--ds-*)
- [ ] No hardcoded colors, sizes, or spacing
- [ ] No Tailwind classes inside component
- [ ] Proper index.ts export

#### Responsive
- [ ] Works at 350px (mobile)
- [ ] Works at 768px (tablet)
- [ ] Works at 1200px (desktop)

#### Accessibility
- [ ] Semantic HTML element used
- [ ] ARIA attributes where needed
- [ ] Keyboard navigable (buttons, links, inputs)
- [ ] Sufficient color contrast

#### Integration
- [ ] Registered in REGISTRY.md
- [ ] Exported via atoms/molecules/organisms index.ts
- [ ] Exported via ds/index.ts
```

---

## Quick Reference Card

```
┌────────────────────────────────────────────┐
│          DESIGN SYSTEM QUICK REF           │
├────────────────────────────────────────────┤
│                                            │
│  Token prefix:    --ds-*                   │
│  Component prefix: DS*                     │
│  CSS prefix:      .ds-*                    │
│  File prefix:     ds-*                     │
│                                            │
│  Token file:   src/appx/styles/            │
│                design-tokens.css           │
│  Components:   src/shared/ui/ds/           │
│  Registry:     src/shared/ui/ds/           │
│                REGISTRY.md                 │
│                                            │
│  CSS method:   Vanilla CSS + BEM           │
│  Responsive:   Mobile-first media queries  │
│  Values:       ALWAYS design tokens        │
│                                            │
│  Build order:  Tokens → Atoms →            │
│                Molecules → Organisms →     │
│                Pages                       │
│                                            │
│  Tailwind:     ONLY at page-level          │
│                composition, NEVER inside   │
│                DS components               │
│                                            │
│  Migration:    Incremental, page-by-page   │
│                Old → [DEPRECATED] → DS     │
│                                            │
└────────────────────────────────────────────┘
```
