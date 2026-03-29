# Phân Tích Hệ Thống Affiliate - nghecontent.com

## 1. Frontend (Trang dành cho User Affiliate)

### Giao diện
| Trang | Mô tả |
|-------|--------|
| **Landing Page** | Giới thiệu chương trình, chính sách hoa hồng, CTA đăng ký |
| **Dashboard** | Tổng quan số liệu: Clicks, Đơn hoàn tất, Tổng hoa hồng |
| **Link Generator** | Hiển thị mã ref cá nhân (VD: `PHONG4637`), link affiliate kèm nút Copy |
| **Hướng dẫn** | Quy trình 3 bước: Tạo mã → Chia sẻ → Theo dõi |
| **Chính sách** | Điều khoản, quy tắc nhận thưởng, FAQ |

### Chức năng
- **Đăng ký / Đăng nhập** tài khoản affiliate
- **Xem mã giới thiệu** cá nhân (unique ref code)
- **Copy link affiliate** (tích hợp Clipboard API)
- **Xem thống kê real-time**: tổng click, số đơn, hoa hồng tích lũy
- **Xem lịch sử đơn hàng** phát sinh qua link
- **Yêu cầu rút tiền** (payout request)
- **Xem trạng thái thanh toán** (chờ duyệt / đã thanh toán)

---

## 2. Admin Dashboard (Quản trị hệ thống)

### Giao diện
| Trang | Mô tả |
|-------|--------|
| **Tổng quan** | Biểu đồ tổng click, đơn hàng, hoa hồng phát sinh toàn hệ thống |
| **Quản lý Affiliates** | Danh sách user, trạng thái (active/banned), mã ref, hiệu suất |
| **Quản lý Đơn hàng** | Đơn phát sinh qua affiliate, trạng thái (pending/completed/cancelled) |
| **Quản lý Hoa hồng** | Chi tiết hoa hồng từng affiliate, duyệt/từ chối commission |
| **Quản lý Payout** | Danh sách yêu cầu rút tiền, xác nhận thanh toán |
| **Cấu hình** | Thiết lập % hoa hồng, thời hạn cookie, quy tắc chống gian lận |

### Chức năng

#### Quản lý User Affiliate
- CRUD tài khoản affiliate
- Duyệt / Từ chối đăng ký affiliate
- Khóa / Mở khóa tài khoản
- Xem chi tiết hiệu suất từng user (click, đơn, doanh thu)

#### Quản lý Đơn hàng & Hoa hồng
- Xem danh sách đơn hàng phát sinh qua affiliate link
- Gán trạng thái đơn: `Pending` → `Completed` → `Commission Approved`
- Tự động tính hoa hồng khi đơn hoàn tất
- Từ chối hoa hồng nếu phát hiện gian lận

#### Quản lý Payout (Thanh toán chuyển khoản)
- Xem danh sách yêu cầu rút tiền
- Duyệt / Từ chối yêu cầu payout
- Ghi nhận lịch sử thanh toán (số tiền, ngày, phương thức)
- Export báo cáo thanh toán (CSV/Excel)

#### Cấu hình hệ thống
- Thiết lập **tỷ lệ hoa hồng** (% hoặc cố định)
- Thiết lập **cookie duration** (30-90 ngày)
- Thiết lập **ngưỡng rút tiền tối thiểu**
- Cấu hình **quy tắc chống gian lận** (chặn self-referral, spam click)

#### Báo cáo & Thống kê
- Dashboard tổng quan: doanh thu, top affiliates, conversion rate
- Lọc theo thời gian, theo affiliate, theo sản phẩm
- Export báo cáo

---

## 3. Chi tiết: Cookie Duration (Thời hạn ghi nhận giới thiệu)

### Cookie Duration là gì?
Khi khách hàng click vào link affiliate (VD: `nghecontent.com?ref=PHONG4637`), hệ thống sẽ **lưu mã ref vào cookie trình duyệt** của khách hàng. Cookie duration là **khoảng thời gian mà mã ref đó còn hiệu lực**.

### Cơ chế hoạt động

