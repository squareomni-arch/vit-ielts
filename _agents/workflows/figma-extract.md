---
description: Quy trình extract và sử dụng Figma design specs khi implement UI. PHẢI chạy trước khi bắt đầu code.
---

# Figma Design Extraction Workflow

## Khi nào dùng
- Khi implement bất kỳ UI page/component nào
- Khi cần biết chính xác colors, spacing, typography, effects
- Khi cần export icon/logo từ Figma

## Bước 1: Đọc Figma Reference (BẮT BUỘC)

Mở và đọc file:
```
_agents/skills/figma-to-code-design-system/FIGMA_REFERENCE.md
```

File này chứa TẤT CẢ design tokens đã extract từ Figma API:
- 20 colors với hex codes chính xác
- 9 typography styles (font: Noto Sans duy nhất)
- Box-shadow values
- Node IDs cho components và pages

## Bước 2: Extract specs cho element cụ thể

Nếu cần chi tiết hơn (padding, gap, layout mode, etc.), tra cứu node offline:

// turbo
```bash
node scripts/figma-find-node.mjs <node-id>
```

Ví dụ tra cứu color palette:
```bash
node scripts/figma-find-node.mjs 14:137
```

### Node IDs thường dùng

| Element | Node ID |
|---|---|
| Color Palette | `14:137` |
| Typography | `1076:2184` |
| Buttons | `1076:2183` |
| Icons | `29:16` |
| Header | `448:5862` |
| Footer | `309:5183` |
| Home Page | `10:2` |
| Login | `388:9966` |
| Signup | `391:342` |
| Dashboard | `448:6279` |
| Subscription | `393:5763` |
| Blog | `972:1205` |

## Bước 3: Extract chi tiết từ Figma API (nếu data chưa có)

Nếu node chưa có trong `scripts/figma-data/`, gọi API trực tiếp:

```bash
node scripts/figma-extract.mjs node <node-id>
```

⚠️ Lưu ý rate limit: Figma free plan giới hạn ~30 requests/phút. Delay 3-5 giây giữa các requests.

## Bước 4: Export icons/logos (nếu cần)

```bash
# Export icons + logos thành SVG
node scripts/figma-export-icons.mjs

# Export cụ thể nodes thành PNG
node scripts/figma-export-images.mjs --nodes 14:137,448:5862 --scale 2

# Export 1 page
node scripts/figma-export-images.mjs --page "Home Page" --scale 1
```

## Bước 5: Sync lại toàn bộ (khi Figma design thay đổi)

```bash
node scripts/figma-extract-full.mjs
```

Sau khi chạy, cập nhật lại `FIGMA_REFERENCE.md` nếu có thay đổi.

## Lưu ý quan trọng

1. **KHÔNG BAO GIỜ** đoán giá trị từ screenshot
2. **LUÔN** dùng design tokens (`--ds-*`) thay vì hardcode hex values
3. **Font duy nhất** trong Figma: `Noto Sans` (KHÔNG phải Nunito)
4. **Primary color**: `#D94A56` — không dùng trực tiếp, dùng `var(--color-primary-500)`
5. **BoxShadow**: `0 2px 4px -2px rgba(16,24,40,0.06), 0 4px 8px -2px rgba(16,24,40,0.10)`
