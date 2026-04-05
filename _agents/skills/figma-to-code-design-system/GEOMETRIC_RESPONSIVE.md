# Geometric Responsive Computation — Agent Reference

> **Mục đích**: Hướng dẫn agent **tính toán chính xác** responsive Tailwind classes từ dữ liệu hình học Figma, thay vì đoán.
> Đọc file này khi implement bất kỳ component/section nào cần responsive behavior.

---

## Khi nào áp dụng

- Khi implement **components mới** từ Figma
- Khi **refactor components cũ** được yêu cầu responsive fix
- Khi cần quyết định responsive classes cho **page-level composition**

---

## Input: Dữ liệu hình học từ Figma

Chạy `node scripts/figma-find-node.mjs <node-id>` để lấy data. Các fields hình học quan trọng:

```
bounds: { x, y, w, h }          → Bounding box (absolute pixels)
layout.mode: HORIZONTAL|VERTICAL → Flex direction
layout.gap: number               → Gap between children (px)
layout.pad: [t, r, b, l]         → Padding (px)
layout.mainAlign: MIN|CENTER|MAX|SPACE_BETWEEN  → justify-content
layout.crossAlign: MIN|CENTER|MAX|BASELINE      → align-items
layout.hSize: FIXED|HUG|FILL    → Width sizing mode
layout.vSize: FIXED|HUG|FILL    → Height sizing mode
radius: number | [tl, tr, br, bl] → Border radius
```

---

## Step 1: Layout Detection

### 1A. Node có Auto Layout (`layout.mode` tồn tại)

Map trực tiếp:

| Figma `layout.mode` | Tailwind |
|---|---|
| `HORIZONTAL` | `flex` (default row) |
| `VERTICAL` | `flex flex-col` |

### 1B. Node KHÔNG có Auto Layout (absolute positioned children)

Phân tích bounding boxes của children:

1. **Lấy tất cả children bounds**: `[{x, y, w, h}, ...]`
2. **Tính y-range**: `max(y) - min(y)`
3. **Tính x-range**: `max(x) - min(x)`

**Quyết định:**
- `y-range < 20px` hoặc `< 10% parent height` → **Horizontal row** → `flex`
- `x-range < 20px` hoặc `< 10% parent width` → **Vertical column** → `flex flex-col`
- Cả hai đều lớn + children ≥ 4 → **Kiểm tra Grid** (xem 1C)
- Không match → **Absolute** → từng child dùng `absolute` positioning

### 1C. Grid Detection

1. Sort children theo Y, cluster vào rows (tolerance 20px)
2. Đếm items mỗi row
3. Nếu consistent (mỗi row cùng số items, row cuối cho phép ít hơn) → **Grid**

```
Ví dụ: 6 items, cluster = [3, 3] → grid grid-cols-3
Ví dụ: 8 items, cluster = [4, 4] → grid grid-cols-4
Ví dụ: 7 items, cluster = [4, 3] → grid grid-cols-4 (row cuối ít hơn OK)
```

### 1D. Gap Computation

Khi có Auto Layout: dùng `layout.gap` trực tiếp.

Khi không có Auto Layout:
- **Horizontal**: gap = `child[i+1].x - (child[i].x + child[i].w)` → lấy median
- **Vertical**: gap = `child[i+1].y - (child[i].y + child[i].h)` → lấy median

---

## Step 2: Spacing Quantization Tables

### 2A. Pixel → Tailwind Spacing Class

Tìm giá trị Tailwind gần nhất. **Tolerance: 15%** — nếu khoảng cách > 15% thì dùng arbitrary `[Xpx]`.

| px Range | Tailwind | px Range | Tailwind |
|----------|----------|----------|----------|
| 0 | `0` | 28-30 | `7` |
| 1 | `px` | 31-34 | `8` |
| 2 | `0.5` | 35-38 | `9` |
| 3-4 | `1` | 39-42 | `10` |
| 5-6 | `1.5` | 43-46 | `11` |
| 7-8 | `2` | 47-50 | `12` |
| 9-10 | `2.5` | 52-54 | `13` |
| 11-12 | `3` | 55-58 | `14` |
| 13-14 | `3.5` | 59-62 | `15` |
| 15-16 | `4` | 63-66 | `16` |
| 17-18 | `4.5` | 70-74 | `18` |
| 19-20 | `5` | 78-82 | `20` |
| 21-24 | `6` | 94-98 | `24` |

> Giá trị nằm ngoài bảng → dùng `[Xpx]`. Ví dụ: 100px → `[100px]`

