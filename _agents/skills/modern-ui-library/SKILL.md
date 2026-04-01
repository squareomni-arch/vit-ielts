---
name: modern-ui-library
description: Specialized skillset for building high-end, premium web interfaces using Vanilla CSS and Glassmorphism.
---

# Modern Premium UI/UX Design System

Skillset focused on high-end aesthetic presentation for the IELTS-Prediction project.

## Core Capabilities
1. **Design Tokens**: Standardizing colors, spacing, and typography across the application.
2. **Glassmorphism**: Implementing frosted glass effects, subtle borders, and blur backdrops for a "Premium" feel.
3. **Micro-animations**: Adding hover effects, layout transitions, and interactive visual feedback.
4. **Responsive Layouts**: Designing "Mobile-First" while ensuring stunning desktop experiences.
5. **Dynamic Theming**: Supporting HSL-based color adjustments for easy theme switching.

## Guidelines
- **Visual Hierarchy**: Use typography (Inter/Roboto/Outfit) to create clear content structure.
- **Color Palettes**: Avoid generic colors. Use curated, harmonious palettes (e.g., deep blues, professional accent colors).
- **Interactive States**: Every button and link must have defined hover/active/focus states.
- **Glassmorphism Spec**:
  ```css
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  ```

## Component Architecture

### ⚠️ MANDATORY: Before building ANY UI, read `src/shared/ui/ds/REGISTRY.md`

This file contains:
- **Every DS component** with exact props, types, and usage examples
- **Import paths** for atoms, molecules, organisms
- **Figma color → Tailwind class** mapping
- **Available icon paths** in `public/assets/figma/icons/`
- **Rules for AI agents** on when to use DS vs inline Tailwind

### Styling Strategy: Tailwind v4 + Design Tokens

```
1. DESIGN TOKENS (globals.css @theme block)
   → Define brand colors, fonts, breakpoints as CSS custom properties
   → Tailwind v4 auto-generates utility classes from @theme
   → Example: --color-primary-500 → bg-primary-500, text-primary-500

2. TAILWIND CLASSES (all components)
   → ALL styling uses Tailwind utility classes
   → Components encapsulate Tailwind classes + behavior + props API
   → Pages compose DS components with Tailwind layout utilities

3. LEGACY CSS (existing DS atoms — Button, Badge, Input)
   → Some atoms still use BEM CSS files (button.css, badge.css)
   → These will be migrated to Tailwind over time
   → New components should use Tailwind only
```

### Component Rules
- **Use existing DS components** — check REGISTRY.md first
- **Atomized Components**: Keep components small and reusable
- **Tailwind for styling**: Use utility classes, reference `@theme` tokens when available
- **Iconography**: Use Lucide React icons or SVGs from `public/assets/figma/icons/`

## Excellence Checklist
- [ ] Check `REGISTRY.md` — used existing DS components (no reinventing)
- [ ] No default browser colors
- [ ] Smooth transitions for all hover states
- [ ] Proper contrast for accessibility
- [ ] High-fidelity images/mockups
- [ ] Responsive behavior on all breakpoints
- [ ] All major sections have `data-section` attributes
- [ ] All major sections have `{/* === SECTION: ... === */}` comment markers
- [ ] Used Tailwind theme tokens over hardcoded hex when available

## Section Locator Convention (Tailwind-first Navigation)

When using Tailwind CSS classes entirely (no separate CSS files), quickly locating sections requires a systematic approach. This project uses the following conventions:

### 1. `data-section` Attributes (REQUIRED)
Every root wrapper element of a distinct UI section **MUST** have a `data-section` attribute with a kebab-case identifier:

```tsx
<section data-section="hero-banner" className="relative w-full ...">
<div data-section="practice-tests" className="w-full bg-white ...">
<footer data-section="footer" className="bg-gray-100">
```

**Benefits:**
- Instantly visible in DevTools via inspect → look at `data-section` value
- Searchable: `grep -rn 'data-section="hero' src/`
- Does NOT affect styling, semantics, or bundle size

### 2. Comment Markers (REQUIRED)
Place a standardized JSX comment **above** every section block using the pattern `{/* === SECTION: <Name> === */}`:

```tsx
{/* === SECTION: Hero Banner === */}
<HeroBanner config={heroBannerConfig} />

{/* === SECTION: Practice Tests Carousel === */}
<div data-section="practice-tests" className="...">
```

**Benefits:**
- `grep -rn "SECTION:" src/` lists ALL sections across the project
- Human-readable when scrolling through large files
- Consistent leading `===` makes them stand out from regular comments

### 3. Naming Conventions
| Pattern | Example | Usage |
|---------|---------|-------|
| `{page}-{element}` | `subscription-banner` | Page-specific section with page prefix |
| `{element}` | `hero-banner` | Shared/reusable component section |
| `{parent}-{child}` | `footer-cta-banner` | Sub-section within a larger section |

### 4. Quick Lookup Workflow
| Scenario | Command / Method |
|---|---|
| Know the text on screen | `grep -rn "Displayed Text" src/` |
| Know section name | `grep -rn 'data-section="pricing' src/` |
| List ALL sections | `grep -rn "=== SECTION:" src/` |
| Find by unique Tailwind class | `grep -rn "from-rose-600" src/` |
| Visual debugging | DevTools → Inspect → read `data-section` attribute |

### 5. Current Section Map
```
BaseLayout
├── header-topbar          (Top bar with social links & promo)
├── header-navigation      (DSHeader nav component)
├── main-content           (<main> wrapper)
│   ├── [Page-specific sections]
│   └── ...
├── footer
│   ├── footer-cta-banner  (CTA call-to-action card)
│   ├── footer-links       (Columns: useful links, company, contact, newsletter)
│   └── footer-copyright   (Bottom copyright row)

HomePage
├── hero-banner            (Full-width hero with mascots)
├── platform-intro         (Category cards grid)
├── user-dashboard         (Target score + Practice history — auth only)
├── practice-tests         (Multiple PracticeSection carousels)
├── why-choose-us          (Statistics cards)
└── testimonials           (Marquee testimonial rows)

SubscriptionPage
├── subscription-banner    (Hero with dark overlay)
├── subscription-plans     (Pricing cards)
├── subscription-testimonials
└── faq

AboutUsPage
├── about-banner           (Hero with dark overlay)
├── about-content          (Content section)
├── about-why-choose-us    (Statistics reuse)
└── testimonials

ExamLibraryPage
├── exam-library-hero      (Hero with breadcrumb)
└── exam-library-content   (Filter + Tabs)

ContactPage
├── contact-breadcrumb     (Navigation breadcrumb)
└── contact-form           (Form + Social links sidebar)
```
