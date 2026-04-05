# Agent Instructions — IELTS Prediction

> **⚠️ ĐỌC FILE NÀY TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ.**
> File này tổng hợp các quy tắc quan trọng nhất. Vi phạm bất kỳ quy tắc nào dưới đây = code bị reject.

---

## 📋 Tài liệu BẮT BUỘC phải đọc

Tuỳ theo loại task, bạn **PHẢI** đọc các file tương ứng **TRƯỚC KHI** viết code:

### Mọi task
- `CODE_CONVENTIONS.md` — Quy ước code tổng thể (TypeScript, naming, FSD architecture, Supabase, services)

### Frontend / UI tasks
- `UI_MIGRATION_RULES.md` — Quy tắc CSS, responsive, imports, accessibility
- `src/shared/ui/ds/REGISTRY.md` — DS component registry (CHECK trước khi tạo component mới)
- `implementation_plan.md` — Figma design specs, wave plan, visual style
- `_agents/skills/figma-to-code-design-system/GEOMETRIC_RESPONSIVE.md` — ⭐ Responsive computation tables

### Trước khi implement UI từ Figma
- Chạy workflow: `/figma-extract` (xem `_agents/workflows/figma-extract.md`)
- Hoặc đọc: `_agents/skills/figma-to-code-design-system/SKILL.md`

### Backend / Data tasks
- `NEW_CODEBASE_ANALYSIS.md` — Kiến trúc Supabase, services, types
- `LEGACY_CODEBASE_DOCS.md` — Logic hệ thống cũ (WordPress) khi port PHP → TS

---

## 🚫 Quy tắc tuyệt đối — KHÔNG ĐƯỢC vi phạm

### 1. Protected Pages — KHÔNG CHẠM VÀO
```
pages/take-the-test/**     → Trang thi — KHÔNG thay đổi
pages/preview.tsx          → Gallery tool — giữ nguyên
pages/admin/**             → Admin dashboard — giữ nguyên Ant Design
```

### 2. Styling — Tailwind-Only (cho user-facing pages)
```
❌ KHÔNG tạo file .css mới cho components
❌ KHÔNG dùng <style jsx>
❌ KHÔNG dùng BEM classes (.hero-banner, .hero-banner__title)
❌ KHÔNG dùng inline styles (trừ dynamic runtime values)
❌ KHÔNG hardcode colors (text-[#d94a56]) — dùng tokens
✅ Tailwind utility classes trực tiếp trong className
✅ DS design tokens: text-[var(--color-primary-600)], bg-primary-500
✅ DS components: <Button variant="primary">, <TestCard>, <Badge>
```

### 3. Banned Imports (user-facing pages)
```tsx
// ❌ CẤM tuyệt đối — Ant Design trong user-facing pages
import { Button, Card, Modal, Table, Collapse } from "antd";

// ✅ Dùng DS components thay thế
import { Button, Badge, TestCard } from "@/shared/ui/ds";
```

### 4. Không thay đổi Business Logic
```
❌ KHÔNG sửa getServerSideProps (trừ khi task yêu cầu)
❌ KHÔNG sửa services/ (trừ khi task yêu cầu)
❌ KHÔNG sửa types.ts (trừ khi thêm UI-only types)
```

---

## ✅ Checklist trước mỗi PR

```
□ Đã đọc tài liệu liên quan (xem mục "Tài liệu BẮT BUỘC")
□ Không có import "antd" trong user-facing pages
□ KHÔNG có file .css mới
□ KHÔNG có <style jsx>
□ Mọi color dùng Tailwind + CSS variable tokens
□ Mọi font = Noto Sans
□ Mobile-first responsive (default = mobile, sm:, lg:, xl: cho lớn hơn)
□ Responsive classes computed từ Figma geometry (xem GEOMETRIC_RESPONSIVE.md)
□ Mọi section có container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
□ Semantic HTML (section, nav, main, article, header, footer)
□ Alt text trên tất cả images
□ Dùng Next.js <Image> thay vì <img>
□ Pages trong Protected list KHÔNG bị ảnh hưởng
□ npm run build pass
```

---

## 🏗️ Component Architecture — Quick Reference