### 2B. Pixel → Font Size Class

| px | Tailwind | px | Tailwind |
|----|----------|----|----------|
| 12 | `text-xs` | 30 | `text-3xl` |
| 14 | `text-sm` | 36 | `text-4xl` |
| 16 | `text-base` | 48 | `text-5xl` |
| 18 | `text-lg` | 60 | `text-6xl` |
| 20 | `text-xl` | 72 | `text-7xl` |
| 24 | `text-2xl` | 96 | `text-8xl` |

> Tolerance: ±1px. Không match → `text-[Xpx]`

### 2C. Font Weight Map

| Figma weight | Tailwind |
|---|---|
| 300 | `font-light` |
| 400 | (default, omit) |
| 500 | `font-medium` |
| 600 | `font-semibold` |
| 700 | `font-bold` |
| 800 | `font-extrabold` |

### 2D. Border Radius Map

| px Range | Tailwind |
|----------|----------|
| 0 | `rounded-none` |
| 1-2 | `rounded-sm` |
| 3-4 | `rounded` |
| 5-6 | `rounded-md` |
| 7-8 | `rounded-lg` |
| 9-12 | `rounded-xl` |
| 13-16 | `rounded-2xl` |
| 17-24 | `rounded-3xl` |
| ≥ 100 | `rounded-full` |

### 2E. Alignment Maps

**Figma `mainAlign` → Tailwind `justify-*`:**

| Figma | Tailwind |
|---|---|
| `MIN` | `justify-start` (omit, default) |
| `CENTER` | `justify-center` |
| `MAX` | `justify-end` |
| `SPACE_BETWEEN` | `justify-between` |

**Figma `crossAlign` → Tailwind `items-*`:**

| Figma | Tailwind |
|---|---|
| `MIN` | `items-start` |
| `CENTER` | `items-center` |
| `MAX` | `items-end` |
| `BASELINE` | `items-baseline` |

---

## Step 3: Width Ratio → Responsive Strategy

### 3A. Sizing Mode Decision

| Figma `hSize` | Tailwind | Responsive |
|---|---|---|
| `FILL` | `flex-1` hoặc `w-full` | Giữ nguyên mọi breakpoint |
| `HUG` | `w-fit` | Giữ nguyên mọi breakpoint |
| `FIXED` | Tính ratio (xem 3B) | Cần responsive |

### 3B. Fixed Width → Fraction Mapping

**Công thức**: `ratio = childWidth / parentWidth`

Tìm fraction gần nhất (**tolerance 5%**):

| Ratio Range | Tailwind Fraction |
|---|---|
| 0.95 – 1.0 | `w-full` |
| 0.80 – 0.87 | `w-5/6` |
| 0.73 – 0.78 | `w-3/4` |
| 0.64 – 0.70 | `w-2/3` |
| 0.57 – 0.63 | `w-3/5` |
| 0.47 – 0.53 | `w-1/2` |
| 0.37 – 0.43 | `w-2/5` |
| 0.30 – 0.36 | `w-1/3` |
| 0.23 – 0.27 | `w-1/4` |
| 0.18 – 0.22 | `w-1/5` |
| 0.14 – 0.18 | `w-1/6` |

> Không match fraction nào → dùng `max-w-[Xpx]` hoặc `w-[Xpx]`

### 3C. Responsive Width Rules

**Mobile-first**: mặc định = mobile, scale up bằng `sm:`, `lg:`, `xl:`

| Desktop Layout | Mobile Strategy | Tailwind Pattern |
|---|---|---|
| 2+ items horizontal, mỗi item > 300px | Stack vertical | `w-full lg:w-{fraction}` |
| 2+ items horizontal, mỗi item ≤ 300px | Keep horizontal | `w-{fraction}` (no change) |
| Item width > 50% parent | Full width mobile | `w-full lg:w-{fraction}` |
| Item width ≤ 50% parent, min-width okay | Keep fraction | `w-{fraction}` |

**Quy tắc quyết định stack hay không:**
```
Nếu childWidth_px > 300 VÀ có ≥ 2 horizontal siblings:
  → Mobile: w-full, flex-col
  → Desktop: w-{fraction}, flex-row
  → Breakpoint chuyển: lg: (1024px)

Nếu childWidth_px ≤ 300 VÀ total children ≤ 3:
  → Có thể giữ horizontal, co lại bằng flex-1
  → Breakpoint chuyển: sm: (550px) nếu cần
```

---