```
Ngày 1:  Khách click link ?ref=PHONG4637
         → Cookie được set: { ref: "PHONG4637", expires: 30 ngày sau }

Ngày 15: Khách quay lại mua hàng (KHÔNG qua link affiliate)
         → Hệ thống kiểm tra cookie → Tìm thấy ref=PHONG4637 → ✅ Ghi nhận hoa hồng

Ngày 35: Khách quay lại mua hàng
         → Cookie đã hết hạn → ❌ Không ghi nhận
```

### Logic xử lý Backend

| Bước | Hành động |
|------|-----------|
| 1 | Khách truy cập URL có `?ref=XXX` |
| 2 | Backend middleware bắt param `ref`, lưu vào **cookie** (HttpOnly) + ghi 1 record vào bảng `clicks` |
| 3 | Set cookie expiry = `current_time + cookie_duration` (VD: 30 ngày) |
| 4 | Khi khách đặt hàng, backend đọc cookie `ref` → gán `affiliate_id` vào đơn hàng |
| 5 | Nếu cookie hết hạn hoặc không tồn tại → đơn hàng không liên kết affiliate nào |

### Quy tắc ghi đè (Last-click wins)
Nếu khách click link của affiliate A, rồi sau đó click link affiliate B → **cookie bị ghi đè bằng B** → B nhận hoa hồng. Đây là mô hình phổ biến nhất (**last-click attribution**).

> **Gợi ý cấu hình**: Admin có thể set duration trong khoảng 7-90 ngày tùy ngành. Ngành giáo dục/khóa học thường set **30 ngày** vì khách cần thời gian cân nhắc.

---

## 4. Chi tiết: Quy tắc chống gian lận

### 4.1. Chặn Self-Referral (Tự mua qua link của mình)

**Vấn đề:** Affiliate tự click link của mình rồi tự mua hàng để nhận hoa hồng.

**Giải pháp:**

| Phương pháp | Cách hoạt động |
|-------------|----------------|
| **So sánh email** | Nếu email đặt hàng = email tài khoản affiliate → **Từ chối hoa hồng** |
| **So sánh IP** | Nếu IP lúc click link = IP lúc đặt hàng VÀ trùng IP đăng nhập affiliate → **Flag cảnh báo** |
| **So sánh SĐT** | SĐT đơn hàng = SĐT tài khoản affiliate → **Từ chối** |
| **Blacklist device** | Dùng fingerprint trình duyệt (user-agent + screen size + timezone) để phát hiện cùng 1 thiết bị |

```
// Pseudo code khi xử lý đơn hàng
if (order.email == affiliate.email) → reject commission
if (order.phone == affiliate.phone) → reject commission
if (order.ip == affiliate.last_login_ip) → flag for review
```

### 4.2. Chống Spam Click (Click ảo)

**Vấn đề:** Affiliate tự click hoặc dùng bot spam link để tăng số click giả.

**Giải pháp:**

| Phương pháp | Cách hoạt động |
|-------------|----------------|
| **Rate limiting** | Tối đa **1 click/IP/ref_code/24h** – Click thừa không được ghi nhận |
| **Bot detection** | Kiểm tra User-Agent, nếu không phải trình duyệt thật → bỏ qua |
| **Click velocity** | Nếu 1 ref_code nhận > 100 clicks/phút → tự động **tạm dừng** ghi nhận |
| **Unique visitor** | Chỉ đếm click từ **IP + User-Agent unique**, không đếm lặp |
| **reCAPTCHA** | Với traffic bất thường, hiển thị captcha trước khi redirect |

```
// Pseudo code khi ghi nhận click
existing_click = db.find({ip: request.ip, ref_code: ref, created_at: > 24h_ago})

if (existing_click) → SKIP, không ghi nhận
if (isBot(request.user_agent)) → SKIP
if (clicksPerMinute(ref) > 100) → FLAG affiliate, tạm dừng tracking
else → INSERT click record
```

### 4.3. Các flag cảnh báo trong Admin Dashboard

| Cấp độ | Điều kiện | Hành động |
|--------|-----------|-----------|
| 🟡 **Warning** | Click/đơn ratio quá cao (>500 click, 0 đơn) | Gửi cảnh báo cho admin |
| 🟠 **Suspicious** | Trùng IP giữa affiliate và buyer | Tạm giữ hoa hồng, chờ review |
| 🔴 **Fraud** | Phát hiện self-referral hoặc bot rõ ràng | Tự động từ chối hoa hồng, khóa tài khoản |

---

