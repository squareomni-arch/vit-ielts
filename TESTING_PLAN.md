# 🧪 Kế hoạch Kiểm thử Toàn diện — IELTS Prediction

> ⚠️ **TÀI LIỆU LỖI THỜI — CẦN LẬP KẾ HOẠCH LẠI.** Plan này gắn với quy trình migration cũ (`implementation_plan.md`, `CODE_CONVENTIONS.md`, `UI_MIGRATION_RULES.md` — đã xóa). Việc kiểm thử cho đợt UI rebuild sẽ được lập lại theo `AGENT_UI_REBUILD_GUIDE.md` + `DESIGN_SYSTEM_REBUILD.md` (3 gate: `pnpm test`, `pnpm typecheck`, `pnpm test:visual`). Giữ file để tham khảo lịch sử.

## Tổng quan

Test trực tiếp trên **Real Supabase** (không mock) — 8 phases, 7 agents.

---

## Phase 0: Test Infrastructure
- `tests/fixtures/supabase-live.ts` — real Supabase client
- `tests/fixtures/test-data-helpers.ts` — seed/cleanup helpers
- Update `vitest.config.ts` — timeout + sequential

## Phase 1: Service Unit Tests (Real Supabase)
- Task 1.1: Payout Service (12 tests)
- Task 1.2: Affiliate Anti-Fraud (12 tests)
- Task 1.3: Order Service Edge Cases (10 tests)
- Task 1.4: Coupon Concurrency & Expiry (9 tests)
- Task 1.5: RLS Policy Tests (8 tests)

## Phase 2: API Route Integration Tests
- Task 2.1: Order API (6 tests)
- Task 2.2: Affiliate API (13 tests)
- Task 2.3: Coupon API (5 tests)
- Task 2.4: Test Flow API (4 tests)
- Task 2.5: Contact API (3 tests)
- Task 2.6: Admin API Auth (8 tests)

## Phase 3: Webhook & Pipeline E2E
- Task 3.1: SePay Webhook Handler (8 tests)
- Task 3.2: Full Payment Pipeline (3 scenarios)
- **Task 3.3: Test-Taking Pipeline E2E (8 tests)** ← MỚI

## Phase 4: Security & Edge Case Audit
- Task 4.1: Input Sanitization (6 tests)
- Task 4.2: Auth Bypass (5 tests)
- Task 4.3: Race Conditions (3 tests)
- Task 4.4: Null-Safety (6 tests)

## Phase 5: UI & Critical E2E Flows (Browser)
- Task 5.1: Public Pages Load (9 pages)
- Task 5.2: Interactive Test Flow (basic)
- Task 5.3: Responsive Design (4 viewports)
- Task 5.4: Navigation Integrity
- **Task 5.5: 🎯 Luồng Làm Bài Đầy Đủ (10 steps)** ← MỚI
- **Task 5.6: 💰 Luồng Mua Gói Đầy Đủ (12 steps + 5 edge cases)** ← MỚI

## Phase 6: Performance Benchmarking
## Phase 7: Final Report

---

## 🎯 Task 3.3: Test-Taking Pipeline E2E (Service-Level)

**File tạo**: `tests/test-taking-pipeline-live.test.ts`  
**Sources**: `services/test-flow.ts`, `services/scoring.ts`, `services/quiz.ts`

**Setup**: Dùng 1 quiz published có sẵn trong DB (KHÔNG tạo quiz mới)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Full flow: start → score | getQuizBySlug → takeTheTest → saveDraft → submitTest → calculateScore | testResult có score ≥ 0, status="published" |
| 2 | Resume existing test | takeTheTest → getTestResult(testId) | Same testId returned |
| 3 | Retake test | Submit → takeTheTest(retake:true) | New testResult.id |
| 4 | Empty answers → score 0 | submitTest with answers=[] | score = 0 |
| 5 | Partial answers | submitTest with 50% answers | 0 < score < max |
| 6 | tests_taken increment | Note before, submit, check after | tests_taken += 1 |
| 7 | Draft → resume → submit | saveDraft → getTestResult → submitTest | Final score based on full answers |
| 8 | All correct → perfect score | Submit all-correct answers | Score = 9.0 or 100% |

---

## 🎯 Task 5.5: E2E — Luồng Làm Bài Đầy Đủ (Browser)

**Prerequisite**: Account test đã đăng nhập

