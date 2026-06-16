# Kế hoạch thay đổi Backend — Vit IELTSKế hoạch thay đổi Backend — Vit IELTS

## 1. Phân tích hệ thống hiện tại1. Phân tích hệ thống hiện tại

## Kiến trúc hiện tạiKiến trúc hiện tại

```
graph TB
subgraph "Frontend (Next.js on Vercel)"
A[Pages SSR/CSR]
B[Apollo Client]
C[Next.js API Routes]
D[JSON Files / Vercel KV]
end
```
```
subgraph "Backend (WordPress)"
E[WPGraphQL Plugin]
F[ACF Custom Fields]
G[Custom Post Types]
H[REST API]
I[MySQL Database]
end
```
```
A --> B
B --> E
C --> D
C --> H
E --> I
H --> I
```
## Dữ liệu đang lưu ở ĐÂUDữ liệu đang lưu ở ĐÂU

#### Loại dữ liệuLoại dữ liệu Lưu ở đâuLưu ở đâu Ghi chúGhi chú

#### UsersUsers (email, avatar, isPro, proExpiration) WordPress MySQL + ACF Qua WPGraphQL + REST API

#### QuizzesQuizzes (bài test IELTS) WordPress Custom Post Type ~2000+ bài, có passages, questions,

#### answers

#### Test ResultsTest Results (bài làm của user) WordPress Custom Post Type answers JSON, score, timeLeft

#### OrdersOrders (đơn hàng Pro) JSON file (data/orders.json) → Vercel KV Sepay webhook cập nhật

#### AffiliatesAffiliates (hoa hồng, links) JSON file (data/affiliate-*.json) → Vercel

#### KV

#### 4 JSON files

#### CouponsCoupons (mã giảm giá) JSON file (data/coupons.json) → Vercel KV

#### CMS ContentCMS Content (hero banner, testimonials,

#### FAQ...)

#### JSON file (config/*.json) → Vercel KV 17 JSON files cho admin CMS

#### AuthenticationAuthentication WordPress JWT tokens + cookies Custom login/register mutations

## Các GraphQL Queries/Mutations đang dùng (WordPress)Các GraphQL Queries/Mutations đang dùng (WordPress)

#### AuthenticationAuthentication

```
login — Đăng nhập (PASSWORD / GOOGLE provider)
registerUser — Đăng ký
refreshToken — Gia hạn token
checkDevice — Kiểm tra thiết bị đăng nhập
```
#### Quiz & TestQuiz & Test


```
GET_PRACTICE_TESTS — Danh sách bài test
GET_PRACTICE_SINGLE — Chi tiết 1 bài test (passages, questions, options)
GET_EXAM_COLLECTIONS — Bộ sưu tập đề thi
TAKE_THE_TEST — Bắt đầu làm bài (tạo test result draft)
SAVE_DRAFT — Lưu nháp bài làm
SUBMIT_ANSWER — Nộp bài
GET_TEST_RESULT — Kết quả bài thi
GET_PRACTICE_HISTORY — Lịch sử làm bài
```
#### UserUser

```
GET_MASTER_DATA — Dữ liệu viewer + menu + settings
GET_USERDATA — Thông tin profile
UPDATE_USER — Cập nhật profile
GET_USER_PAYMENT_HISTORY — Lịch sử thanh toán
UPDATE_TARGET_SCORE / UPDATE_EXAM_DATE — Mục tiêu điểm
```
#### ContentContent

```
GET_POSTS — Bài viết blog
GET_SAMPLE_ESSAYS — Bài mẫu IELTS
GET_NEWS_ARCHIVE_DATA — Archive tin tức
```
#### Orders (WordPress GraphQL + JSON fallback)Orders (WordPress GraphQL + JSON fallback)

```
CREATE_ORDER — Tạo đơn hàng
```
### API Routes hiện tại (Next.js API Routes hiện tại (Next.js /pages/api//pages/api/))

#### RouteRoute Chức năngChức năng StorageStorage

#### /api/admin/* (17 routes) CMS quản lý nội dung JSON → KV

#### /api/orders/create Tạo đơn hàng JSON → KV + WordPress

#### /api/orders/[orderId] Chi tiết đơn JSON → KV

#### /api/webhooks/sepay Webhook thanh toán, kích hoạtPro JSON REST→ KV + WordPress

#### /api/affiliate/* (

#### routes)

#### Hệ thống hoa hồng JSON → KV

#### /api/coupons/* (2 routes) Mã giảm giá JSON → KV