## 5. Chi tiết: Quy trình Payout (Thanh toán chuyển khoản ngân hàng)

### 5.1. Thông tin affiliate cần cung cấp

User affiliate phải cập nhật **thông tin ngân hàng** trong profile trước khi yêu cầu rút tiền:

| Trường | Bắt buộc | Ví dụ |
|--------|----------|-------|
| Tên chủ tài khoản | ✅ | NGUYEN VAN A |
| Số tài khoản | ✅ | 1234567890 |
| Tên ngân hàng | ✅ | Vietcombank |
| Chi nhánh | ❎ | Hà Nội |

### 5.2. Quy trình rút tiền (Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUY TRÌNH PAYOUT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AFFILIATE                          ADMIN                       │
│  ────────                          ─────                        │
│                                                                 │
│  1. Kiểm tra số dư hoa hồng                                    │
│     (VD: 2.500.000đ)                                            │
│         │                                                       │
│         ▼                                                       │
│  2. Nhấn "Yêu cầu rút tiền"                                    │
│     → Nhập số tiền muốn rút                                    │
│     → Hệ thống check: số tiền ≥ ngưỡng tối thiểu?             │
│     → Hệ thống check: thông tin bank đã cập nhật?              │
│         │                                                       │
│         ▼                                                       │
│  3. Tạo Payout Request                                          │
│     Trạng thái: ⏳ PENDING                                      │
│                    │                                             │
│                    ▼                                             │
│               4. Admin nhận thông báo                            │
│                  có yêu cầu rút tiền mới                        │
│                    │                                             │
│                    ▼                                             │
│               5. Admin review:                                   │
│                  - Kiểm tra hoa hồng hợp lệ                    │
│                  - Kiểm tra không có fraud                       │
│                    │                                             │
│              ┌─────┴─────┐                                      │
│              ▼           ▼                                       │
│         ✅ DUYỆT    ❌ TỪ CHỐI                                  │
│              │           │                                       │
│              ▼           ▼                                       │
│     6. Admin chuyển   Hoàn lại số dư                            │
│        khoản thủ công  cho affiliate                             │
│        qua ngân hàng   + ghi lý do                              │
│              │                                                   │
│              ▼                                                   │
│     7. Admin nhập mã                                             │
│        giao dịch (UTR)                                           │
│        để xác nhận                                               │
│              │                                                   │
│              ▼                                                   │
│     8. Trạng thái: ✅ COMPLETED                                  │
│        Affiliate nhận thông báo                                  │
│        "Đã thanh toán thành công"                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3. Trạng thái Payout

| Trạng thái | Mô tả | Ai thấy |
|------------|--------|---------|
| `PENDING` | Affiliate vừa gửi yêu cầu, chờ admin duyệt | Cả hai |
| `APPROVED` | Admin đã duyệt, đang tiến hành chuyển khoản | Cả hai |
| `COMPLETED` | Admin đã chuyển khoản xong, nhập mã giao dịch | Cả hai |
| `REJECTED` | Admin từ chối, số dư hoàn lại cho affiliate | Cả hai |

### 5.4. Xử lý phía Backend

```
// Khi affiliate tạo yêu cầu rút tiền
function createPayoutRequest(affiliateId, amount) {
  1. Kiểm tra: amount >= MIN_PAYOUT (VD: 200.000đ)
  2. Kiểm tra: affiliate.balance >= amount
  3. Kiểm tra: affiliate.bank_info đã đầy đủ
  4. Trừ tạm affiliate.balance -= amount (hold balance)
  5. Tạo record: payouts { affiliate_id, amount, status: "PENDING", bank_info }
  6. Gửi notification cho Admin
}

// Khi admin duyệt và chuyển khoản xong
function approveAndCompletePayout(payoutId, transactionCode) {
  1. Cập nhật: payout.status = "COMPLETED"
  2. Lưu: payout.transaction_code = transactionCode (mã giao dịch ngân hàng)
  3. Lưu: payout.completed_at = now()
  4. Gửi notification cho Affiliate: "Đã thanh toán {amount}đ"
}

// Khi admin từ chối
function rejectPayout(payoutId, reason) {
  1. Cập nhật: payout.status = "REJECTED"
  2. Lưu: payout.reject_reason = reason
  3. Hoàn lại: affiliate.balance += payout.amount
  4. Gửi notification cho Affiliate: "Yêu cầu bị từ chối: {reason}"
}
```