### File Structure
```
src/pages/{page-name}/
├── ui/
│   ├── index.tsx              # Page composition
│   ├── hero-section.tsx       # Section component (Tailwind-only)
│   ├── filter-bar.tsx
│   └── test-grid.tsx
├── api/                       # GIỮ NGUYÊN
└── index.ts                   # GIỮ NGUYÊN — getServerSideProps
```

### Component Template
```tsx
// 1. Imports (grouped: react → third-party → DS → local)
import { useState } from "react";
import Image from "next/image";
import { Button, Badge } from "@/shared/ui/ds";
import type { PageConfig } from "../types";

// 2. Types
type SectionProps = {
  config: PageConfig;
  className?: string;
};

// 3. Component
export const HeroSection = ({ config, className }: SectionProps) => {
  // 3a. Hooks → 3b. Derived values → 3c. Handlers → 3d. Effects → 3e. Guards
  
  return (
    <section className={`py-12 lg:py-20 ${className ?? ""}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Content — Tailwind classes only */}
      </div>
    </section>
  );
};
```

### DS Component Priority
1. **DS Design Tokens** (CSS vars via Tailwind) → `text-[var(--color-primary-600)]`
2. **DS Components** → `<Button variant="primary">`, `<TestCard>`
3. **Tailwind utilities** → `flex items-center gap-8`
4. **Inline styles** → ❌ CẤM (trừ dynamic runtime)

### Import Pattern
```tsx
// ✅ APPROVED
import { Button, Input, Badge } from "@/shared/ui/ds";
import { TestCard, BlogCard } from "@/shared/ui/ds";
import { DSHeader, DSFooter, CTABanner } from "@/shared/ui/ds";
import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import Image from "next/image";
import Link from "next/link";
```

---

## 🎨 Design Tokens — Quick Reference

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Primary | `#D94A56` | `bg-primary-500` `text-primary-500` | CTA, buttons |
| Primary Hover | `#EA8D95` | `bg-primary-300` | Hover states |
| Text Dark | `#2D3142` | `text-[#2D3142]` | Headings |
| Bg Warm | `#FAF7EB` | `bg-[#FAF7EB]` | Card image area |
| Orange | `#F2994A` | `bg-tertiary-500` | Part tags |
| Footer Navy | `#242938` | `bg-[#242938]` | Footer bg |
| Font | Noto Sans | `font-noto-sans` | ALL text |

### Breakpoints (Mobile-First)
```
Mobile:  < 640px   → default styles
Tablet:  ≥ 640px   → sm:
Desktop: ≥ 1024px  → lg:
Wide:    ≥ 1280px  → xl:
```

---

## 📎 Git Conventions

```
# Branch: ui/{scope}
ui/home-page
ui/exam-library

# Commit: ui({scope}): {description}
ui(ds): add HeroBanner organism component
ui(home): replace hero section with DS components
ui(cleanup): remove unused AntD CSS overrides
```

---

## 📚 Full Documentation Index

| File | Content | Read When |
|------|---------|-----------|
| [CODE_CONVENTIONS.md](CODE_CONVENTIONS.md) | TypeScript, naming, FSD, Supabase, services, security | Always |
| [UI_MIGRATION_RULES.md](UI_MIGRATION_RULES.md) | CSS strategy, responsive, imports, accessibility | Frontend tasks |
| [GEOMETRIC_RESPONSIVE.md](_agents/skills/figma-to-code-design-system/GEOMETRIC_RESPONSIVE.md) | Geometric responsive computation tables & workflow | Responsive layout decisions |
| [src/shared/ui/ds/REGISTRY.md](src/shared/ui/ds/REGISTRY.md) | DS components API, props, examples | Before creating UI |
| [implementation_plan.md](implementation_plan.md) | Figma design, wave plan, visual style | Planning / new pages |
| [NEW_CODEBASE_ANALYSIS.md](NEW_CODEBASE_ANALYSIS.md) | Architecture, services, debt | Backend / refactor |
| [LEGACY_CODEBASE_DOCS.md](LEGACY_CODEBASE_DOCS.md) | WordPress PHP logic | Porting PHP → TS |
| [Backend_migration_plan.md](Backend_migration_plan.md) | Overall migration strategy | Migration tasks |
