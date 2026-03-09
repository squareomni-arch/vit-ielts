# Task 22 — Migration Issues ✅ COMPLETED

> Ngày: 2026-03-09 | Hoàn thành: 2026-03-09 14:00

## ✅ Đã migrate thành công

| Table             | Rows       | Nguồn                             | Script                        |
| ----------------- | ---------- | --------------------------------- | ----------------------------- |
| quizzes           | 298        | WP GraphQL (basic info)           | `run-migration.mjs`           |
| mock_tests        | 3          | WP GraphQL                        | `run-migration.mjs`           |
| orders            | 13         | `data/orders.json`                | `run-migration.mjs`           |
| posts             | 7          | WP GraphQL                        | `run-migration.mjs`           |
| cms_configs       | 17         | `config/*.json`                   | `run-migration.mjs`           |
| affiliates        | 1          | `data/affiliates.json`            | `run-migration.mjs`           |
| affiliate_links   | 5          | `data/affiliate-links.json`       | `run-migration.mjs`           |
| affiliate_visits  | 4          | `data/affiliate-visits.json`      | `run-migration.mjs`           |
| commissions       | 6          | `data/affiliate-commissions.json` | `run-migration.mjs`           |
| **users**         | **7,660**  | DB export (`data/wp-users.json`)  | `migrate-users-from-db.mjs`   |
| **test_results**  | **23,067** | WP GraphQL                        | `migrate-test-results.mjs`    |
| **passages**      | **492**    | WP GraphQL (nested ACF)           | `migrate-passages-essays.mjs` |
| **questions**     | **1,126**  | WP GraphQL (nested ACF)           | `migrate-passages-essays.mjs` |
| **sample_essays** | **3**      | WP GraphQL                        | `migrate-passages-essays.mjs` |

## ⚠️ Lưu ý

### Test Results — 767 FK errors

- Users được tạo trong `auth.users` nhưng một số không insert được vào `public.users` (lỗi date_of_birth format)
- Test results của các users này bị FK constraint reject
- Fix: tạo lại rows trong `public.users` cho các users bị thiếu

### Users — 1 error

- 1 user có date_of_birth format lạ → profile insert thất bại (auth user vẫn tạo OK)

### Coupons — Bỏ qua

- `data/coupons.json` rỗng (`[]`)

## ⏳ Deferred — Ưu tiên thấp

### Site Settings & Menus

- Chưa migrate, cần DB export từ `mf_options`
- Không ảnh hưởng đến chức năng chính

## Mapping Files

- `data/user-id-mapping.json` — 7,660 entries (`wp_user_id → supabase_uuid`)
- `data/quiz-id-mapping.json` — 298 entries (`wp_databaseId → supabase_uuid`)

## Ghi chú kỹ thuật

- **WP GraphQL endpoint**: `https://cms.ieltspredictiontest.com/graphql`
- **WP GraphQL ACF naming**: Không nhất quán — top-level dùng snake_case (`passage_content`), nested dùng camelCase (`matchingItems`, `correctAnswer`). Cần introspection per-type.
- **ESM issue**: Dùng `.mjs` thay vì `.ts` do `@supabase/supabase-js` v2 ESM-only.
- **dotenv v17**: Tự inject từ `.env.local`, nhưng cần `config({ path: '.env.local' })` để load đúng file.