### 5.5. Giao diện Admin - Màn hình duyệt Payout

Admin cần thấy bảng danh sách với các cột:

| Cột | Mô tả |
|-----|--------|
| Affiliate | Tên + mã ref |
| Số tiền yêu cầu | VD: 2.500.000đ |
| Thông tin bank | VCB - 1234567890 - NGUYEN VAN A |
| Ngày yêu cầu | 27/03/2026 |
| Trạng thái | Badge màu (Pending/Approved/Completed/Rejected) |
| Hành động | Nút [Duyệt] [Từ chối] [Xem chi tiết] |

> **Lưu ý:** Phần dưới đây mô tả cách tích hợp SePay để **tự động xác nhận** giao dịch chuyển khoản.

---

## 6. Tích hợp SePay cho quy trình Payout

### 6.1. SePay làm được gì?

> [!IMPORTANT]
> SePay **KHÔNG** cung cấp API để **chuyển tiền đi** (disbursement). SePay chỉ giám sát biến động số dư tài khoản ngân hàng của bạn và **bắn webhook** khi có giao dịch (tiền vào hoặc tiền ra).

Điều này có nghĩa:
- ❌ **Không thể**: Gọi API SePay để tự động chuyển tiền cho affiliate
- ✅ **Có thể**: Admin chuyển khoản thủ công → SePay phát hiện giao dịch tiền ra → Bắn webhook → Hệ thống **tự động xác nhận** payout

### 6.2. Luồng Payout với SePay (Hybrid: Thủ công + Tự động xác nhận)

```
┌──────────────────────────────────────────────────────────────────────┐
│              LUỒNG PAYOUT VỚI SEPAY                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AFFILIATE              ADMIN                    SEPAY               │
│  ─────────              ─────                    ─────               │
│                                                                      │
│  1. Yêu cầu rút tiền                                                │
│     (2.500.000đ)                                                     │
│         │                                                            │
│         ▼                                                            │
│  2. Payout status:                                                   │
│     ⏳ PENDING                                                       │
│                    │                                                  │
│                    ▼                                                  │
│               3. Admin review                                        │
│                  → Nhấn [Duyệt]                                      │
│                  → Status: 🔄 APPROVED                               │
│                    │                                                  │
│                    ▼                                                  │
│               4. Admin mở app ngân hàng                              │
│                  chuyển khoản THỦ CÔNG                                │
│                  Nội dung: "PAYOUT 12345"                            │
│                  (12345 = payout_id)                                  │
│                    │                                                  │
│                    ▼                                                  │
│                                          5. SePay phát hiện          │
│                                             giao dịch tiền ra        │
│                                                  │                   │
│                                                  ▼                   │
│                                          6. SePay bắn Webhook        │
│                                             POST → your-server       │
│                                             {                        │
│                                               transferType: "out",   │
│                                               transferAmount: 2500000│
│                                               content: "PAYOUT 12345"│
│                                             }                        │
│                                                  │                   │
│                    ┌─────────────────────────────┘                   │
│                    ▼                                                  │
│               7. Backend nhận webhook                                │
│                  → Parse "PAYOUT 12345"                               │
│                  → Tìm payout có id=12345                            │
│                  → Kiểm tra amount khớp                              │
│                  → ✅ Auto update: COMPLETED                          │
│                    │                                                  │
│                    ▼                                                  │
│  8. Affiliate nhận                                                   │
│     thông báo:                                                       │
│     "Đã thanh toán                                                   │
│      2.500.000đ"                                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3. Cấu hình SePay cần thiết

| Bước | Hành động |
|------|-----------|
| 1 | Đăng ký tài khoản tại [my.sepay.vn](https://my.sepay.vn) |
| 2 | Kết nối tài khoản ngân hàng của bạn (tài khoản dùng để chi trả affiliate) |
| 3 | Tạo **API Token** tại menu API Token |
| 4 | Tạo **Webhook** mới với cấu hình: |

**Cấu hình Webhook:**

| Thuộc tính | Giá trị |
|------------|---------|
| Tên | Affiliate Payout Webhook |
| Sự kiện | **Có tiền ra** (transferType = "out") |
| Tài khoản ngân hàng | Chọn tài khoản chi trả affiliate |
| Gọi đến URL | `https://your-domain.com/api/webhooks/sepay` |
| Kiểu chứng thực | **API Key** |
| API Key | Tạo 1 secret key riêng để xác thực |
| Content Type | `application/json` |

