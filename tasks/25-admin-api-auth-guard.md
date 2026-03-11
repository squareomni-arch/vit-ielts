# Task 25 — Admin API Authentication Guard ✅ COMPLETED

## Mô tả

⚠️ **VẤN ĐỀ BẢO MẬT NGHIÊM TRỌNG**: 13+ admin API routes không có authentication check — ai cũng truy cập được dữ liệu admin (users, orders, coupons, settings...).

Chỉ có `GET /api/admin/dashboard` kiểm tra quyền admin đúng cách.

## Prerequisites

- Task 02 (Auth system)
- Task 16 (Admin layout)

## Công việc cụ thể

### 1. Tạo admin auth middleware/helper

**File tạo mới**: `lib/admin-auth.ts` hoặc `utils/admin-guard.ts`

Tái sử dụng pattern từ `pages/api/admin/dashboard.ts`:

```typescript
import { createApiSupabase } from "~supabase/server";
import { supabaseAdmin } from "~supabase/admin";

export async function requireAdmin(req, res) {
  const supabase = createApiSupabase(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return res.status(401).json({ success: false, error: "Unauthorized" });

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];
  if (!roles.includes("administrator"))
    return res.status(403).json({ success: false, error: "Forbidden" });

  return user; // Return user nếu OK
}
```

### 2. Thêm auth guard vào tất cả admin routes

**Files cần sửa (CRUD routes — ĐỘ ƯU TIÊN CAO):**

- `pages/api/admin/quizzes/index.ts`
- `pages/api/admin/quizzes/[id].ts`
- `pages/api/admin/quizzes/[id]/clone.ts`
- `pages/api/admin/orders/index.ts`
- `pages/api/admin/orders/[id].ts`
- `pages/api/admin/orders/export.ts`
- `pages/api/admin/posts/index.ts`
- `pages/api/admin/posts/[id].ts`
- `pages/api/admin/sample-essays/index.ts`
- `pages/api/admin/sample-essays/[id].ts`
- `pages/api/admin/users/` (tất cả files)
- `pages/api/admin/coupons.ts`
- `pages/api/admin/coupons-v2.ts`
- `pages/api/admin/settings/index.ts`
- `pages/api/admin/test-results/`
- `pages/api/admin/affiliate/users.ts`
- `pages/api/admin/affiliate/detail.ts`
- `pages/api/admin/affiliate-v2/index.ts`
- `pages/api/admin/affiliate-v2/commissions.ts`
- `pages/api/admin/affiliate-v2/[id].ts`
- `pages/api/admin/upload-image.ts`
- `pages/api/admin/debug-upload.ts`
- `pages/api/admin/privacy-policy.ts`
- `pages/api/admin/terms-of-use.ts`

**Files KHÔNG cần auth (public config — chỉ đọc, dùng trong getServerSideProps):**

- `pages/api/admin/home/*-config.ts`
- `pages/api/admin/header/top-bar-config.ts`
- `pages/api/admin/ielts-exam-library/hero-banner-config.ts`
- `pages/api/admin/ielts-practice-library/banner-config.ts`
- `pages/api/admin/sample-essay/banner-config.ts`
- `pages/api/admin/subscription/*-config.ts`
- `pages/api/admin/account/login-config.ts`
- `pages/api/admin/account/register-config.ts`

**Files cần auth cho POST nhưng GET công khai (CMS editor routes):**

- `pages/api/admin/home/hero-banner.ts` — GET public, POST cần auth
- `pages/api/admin/home/practice-section.ts`
- `pages/api/admin/home/test-platform-intro.ts`
- `pages/api/admin/home/testimonials.ts`
- `pages/api/admin/home/why-choose-us.ts`
- `pages/api/admin/header/top-bar.ts`
- `pages/api/admin/footer/cta-banner.ts`
- `pages/api/admin/subscription/banner.ts`
- `pages/api/admin/subscription/course-packages.ts`
- `pages/api/admin/subscription/faq.ts`

### 3. Fix admin account routes

- `pages/api/admin/account/login.ts` — Trả 200 với body rỗng → cần validate
- `pages/api/admin/account/register.ts` — Trả 200 với body rỗng → cần validate

## KHÔNG chạm vào

- `pages/api/admin/dashboard.ts` (đã có auth đúng cách)
- `*-config.ts` routes (public config cho SSR)
- Frontend components
- Service layer

## Acceptance Criteria

- [ ] Tạo admin auth helper có thể reuse
- [ ] Tất cả admin CRUD routes yêu cầu admin role
- [ ] CMS editor routes yêu cầu auth cho POST, cho phép GET
- [ ] Account routes validate input
- [ ] Test lại: unauthenticated request → 401/403
