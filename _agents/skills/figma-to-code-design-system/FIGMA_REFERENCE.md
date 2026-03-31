# Figma Design Reference — IELTS Prediction

> **⚠️ MANDATORY**: Mọi agent thực hiện UI task PHẢI đọc file này trước khi implement.
> Đây là **source of truth** được extract trực tiếp từ Figma API.

---

## Figma File Info

| Key | Value |
|---|---|
| File Name | IELTS Prediction Test (Copy) |
| File Key | `JbK4p9yyXBjhu7B7VOIBhd` |
| Token | `process.env.FIGMA_TOKEN` |
| Last Synced | 2026-03-31 |

---

## 1. Color Palette (from Figma styles — node `14:137`)

### Primary Colors
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-primary` | Primary | `#D94A56` | Brand chính, buttons, links, CTAs |
| `--color-primary-light` | Primary2 | `#EA8D95` | Hover states, lighter accents |
| `--color-primary-lighter` | Primary3 | `#F6CDD0` | Backgrounds, subtle highlights |

### Secondary Colors (Orange)
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-secondary` | Second | `#FC945A` | Secondary actions, accents |
| `--color-secondary-light` | Second2 | `#FEB992` | Lighter secondary |
| `--color-secondary-lighter` | Second3 | `#FED6C0` | Subtle secondary backgrounds |

### Secondary B Colors (Yellow)
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-yellow` | SecondB | `#FBDD60` | Highlights, warnings |
| `--color-yellow-light` | SecondB2 | `#FFE887` | Light yellow accents |
| `--color-yellow-lighter` | SecondB3 | `#FFF5C9` | Yellow tinted backgrounds |

### Positive Colors (Green)
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-positive` | Positive1 | `#60FB87` | Success indicators |
| `--color-positive-light` | Positive2 | `#96FFB0` | Light success |
| `--color-positive-lighter` | Positive3 | `#BDFFCD` | Success backgrounds |
| `--color-positive-dark` | Positive4 | `#219653` | Dark green text/icons |

### Accent Colors (Blue)
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-accent` | Accent1 | `#5281F9` | Links, info badges |
| `--color-accent-light` | Accent2 | `#7CA1FF` | Light blue accents |
| `--color-accent-lighter` | Accent3 | `#C3D4FF` | Blue tinted backgrounds |

### Neutral Colors
| Token Name | Figma Style | Hex | Usage |
|---|---|---|---|
| `--color-text` | Text | `#191D24` | Primary text |
| `--color-text-secondary` | Text2 | `#374151` | Secondary/muted text |
| `--color-bg-primary` | BG1 | `#FFFFFF` | Main background |
| `--color-bg-secondary` | BG2 | `#FFF2F2` | Tinted background (pink) |

---

## 2. Typography (from Figma styles)

> **Font Family**: `Noto Sans` — Duy nhất, KHÔNG dùng font nào khác.

### Text Styles
| Figma Style | CSS Token | Font | Weight | Size | Line Height |
|---|---|---|---|---|---|
| Text-Normal-Regular | `--text-normal` | Noto Sans | 400 | 14px | ~19px (1.36) |
| Text-Normal-SemiBold | `--text-normal-semibold` | Noto Sans | 600 | 14px | ~19px |
| Text-Normal-Bold | `--text-normal-bold` | Noto Sans | 700 | 14px | ~19px |
| Text-Medium-Regular | `--text-medium` | Noto Sans | 400 | 16px | ~22px (1.36) |
| Text-Medium-SemiBold | `--text-medium-semibold` | Noto Sans | 600 | 16px | ~22px |
| Text-Medium-Bold | `--text-medium-bold` | Noto Sans | 700 | 16px | ~22px |
| Heading1 | `--heading-1` | Noto Sans | 400 | 24px | ~33px (1.36) |
| Heading2 | `--heading-2` | Noto Sans | 700 | 36px | ~49px (1.36) |
| Heading3 | `--heading-3` | Noto Sans | 700 | 64px | ~87px (1.36) |

---

## 3. Effects (from Figma styles)

### BoxShadow (style id: `364:10502`)
```css
box-shadow:
  0 2px 4px -2px rgba(16, 24, 40, 0.06),
  0 4px 8px -2px rgba(16, 24, 40, 0.10);
```

---

## 4. Component Node IDs

Khi cần extract chi tiết component, dùng:
```bash
node scripts/figma-find-node.mjs <node-id>
```

### Design System Components
| Component | Node ID | Type | Size |
|---|---|---|---|
| Header | `448:5862` | COMPONENT_SET | 1637×220 |
| Footer | `309:5183` | COMPONENT | 1920×460 |
| CTA | `412:6730` | COMPONENT | 1920×359 |
| Title | `827:7254` | COMPONENT | 1923×419 |
| BreadCrumb | `361:228` | COMPONENT | 453×41 |
| Hover Cells | `653:2243` | COMPONENT_SET | 1606×1460 |

