# Task 01 — Supabase Foundation

## Mô tả
Thiết lập project Supabase, tạo toàn bộ database schema (18 tables), cấu hình RLS policies, và tạo Supabase client files cho Next.js.

## Prerequisites
- Không có (task đầu tiên)

## Context cần đọc
- `NEW_CODEBASE_ANALYSIS.md` → mục 5 (Database Schema & RLS)
- `CLAUDE.md` → mục Architecture / Key Supabase Tables

## Công việc cụ thể

### 1. Tạo Supabase Project
- Tạo project trên supabase.com
- Lấy URL + anon key + service role key
- Cấu hình Google OAuth provider trong Supabase Auth

### 2. Tạo SQL Migration
**File tạo mới**: `supabase/migrations/001_initial_schema.sql`

Tạo 18 tables (copy từ `NEW_CODEBASE_ANALYSIS.md` mục 5.1):
- `users` (extends auth.users)
- `quizzes`, `passages`, `questions`
- `test_results`
- `mock_tests`, `mock_test_collections`
- `orders`, `coupons`
- `affiliates`, `affiliate_links`, `affiliate_visits`, `commissions`
- `cms_configs`, `site_settings`, `menus`
- `posts`, `sample_essays`

Tạo indexes:
```sql
CREATE INDEX idx_quizzes_skill_type ON quizzes(skill, type);
CREATE INDEX idx_quizzes_slug ON quizzes(slug);
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_quiz ON test_results(quiz_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_passages_quiz ON passages(quiz_id);
CREATE INDEX idx_questions_passage ON questions(passage_id);
```

Tạo RPC function:
```sql
CREATE OR REPLACE FUNCTION increment_tests_taken(p_quiz_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quizzes SET tests_taken = tests_taken + 1 WHERE id = p_quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Tạo RLS Policies
**File**: trong cùng migration file

Áp dụng RLS cho TẤT CẢ tables (xem `NEW_CODEBASE_ANALYSIS.md` mục 5.2)

### 4. Tạo Supabase Client Files

**File tạo mới**: `lib/supabase/client.ts`
```typescript
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File tạo mới**: `lib/supabase/server.ts`
- SSR client dùng `createServerClient` + cookie handling
- Xem code mẫu trong `NEW_CODEBASE_ANALYSIS.md` mục 3.2

**File tạo mới**: `lib/supabase/admin.ts`
```typescript
import { createClient } from "@supabase/supabase-js";
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 5. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 6. Cấu hình Environment
**File sửa**: `.env.local` (tạo mới nếu chưa có)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 7. Update tsconfig paths
**File sửa**: `tsconfig.json` — thêm alias
```json
"~supabase/*": ["./lib/supabase/*"]
```

## Files tạo mới
- `supabase/migrations/001_initial_schema.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`

## Files sửa
- `package.json` (thêm dependencies)
- `tsconfig.json` (thêm alias)
- `.env.local` (thêm env vars)

## KHÔNG chạm vào
- `src/` (chưa sửa frontend)
- `pages/` (chưa sửa pages)
- `lib/server/` (chưa xóa helpers cũ)

## Acceptance Criteria
- [ ] Supabase project đã tạo, có URL + keys
- [ ] SQL migration chạy thành công (18 tables, indexes, RLS)
- [ ] 3 client files tạo xong, import không lỗi
- [ ] `npm run build` không có TypeScript errors mới
