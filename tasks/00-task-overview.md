# Task Overview — IELTS Prediction Migration

## Dependency Graph

```
PHASE 1: Foundation
  Task 01 ──→ Task 02 ──→ (tất cả tasks sau)

PHASE 2: Core Services (song song, không phụ thuộc nhau)
  Task 03: Scoring Engine
  Task 04: Quiz Service + Types
  Task 05: User & CMS Services

PHASE 3: Business Logic (phụ thuộc Phase 2)
  Task 06: Test Flow (phụ thuộc 03 + 04)
  Task 07: Exam Collections (phụ thuộc 04)
  Task 08: Orders + Payment (phụ thuộc 05)
  Task 09: Affiliate + Coupons (phụ thuộc 05)

PHASE 4: Frontend Pages (phụ thuộc services tương ứng)
  Task 10: Auth Pages (phụ thuộc 02)
  Task 11: Library Pages (phụ thuộc 04 + 07)
  Task 12: Test Pages (phụ thuộc 06)
  Task 13: Account Pages (phụ thuộc 05 + 08)
  Task 14: Content Pages (phụ thuộc 05)
  Task 15: Home + Static Pages (phụ thuộc 05)

PHASE 5: Admin Dashboard (phụ thuộc services tương ứng)
  Task 16: Admin Layout + Dashboard (phụ thuộc 05)
  Task 17: Admin Users (phụ thuộc 05)
  Task 18: Admin Quizzes (phụ thuộc 04)
  Task 19: Admin Orders + Coupons (phụ thuộc 08 + 09)
  Task 20: Admin Content (phụ thuộc 05)
  Task 21: Admin Settings (phụ thuộc 05)

PHASE 6: Migration + Cleanup
  Task 22: Data Migration Scripts (phụ thuộc Phase 1)
  Task 23: Cleanup + Deploy (sau TẤT CẢ tasks)

PHASE 7: Bug Fixes & Security (từ API audit 10/03/2026)
  Task 24: Fix API Error Handling (không phụ thuộc)
  Task 25: Admin API Auth Guard ⚠️ BẢO MẬT (phụ thuộc 02 + 16)
```

## Quy tắc cho Agent

1. **Đọc trước khi code**: `CLAUDE.md` + `LEGACY_CODEBASE_DOCS.md` + `NEW_CODEBASE_ANALYSIS.md`
2. **Mỗi task**: Độc lập, có acceptance criteria rõ ràng
3. **Không chồng chéo**: Mỗi file chỉ thuộc 1 task
4. **Tham chiếu**: Dùng `@origin` comment khi port PHP code
