# Tài liệu chi tiết Codebase cũ — Vit IELTS

> **Mục đích**: Tài liệu tham khảo cho các agent/developer sau khi migration sang Supabase. Ghi lại toàn bộ logic, luồng dữ liệu, và cách hoạt động của hệ thống WordPress + Next.js hiện tại.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Quiz & Test System (Luồng làm bài)](#3-quiz--test-system)
4. [Scoring Engine (Chấm điểm)](#4-scoring-engine)
5. [Exam Collections (Bộ sưu tập đề thi)](#5-exam-collections)
6. [Orders & Payment (Thanh toán)](#6-orders--payment)
7. [Affiliate System (Hoa hồng)](#7-affiliate-system)
8. [Admin CMS (Quản lý nội dung)](#8-admin-cms)
9. [User Management](#9-user-management)
10. [Blog & Sample Essays](#10-blog--sample-essays)
11. [Data Storage Layer](#11-data-storage-layer)
12. [GraphQL API Reference](#12-graphql-api-reference)
13. [File Map & Code Locations](#13-file-map--code-locations)
14. [Known Issues & Bugs](#14-known-issues--bugs)

---

## 1. Tổng quan kiến trúc

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (Pages Router) | 15.x |
| React | React + ReactDOM | 19.x |
| UI Library | Ant Design | 5.x |
| CSS | Tailwind CSS | 4.x |
| State | Zustand | 5.x |
| GraphQL | Apollo Client + graphql | 3.x / 16.x |
| Auth (Client) | js-cookie + @react-oauth/google | - |
| Device ID | @fingerprintjs/fingerprintjs | 4.x |
| Backend | WordPress (headless) | - |
| GraphQL Server | WPGraphQL plugin | - |
| Custom Fields | ACF Pro + wpgraphql-acf | - |
| Auth (Server) | wp-graphql-headless-login (JWT) | - |
| Data Storage | JSON files + Vercel KV (Redis) | - |
| Image Upload | Vercel Blob / imgBB | - |
| Email | Nodemailer (SMTP) | - |
| Payment | Sepay webhook | - |

### Provider Chain (App Wrapper)

**File**: `src/appx/index.tsx`

```
ProgressProvider
└── AppProvider (masterData context)
    └── GoogleOAuthProvider (clientId: 639199263575-...)
        └── ApolloProvider (client-side Apollo)
            └── AuthProvider (login/register/logout)
                └── ConfigProvider (Ant Design theme)
                    └── Layout (BaseLayout hoặc BlankLayout)
                        └── Component (Page)
```

**Logic chọn Layout**:
- Nếu `pageProps.masterData` tồn tại → dùng `Component.Layout || BaseLayout` + wrap trong providers
- Nếu không có `masterData` → dùng `BlankLayout`, KHÔNG wrap providers (trang admin, trang lỗi)

### SSR Data Flow

**File**: `src/shared/hoc/withMasterData.tsx`

Mỗi page có `getServerSideProps` gọi `withMasterData(context)`:

1. `createServerApolloClient(context)` — tạo Apollo client server-side, đọc JWT từ cookie
2. Query `GET_MASTER_DATA` — lấy `viewer`, `menuData`, `allSettings`, `websiteOptions`
3. Trả về `props.masterData` cho page component
4. `AppProvider` nhận `masterData` và cung cấp qua `useAppContext()` hook

**GET_MASTER_DATA query lấy:**
- `websiteOptions.websiteOptionsFields.generalSettings` — logo, favicon, facebook, email, zalo, phoneNumber, preventCopy, buyProLink, bannerTestResult
- `allSettings.generalSettingsTitle` — tên trang web
- `viewer` — user đang đăng nhập (id, name, roles, avatar, isPro, proExpirationDate)
- `menuData` — main-menu + footer-menu (tree structure)

---

## 2. Authentication & Authorization

### 2.1 Login Flow

**Files**:
- Client: `src/appx/providers/auth-provider.tsx`
- Client Apollo: `src/appx/providers/apollo-provider.tsx`
- Server Apollo: `src/shared/graphql/createServerApolloClient.ts`

#### Password Login

```
User nhập email + password
    → useAuth().signIn({ username, password, provider: "PASSWORD" })
    → GraphQL mutation `login` (gửi kèm deviceId + deviceType)
        → WordPress wp-graphql-headless-login plugin
        → Trả về { authToken, refreshToken, authTokenExpiration, refreshTokenExpiration }
    → Lưu cookie "userCredentials" = JSON.stringify({ authToken, refreshToken })
        → Cookie expires = refreshTokenExpiration (UNIX timestamp → Date)
    → Router redirect về trang trước đó
```

#### Google Login

```
User click "Đăng nhập bằng Google"
    → GoogleOAuthProvider → onSuccess(credentialResponse)
    → useAuth().signIn({ provider: "GOOGLE", args: { code: credential } })
    → GraphQL mutation `login` (provider: GOOGLE, oauthResponse: { code })
        → WordPress headless-login plugin xử lý OAuth
        → Trả về { authToken, refreshToken }
    → Lưu cookie tương tự
```

#### GraphQL Mutations

```graphql
# Password login
mutation login($username: String!, $password: String!, $provider: LoginProviderEnum!, $deviceId: String!, $deviceType: String!) {
  login(input: {
    provider: $provider
    credentials: { username: $username, password: $password }
    deviceId: $deviceId
    deviceType: $deviceType
  }) {
    authToken
    authTokenExpiration
    refreshToken
    refreshTokenExpiration
  }
}

# Google login
mutation login($code: String!, $deviceId: String!, $deviceType: String!) {
  login(input: {
    provider: GOOGLE
    oauthResponse: { code: $code }
    deviceId: $deviceId
    deviceType: $deviceType
  }) {
    authToken
    authTokenExpiration
    refreshToken
    refreshTokenExpiration
  }
}
```

### 2.2 Token Refresh Flow

**JWT authToken hết hạn sau 10 GIÂY** (config tại `functions.php` line 229–231).

#### Client-side (apollo-provider.tsx):

```
Apollo request → 403 hoặc "Invalid token" error
    → errorLink bắt lỗi
    → Gọi refreshToken() từ auth-provider
        → POST /graphql với mutation refreshToken({ refreshToken })
        → Nhận authToken mới
        → Cập nhật cookie "userCredentials" (expires: 30 ngày)
    → Retry request với token mới
```

#### Server-side (createServerApolloClient.ts):

```
SSR request → 403 networkError
    → errorLink bắt lỗi
    → Gọi refreshToken() via axios POST
        → Nhận authToken mới
        → Set-Cookie header trên response (expires: 365 ngày)
    → Retry request
```

### 2.3 Register Flow

**File**: `auth-provider.tsx` → `signUp()`

```
User điền form (name, email, password, dateOfBirth, gender, avatar)
    → Tạo FormData với multipart/form-data
    → POST trực tiếp tới WordPress /graphql (không qua Apollo)
    → GraphQL mutation registerUser:
        input: { username: email, email, displayName: name, password,
                 dateOfBirth: "DD/MM/YYYY", avatar: Upload, gender, nickname: name }
    → WordPress tạo user + ACF fields
    → Trả về clientMutationId
    → Auto login sau khi register thành công
```

### 2.4 Device Fingerprint

**File**: `src/shared/hooks/useDeviceID.tsx` (Zustand store)

```
getDeviceID():
    → FingerprintJS.load() → fp.get() → result.visitorId
getDeviceType():
    → react-device-detect → "mobile" | "tablet" | "desktop"
```

**WordPress logic** (`functions.php` line 2056–2120):

- `checkDevice` query: Nhận `deviceId` + `deviceType` → so sánh với `devices` ACF field trên user
- `graphql_login_after_authenticate` hook: Sau login → lưu `deviceId` vào `devices[deviceType].device_id`
- Mỗi user lưu 1 device ID per device type (mobile/tablet/desktop)

### 2.5 Pro Status Logic

**File**: `functions.php` line 755–773

```php
// Kiểm tra is_pro khi trả về qua GraphQL:
if (field_name == 'is_pro' && node_id contains 'user_') {
    if (current_user_can('manage_options')) return true;  // Admin luôn Pro
    
    $expiration_date = get_field('pro_expiration_date', node_id);  // format "DD/MM/YYYY"
    if (!$expiration_date) return false;
    
    $unix_time = DateTime::createFromFormat('d/m/Y', $expiration_date)->getTimestamp();
    if (time() > $unix_time) return false;  // Đã hết hạn
    
    return $prepared_value;  // Giá trị gốc từ ACF
}
```

**ACF Fields trên User**:
- `is_pro` (Boolean) — cờ Pro
- `pro_expiration_date` (String) — format "DD/MM/YYYY" (hiển thị) hoặc "YYYYMMDD" (ACF internal)

---

## 3. Quiz & Test System

### 3.1 Data Model (WordPress Custom Post Types)

#### Quiz (post_type: `quiz`)

ACF Fields:
- `type` (Select: "practice" | "exam") — loại bài test
- `skill` (Select: "reading" | "listening") — kỹ năng
- `time` (Number) — thời gian làm bài (phút)
- `score_type` (String) — kiểu tính điểm
- `pro_user_only` (Boolean) — chỉ user Pro
- `audio` (File ID) — file audio cho Listening
- `pdf` (File ID) — file PDF
- `featured_image` (Image) — ảnh đại diện
- `tests_taken` (Number) — số lần đã làm
- `source` (String) — nguồn đề
- `year` (String) — năm
- `quarter` (String) — quý
- `part` (String) — phần
- `passages` (Repeater) — mảng passages, MỖI passage gồm:
    - `passage_content` (WYSIWYG) — nội dung đoạn văn
    - `title` (Text) — tiêu đề passage
    - `audio_start` / `audio_end` (Number) — thời gian audio
    - `questions` (Repeater) — mảng câu hỏi, MỖI câu hỏi gồm:
        - `type` (Select: "radio" | "select" | "fillup" | "checkbox" | "matching" | "matrix")
        - `title` (Text)
        - `question_text` (WYSIWYG)
        - `instructions` (Text)
        - `question_form` (String) — dạng câu hỏi (true_false_not_given, matching, fill_in_blank, etc.)
        - `list_of_questions` (Repeater) — cho radio/select: [{question, correct, options}]
        - `list_of_options` (Repeater) — cho checkbox: [{option_text, correct}]
        - `matching_question` (Group) — cho matching:
            - `layout_type` ("standard" | "summary" | "heading")
            - `matching_items` (Repeater) — [{questionPart, correctAnswer}]
            - `summary_text` (WYSIWYG) — text chứa {đáp án} cho dạng summary
            - `answer_options` (Repeater) — [{option_text}] (A, B, C, D...)
        - `matrix_question` (Group) — cho matrix:
            - `matrix_categories` (Repeater) — [{category_letter, category_text}]
            - `matrix_items` (Repeater) — [{item_text, correct_category_letter}]
        - `explanations` (Repeater) — [{content}] — đáp án đúng cho fillup

#### Test Result (post_type: `test-result`)

ACF Fields:
- `quiz` (Post Object → quiz) — link tới quiz
- `answers` (Textarea/JSON string) — `{"answers": [answer1, answer2, ...]}`
- `test_part` (Textarea/JSON string) — `[0, 1, 2]` (indices of passages được chọn)
- `time_left` (String) — thời gian còn lại
- `test_time` (Number) — tổng thời gian
- `test_mode` (String) — chế độ thi
- `score` (Number) — điểm (0–9, bước 0.5)
- `date_taken` (Number/Timestamp) — thời điểm bắt đầu
- `date_submitted` (Number/Timestamp) — thời điểm nộp bài

#### Mock Test (post_type: `mock_test`)

ACF Fields:
- `practice_test` (Repeater) — mảng:
    - `reading_test` (Post Object → quiz)
    - `listening_test` (Post Object → quiz)

#### Mock Test Collection (post_type: `mock-test-collection`)

ACF Fields:
- `mock_test` (Relationship → mock_test) — mảng mock_test IDs

### 3.2 Luồng "Bắt đầu làm bài" (TakeTheTest)

**GraphQL Mutation**: `TakeTheTest`  
**File**: `functions.php` line 1471–1586

```
Frontend gọi TakeTheTest({
    quizId,           // ID bài quiz (GraphQL global ID)
    testPart,         // JSON string: indices passages được chọn, vd: "[0,1,2]"
    testTime,         // thời gian (phút)
    testMode,         // chế độ thi
    retake            // boolean: có phải làm lại không
})

Backend logic:
1. Kiểm tra user đã đăng nhập (get_current_user_id() != 0)
2. Decode GraphQL ID → WordPress post ID
3. Kiểm tra Pro access:
   - User is_pro? && Quiz pro_user_only?
   - Nếu quiz là Pro mà user không phải Pro → throw error
4. Tìm draft test-result đang tồn tại:
   - WP_Query: post_type=test-result, status=draft, author=user_id, meta quiz=quiz_id
5. Nếu có draft + không retake → trả về draft cũ (resume bài làm dở)
6. Nếu retake → xóa draft cũ (wp_delete_post)
7. Tạo test-result mới:
   - wp_insert_post(post_type=test-result, status=draft, author=user_id)
   - Lưu ACF fields: quiz, test_part, test_time, date_taken, test_mode
   - Tăng tests_taken trên quiz
8. Trả về: { id (GraphQL ID), quiz, test_part, test_time, test_mode }
```

### 3.3 Luồng "Lưu nháp" (SaveTestResult)

**GraphQL Mutation**: `SaveTestResult`  
**File**: `functions.php` line 815–866

```
Frontend gọi SaveTestResult({
    testId,    // test-result GraphQL ID
    answers,   // JSON string: '{"answers": [...]}'
    timeLeft   // string: thời gian còn lại
})

Backend logic:
1. Kiểm tra đăng nhập
2. Tìm draft test-result (author=user, id=testId)
3. Nếu tồn tại → update ACF fields: answers, time_left
4. Nếu không → throw error "This test is not available for you"
```

### 3.4 Luồng "Nộp bài" (SubmitTestResult)

**GraphQL Mutation**: `SubmitTestResult`  
**File**: `functions.php` line 939–1011

```
Frontend gọi SubmitTestResult({
    testId,
    answers,       // JSON string
    timeLeft,
    dateSubmitted  // UNIX timestamp (int)
})

Backend logic:
1. Kiểm tra đăng nhập
2. Tìm draft test-result
3. Update ACF fields: answers, time_left, date_submitted, date_taken
4. Lấy quiz data + test_part
5. Parse answers: JSON decode → $answers->answers
6. Parse test_part: JSON decode → array of indices
7. GỌI calculate_score($answers, $quiz, $test_part)
8. Update score vào test-result
9. Chuyển status draft → publish (wp_update_post)
```

---

## 4. Scoring Engine

**Function**: `calculate_score($answers, $quiz, $test_part)`  
**File**: `functions.php` line 1014–1452  
**Độ dài**: ~440 dòng

### 4.1 Quy trình tổng quan

```
Input:
  - $answers: array of user answers (flat array, mỗi phần tử là answer cho 1 question group)
  - $quiz: WordPress post object (quiz)
  - $test_part: array of passage indices (vd: [0, 1, 2])

Step 1: Lọc passages
  - Lấy tất cả passages từ quiz via ACF
  - Chỉ giữ passages có index nằm trong $test_part

Step 2: Làm phẳng questions
  - Lặp qua từng passage → lấy questions
  - Gắn 'associated_passage_content' vào mỗi question (dùng cho matching-heading)
  - Merge thành mảng questions phẳng

Step 3: Chấm điểm
  - Lặp qua questions, dùng $answerIndex để track vị trí trong $answers
  - Switch theo question_type → chấm từng loại
  - Đếm $correct và $total_questions

Step 4: Tính điểm
  - raw_score = (correct / total_questions) × 9
  - rounded_score = round(raw_score × 2) / 2   // Làm tròn đến 0.5
  - Return rounded_score (0.0 – 9.0)
```

### 4.2 Chi tiết từng loại câu hỏi

#### Radio / Select

```
Data: question.list_of_questions = [{question, correct, options}, ...]
Mỗi sub-question = 1 câu hỏi, user trả lời bằng index (0, 1, 2, ...)

Chấm:
  for each sub_question in list_of_questions:
      user_answer = answers[answerIndex]  // string: "0", "1", "2"...
      correct_flag = sub_question.correct  // ACF value
      if (string)user_answer == (string)correct_flag → correct++
      answerIndex++
      total_questions++
```

#### Fillup (Điền từ)

```
Data: question.explanations = [{content: "correct answer 1 / correct answer 2"}, ...]
User nhập text, có thể nhiều đáp án cách nhau bằng "/"

Chấm:
  for each explanation:
      user_answer = trim(answers[answerIndex])
      user_answers_arr = split("/", lowercase(user_answer))
      correct_answers_arr = split("/", lowercase(explanation.content))
      
      if any user_answer in correct_answers_arr → correct++
      answerIndex++
      total_questions++
```

#### Checkbox

```
Data: question.list_of_options = [{option_text, correct: bool}, ...]
User trả lời bằng array of selected indices: [0, 2, 4]

Chấm:
  user_answer = answers[answerIndex]  // array: [0, 2, 4]
  correct_indices = [index for option if option.correct == true]
  
  sort(user_answer) == sort(correct_indices) → correct += len(correct_indices)
  total_questions += len(correct_indices)
  answerIndex++  // 1 lần cho cả nhóm
  
  ⚠️ PHẢI ĐÚNG TOÀN BỘ mới được điểm (all-or-nothing)
```

#### Matching (3 layouts)

```
Data: question.matching_question = {
    layout_type: "standard" | "summary" | "heading",
    matching_items: [{questionPart, correctAnswer}],
    answer_options: [{option_text}],
    summary_text: "text with {correct answer} gaps"
}
User trả lời bằng object: { "0": "2", "1": "0", ... } hoặc { "0": "option-0-2", ... }

LAYOUT "STANDARD":
  for each matching_item:
      user_option_index = user_answers[item_index]  // "2"
      user_text = answer_options[user_option_index].option_text
      correct_text = matching_item.correctAnswer
      if lowercase(user_text) == lowercase(correct_text) → correct++
      total_questions++
  answerIndex++

LAYOUT "SUMMARY":
  Regex {correct_text} từ summary_text → mảng đáp án
  for each gap:
      user_option_id = user_answers[gap_index]  // "option-0-2"
      user_option_index = last part after "-"  // 2
      user_text = answer_options[user_option_index].option_text
      if lowercase(user_text) == lowercase(correct_text) → correct++
      total_questions++
  answerIndex++

LAYOUT "HEADING":
  Giống summary nhưng regex từ associated_passage_content thay vì summary_text
  Dùng passage_content để lấy các {correct answer} gaps
  answerIndex++
```

#### Matrix

```
Data: question.matrix_question = {
    matrix_categories: [{category_letter: "A", category_text: "..."}],
    matrix_items: [{item_text, correct_category_letter: "B"}]
}
User trả lời bằng object: { "0": "cat-0-1", "1": "cat-0-0", ... }

Chấm:
  for each matrix_item (row):
      user_category_id = user_answers[row_index]  // "cat-0-1"
      user_category_index = last part after "-"  // 1
      user_letter = matrix_categories[user_category_index].category_letter  // "B"
      correct_letter = matrix_item.correct_category_letter  // "B"
      if lowercase(user_letter) == lowercase(correct_letter) → correct++
      total_questions++
  answerIndex++
```

### 4.3 Frontend Score Calculation

**File**: `src/shared/lib/calculateScore/index.ts`

Frontend cũng có `calculateScore()` — dùng cho hiển thị ngay trên client trước khi gửi lên server. Logic tương tự PHP version nhưng viết bằng TypeScript.

---

## 5. Exam Collections

**Function**: `exam_collections_resolve($object, $args, $context, $info)`  
**File**: `functions.php` line 1819–1993

### Luồng xử lý

```
Input args: { type, search, sort, offsetPagination: {size, offset}, questionForm }

Step 1: Build meta_query
  - Luôn thêm: type != "practice" (chỉ lấy exam, không lấy practice)
  - Nếu có args.type → thêm filter
  - Nếu có args.questionForm → thêm OR filter cho từng form (comma-separated)

Step 2: Lấy practice quiz IDs
  - WP_Query: post_type=quiz, meta_query=above, numberposts=-1, search=args.search
  - → Mảng quiz IDs thỏa điều kiện

Step 3: Tìm mock_test chứa các quiz đó
  - WP_Query: post_type=mock_test
  - meta_query OR: practice_test_$_reading_test IN quiz_ids
                    OR practice_test_$_listening_test IN quiz_ids

Step 4: Tìm collections chứa các mock_test đó
  - WP_Query: post_type=mock-test-collection
  - meta_query OR: mock_test LIKE "mock_test_id" (từng ID)
  - Phân trang: posts_per_page=pageSize, paged=calculated

Step 5: Build results
  - Lặp qua collections → mock_tests → practice_tests → reading + listening
  - Group theo skill (reading / listening)
  - Mỗi quiz item: { id (base64), title, featuredImage, slug, quizFields }

Output: {
  data: {
    reading: [{ id, title, exams: [...quiz items] }],
    listening: [{ id, title, exams: [...quiz items] }]
  },
  pageInfo: { total, currentPage }
}
```

### Cấu trúc nested

```
MockTestCollection (bộ sưu tập)
  └── MockTest[] (đề thi)
       └── PracticeTest[] (bài practice trong đề)
            ├── reading_test → Quiz (post_type=quiz)
            └── listening_test → Quiz (post_type=quiz)
```

---

## 6. Orders & Payment

### 6.1 Tạo đơn hàng

**File**: `pages/api/orders/create.ts` (API Route)

```
POST /api/orders/create
Body: {
    packageType: "combo" | "single",
    duration: number (months),
    skillType?: "listening" | "reading",  // cho single package
    amount: number (VND),
    originalAmount?: number,
    discountAmount?: number,
    couponId?: string,
    couponCode?: string,
    paymentMethod: string,
    affiliateRef?: string
}

Logic:
1. Lấy userId từ WordPress cookie (decode JWT → viewer ID)
2. Generate orderId: "VIT IELTS " + timestamp + random4digits
3. Generate transferContent = orderId (nội dung chuyển khoản)
4. Tạo order object + status: "pending"
5. Lưu vào orders.json / Vercel KV
6. Trả về order
```

### 6.2 Order Data Structure

```json
{
    "id": "order_1766593255814_eoymcdwxw",
    "orderId": "VIT IELTS 17665932558141657",
    "userId": "dXNlcjo4NDQ=",           // Base64 GraphQL ID: "user:844"
    "packageType": "combo",
    "duration": 2,                       // tháng
    "amount": 400000,                    // VND
    "originalAmount": 400000,
    "discountAmount": 0,
    "couponId": null,
    "couponCode": null,
    "status": "pending",                 // pending → completed
    "paymentMethod": "Ngân hàng VCB (Vietcombank)",
    "transferContent": "VIT IELTS 17665932558141657",
    "affiliateRef": "affiliat",
    "createdAt": "2025-12-24T16:20:55.814Z"
}
```

### 6.3 Sepay Webhook (Xác nhận thanh toán)

**File**: `pages/api/webhooks/sepay.ts` — 816 dòng

```
POST /api/webhooks/sepay
Body từ Sepay: {
    gateway: "ACB",
    transactionDate: "2026-01-23 16:58:05",
    accountNumber: "2447967",
    content: "VIT IELTS 17691622312585779 FT26023...",
    transferType: "in",
    transferAmount: 400000,
    referenceCode: "...",
    accumulated: 1234567
}

Luồng xử lý (chi tiết):

1. PARSE PAYLOAD:
   - Lấy transferAmount + content
   - Regex extract orderId: /IELTS\s+PREDICTION\s+(\d+)/i
   - Normalize spaces

2. TÌM ORDER:
   - Exact match: transferContent == orderId hoặc orderId == searchedId
   - Partial match: normalize spaces, includes check
   - Fallback: chỉ dùng phần số

3. VALIDATE:
   - Order chưa completed? (skip nếu đã completed)
   - Số tiền khớp? (cho phép sai số ±1000 VND)

4. LẤY USER INFO:
   - Decode GraphQL User ID → WordPress numeric ID
   - Gọi WordPress REST API: GET /wp-json/wp/v2/users/{wpUserId}?context=edit
   - Auth: Basic Auth (WP_ADMIN_USER:WP_ADMIN_PASSWORD)
   - Lấy email + name

5. KÍCH HOẠT PRO:
   - Gọi updateUserProAccount(userId, duration)
   - GET user hiện tại từ WP REST API → check is_pro + pro_expiration_date
   - Tính ngày hết hạn mới:
     * Nếu đã Pro + chưa hết hạn → cộng thêm duration tháng vào ngày hết hạn hiện tại
     * Nếu chưa Pro hoặc đã hết hạn → tính từ ngày hiện tại + duration tháng
   - POST WP REST API: update user ACF fields { is_pro: true, pro_expiration_date: "YYYYMMDD" }

6. GỬI EMAIL:
   - Email cho khách hàng: xác nhận thanh toán + thông tin đơn hàng
   - Email cho admin: thông báo có đơn hàng mới
   - Qua Nodemailer SMTP

7. CẬP NHẬT ORDER:
   - orders[index].status = "completed"
   - Lưu lại vào JSON/KV

8. TRẢ VỀ:
   - 200: { success: true, orderId, status: "completed" }
```

### 6.4 Environment Variables cho Payment

```env
NEXT_PUBLIC_WORDPRESS_CMS_URL=https://...
WP_ADMIN_USER=admin_username
WP_ADMIN_PASSWORD=application_password
SEPAY_WEBHOOK_SECRET=optional_secret
ADMIN_EMAIL=admin@vitieltstest.com
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## 7. Affiliate System

### Files

- `pages/api/affiliate/register.ts` — Đăng ký affiliate
- `pages/api/affiliate/links.ts` — Quản lý affiliate links
- `pages/api/affiliate/visits.ts` — Track visits
- `pages/api/affiliate/commissions.ts` — Quản lý hoa hồng
- `pages/api/affiliate/stats.ts` — Thống kê
- `pages/api/affiliate/resolve.ts` — Resolve affiliate ref
- `lib/server/affiliate-data-helper.ts` — Read/Write helper

### Data Files (JSON/KV)

```
data/affiliates.json:
[{
    userId: "dXNlcjo4NDQ=",    // GraphQL user ID
    customLink: "my-link",
    status: "active",
    commissionRate: 0.1,        // 10%
    createdAt: "2025-12-24T..."
}]

data/affiliate-links.json:
[{
    id: "link_xxx",
    affiliateId: "aff_xxx",
    customLink: "my-custom-link",
    createdAt: "..."
}]

data/affiliate-visits.json:
[{
    id: "visit_xxx",
    affiliateId: "aff_xxx",
    linkId: "link_xxx",
    ip: "1.2.3.4",
    userAgent: "Mozilla/...",
    converted: false,
    orderId: null,
    createdAt: "..."
}]

data/affiliate-commissions.json:
[{
    id: "comm_xxx",
    affiliateId: "aff_xxx",
    orderId: "VIT IELTS ...",
    amount: 400000,
    commissionRate: 0.1,
    commissionAmount: 40000,
    status: "pending",          // pending → paid
    createdAt: "..."
}]
```

### Affiliate Flow

```
1. User đăng ký affiliate → POST /api/affiliate/register
   → Tạo record trong affiliates.json

2. User tạo link → POST /api/affiliate/links
   → Tạo record trong affiliate-links.json

3. Visitor click link → GET /api/affiliate/resolve?ref=xxx
   → Track visit trong affiliate-visits.json
   → Set cookie "affiliateRef" = affiliate_custom_link

4. Visitor mua hàng → POST /api/orders/create
   → Đọc cookie "affiliateRef" → gắn vào order
   → Khi Sepay webhook confirm → tạo commission record
```

---

## 8. Admin CMS

### Files

- `pages/api/admin/*` — 38 API routes
- `lib/server/admin-config-helper.ts` — Read/Write config helper

### Config Sections (17 JSON files)

| Section Path | Mô tả |
|-------------|-------|
| `home/hero-banner` | Banner trang chủ |
| `home/test-platform-intro` | Giới thiệu platform |
| `home/why-choose-us` | Phần "Tại sao chọn chúng tôi" |
| `home/testimonials` | Đánh giá khách hàng |
| `home/faq` | Câu hỏi thường gặp |
| `subscription/banner` | Banner trang subscription |
| `subscription/course-packages` | Gói dịch vụ (combo/single, plans, giá) |
| `subscription/payment-guide` | Hướng dẫn thanh toán |
| `header/top-bar` | Top bar (thông báo, discount) |
| `header/header` | Header navigation |
| `footer/cta-banner` | CTA banner cuối trang |
| `account/login-page` | Cấu hình trang login |
| `account/register-page` | Cấu hình trang register |
| `ielts-exam-library/hero` | Banner exam library |
| `ielts-practice-library/banner` | Banner practice library |
| `sample-essay/banner` | Banner sample essay |
| `privacy-policy` | Nội dung privacy policy |
| `terms-of-use` | Nội dung terms of use |

### API Pattern

```
GET  /api/admin/{section} → readConfig(section) → JSON
POST /api/admin/{section} → writeConfig(section, body) → void
```

### Storage Logic (admin-config-helper.ts)

```
readConfig(sectionName):
  if (shouldUseKV()):       // Production + Vercel + KV env vars
      try KV.get("config:{sectionName}")
      catch → fallback filesystem
              + auto-migrate to KV in background
  else:                     // Localhost
      readFileSync("config/{sectionName}.json")

writeConfig(sectionName, data):
  if (shouldUseKV()):
      try KV.set("config:{sectionName}", JSON)
      catch → fallback filesystem (localhost only)
  else:
      writeFileSync("config/{sectionName}.json")

shouldUseKV():
  return hasKVEnvVars && (isVercel || isProduction) && kvClientInitialized
```

---

## 9. User Management

### GraphQL Fields trên User (ACF)

| Field | Type | Mô tả |
|-------|------|-------|
| `is_pro` | Boolean | Cờ Pro |
| `pro_expiration_date` | Date | Ngày hết hạn Pro (DD/MM/YYYY hoặc YYYYMMDD) |
| `avatar` | Image (Attachment ID) | Ảnh đại diện |
| `date_of_birth` | String | Ngày sinh (DD/MM/YYYY) |
| `gender` | String | Giới tính |
| `phone_number` | String | SĐT |
| `target_score` | Group | { reading, listening, speaking, writing, exam_date } |
| `devices` | Group | { mobile: {device_id}, tablet: {device_id}, desktop: {device_id} } |

### Mutations

#### UpdateUser (built-in WPGraphQL + custom handler)

```
File: functions.php line 728–745

graphql_user_object_mutation_update_additional_data hook:
  if (input.avatar) → saveFile(avatar) → update_field('avatar')
  if (input.dateOfBirth) → update_field('date_of_birth')
  if (input.gender) → update_field('gender')
  if (input.phoneNumber) → update_field('phone_number')
```

#### UpdateUserTargetScore

```
File: functions.php line 1664–1746

Input: { id, reading, listening, speaking, writing, examDate }
Logic:
  1. Validate user exists + permissions
  2. update_field('target_score', {reading, listening, speaking, writing, exam_date})
```

#### UpdatePostRating

```
File: functions.php line 1588–1662

Input: { id (post ID), rate (1-5) }
Logic:
  1. Check đăng nhập
  2. Lấy votes[] từ ACF field
  3. Check user đã vote chưa → throw error nếu đã vote
  4. Thêm { user: user_id, rate } vào votes[]
  5. Tính rating_average = sum(rates) / count(votes)
  6. update_field('votes', votes)
```

### Avatar Handling

```
File: functions.php line 159–199

- get_avatar_url filter: Nếu user có ACF 'avatar' → trả URL attachment thay vì Gravatar
- delete_user action: Xóa attachment avatar khi xóa user
- acf/update_value/name=avatar filter: Xóa avatar cũ khi update avatar mới
```

---

## 10. Blog & Sample Essays

### Blog Posts (post_type: `post`)

GraphQL Fields (custom):
- `hasAccess` — Boolean: kiểm tra Pro access (pro_user_only field)
- `rating` — { rate, count, voted } — hệ thống đánh giá
- `views` — số lượt xem

### Sample Essays (post_type: `sample-essay`)

Taxonomy: `sample-essay-type` (skill: writing, speaking, reading, listening)
Taxonomy: `annual_period` (year: 2024, 2025...)
Taxonomy: `sample-source` (nguồn)

ACF Fields:
- `part` — phần (Part 1, Part 2, etc.)
- `question_type` — dạng câu hỏi
- `quarter` — quý
- `topic` — chủ đề (cho writing)
- `task` — task (cho writing)
- `passage` — passage (cho reading)

### Filter Logic (Sample Essays)

**File**: `functions.php` line 550–671

```
graphql_post_object_connection_query_args filter:
  Chỉ áp dụng cho post_type=sample-essay

  Filters:
    part → meta_query (key=part, value=part)
    questionType → meta_query LIKE (key=question_type, value="%questionType%")
    quarter → meta_query (key=quarter)
    year → tax_query (taxonomy=annual_period, slug=year)
    sampleSource → tax_query (taxonomy=sample-source, slug=source)
    search → s parameter
    topic → meta_query LIKE (key=topic)
    task → meta_query (key=task)
    passage → meta_query (key=passage)
    skill → tax_query (taxonomy=sample-essay-type, slug=skill)
```

---

## 11. Data Storage Layer

### Dual Storage Pattern

Hệ thống dùng **2 storage backends** chạy song song:

```
                ┌──────────────────┐
                │   readData()     │
                │   writeData()    │
                └────────┬─────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
    ┌─────────▼─────────┐   ┌──────▼──────────┐
    │   Vercel KV        │   │   JSON Files     │
    │   (Production)     │   │   (Localhost)     │
    │                    │   │                   │
    │   Key: "data:{fn}" │   │   data/{fn}.json  │
    │   Key: "config:{s}"│   │   config/{s}.json │
    └────────────────────┘   └───────────────────┘
```

**Quy tắc chọn storage**:
- `shouldUseKV()`: `KV_REST_API_URL` + `KV_REST_API_TOKEN` + (`VERCEL=1` || `NODE_ENV=production`) + KV client OK
- Nếu true → dùng Vercel KV, fallback filesystem nếu KV fail
- Nếu false → dùng filesystem trực tiếp

**Auto-migration**: Khi KV không có data nhưng filesystem có → tự động copy lên KV trong background

### Files

| Helper | Dùng cho | Functions |
|--------|---------|-----------|
| `lib/server/admin-config-helper.ts` | Config CMS | `readConfig()`, `writeConfig()` |
| `lib/server/affiliate-data-helper.ts` | Data tables | `readData()`, `writeData()` |
| `lib/server/email-helper.ts` | SMTP email | `sendEmail()` |
| `lib/server/user-id-helper.ts` | Decode WP ID | `decodeWordPressUserId()` |

### User ID Encoding

```
WordPress User ID: 844
GraphQL Global ID: base64("user:844") = "dXNlcjo4NDQ="

Decode: atob("dXNlcjo4NDQ=") = "user:844" → split(":")[1] = "844"
```

---

## 12. GraphQL API Reference

### Queries

| Query | Mô tả | File |
|-------|-------|------|
| `GET_MASTER_DATA` | Viewer + Menu + Settings | `withMasterData.tsx` |
| `MenuData` | Menu tree (main + footer) | `functions.php:293` |
| `QuizFilterData` | Filter options cho quiz (years, sources, parts) | `functions.php:341` |
| `ExamCollection` | Bộ sưu tập đề thi (nested) | `functions.php:466` |
| `checkDevice` | Kiểm tra device fingerprint | `functions.php:2057` |
| Quizzes connection | Danh sách quiz (filtered) | `bp_quiz_creator/index.php:192` |
| TestResults connection | Danh sách kết quả (filtered) | `functions.php:673` |
| SampleEssays connection | Danh sách bài mẫu (filtered) | `functions.php:550` |
| Posts connection | Danh sách bài viết | WPGraphQL built-in |

### Mutations

| Mutation | Mô tả | File |
|----------|-------|------|
| `login` | Đăng nhập (PASSWORD / GOOGLE) | WP headless-login plugin |
| `registerUser` | Đăng ký (+ avatar upload) | WPGraphQL built-in + `functions.php:413` |
| `refreshToken` | Gia hạn JWT token | WP headless-login plugin |
| `TakeTheTest` | Bắt đầu làm bài | `functions.php:1471` |
| `SaveTestResult` | Lưu nháp bài làm | `functions.php:815` |
| `SubmitTestResult` | Nộp bài + chấm điểm | `functions.php:939` |
| `UpdatePostViewCount` | Tăng lượt xem bài viết | `functions.php:788` |
| `UpdatePostRating` | Đánh giá bài viết (1-5 sao) | `functions.php:1588` |
| `UpdateUserTargetScore` | Cập nhật mục tiêu điểm | `functions.php:1664` |
| `SendContactEmail` | Gửi email liên hệ | `functions.php:868` |
| `createQuiz` / `updateQuiz` | CRUD quiz (admin) | `bp_quiz_creator/index.php:34` |

---

## 13. File Map & Code Locations

### WordPress Backend

```
wp-content/themes/findme-old/
├── functions.php (2234 lines) ─── CORE BUSINESS LOGIC
│   ├── L1-260     Admin setup, avatar, file handling, menus
│   ├── L262-548   GraphQL type registration
│   ├── L550-726   Query filters (sample-essay, test-result)
│   ├── L728-773   User mutation handler + Pro status
│   ├── L775-813   Object scalar + UpdatePostViewCount
│   ├── L815-866   SaveTestResult mutation
│   ├── L868-937   SendContactEmail mutation
│   ├── L939-1011  SubmitTestResult mutation
│   ├── L1014-1452 calculate_score() ─── SCORING ENGINE
│   ├── L1456-1469 extractWords() helper
│   ├── L1471-1586 TakeTheTest mutation
│   ├── L1588-1662 UpdatePostRating mutation
│   ├── L1664-1746 UpdateUserTargetScore mutation
│   ├── L1819-1993 exam_collections_resolve()
│   ├── L2056-2120 Device fingerprint (checkDevice + login hook)
│   └── L2128-2234 Admin Pro filter UI
├── includes/
│   ├── class-graphql-extensions.php (424 lines) ─── OOP VERSION (DUPLICATE)
│   ├── class-image-handling.php
│   ├── class-admin-customizations.php
│   ├── class-acf-customizations.php
│   ├── class-checkout-customizations.php
│   └── class-menu-handling.php
├── bp_quiz_creator/
│   ├── index.php (440 lines) ─── QUIZ CRUD + RELATED QUIZZES
│   ├── editor.php ─── Quiz editor page
│   └── dist/ ─── React-based editor assets
└── ACF_Field_Unique_ID.php
```

### Frontend Next.js

```
pages/
├── _app.tsx ─── Entry point → src/appx/index.tsx
├── api/
│   ├── admin/ (38 files) ─── CMS CRUD
│   ├── affiliate/ (6 files) ─── Affiliate system
│   ├── orders/ (2 files) ─── Order CRUD
│   ├── coupons/ (2 files) ─── Coupon system
│   └── webhooks/sepay.ts (816 lines) ─── PAYMENT WEBHOOK
├── account/ (9 files) ─── Account pages
├── admin/ (20 files) ─── Admin dashboard
├── checkout.tsx ─── Checkout page
├── ielts-exam-library/ ─── Exam library
├── ielts-practice-library/ ─── Practice library
├── take-the-test/ ─── Test taking page
└── test-result/ ─── Test result page

src/
├── appx/ ─── App layer
│   ├── index.tsx ─── App component (Provider chain)
│   └── providers/
│       ├── apollo-provider.tsx ─── Client Apollo + error/auth links
│       ├── auth-provider.tsx ─── useAuth() hook (login/register/logout/refresh)
│       └── app-provider.tsx ─── MasterData context
├── pages/ ─── Page components (15 modules)
├── shared/
│   ├── graphql/
│   │   └── createServerApolloClient.ts ─── Server-side Apollo (SSR)
│   ├── hoc/
│   │   ├── withMasterData.tsx ─── SSR data fetching (GET_MASTER_DATA)
│   │   ├── withAuth.tsx ─── Auth guard HOC
│   │   └── withGuest.tsx ─── Guest-only guard
│   ├── hooks/
│   │   └── useDeviceID.tsx ─── FingerprintJS (Zustand store)
│   ├── lib/
│   │   ├── calculateScore/ ─── Client-side scoring
│   │   ├── extractWords/ ─── Extract {words} from text
│   │   └── ... (6 more utilities)
│   ├── types/ ─── TypeScript definitions
│   └── ui/ ─── Shared UI components (29 items)
├── entities/ ─── Domain entities (avatar, practice-test, star-rating)
└── widgets/ ─── Layout widgets (45 items)

lib/server/
├── admin-config-helper.ts ─── Config R/W (filesystem ↔ KV)
├── affiliate-data-helper.ts ─── Data R/W (filesystem ↔ KV)
├── email-helper.ts ─── Nodemailer SMTP
└── user-id-helper.ts ─── WP user ID decoder

config/ ─── 17 JSON files (CMS content)
data/ ─── 6 JSON files (orders, affiliates, coupons)
```

---

## 14. Known Issues & Bugs

### Bug 1: `class-graphql-extensions.php` — Luôn set Pro

**File**: `includes/class-graphql-extensions.php` line 223–224  
**Nghiêm trọng**: CẦN XÁC NHẬN CÓ ĐANG ACTIVE KHÔNG

```php
// Trong update_user_data():
update_field('is_pro', true, 'user_' . $user_id);
update_field('pro_expiration_date', date('Y-m-d H:i:s', time() + 60 * 60 * 24 * 60), 'user_' . $user_id);
```

Code này set is_pro=true + 60 ngày cho BẤT KỲ user nào khi update profile. Có vẻ là code test quên xóa.

**So sánh**: `functions.php` line 728–745 (inline version) KHÔNG có bug này — 2 dòng tương tự bị comment out.

### Bug 2: `check_pro_status()` — Crash khi null expiration

**File**: `includes/class-graphql-extensions.php` line 196–206

```php
$expiration_date = get_field('pro_expiration_date', $node_id);
$unix_time = DateTime::createFromFormat('d/m/Y', $expiration_date)->getTimestamp();
```

Nếu `pro_expiration_date` là null → `createFromFormat()` trả về `false` → gọi `getTimestamp()` trên false → Fatal Error.

**So sánh**: `functions.php` line 755–773 (inline version) có check null trước.

### Bug 3: Duplicate code — 2 hệ thống GraphQL

`class-graphql-extensions.php` (OOP) và inline code trong `functions.php` CẢ HAI đều register cùng các types/mutations. Cần xác nhận file nào đang thực sự active (có thể `class-graphql-extensions.php` bị gọi bởi `functions.php` require nhưng bị override bởi inline code sau đó).

### Issue 4: JWT expiration 10 giây

`functions.php` line 229–231: `graphql_jwt_auth_expire` filter return 10 (giây). Rất ngắn, gây nhiều request refresh token. Client-side xử lý bằng `errorLink` nhưng vẫn tốn latency.

### Issue 5: `debug.log` 27GB

`wp-content/debug.log` có kích thước 27GB. Cần xóa trước khi backup/migrate.

### Issue 6: `userId` format không nhất quán

- Trong `orders.json`: userId là GraphQL ID base64 (`"dXNlcjo4NDQ="`)
- Trong WordPress: user ID là numeric (`844`)
- Trong frontend cookie: lưu cả authToken + refreshToken
- Khi decode: `atob("dXNlcjo4NDQ=")` → `"user:844"` → split `:` → `844`

---

> **Lưu ý cho agent sau**: Khi migration sang Supabase, cần đặc biệt chú ý:
> 1. Port `calculate_score()` 1:1 sang TypeScript (đã có version client nhưng cần verify)
> 2. Exam Collections logic nested 3 cấp cần redesign cho Supabase query
> 3. Dual storage (JSON + KV) sẽ được thay hoàn toàn bằng Supabase tables
> 4. JWT auth → Supabase Auth (khác hoàn toàn, cần rewrite toàn bộ auth flow)
> 5. Device fingerprint logic cần reimplement với Supabase
> 6. Sepay webhook logic giữ nguyên, chỉ đổi storage + user update method
