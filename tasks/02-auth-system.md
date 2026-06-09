# Task 02 — Authentication System

## Mô tả
Thay thế toàn bộ WordPress JWT auth bằng Supabase Auth. Rewrite auth provider, tạo getMasterData mới, và tạo auth callback page.

## Prerequisites
- Task 01 hoàn thành (Supabase clients sẵn sàng)

## Context cần đọc
- `LEGACY_CODEBASE_DOCS.md` → mục 2 (Authentication & Authorization) — hiểu flow cũ
- `NEW_CODEBASE_ANALYSIS.md` → mục 4 (Authentication Flow mới) — code mẫu
- `CLAUDE.md` → mục Architecture (HOCs/State) & Naming Conventions
- File cũ: `src/appx/providers/auth-provider.tsx` (321 dòng)
- File cũ: `src/appx/providers/apollo-provider.tsx` (69 dòng)
- File cũ: `src/shared/graphql/createServerApolloClient.ts` (136 dòng)
- File cũ: `src/shared/hoc/withMasterData.tsx` (96 dòng)

## Công việc cụ thể

### 1. Rewrite Auth Provider
**File sửa**: `src/appx/providers/auth-provider.tsx`

Thay toàn bộ nội dung. Logic mới:
- `signIn({ email, password })` → `supabase.auth.signInWithPassword()`
- `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: "google" })`
- `signUp({ email, password, name, dateOfBirth, gender })` → `supabase.auth.signUp()` + insert `users` table
- `signOut()` → `supabase.auth.signOut()`
- `getUser()` → `supabase.auth.getUser()`
- **XÓA**: refreshToken logic (Supabase auto-refresh)
- **XÓA**: deviceId trong login (chuyển sang Task 05)

Xem code mẫu: `NEW_CODEBASE_ANALYSIS.md` mục 4.2

### 2. Xóa Apollo Provider
**File xóa**: `src/appx/providers/apollo-provider.tsx`

### 3. Update Provider Index
**File sửa**: `src/appx/providers/index.ts`
- Xóa export `ApolloProvider`
- Giữ export `AuthProvider`, `AppProvider`, types

### 4. Update App Wrapper
**File sửa**: `src/appx/index.tsx`
- Xóa `import { ApolloProvider }` và `<ApolloProvider>` wrapper
- Giữ `GoogleOAuthProvider` nếu vẫn dùng Google Sign-in qua Supabase
- Hoặc xóa `GoogleOAuthProvider` nếu Supabase OAuth xử lý redirect

### 5. Tạo getMasterData
**File tạo mới**: `lib/supabase/getMasterData.ts`

Thay thế `src/shared/hoc/withMasterData.tsx`. Logic:
- Tạo server Supabase client
- Query `users` table (thay thế GraphQL `viewer`)
- Query `site_settings` table (thay thế `allSettings` + `websiteOptions`)
- Query `menus` table (thay thế `menuData`)
- Return `{ props: { masterData: {...} } }`

Xem code mẫu: `NEW_CODEBASE_ANALYSIS.md` mục 4.3

### 6. Tạo Auth Callback Page
**File tạo mới**: `pages/auth/callback.tsx`

Cho Google OAuth redirect:
```typescript
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
  }, []);
  return <div>Đang xử lý đăng nhập...</div>;
}
```

### 7. Update App Provider Types
**File sửa**: `src/appx/providers/app-provider.tsx`
- Update `MasterData` type: bỏ `userCredentials`, đổi `viewer` structure
- Bỏ dependency vào GraphQL types

## Files tạo mới
- `lib/supabase/getMasterData.ts`
- `pages/auth/callback.tsx`

## Files sửa
- `src/appx/providers/auth-provider.tsx` (rewrite)
- `src/appx/providers/app-provider.tsx` (update types)
- `src/appx/providers/index.ts` (remove Apollo export)
- `src/appx/index.tsx` (remove ApolloProvider wrapper)

## Files xóa
- `src/appx/providers/apollo-provider.tsx`

## KHÔNG chạm vào
- `src/shared/graphql/` (xóa ở Task 23 cleanup)
- `src/shared/hoc/withMasterData.tsx` (giữ tạm, pages sẽ migrate dần)
- `pages/account/login.tsx`, `register.tsx` (sửa ở Task 10)
- `src/shared/hooks/useDeviceID.tsx` (sửa ở Task 05)

## Acceptance Criteria
- [ ] Auth provider mới compile thành công
- [ ] `getMasterData()` trả về đúng structure MasterData
- [ ] App wrapper không còn ApolloProvider
- [ ] Auth callback page tồn tại
- [ ] `npm run build` thành công (pages cũ có thể warning nhưng không break)
