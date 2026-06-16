# Design System — Component Registry

> **Last updated:** 2026-04-02
> **Source:** Figma — Vit IELTS
> **Styling approach:** Tailwind v4 + Design Tokens (CSS custom properties)
>
> ⚠️ **FOR AI AGENTS:** This file is the single source of truth for using DS components.
> Before creating ANY new UI, check this registry first. If a component exists here, USE IT.

---

## Architecture Decision

This project uses **Tailwind v4 + Design Tokens** (hybrid approach):

- **All components** use Tailwind classes for styling
- **Design tokens** are defined in `globals.css` `@theme` block and `design-tokens.css` `:root`
- Components encapsulate **behavior + props API + Tailwind classes**
- Pages compose these components as building blocks

### Key Tailwind v4 Theme Tokens (from `globals.css`)

```
Brand Colors:
  --color-primary-500    → bg-primary-500   (≈ #D94A56)
  --color-secondary-500  → bg-secondary-500 (≈ #F2C94C)
  --color-tertiary-500   → bg-tertiary-500  (≈ #F2994A)
  --color-quaternary-500 → bg-quaternary-500(≈ #E0828B)

Fonts:
  --font-noto-sans  → font-noto-sans
  --font-nunito     → font-nunito
  --font-noto-serif → font-noto-serif

Breakpoints: xs:350 sm:550 md:850 lg:1024 xl:1200 xxl:1536
```

### Figma Color Quick Reference

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| Brand Primary | `#D94A56` | `bg-primary-500` `text-primary-500` | CTA, buttons, links |
| Brand Hover | `#EA8D95` | `bg-primary-300` | Hover states |
| Text Dark | `#2D3142` | `text-[#2D3142]` | Headings, body |
| Bg Warm | `#FAF7EB` | `bg-[#FAF7EB]` | Card image area |
| Orange | `#F2994A` | `bg-tertiary-500` | Part tags, warnings |
| Green | `#27AE60` | — | Success, writing skill |
| Blue | `#2F80ED` | — | Info, listening skill |
| Navy Dark | `#242938` | `bg-[#242938]` | Footer, inverse bg |

---

## Import Paths

```tsx
// Atoms
import { Button } from '@/shared/ui/ds/atoms/button';
import { Input } from '@/shared/ui/ds/atoms/input';
import { Badge } from '@/shared/ui/ds/atoms/badge';
import { Avatar } from '@/shared/ui/ds/atoms/avatar';
import { Tag } from '@/shared/ui/ds/atoms/tag';
import { PartTag } from '@/shared/ui/ds/atoms/part-tag';
import { Divider } from '@/shared/ui/ds/atoms/divider';
import { Spinner } from '@/shared/ui/ds/atoms/spinner';

// Molecules
import { FormField } from '@/shared/ui/ds/molecules/form-field';
import { NavLink } from '@/shared/ui/ds/molecules/nav-link';
import { Breadcrumb } from '@/shared/ui/ds/molecules/breadcrumb';
import { TestCard } from '@/shared/ui/ds/molecules/test-card/test-card';
import { BlogCard } from '@/shared/ui/ds/molecules/blog-card';
import { StatCard } from '@/shared/ui/ds/molecules/stat-card';
import { PricingCard } from '@/shared/ui/ds/molecules/pricing-card';

// Organisms
import { DSHeader } from '@/shared/ui/ds/organisms/header';
import { DSFooter } from '@/shared/ui/ds/organisms/footer';
import { CTABanner } from '@/shared/ui/ds/organisms/cta-banner';

// Shared UI (non-DS)
import { Container } from '@/shared/ui';
import { ProBadge } from '@/shared/ui/pro-badge';
import { ProLink } from '@/shared/ui/pro-link';

// Batch import
import { Button, Input, Badge } from '@/shared/ui/ds';
```

---

## Atoms

### Button

