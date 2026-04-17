# Re-architecting the Question Creator UX

Khảo sát trải nghiệm người dùng (Content Creator) khi nhập liệu đề thi IELTS cho thấy có một độ lệch lớn giữa **"Format câu hỏi IELTS"** (ví dụ: True/False/Not Given, Matching Headings) và **"Cấu trúc Technical Component"** (ví dụ: radio, fillup, matrix).

Việc bắt user phải tự suy luận: _"Để tạo bài True/False, tôi phải chọn Type = Radio, và Question Form = True_False_Not_Given"_ là UX chưa hợp lý.

Mục tiêu của kế hoạch này là **chuyển đổi quy trình tạo câu hỏi sang hướng Template-Driven (Dựa trên mẫu)**, giúp user thao tác "thuận lợi, dễ dàng và nhanh chóng".

## User Review Required

> [!IMPORTANT]
> Thay đổi UX này sẽ gộp trường `Type` và `Question Form` ở góc độ UI. User sẽ chỉ cần chọn **IELTS Question Format** (Ví dụ: "True / False / Not Given"), hệ thống sẽ tự map về `type: "radio"` và `question_form: "true_false_not_given"` ở dưới backend. Bạn có đồng ý với hướng map 1-1 tự động này không?

> [!WARNING]
> Chúng ta sẽ thu gọn hệ thống Tabs (Question / Explanation / Preview) thành một giao diện Single-View hoặc Side-by-side (ví dụ: giải thích nằm ngay cạnh field nhập đáp án) để giảm click (giảm ma sát). Điều này có hợp với thói quen của team content không?

---

## Proposed Changes

### 1. Template-Driven Selection (Smart Picker)

Thay vì hai dropdown kỹ thuật khô khan, cung cấp một **Visual Menu / Card Grid** cho user ngay khi họ bấm "Add Question".
User sẽ chọn trực tiếp các Format chuẩn của IELTS:

- **Multiple Choice** (Tương đương: `radio` / `checkbox`)
- **True / False / Not Given** (Tương đương: `radio`)
- **Matching Headings** (Tương đương: `matching` layout heading)
- **Summary Completion** (Tương đương: `fillup`)
- **Map / Diagram Labeling** (Tương đương: `select` / `fillup`)

_Sau khi click, hệ thống tự động thiết lập `type` và UI Editor tương ứng._

### 2. Hợp nhất Tabs thành Single-View Focus

Modal hiện tại có 3 tabs (Question, Explanation, Preview). UX mới sẽ:

- **Instructions:** Nằm cố định ở đầu.
- **Detailed Editor:** Editor nhập nội dung câu hỏi/đáp án.
- **Inline Explanations:** Di chuyển phần nhập "Giải thích" (Explanation) gắn liền vào từng tuỳ chọn đáp án (Ví dụ: Kế bên textbox nhập Option A sẽ có một nút `[+] Thêm giải thích`).
- **Live Preview:** Nếu màn hình đủ rộng, Preview sẽ nằm ở nửa bên phải (Split-pane) thay vì phải nhảy tab.

### 3. Tối ưu hoá từng Editor UI

#### [MODIFY] `src/features/admin-quiz/editors/RadioSelectEditor.tsx`

- Tự động sinh sẵn 3 options phổ biến (True, False, Not Given) nếu user chọn template T/F/NG.

#### [MODIFY] `src/features/admin-quiz/editors/FillupEditor.tsx`

- Tích hợp Inline Explanation: Bấm vào một `{word}` đã được parse ra ở dưới (green badge), sẽ hiện một popup/popover nhỏ để nhập giải thích luôn cho khoảng trống đó.

#### [MODIFY] `src/features/admin-quiz/QuestionModal.tsx`

- Thay thế toàn bộ phần header (Title, Type, Form) thành một tiêu đề thông minh sinh ra từ Template (Ví dụ: `Title` tự gen là "Question 1-5" tuỳ thuộc độ dài mảng list_of_questions).
- Bố cục lại Layout.

---

## Khung Wireframe UI dự kiến (Modal)

```text
+-------------------------------------------------------------+
|  [Đổi Template: True/False/NG]     Câu hỏi từ: [ 1 ] tới [ 5 ] |
+-------------------------------------------------------------+
|                                                             |
|  INSTRUCTIONS (Rich Text)                                   |
|  [ Do the following statements agree with the claims... ]   |
|                                                             |
+-------------------------------------------------------------+
|  QUESTIONS                                    [+ Add Q.]    |
|                                                             |
|  Q.1: [ Metti solution provides...                 ]        |
|       (o) True      ( ) False     ( ) Not Given             |
|       ↳ Thêm giải thích cho câu 1: [ Đoạn 2, dòng 4...  ]   |
|                                                             |
|  Q.2: [ Metti solution is bad...                   ]        |
|       ( ) True      (o) False     ( ) Not Given             |
|       ↳ Thêm giải thích cho câu 2: [ ...                ]   |
+-------------------------------------------------------------+
|                                 [ Cancel ] [ Save Question ]|
+-------------------------------------------------------------+
```

## Open Questions

1. **Auto-numbering**: Tool BP Quiz cũ có tự động điền số thứ tự (ví dụ: Q1, Q2) bám sát theo số thứ tự trên đề thi không? Kế hoạch là sẽ tự động tính toán số Q.1, Q.2 lấy từ danh sách câu hỏi passage trước đó để hiển thị.
2. **Tab vs Inline**: Việc chuyển tab (Question -> Explanation) có thể làm người soạn đề quên mất context câu hỏi. Bạn ưu tiên phương án **Inline Explanation** (như wireframe ở trên) hay **Split-pane** (chia đôi màn hình trái-phải)?