### 6.4. Dữ liệu SePay gửi qua Webhook

Khi admin chuyển khoản, SePay sẽ POST đến URL của bạn:

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2026-03-27 14:02:37",
  "accountNumber": "0123499999",
  "code": null,
  "content": "PAYOUT 12345",
  "transferType": "out",
  "transferAmount": 2500000,
  "accumulated": 19077000,
  "subAccount": null,
  "referenceCode": "MBVCB.3278907687",
  "description": ""
}
```

**Các trường quan trọng:**

| Trường | Ý nghĩa | Cách dùng |
|--------|---------|-----------|
| `transferType` | `"out"` = tiền ra | Chỉ xử lý payout khi = `"out"` |
| `transferAmount` | Số tiền chuyển | So khớp với `payout.amount` |
| `content` | Nội dung chuyển khoản | Parse để lấy `payout_id` từ "PAYOUT {id}" |
| `referenceCode` | Mã tham chiếu ngân hàng | Lưu làm bằng chứng giao dịch |
| `id` | ID giao dịch trên SePay | Dùng để chống trùng lặp (idempotency) |

### 6.5. Backend xử lý Webhook

```javascript
// POST /api/webhooks/sepay
async function handleSepayWebhook(req, res) {

  // 1. Xác thực API Key
  const apiKey = req.headers['authorization'];
  if (apiKey !== `Apikey ${process.env.SEPAY_WEBHOOK_SECRET}`) {
    return res.status(401).json({ success: false });
  }

  const data = req.body;

  // 2. Chống trùng lặp - kiểm tra sepay transaction id đã xử lý chưa
  const existingTx = await db.sepay_transactions.findOne({
    sepay_id: data.id
  });
  if (existingTx) {
    return res.status(200).json({ success: true }); // Đã xử lý rồi, trả OK
  }

  // 3. Chỉ xử lý giao dịch tiền ra (payout)
  if (data.transferType !== 'out') {
    return res.status(200).json({ success: true });
  }

  // 4. Parse payout_id từ nội dung chuyển khoản
  //    Nội dung chuẩn: "PAYOUT 12345"
  const match = data.content?.match(/PAYOUT\s+(\d+)/i);
  if (!match) {
    // Giao dịch không liên quan đến affiliate payout
    return res.status(200).json({ success: true });
  }

  const payoutId = parseInt(match[1]);

  // 5. Tìm payout request trong DB
  const payout = await db.payouts.findOne({
    id: payoutId,
    status: 'APPROVED' // Chỉ xử lý payout đã được admin duyệt
  });

  if (!payout) {
    console.warn(`Payout #${payoutId} not found or not in APPROVED status`);
    return res.status(200).json({ success: true });
  }

  // 6. Kiểm tra số tiền khớp
  if (data.transferAmount !== payout.amount) {
    console.warn(`Amount mismatch: SePay=${data.transferAmount}, Payout=${payout.amount}`);
    // Flag cho admin review thủ công
    await db.payouts.update(payoutId, {
      flag: 'AMOUNT_MISMATCH',
      sepay_amount: data.transferAmount
    });
    return res.status(200).json({ success: true });
  }

  // 7. ✅ Tất cả khớp → Tự động hoàn tất payout
  await db.payouts.update(payoutId, {
    status: 'COMPLETED',
    completed_at: new Date(),
    sepay_transaction_id: data.id,
    sepay_reference_code: data.referenceCode,
    transaction_date: data.transactionDate
  });

  // 8. Lưu bản ghi SePay transaction (chống trùng lặp)
  await db.sepay_transactions.create({
    sepay_id: data.id,
    payout_id: payoutId,
    amount: data.transferAmount,
    reference_code: data.referenceCode
  });

  // 9. Gửi thông báo cho affiliate
  await notifyAffiliate(payout.affiliate_id, {
    type: 'PAYOUT_COMPLETED',
    message: `Đã thanh toán ${payout.amount.toLocaleString()}đ vào tài khoản của bạn`,
    reference: data.referenceCode
  });

  // 10. Trả về success cho SePay
  return res.status(200).json({ success: true });
}
```

### 6.6. Quy tắc nội dung chuyển khoản

Khi admin chuyển khoản, **bắt buộc** phải ghi nội dung theo format:

```
PAYOUT {payout_id}
```

**Ví dụ:** `PAYOUT 12345`

> [!WARNING]
> Nếu admin ghi sai nội dung chuyển khoản, hệ thống sẽ **không tự động match** được. Khi đó admin cần xác nhận thủ công trên dashboard.

**Để hỗ trợ admin**, giao diện duyệt payout nên có:
- Nút **"Copy nội dung CK"** → tự động copy `PAYOUT 12345` vào clipboard
- Nút **"Copy số tiền"** → copy `2500000`
- Nút **"Copy STK"** → copy số tài khoản affiliate
- Hiển thị QR code VietQR để admin quét nhanh trên app bank

### 6.7. API SePay bổ sung: Đối soát

Ngoài webhook, bạn có thể dùng **SePay Transaction API** để đối soát:

```bash
# Lấy danh sách giao dịch tiền ra trong ngày
curl -X GET "https://my.sepay.vn/userapi/transactions/list?\
  account_number=YOUR_ACCOUNT\
  &transaction_date_min=2026-03-27\
  &amount_out=2500000" \
  -H "Authorization: Bearer YOUR_SEPAY_API_TOKEN"