## Step 4: Grid Responsive Column Rules

Khi đã detect grid ở Step 1C:

| Desktop Cols | Mobile (default) | `sm:` (≥550) | `lg:` (≥1024) |
|---|---|---|---|
| 2 | `grid-cols-1` | `sm:grid-cols-2` | — |
| 3 | `grid-cols-1` | `sm:grid-cols-2` | `lg:grid-cols-3` |
| 4 | `grid-cols-1` | `sm:grid-cols-2` | `lg:grid-cols-4` |
| 5 | `grid-cols-2` | `sm:grid-cols-3` | `lg:grid-cols-5` |
| 6 | `grid-cols-2` | `sm:grid-cols-3` | `lg:grid-cols-6` |

**Gap scaling**: gap cũng nên giảm trên mobile.

| Desktop Gap (px) | Mobile Gap | Tailwind Pattern |
|---|---|---|
| ≤ 16 | Giữ nguyên | `gap-{X}` |
| 17 – 32 | Giảm ~60% | `gap-{mobile} lg:gap-{desktop}` |
| > 32 | Giảm ~40% | `gap-{mobile} lg:gap-{desktop}` |

---

## Step 5: Padding Responsive Scaling

### 5A. Padding Shorthand Optimization

Trước khi output, **luôn optimize**:

| Condition | Output |
|---|---|
| t = r = b = l | `p-{X}` |
| t = b AND l = r | `py-{Y} px-{X}` |
| Otherwise | `pt-{t} pr-{r} pb-{b} pl-{l}` |

### 5B. Responsive Padding Rules

| Desktop Padding (px) | Mobile Strategy | Pattern |
|---|---|---|
| px ≤ 16 | Giữ nguyên | `px-{X}` |
| px 17 – 40 | Giảm xuống 16px | `px-4 lg:px-{desktop}` |
| px 41 – 80 | Giảm xuống 16-24px | `px-4 sm:px-6 lg:px-{desktop}` |
| px > 80 | Giảm xuống 16px, tăng dần | `px-4 sm:px-6 lg:px-8 xl:px-{desktop}` |
| py ≤ 24 | Giữ nguyên | `py-{Y}` |
| py 25 – 48 | Giảm ~60% | `py-{mobile} lg:py-{desktop}` |
| py 49 – 96 | Giảm ~50% | `py-{mobile} sm:py-{mid} lg:py-{desktop}` |
| py > 96 | Giảm ~40% | Progressive scale |

---

## Step 6: Typography Responsive Scaling

Headings nên scale down trên mobile. Body text giữ nguyên.

| Desktop Size | Type | Mobile Size | Pattern |
|---|---|---|---|
| `text-5xl` (48px) | Heading | `text-3xl` (30px) | `text-3xl lg:text-5xl` |
| `text-4xl` (36px) | Heading | `text-2xl` (24px) | `text-2xl lg:text-4xl` |
| `text-3xl` (30px) | Heading | `text-xl` (20px) | `text-xl sm:text-2xl lg:text-3xl` |
| `text-2xl` (24px) | Heading | `text-lg` (18px) | `text-lg lg:text-2xl` |
| `text-xl` (20px) | Subheading | `text-lg` (18px) | `text-lg lg:text-xl` |
| `text-lg` (18px) | Body large | Giữ nguyên | `text-lg` |
| `text-base` (16px) | Body | Giữ nguyên | `text-base` |
| `text-sm` (14px) | Small | Giữ nguyên | `text-sm` |

---

## Step 7: Color → Design Token Lookup

KHÔNG dùng hex trực tiếp. Luôn map sang design token.

| Hex | Token Class (bg/text) |
|---|---|
| `#D94A56` | `primary-500` |
| `#EA8D95` | `primary-300` |
| `#F6CDD0` | `primary-100` |
| `#FC945A` | `tertiary-500` / `secondary-500`* |
| `#FEB992` | `tertiary-300` / `secondary-300`* |
| `#FBDD60` | Dùng `[#FBDD60]` hoặc check token |
| `#60FB87` | `[#60FB87]` |
| `#219653` | `[#219653]` |
| `#5281F9` | `[#5281F9]` |
| `#191D24` | `[#191D24]` hoặc `neutral-900` |
| `#374151` | `neutral-600` hoặc `[#374151]` |
| `#FFFFFF` | `white` |
| `#FFF2F2` | `[#FFF2F2]` |
| `#FAF7EB` | `[#FAF7EB]` |
| `#2D3142` | `[#2D3142]` |
| `#242938` | `[#242938]` |
| `#F2994A` | `tertiary-500` |