**Import:** `import { Button } from '@/shared/ui/ds/atoms/button'`
**CSS:** `button.css` (BEM: `.btn`, `.btn--{variant}`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outlined' \| 'ghost' \| 'accent' \| 'link' \| 'danger' \| 'icon-circle'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `loading` | `boolean` | `false` | Shows spinner |
| `fullWidth` | `boolean` | `false` | `width: 100%` |
| `leftIcon` | `ReactNode` | — | Icon before label |
| `rightIcon` | `ReactNode` | — | Icon after label |
| `icon` | `ReactNode` | — | Icon-only content (for `icon-circle`) |
| `disabled` | `boolean` | `false` | Disabled state |
| `href` | `string` | — | Renders as `<a>` |
| `onClick` | `(e) => void` | — | Click handler |
| `children` | `ReactNode` | — | Button label |
| `className` | `string` | `''` | Extra CSS classes |

**Variant Details:**

| Variant | Default BG | Hover BG | Text | Border |
|---------|-----------|----------|------|--------|
| `primary` | `#D94A56` | `#E3636E` + glow | White | — |
| `secondary` | `#FFFFFF` | `#E3636E` | `#D94A56` → White | `#D94A56` |
| `outlined` | `#FFFFFF` | `#D94A56` | `#191D24` → White | `#191D24` |
| `ghost` | Transparent | `rgba(0,0,0,0.1)` | `#191D24` | — |
| `link` | Transparent | — | `#D94A56` | — |
| `danger` | `#EF4444` | `#DC2626` | White | — |
| `icon-circle` | `#D94A56` | `#EA8D95` | White | — |
| `white` | `#FFFFFF` | `#E3636E` | `#D94A56` → White | `#FFFFFF` |

**⚠️ `icon-circle` special behavior:**
- Default: `position: absolute; top: 20px; right: 20px; width: 28px; height: 28px;`
- Add class `btn--static` or `!static` to use in flow layout
- Icon SVG/img inside will be sized to `14px`

```tsx
// Standard button
<Button variant="primary" onClick={handleClick}>Nâng cấp Premium</Button>

// With icon
<Button variant="outlined" leftIcon={<SearchIcon />}>Tìm kiếm</Button>

// Icon circle — absolute positioned overlay
<Button variant="icon-circle" icon={<img src="/assets/figma/icons/Arrow1.svg" />} />

// Icon circle — in flow layout (carousel arrows)
<Button
  variant="icon-circle"
  className="!static"
  icon={<img src="/assets/figma/icons/Arrow1.svg" style={{ transform: 'rotate(180deg)' }} />}
/>

// Link button
<Button variant="link" href="/pricing">Xem giá</Button>

// Loading state
<Button variant="primary" loading>Đang xử lý...</Button>
```

---

### Badge

**Import:** `import { Badge } from '@/shared/ui/ds/atoms/badge'`
**CSS:** `badge.css` (BEM: `.badge`, `.badge--{variant}`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info' \| 'reading' \| 'listening' \| 'speaking' \| 'writing'` | `'default'` | Color variant |
| `size` | `'sm' \| 'md'` | `'sm'` | Badge size |
| `children` | `ReactNode` | — | Badge content |
| `className` | `string` | `''` | Extra CSS |

```tsx
// IELTS skill badge
<Badge variant="reading" size="md">Reading</Badge>

// Status badge
<Badge variant="success">Active</Badge>
```

---

### Input

**Import:** `import { Input } from '@/shared/ui/ds/atoms/input'`
**CSS:** `input.css` (BEM: `.input`, `.input--{size}`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'text' \| 'password' \| 'email' \| 'tel' \| 'search' \| 'number' \| 'url'` | `'text'` | Input type |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Input height |
| `placeholder` | `string` | — | Placeholder text |
| `value` | `string` | — | Controlled value |
| `error` | `boolean` | `false` | Error state (red border) |
| `leftIcon` | `ReactNode` | — | Icon inside left |
| `rightIcon` | `ReactNode` | — | Icon inside right |
| `fullWidth` | `boolean` | `false` | `width: 100%` |
| `disabled` | `boolean` | `false` | Disabled state |
| `onChange` | `(e) => void` | — | Change handler |
| `className` | `string` | `''` | Extra CSS |

```tsx
<Input
  type="email"
  placeholder="Enter your email"
  leftIcon={<MailIcon />}
  fullWidth
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

### Avatar

**Import:** `import { Avatar } from '@/shared/ui/ds/atoms/avatar'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Image URL |
| `alt` | `string` | — | Alt text |
| `size` | `AvatarSize` | `'md'` | `sm \| md \| lg` |
| `fallback` | `string` | — | Initials when no image |
| `className` | `string` | `''` | Extra CSS |

```tsx
<Avatar src="/avatars/user.jpg" alt="John" size="lg" />
<Avatar fallback="JD" size="sm" />
```

---

### Tag

**Import:** `import { Tag } from '@/shared/ui/ds/atoms/tag'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `TagVariant` | `'default'` | Style variant |
| `children` | `ReactNode` | — | Tag content |
| `className` | `string` | `''` | Extra CSS |

```tsx
<Tag variant="outlined">Cambridge 18</Tag>
```

---

### PartTag

**Import:** `import { PartTag } from '@/shared/ui/ds/atoms/part-tag'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `part` | `number \| string` | — | Part number |
| `className` | `string` | `''` | Extra CSS |

```tsx
<PartTag part={1} />  {/* Renders: "Part 1" in orange pill */}
```

---

### Divider

**Import:** `import { Divider } from '@/shared/ui/ds/atoms/divider'`

```tsx
<Divider />                    {/* Horizontal */}
<Divider direction="vertical" />
```

---

### Spinner

**Import:** `import { Spinner } from '@/shared/ui/ds/atoms/spinner'`

```tsx
<Spinner size="md" />   {/* sm | md | lg */}
```

---

## Molecules

### TestCard

**Import:** `import { TestCard } from '@/shared/ui/ds/molecules/test-card/test-card'`
**Styling:** Tailwind inline classes (no separate CSS)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `image` | `string` | — | Card image URL |
| `title` | `string` | **required** | Card title |
| `subtitle` | `string` | — | Optional subtitle |
| `skill` | `'reading' \| 'listening' \| 'speaking' \| 'writing'` | — | Skill badge |
| `author` | `string` | — | Author name |
| `authorAvatar` | `string` | — | Author avatar URL |
| `views` | `number` | — | View count |
| `attempts` | `number` | — | Attempt count |
| `part` | `1-5 \| string` | — | Part tag overlay |
| `isPro` | `boolean` | — | Shows PRO badge |
| `score` | `string \| number` | — | Score circle |
| `actionText` | `string` | `'Làm bài'` | Action button text |
| `href` | `string` | — | Link URL |
| `onClick` | `() => void` | — | Click handler |
| `className` | `string` | `''` | Extra CSS |

**Visual behavior:**
- Rounded card (24px), lifts on hover (`-translate-y-[6px]`)
- Image area has warm beige background (`#FAF7EB`)
- Title turns red on hover
- If `actionText` includes "thử lại" → shows retry icon; otherwise shows play icon

```tsx
<TestCard
  title="IELTS Reading Vol 8 Test 1"
  attempts={1195}
  score="5.5"
  actionText="Thử lại"
  isPro
  image="/assets/figma/icons/Background-1.png"
  href="/test/reading-vol-8-1"
/>
```

---

### BlogCard

**Import:** `import { BlogCard } from '@/shared/ui/ds/molecules/blog-card'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `image` | `string` | — | Card image |
| `title` | `string` | **required** | Post title |
| `excerpt` | `string` | — | Short description |
| `category` | `string` | — | Category label |
| `date` | `string` | — | Published date |
| `href` | `string` | — | Link URL |
| `className` | `string` | `''` | Extra CSS |

```tsx
<BlogCard
  image="/blog/post-1.jpg"
  title="IELTS Writing Task 2 Tips"
  excerpt="Learn how to structure..."
  category="Writing"
  href="/blog/writing-tips"
/>
```

---

### PricingCard

**Import:** `import { PricingCard } from '@/shared/ui/ds/molecules/pricing-card'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Plan name |
| `price` | `string` | **required** | Price text |
| `priceLabel` | `string` | — | e.g. "/tháng" |
| `popular` | `boolean` | `false` | Highlighted card |
| `features` | `string[]` | **required** | Feature list |
| `ctaText` | `string` | `'Mua ngay'` | Button label |
| `ctaHref` | `string` | — | Button link |
| `onCtaClick` | `() => void` | — | Button handler |
| `className` | `string` | `''` | Extra CSS |

```tsx
<PricingCard
  name="Premium"
  price="199k"
  priceLabel="/tháng"
  popular
  features={["Unlimited tests", "AI scoring", "Priority support"]}
  onCtaClick={handlePurchase}
/>
```

---

### StatCard

**Import:** `import { StatCard } from '@/shared/ui/ds/molecules/stat-card'`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `ReactNode` | — | Stat icon |
| `value` | `string \| number` | **required** | Stat value |
| `label` | `string` | **required** | Stat description |
| `className` | `string` | `''` | Extra CSS |

```tsx
<StatCard icon={<UsersIcon />} value="100K+" label="Học viên" />
```

---

### FormField

**Import:** `import { FormField } from '@/shared/ui/ds/molecules/form-field'`

Wraps a DS `Input` with label + error message.

---

### NavLink

**Import:** `import { NavLink } from '@/shared/ui/ds/molecules/nav-link'`

Header navigation item with icon + label.

---

### Breadcrumb (DS)

**Import:** `import { Breadcrumb as DSBreadcrumb } from '@/shared/ui/ds/molecules/breadcrumb'`

> ⚠️ Don't confuse with Ant Design `Breadcrumb` — use this for DS-styled pages.

---

## Organisms

### CTABanner

**Import:** `import { CTABanner } from '@/shared/ui/ds/organisms/cta-banner'`
**CSS:** `cta-banner.css` (BEM: `.cta-banner`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Heading text |
| `subtitle` | `string` | — | Supporting text |
| `ctaText` | `string` | `'Nâng cấp Premium'` | Button label |
| `ctaHref` | `string` | — | Button link |
| `onCtaClick` | `() => void` | — | Button handler |
| `mascotSrc` | `string` | `'/assets/figma/icons/mascot.png'` | Mascot image |
| `className` | `string` | `''` | Extra CSS |

**Visual:** Red pill shape with dot pattern overlay, mascot on right, white text + CTA button.

```tsx
<CTABanner
  title="Nâng cấp Premium để mở khóa tất cả!"
  subtitle="Truy cập 1000+ bài test với AI chấm điểm"
  ctaHref="/subscription"
/>
```

---

### DSHeader

**Import:** `import { DSHeader } from '@/shared/ui/ds/organisms/header'`

Sticky header with logo, nav links, search, and user menu. Used in `BaseLayout`.

---

### DSFooter

**Import:** `import { DSFooter } from '@/shared/ui/ds/organisms/footer'`

Dark navy footer with 5-column grid, social links, newsletter form, copyright.

---

## Shared UI (Non-DS)

### Container

**Import:** `import { Container } from '@/shared/ui'`

Max-width content wrapper. Centers content on large screens.

```tsx
<Container className="py-10">
  {/* Content */}
</Container>
```

### ProBadge

**Import:** `import { ProBadge } from '@/shared/ui/pro-badge'`

Small "PRO" label badge for premium content.

### ProLink

**Import:** `import { ProLink } from '@/shared/ui/pro-link'`

Link wrapper that shows lock icon for non-pro users.

---

## Available Figma Icons

All in `public/assets/figma/icons/`:

| Icon | Path | Use Case |
|------|------|----------|
| Arrow (right) | `Arrow1.svg` | Navigation, carousel arrows |
| Logo | `logo.svg` / `logo.png` | Header, footer |
| Mascot | `mascot.png` | CTA banner |
| Check | `check.svg` | Success states, checkmarks |
| Cross | `Cross.svg` | Close, cancel |
| Plus | `Plus.svg` | Add actions |
| Search | `search 1.svg` / `search 2.svg` | Search UI |
| Play | `Play.svg` / `play 1.svg` | Video, start test |
| Reading | `reading-book 1.svg` | Reading skill |
| Listening | `listen 1.svg` | Listening skill |
| Speaking | `speaking 1.svg` | Speaking skill |
| Writing | `copywriting (1) 1.svg` | Writing skill |
| All skills | `all.svg` | All skills combined |
| Screen | `screen 1.png` | Device/platform UI |
| Backgrounds | `Background-1~6.png` | Test card images |

---

## Rules for AI Agents

1. **ALWAYS check this registry** before creating new UI elements
2. **NEVER inline-create** a button, input, badge, or card — use DS components
3. **USE Tailwind classes** for layout and spacing (flex, grid, padding, margin)
4. **USE design tokens** via Tailwind theme classes when available (e.g. `bg-primary-500`)
5. **USE hardcoded hex** only when no Tailwind theme token exists (e.g. `text-[#2D3142]`)
6. **ADD `data-section`** attribute to every section wrapper
7. **ADD `{/* === SECTION: Name === */}`** comment above sections
8. **PREFER composition** — compose existing DS components rather than building from scratch