```

**Response:**
```json
{
  "status": 200,
  "transactions": [
    {
      "id": "92704",
      "bank_brand_name": "Vietcombank",
      "account_number": "0123499999",
      "transaction_date": "2026-03-27 14:02:37",
      "amount_out": "2500000.00",
      "amount_in": "0.00",
      "transaction_content": "PAYOUT 12345",
      "reference_number": "MBVCB.3278907687"
    }
  ]
}
```

Dùng API này để:
- Chạy **cron job đối soát** hàng ngày (backup cho webhook)
- Xác nhận lại các payout bị miss webhook
- Export báo cáo chi trả

### 6.8. Trạng thái Payout (cập nhật với SePay)

| Trạng thái | Mô tả | Chuyển tiếp |
|------------|--------|-------------|
| `PENDING` | Affiliate vừa gửi yêu cầu | → Admin duyệt → `APPROVED` |
| `APPROVED` | Admin đã duyệt, chờ chuyển khoản | → Admin CK + SePay confirm → `COMPLETED` |
| `COMPLETED` | SePay xác nhận giao dịch thành công | Trạng thái cuối |
| `REJECTED` | Admin từ chối, hoàn lại số dư | Trạng thái cuối |
| `FLAGGED` | SePay nhận giao dịch nhưng amount không khớp | → Admin review thủ công |

### 6.9. Giao diện Admin - Cải tiến với SePay

Khi admin nhấn **[Duyệt]** một payout, hiển thị modal:

```
┌─────────────────────────────────────────┐
│  💸 Duyệt Payout #12345                │
├─────────────────────────────────────────┤
│                                         │
│  Affiliate:  Nguyễn Văn A (PHONG4637)  │
│  Số tiền:    2.500.000đ                │
│                                         │
│  ── Thông tin chuyển khoản ──           │
│                                         │
│  Ngân hàng:  Vietcombank               │
│  Số TK:      1234567890   [📋 Copy]    │
│  Chủ TK:     NGUYEN VAN A              │
│  Số tiền:    2,500,000    [📋 Copy]    │
│  Nội dung:   PAYOUT 12345 [📋 Copy]    │
│                                         │
│  ┌─────────────────────────┐            │
│  │    [QR Code VietQR]     │            │
│  │    Quét để chuyển       │            │
│  │    khoản nhanh          │            │
│  └─────────────────────────┘            │
│                                         │
│  ⓘ Sau khi chuyển khoản, SePay sẽ     │
│    tự động xác nhận giao dịch.          │
│                                         │
│  [Xác nhận đã duyệt]  [Hủy]           │
│                                         │
└─────────────────────────────────────────┘
```

> [!TIP]
> Có thể tạo QR code VietQR bằng URL: `https://qr.sepay.vn/img?acc={stk}&bank={bank_code}&amount={amount}&des=PAYOUT+{id}` — SePay hỗ trợ tạo QR chuẩn VietQR miễn phí.