### Design System Sections
| Section | Node ID | Contents |
|---|---|---|
| COLOR PALETTE | `14:137` | 18 color swatches |
| TYPOGRAPHY | `1076:2184` | Font scale examples |
| BUTTONS | `1076:2183` | Button variants |
| ICONS | `29:16` | 43 icon components |
| LOGO | `1076:2185` | Logo variants |
| HOVER CELLS | `1076:2182` | Card/cell hover states |

---

## 5. Page Node IDs

| Page | Node ID | Key Frames |
|---|---|---|
| Home Page | `0:1` | Main Container (`10:2`), History (`779:1408`) |
| Tests Page | `350:9767` | Library-Reading (`353:9605`), Library-Listening (`962:2866`), Test01 (`1076:4384`) |
| Login/Signup | `354:15408` | Login (`388:9966`), Sign Up (`391:342`) |
| Dashboard | `438:6479` | Dashboard (`448:6279`), Checkout (`1098:2660`, `1098:2952`) |
| Result | `796:7098` | Listening-fail (`796:7183`), Listening-pass (`800:161`), Reading (`800:718`) |
| Subscription | `356:15602` | Subscription (`393:5763`) |
| Blog | `972:348` | Blog list (`972:1205`), Blog detail (`1034:3741`) |

---

## 6. Icon Inventory (43 icons in node `29:16`)

### UI Icons (white fill, designed for colored backgrounds)
| Icon Name | Node ID | Size | Usage |
|---|---|---|---|
| Plus | `29:34` | 50×50 | Add/create actions |
| feedback1 | `36:36` | 50×50 | Review/feedback |
| feedback2 | `36:57` | 50×50 | Review variant |
| Arrow1 | `41:197` | 50×50 | Navigation arrow |
| Play | `49:329` | 50×50 | Play audio/video |
| LovedbyStudents | `107:323` | 50×50 | Social proof |
| Legit | `107:373` | 50×50 | Trust badge |
| Aim | `107:371` | 50×50 | Target/goal |
| Goal | `107:372` | 50×50 | Achievement |
| book (1) 1 | `117:643` | 50×50 | Reading |
| search 1 | `117:644` | 50×50 | Search (detailed) |
| search 2 | `444:8391` | 50×50 | Search (simple) |
| listen 1 | `117:645` | 50×50 | Listening skill |
| speaking 1 | `117:646` | 52×50 | Speaking skill |
| copywriting (1) 1 | `117:647` | 50×50 | Writing skill |
| reading-book 1 | `117:648` | 50×50 | Reading skill |
| calendar-days 1 | `391:529` | 50×50 | Calendar/schedule |
| all | `423:7110` | 40×40 | All/grid view |
| check | `435:1364` | 64×64 | Checkmark |
| count | `440:7632` | 62×62 | Counter/number |
| burger | `440:7642` | 44×44 | Hamburger menu |
| wifi | `440:7650` | 40×40 | Connectivity |
| Note | `440:7681` | 42×42 | Notes/document |
| volume-up 1 | `440:7743` | 36×36 | Audio volume |
| play 1 | `440:7744` | 26×26 | Play (small) |
| play 2 | `440:7745` | 26×26 | Play variant |
| tryagain | `777:7314` | 18×18 | Retry |
| Cross | `797:8193` | 30×30 | Close/dismiss |
| skip | `797:8202` | 24×24 | Skip forward |
| tag | `974:8480` | 24×24 | Tag/label |
| mess | `974:9007` | 42×42 | Messaging |
| logo | `1032:1486` | 24×24 | Small logo mark |
| share | `1076:3748` | 24×24 | Share |

### Illustration Assets (colored, multi-tone)
| Asset Name | Node ID | Size |
|---|---|---|
| Asset 11 1 | `319:10699` | 60×69 |
| Asset 10 1 | `319:10692` | 54×48 |
| Asset 9 1 | `319:10687` | 55×56 |
| Asset 8 1 | `319:10680` | 49×50 |
| Asset 7 1 | `319:10672` | 68×69 |
| Asset 6 1 | `319:10654` | 116×123 |
| Asset 5 1 | `319:10643` | 103×79 |
| Asset 4 1 | `319:10636` | 71×75 |
| Asset 3 1 | `319:10627` | 45×212 |
| Asset 2 1 | `319:10614` | 49×207 |

### Logo Assets (node `1076:2185`)
| Asset | Node ID | Size | Type |
|---|---|---|---|
| image 1 (logo full) | `13:92` | 266×136 | Raster image |
| Group 1 (logo vector) | `223:615` | 176×134 | Vector group |