## 2. Tech Stack mới2. Tech Stack mới

### SupabaseSupabase

```
[!IMPORTANT] SupabaseSupabase là lựa chọn tốt nhất cho dự án này vì:
PostgreSQL database (thay thế hoàn toàn MySQL WordPress + JSON/KV)
Auth system sẵn có (thay thế WordPress JWT)
REST API tự động từ database schema
Realtime subscriptions (nếu cần sau này)
File Storage (thay thế WordPress Media Library)
Free tier đủ dùng cho hàng ngàn users
Quan trọng nhấtQuan trọng nhất: Frontend Next.js GIỮ NGUYÊN, chỉ đổi cách gọi API
```
## 3. Thiết kế Database mới (Supabase PostgreSQL)3. Thiết kế Database mới (Supabase PostgreSQL)

```
erDiagram
users ||--o{ test_results : takes
users ||--o{ orders : places
users ||--o{ affiliates : registers
quizzes ||--o{ test_results : has
quizzes ||--o{ passages : contains
passages ||--o{ questions : has
```

passages ||--o{ questions : has
affiliates ||--o{ affiliate_links : has
affiliates ||--o{ commissions : earns
orders ||--o{ commissions : generates

users {
uuid id PK
text email
text name
text avatar_url
boolean is_pro
date pro_expiration_date
float target_score
date exam_date
text gender
date date_of_birth
jsonb roles
timestamp created_at
}

quizzes {
uuid id PK
text title
text slug
text excerpt
text type
text skill
int time_minutes
boolean pro_user_only
text score_type
text featured_image
text audio_url
int tests_taken
text status
timestamp published_at
timestamp created_at
}

passages {
uuid id PK
uuid quiz_id FK
text title
text content
int sort_order
int audio_start
int audio_end
}

questions {
uuid id PK
uuid passage_id FK
text type
text title
text question_text
text instructions
text question_form
jsonb list_of_questions
jsonb list_of_options
jsonb matching_question
jsonb matrix_question
jsonb explanations
int option_choose
int sort_order
}

test_results {


test_results {
uuid id PK
uuid user_id FK
uuid quiz_id FK
jsonb answers
jsonb test_part
text time_left
int test_time
text test_mode
float score
text status
timestamp submitted_at
timestamp created_at
}

orders {
uuid id PK
text order_id
uuid user_id FK
text package_type
int duration
text skill_type
int amount
int original_amount
text coupon_id
text coupon_code
int discount_amount
text status
text payment_method
text transfer_content
text affiliate_ref
timestamp created_at
}

coupons {
uuid id PK
text code
text type
int value
int max_uses
int current_uses
boolean is_active
timestamp created_at
}

affiliates {
uuid id PK
uuid user_id FK
text custom_link
text status
float commission_rate
timestamp created_at
}

affiliate_links {
uuid id PK
uuid affiliate_id FK
text custom_link
timestamp created_at
}

commissions {
uuid id PK
uuid affiliate_id FK
text order_id
int amount
float commission_rate


```
float commission_rate
int commission_amount
text status
timestamp created_at
}
```
```
affiliate_visits {
uuid id PK
uuid affiliate_id FK
uuid link_id FK
text ip
text user_agent
boolean converted
text order_id
timestamp created_at
}
```
```
cms_configs {
uuid id PK
text section_name UK
jsonb data
timestamp updated_at
}
```
```
site_settings {
uuid id PK
text key UK
jsonb value
timestamp updated_at
}
```
```
posts {
uuid id PK
text title
text slug
text content
text excerpt
text featured_image
text status
jsonb seo
timestamp published_at
}
```
```
sample_essays {
uuid id PK
text title
text slug
text content
text skill
text type
text featured_image
jsonb seo
timestamp published_at
}
```
```
menus {
uuid id PK
text location
jsonb items
timestamp updated_at
}
```
## 4. Kế hoạch Migration4. Kế hoạch Migration


### Thiết lập Supabase + Tạo DatabaseThiết lập Supabase + Tạo Database

```
1. Tạo project trên supabase.com
2. Chạy SQL migration tạo bảng (schema ở trên)
3. Thiết lập Auth (Email + Google OAuth)
4. Cấu hình Row Level Security (RLS) policies
5. Tạo file .env mới:
```
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb... # chỉ dùng server-side
```
### Viết Migration Script — Chuyển dữ liệuViết Migration Script — Chuyển dữ liệu

```
1. Export WordPress dataExport WordPress data → SQL/JSON:
Users: WordPress REST API → Supabase users
Quizzes + Passages + Questions: WP Custom Posts → Supabase tables
Test Results: WP Custom Posts → Supabase test_results
2. Import JSON/KV dataImport JSON/KV data → Supabase:
data/*.json → Supabase tables (orders, affiliates, etc.)
config/*.json → Supabase cms_configs table
3. Viết script scripts/migrate-wp-to-supabase.ts
```
### Tạo API Layer mớiTạo API Layer mới

Tạo Supabase client wrapper thay thế Apollo Client:

```
// lib/supabase/client.ts (browser)
import { createBrowserClient } from "@supabase/ssr";
```
```
export const supabase = createBrowserClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```
```
// lib/supabase/server.ts (server-side)
import { createServerClient } from "@supabase/ssr";
```
```
export function createServerSupabase(context) {
return createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{ cookies: context.req.cookies },
);
}
```
Tạo service functions thay thế từng GraphQL query:


```
// services/quiz.ts
export async function getQuizBySlug(supabase, slug: string) {
const { data: quiz } = await supabase
.from("quizzes")
.select(
`
*,
passages (
*,
questions (*)
)
`,
)
.eq("slug", slug)
.single();
```
```
return quiz;
}
```
```
// services/test-result.ts
export async function getTestResult(supabase, id: string) {
const { data } = await supabase
.from("test_results")
.select("*, quizzes(*)")
.eq("id", id)
.single();
```
```
return data;
}
```
### Chuyển đổi từng trangChuyển đổi từng trang

Thay đổi từng page một, kiểm tra kỹ trước khi chuyển:

#### ƯuƯu

#### tiêntiên TrangTrang Thay đổiThay đổi

#### 1 Auth (login, register) WP JWT → Supabase Auth

#### 2 Take the Test WPGraphQL → Supabase queries

#### 3 Test Result WPGraphQL → Supabase queries

#### 4 Exam Library WPGraphQL → Supabase queries

#### 5 Practice Library WPGraphQL → Supabase queries

#### 6 Account (profile,history) WPGraphQL → Supabase queries

#### 7 Orders + Checkout JSON/KV → Supabase tables

#### 8 Affiliate system JSON/KV → Supabase tables

#### 9 Admin CMS pages JSON/KV → Supabase cms_configs

#### 10 Blog/Sample Essays WPGraphQL → Supabase queries

#### 11 Webhook Sepay WP REST → Supabase update

### Testing & QATesting & QA

```
Test toàn bộ flow: Đăng ký → Mua Pro → Làm bài → Xem kết quả
Test webhook Sepay
Test affiliate system
Test admin CMS
```

```
Performance testing
```
### Deploy & CleanupDeploy & Cleanup

```
Deploy lên Vercel với env mới
Loại bỏ dependencies: @apollo/client, graphql, @vercel/kv, apollo-upload-client
Xóa WordPress server
Monitor logs 1 tuần
```
## 6. Lợi ích sau khi chuyển6. Lợi ích sau khi chuyển

#### Trước (WordPress)Trước (WordPress) Sau (Supabase)Sau (Supabase)

####  Backend chậm, nhiều plugin lỗi  Backend nhanh, ổn định

####  JSON files + KV (dễ mất data)  PostgreSQL database thống nhất

####  Auth JWT tự code (nhiều bug)  Auth sẵn có, bảo mật tốt

####  Phải quản lý VPS WordPress  Managed hosting, tự scale

####  ~$10-30/tháng VPS  Free tier (đủ dùng)

####  GraphQL phức tạp, khó debug  REST API đơn giản

####  SEO phụ thuộc Yoast plugin  Tự quản lý SEO

## 7. Cấu trúc Admin Dashboard7. Cấu trúc Admin Dashboard

#### 7.1. Dashboard tổng quan (MỚI)7.1. Dashboard tổng quan (MỚI)

```
Tổng số users / users Pro / users mới hôm nay
Tổng số bài test đã làm
Doanh thu tháng này
Biểu đồ users đăng ký theo ngày/tuần (Line chart)
Đơn hàng gần đây (pending/completed)
Top 10 bài test làm nhiều nhất
```
#### 7.2. Quản lý Users (MỚI — thay thế WordPress Users)7.2. Quản lý Users (MỚI — thay thế WordPress Users)

```
Danh sách tất cả users (tìm kiếm, lọc theo Pro/Free, sắp xếp)
Xem chi tiết user:
Profile (name, email, avatar, ngày đăng ký)
Lịch sử làm bài (test results)
Lịch sử thanh toán (orders)
Bật/tắt Pro thủ công + set ngày hết hạn
Khóa/mở tài khoản
Reset mật khẩu
```
#### 7.3. Quản lý Quizzes (MỚI — thay thế WordPress Posts)7.3. Quản lý Quizzes (MỚI — thay thế WordPress Posts)

```
[!WARNING] Đây là module phức tạp nhất vì cấu trúc nested: Quiz → Passages → Questions → Options/Matching/Matrix
Danh sách bài test (CRUD, lọc theo skill/type/status)
Thêm/sửa bài test:
Thông tin chungThông tin chung: title, slug, skill (reading/listening), time, score_type, pro_user_only
Featured imageFeatured image: upload ảnh
AudioAudio: upload file audio (cho Listening)
PassagesPassages (drag & drop sắp xếp):
Title + Content (Rich text editor)
Audio start/end timestamps (cho Listening)
QuestionsQuestions cho mỗi passage (drag & drop):
Type: multiple_choice, fill_in_blank, true_false_not_given, matching, matrix, list_of_headings...
Title, question text, instructions
List of questions + options + correct answers
Matching question config (layoutType, matchingItems, answerOptions)
Matrix question config (categories, items)
Explanations (rich text)
Clone bài test (duplicate toàn bộ quiz + passages + questions)
Import/Export bài test (JSON)
Bulk actions: publish/draft/delete
```

#### 7.4. Quản lý Test Results (MỚI — thay thế WordPress)7.4. Quản lý Test Results (MỚI — thay thế WordPress)

```
Danh sách kết quả bài thi
Lọc theo: user, bài test, ngày, điểm, status
Xem chi tiết kết quả (answers, score, time spent)
Xóa kết quả rác (draft/expired)
Thống kê: điểm trung bình theo bài test, phân phối điểm
```
#### 7.5. Quản lý Orders (MỚI — nâng cấp từ JSON)7.5. Quản lý Orders (MỚI — nâng cấp từ JSON)

```
Danh sách đơn hàng (pending, completed, cancelled)
Lọc theo status, ngày, user
Xác nhận thanh toán thủ công (pending → completed)
Tự động kích hoạt Pro khi confirmed
Xem chi tiết: thông tin gói, user, mã giảm giá, affiliate ref
Export danh sách đơn hàng (CSV)
```
#### 7.6. Quản lý Blog Posts (MỚI — thay thế WordPress Posts)7.6. Quản lý Blog Posts (MỚI — thay thế WordPress Posts)

```
Danh sách bài viết (CRUD)
Rich text editor (Tiptap hoặc TinyMCE)
SEO fields (title, description, slug)
Featured image upload
Status: draft/published
Categories/Tags (optional)
```
#### 7.7. Quản lý Sample Essays (MỚI — thay thế WordPress)7.7. Quản lý Sample Essays (MỚI — thay thế WordPress)

```
Danh sách bài mẫu IELTS (CRUD)
Filter theo skill (speaking, writing, reading, listening)
Rich text editor cho nội dung
SEO fields
```
#### 7.8. Settings (MỚI)7.8. Settings (MỚI)

```
Site settings (site name, logo URL, favicon, SEO mặc định)
Menu management (header menu items)
SMTP email config (host, port, user, password)
Payment config (Sepay account info, webhook secret)
Google OAuth config (client ID)
```
### Sidebar Menu sau migrationSidebar Menu sau migration

```
 Dashboard
 Users
 Quizzes
└── Danh sách bài test
└── Thêm bài test mới
 Test Results
 Orders
️ Coupons
 Affiliate
 Blog Posts
 Sample Essays
───────────────
 CMS Content
└── Home (5 sections)
└── Exam Library
└── Practice Library
└── Subscription
└── Sample Essay Banner
└── Header / Footer
└── Account Pages
└── Legal Pages
⚙️ Settings
```
### Ưu tiên xây dựng admin modulesƯu tiên xây dựng admin modules

#### ƯuƯu

#### tiêntiên ModuleModule Lý doLý do


####  1 Users Cần quản lý user Pro ngay khi bỏ

#### WordPress

####  2 Quizzes Module lớn nhất, cần làm sớm

####  3 Orders Cần xử lý thanh toán

####  4 Dashboard Tổng quan hệ thống

####  5 Test Results Theo dõi bài thi

####  6 Blog Posts Ít thay đổi, có thể làm sau

####  7 Sample Essays Ít thay đổi

####  8 Settings Config 1 lần

#### ƯuƯu

#### tiêntiên ModuleModule Lý doLý do