> *Kiểm tra `globals.css` / `design-tokens.css` cho mapping chính xác trong project.
> Ưu tiên: token class > `[var(--color-X)]` > `[#hex]`

---

## Computation Walkthrough Template

Khi implement một section/component, agent **PHẢI** thực hiện computation này trước khi viết code. Ghi kết quả vào comment hoặc artifact.

### Template:

```markdown
## Geometric Computation: [Section Name]

**Node**: `<node-id>` | **Parent width**: Xpx

### Layout
- Figma mode: HORIZONTAL/VERTICAL/none
- Detected: flex/flex-col/grid
- Children count: N
- Gap: Xpx → `gap-{Y}`

### Children Width Ratios
| Child | Width (px) | Ratio | Fraction | Responsive |
|-------|-----------|-------|----------|------------|
| Name  | 600       | 0.42  | w-2/5    | w-full lg:w-2/5 |
| Name  | 520       | 0.36  | w-1/3    | w-full lg:w-1/3 |

### Padding
- Desktop: [t, r, b, l] = [X, X, X, X]
- Quantized: py-{Y} px-{X}
- Mobile: px-4 lg:px-{X}

### Grid (if applicable)
- Cols: N → grid-cols-1 sm:grid-cols-2 lg:grid-cols-N
- Gap: Xpx → gap-{mobile} lg:gap-{desktop}

### Typography (if applicable)
- Heading: Xpx → text-{mobile} lg:text-{desktop}
- Body: Xpx → text-{size}

### Final className
`"flex flex-col lg:flex-row gap-4 lg:gap-8 py-8 lg:py-16 px-4 lg:px-20"`
```

---

## Quick Decision Flowchart

```
START: Node from Figma
  │
  ├─ Has layout.mode?
  │   ├─ HORIZONTAL → flex, compute gap/align/children ratios
  │   ├─ VERTICAL   → flex flex-col, compute gap/align
  │   └─ Continue to sizing...
  │
  ├─ No layout.mode?
  │   ├─ Children y-range small → flex (horizontal detected)
  │   ├─ Children x-range small → flex flex-col (vertical detected)
  │   ├─ Multiple rows detected → grid grid-cols-{N}
  │   └─ No pattern → absolute positioning
  │
  ├─ Width sizing?
  │   ├─ FILL → flex-1 or w-full
  │   ├─ HUG  → w-fit
  │   └─ FIXED → compute ratio → fraction → responsive
  │
  ├─ Needs responsive?
  │   ├─ Horizontal + children > 300px → stack on mobile (flex-col / lg:flex-row)
  │   ├─ Grid → reduce columns (see table)
  │   ├─ Large padding → reduce (see table)
  │   └─ Large heading text → reduce (see table)
  │
  └─ Quantize all px values → Tailwind scale → output className
```

---

## Example Computation

**Input**: Hero Section node `10:2`
```
bounds: { w: 1440, h: 500 }
layout: { mode: HORIZONTAL, gap: 48, pad: [80, 120, 80, 120] }
children:
  - Text Block: { w: 600, h: 340 }
  - Image: { w: 520, h: 400 }
```

**Computation:**

1. **Layout**: `HORIZONTAL` → `flex`
2. **Gap**: 48px → table → `gap-12`. Mobile 48×0.6=29 → `gap-7`. Result: `gap-7 lg:gap-12`
3. **Padding**: py=80, px=120.
   - py: 80px → `py-20`. Mobile: 80×0.5=40 → `py-10`. Result: `py-10 lg:py-20`
   - px: 120px → `px-[120px]`. Mobile: rule says >80 → `px-4 sm:px-6 lg:px-8 xl:px-[120px]`
4. **Text Block width**: 600/1440 = 0.417 → nearest `w-2/5` (0.4, within 5%) → `w-full lg:w-2/5`
5. **Image width**: 520/1440 = 0.361 → nearest `w-1/3` (0.333, within 5%) → `w-full lg:w-1/3`
6. **Stack**: 600px > 300px + 2 horizontal siblings → mobile stack → `flex-col lg:flex-row`

**Output:**
```tsx
<section className="flex flex-col lg:flex-row gap-7 lg:gap-12 py-10 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-[120px]">
  <div className="w-full lg:w-2/5">
    {/* Text Block */}
  </div>
  <div className="w-full lg:w-1/3">
    {/* Image */}
  </div>
</section>
```