```
Practice Library → Quiz Detail → "Bắt đầu thi" → Test Page → Trả lời → Lưu nháp → Reload → Submit → Test Result → Xem giải thích
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở Practice Library | Grid of test cards |
| 2 | Click vào 1 test card (Reading) | Quiz detail: title, "Bắt đầu thi" button |
| 3 | Click "Bắt đầu thi" | Test page loads: passages + questions |
| 4 | Verify UI elements | Timer, passage text, question groups |
| 5 | Trả lời 3-5 câu hỏi | Answers highlighted |
| 6 | Click "Lưu nháp" | Toast confirmation |
| 7 | Reload page | Draft answers restored |
| 8 | Submit bài | Redirect to `/test-result/[slug]` |
| 9 | Verify Result page | Band score, Correct/Wrong/Skip, Time |
| 10 | Click "Xem giải thích" | Explanations visible |

**Evidence**: 10 screenshots

---

## 💰 Task 5.6: E2E — Luồng Mua Gói Đầy Đủ (Browser)

**Prerequisite**: Account test đã đăng nhập

```
Subscription → Chọn gói → Checkout → Coupon → Checkout button → Order Received → QR + Bank Info → Polling
```

| Step | Action | Expected |
|------|--------|----------|
| 1 | Mở Subscription page | Pricing cards (Combo + Single) |
| 2 | Click "Mua gói Combo 3 tháng" | Redirect to `/checkout?type=combo&months=3` |
| 3 | Verify Checkout elements | Cart, price, coupon input, checkout button |
| 4 | Nhập mã INVALID | Toast error |
| 5 | Nhập mã VALID (nếu có) | Green badge, discount, total recalculated |
| 6 | Xóa coupon | Price restored |
| 7 | Click "Checkout" | Loading → redirect to order-received |
| 8 | Verify Order Received | Success icon, bank info, transfer content |
| 9 | Verify QR Code | QR loads with correct amount |
| 10 | Test Copy button | Content copied |
| 11 | Verify Polling | Green pulse + "Đang kiểm tra..." |
| 12 | Verify Order Summary | Mã đơn, thời gian, thanh toán, hình thức |

**Edge Cases**: Single Pack flow, No auth → checkout, Invalid params, Direct access order-received, Mock order

**Evidence**: 12 screenshots + 5 edge case screenshots

## Status Update — 2026-04-06 (17:45)

### ✅ Đã hoàn thành (Verified PASS)
- **Phase 0 (Infrastructure)**: Real Supabase client, test-data-helpers, Vitest configured for sequential live testing.
- **Phase 1 (Service Level)**:
    - `tests/payout-live.test.ts` — Payout lifecycle, balance refund (Task 1.1)
    - `tests/affiliate-live.test.ts` — Anti-fraud, IP tracking, self-referral (Task 1.2)
    - `tests/order-live.test.ts` — Price calculation, payment completion, Pro activation (Task 1.3)
    - `tests/coupon-live.test.ts` — Atomic usage, percent/fixed discount (Task 1.4)
    - `tests/rls-policies-live.test.ts` — Data isolation, pub/priv access (Task 1.5)
- **Phase 3 (Pipeline)**:
    - `tests/test-taking-pipeline-live.test.ts` — Full quiz flow (Task 3.3)
- **Phase 5 (Browser E2E)**:
    - **Task 5.5 (Làm bài)**: Verified by subagent. 
        - *Fix*: Thêm nút "Lưu nháp" thủ công vào Header giúp user feedback rõ ràng hơn.
    - **Task 5.6 (Mua gói)**: Verified by subagent.
        - *Fix*: Sửa lỗi UI hiển thị coupon % (trước đó bị tính như số tiền cố định). Đã fix calculation logic trong `pages/checkout.tsx`.
- **Tổng cộng**: 15+ test files, 200+ tests pass. `npm run build` pass.

### 🛠️ Bug Fixes phát hiện qua Test
1. **Lưu nháp**: Nút "Lưu nháp" thiếu feedback UI -> Đã thêm AntD Notification.
2. **Coupon %**: Frontend checkout tính sai giá trị chiết khấu % -> Đã fix logic `finalPrice` & `discountDisplayAmount`.
3. **Session Timing**: Một số test case timeout trên Real Supabase -> Đã nâng timeout lên 30s + `singleThread: true`.

### ⏭️ Tiếp theo
- Tối ưu hóa cleanup data sau test (hiện tại thỉnh thoảng lỗi Auth constraint khi xóa user).
- Mở rộng Task 5.1 - 5.4 cho toàn bộ các trang archive và detail.
