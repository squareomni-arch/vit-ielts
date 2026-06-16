# Báo cáo Chuẩn hóa Badge (Part/Task/Passage) System

## 1. Vấn đề hiện tại (Inconsistencies)
Qua quá trình rà soát toàn bộ UI components, Pages và Dummy Data, tôi phát hiện sự thiếu đồng nhất lớn trong việc hiển thị các tag đánh dấu thành phần bài thi IELTS.

### Các vấn đề chính:
1. **Thiếu chuẩn hóa quy ước (Nomenclature):** 
   - Trên cùng một loại bài test Reading, các Carousel ở trang chủ / Trang thư viện đôi khi hiển thị là `"Part 1"`, nhưng lại có chỗ (`practice-card` cũ) hiển thị là `"Passage 1"`.
   - Với kỹ năng Writing, file `horizontal-item.tsx` lấy tên dạng bài (vd: `Line Graph`) cố nhét vào Badge thay vì dùng chuẩn `"Task 1" / "Task 2"`.
2. **Logic Mapping bị phân mảnh dọc codebase:**
   - Việc "dịch" dữ liệu CMS (như `slug: "0"`, `"passage1"`) ra chữ `"Part 1"` hoặc `"Passage 1"` đang bị code lặp lại (hard-coded dictionary) ở quá nhiều component:
     - `src/pages/home/ui/practice-section/index.tsx` (Dictionary riêng: `PART_LABELS`)
     - `src/pages/ielts-practice-library/ui/practice-card.tsx` (Dictionary riêng: `PART_META`)
     - `src/pages/vit-ielts/ui/practice-card.tsx` (Dictionary riêng: `PART_META`)
     - `src/pages/sample-essay/ui/archive/single-item.tsx` (Dictionary riêng: `FILTER_CONFIGS`)
3. **Mockup Data/Code thừa:**
   - Trong các trang chi tiết bài học (`vit-ielts-single`, `ielts-practice-single`), section "Bài viết tương tự" bị hardcode chết chữ `Part 1` mặc kể kỹ năng (skill) bài thi là Reading/Speaking. 

---

## 2. Giải pháp Chuẩn hóa

### Nguyên tắc đặt tên (IELTS Standard Naming)
Để đảm bảo đúng chuẩn IELTS quốc tế:
- **Nghe (Listening):** Dùng `"Part 1, 2, 3, 4"`
- **Đọc (Reading):** Dùng `"Passage 1, 2, 3"`
- **Viết (Writing):** Dùng `"Task 1, 2"`
- **Nói (Speaking):** Dùng `"Part 1, 2, 3"`

### Triển khai Utility Tập trung (Central Utility)
Tôi đã tạo một Helper Function dùng chung: `normalizeSectionBadge` tại `src/shared/lib/quiz-part.ts`. Hàm này đảm nhiệm việc:
1. Nội suy đúng thể loại IELTS Skill (`reading` -> `Passage`, `writing` -> `Task`, ...).
2. Tự động trích xuất định dạng số lấy từ CMS (`"passage1"`, `"0"`, `"1"`) để bóc tách thành Số `n`.
   *(Ghi chú: Nếu format CMS trả về `0`, `1` thay cho `1`, `2`, hàm tự động detect logic 0-index để trả về +1)*
3. Trả về format chuẩn: `{ label: string, colorIndex: 1..5 }`.

### Component Component & UI Design
Component UI lõi là: `<PartTag part={number} />` (`src/shared/ui/ds/atoms/part-tag/part-tag.tsx`).
- Text hiển thị: Nhận thông qua thuộc tính `children` sẽ render String của `label` mới tạo.
- Style / Color Code: Trích xuất Integer từ `label` truyền vào biến `part` (1..5) để tự động ánh xạ đúng class `<span className="part-tag--part{X}">`.
- Mọi Badge PartTag/TestCard giờ trông đồng nhất và logic.

---

## 3. Các thành phần đã được Refactor
1. **Utility File:** Tạo mới hoàn toàn `src/shared/lib/quiz-part.ts`.
2. **Carousel Trang chủ:** Thay thế logic mapper tự chế ở `practice-section/index.tsx`. Kể từ giờ hệ thống luôn hiện "Passage 1" khi test là Reading, "Part 1" khi Listening.
3. **Thư viện Practice & Prediction (`PracticeCard`):** Đã dọn dẹp map thủ công (`PART_META`), sử dụng hook call trực tiếp ra `normalizeSectionBadge`.
4. **Trang Sample Essay Archive (`single-item.tsx`, `horizontal-item.tsx`):**
   - Loại bỏ hardcode `FILTER_CONFIGS`.
   - Vứt bỏ text `"Line Graph"` ở Badge Size để ưu tiên đưa chữ `"Task 1"` vào Badge. Giữ nguyên *"Line Graph"* ở dòng subtitle description.
5. **Detail Page (Các test liên quan):** Gỡ bỏ hardcode `Part 1`, thay bằng Auto-map tuỳ theo gốc Skill.

Hệ thống Badge nay đã Single Source of Truth ở Data Layer và Consistent hoàn toàn ở UI Layer.
