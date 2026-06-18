-- ===========================================================================
-- CMS Seed Data — Initial config for all CMS sections (NEW UI schema)
-- Chạy sau khi đã có bảng cms_configs
-- Uses ON CONFLICT DO UPDATE = safe to re-run
-- ===========================================================================

-- ─── HOME: Hero Banner ────────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'home/hero-banner',
  '{
    "title": {
      "line1": "Vit IELTS",
      "line2": "Thi",
      "highlight": "Thử Như Thật"
    },
    "subtitle": "Thi thử như thật với giao diện 1:1 và kho đề sát thực tế. Bứt phá band điểm cùng hệ thống giải thích chi tiết.",
    "checklist": [
      "Giao diện thi máy",
      "Cập nhật xu hướng đề",
      "Chấm chữa chi tiết, tối ưu thời gian"
    ],
    "cta": { "text": "Khám phá ngay", "link": "/ielts-practice-library" },
    "images": {
      "screen": "/assets/figma/icons/screen 1.png",
      "mascot": "/assets/figma/icons/like 1.png"
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── HOME: Test Platform Intro ────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'home/test-platform-intro',
  '{
    "badge": "PREMIUM",
    "title": "Khám Phá Kho Đề",
    "titleHighlight": "Dự Đoán",
    "cards": [
      { "title": "IELTS Full Test", "icon": "/assets/figma/icons/book (1) 1.svg", "bg": "/assets/figma/icons/Background-1.png", "color": "from-rose-600 to-rose-500", "href": "/ielts-exam-library" },
      { "title": "Listening Practice", "icon": "/assets/figma/icons/listen 1.svg", "bg": "/assets/figma/icons/Background-2.png", "color": "from-emerald-600 to-emerald-500", "href": "/ielts-practice-library?skill=listening" },
      { "title": "Reading Practice", "icon": "/assets/figma/icons/reading-book 1.svg", "bg": "/assets/figma/icons/Background-3.png", "color": "from-orange-600 to-orange-400", "href": "/ielts-practice-library?skill=reading" },
      { "title": "Sample Writing", "icon": "/assets/figma/icons/copywriting (1) 1.svg", "bg": "/assets/figma/icons/Background-4.png", "color": "from-indigo-400 to-indigo-300", "href": "/sample-writing" },
      { "title": "Sample Speaking", "icon": "/assets/figma/icons/speaking 1.svg", "bg": "/assets/figma/icons/Background-5.png", "color": "from-amber-500 to-yellow-400", "href": "/sample-speaking" },
      { "title": "Vit IELTS", "icon": "/assets/figma/icons/search 1.svg", "bg": "/assets/figma/icons/Background-6.png", "color": "from-blue-600 to-blue-500", "href": "/ielts-prediction" }
    ]
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── HOME: Why Choose Us ──────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'home/why-choose-us',
  '{
    "badge": "Tại sao chọn chúng tôi?",
    "title": "Luyện thi IELTS Trên Giao Diện Thi Thật",
    "description": "IPT cung cấp bộ đề thi thật tập trung vào các dạng câu hỏi xuất hiện thường xuyên, chủ đề lặp lại và cấu trúc đề được ghi nhận từ thí sinh thi gần đây, giúp người học luyện tập hiệu quả, tránh học lan man và tiết kiệm thời gian ôn tập.",
    "stats": [
      { "icon": "/assets/figma/icons/LovedbyStudents.svg", "number": "5,000+", "label": "HỌC VIÊN YÊU THÍCH", "bgColor": "#D94A56" },
      { "icon": "/assets/figma/icons/Aim.svg", "number": "1,000+", "label": "HỌC VIÊN ĐẠT AIM", "bgColor": "#219653" },
      { "icon": "/assets/figma/icons/Legit.svg", "number": "20+", "label": "ĐỀ THI THẬT", "bgColor": "#5281F9" },
      { "icon": "/assets/figma/icons/Goal.svg", "number": "100+", "label": "HỌC VIÊN ĐẠT 8.0", "bgColor": "#FC945A" }
    ]
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── HOME: Testimonials ───────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'home/testimonials',
  '{
    "title": "Phản hồi từ học viên",
    "description": "Trải nghiệm thực tế từ học viên đã luyện đề sát cấu trúc thi thật và làm quen giao diện thi máy trước ngày thi.",
    "cta": { "text": "Xem Thêm Phản Hồi", "link": "/subscription" },
    "reviews": [
      { "name": "Nguyễn Thị Lan", "score": "IELTS 7.0", "avatar": "/assets/figma/icons/Background-1.png", "review": "Giao diện thi rất giống thi thật, giúp mình làm quen trước ngày thi. Mình đã đạt band 7.0 sau 2 tháng luyện tập liên tục.", "rating": 5 },
      { "name": "Trần Văn Minh", "score": "IELTS 6.5", "avatar": "/assets/figma/icons/Background-2.png", "review": "Đề thi sát với cấu trúc thật. Mình thích cách chấm điểm tự động, tiết kiệm rất nhiều thời gian ôn luyện.", "rating": 5 },
      { "name": "Hoàng Minh Tuấn", "score": "IELTS 7.5", "avatar": "/assets/figma/icons/Background-3.png", "review": "Trang web này giúp mình tập làm quen với format thi thật. Sau khi luyện đủ 30 bài, mình tự tin hơn hẳn khi thi chính thức.", "rating": 5 },
      { "name": "Bùi Thị Thu", "score": "IELTS 6.0", "avatar": "/assets/figma/icons/Background-4.png", "review": "Phần Listening rất chuẩn, đúng format. Mình từng mua khóa học bên ngoài nhưng giờ luyện ở đây là đủ rồi.", "rating": 5 },
      { "name": "Lý Thanh Sơn", "score": "IELTS 8.0", "avatar": "/assets/figma/icons/Background-5.png", "review": "Rất hài lòng với chất lượng đề. Hệ thống chấm điểm tức thì giúp mình biết ngay điểm yếu để cải thiện.", "rating": 5 },
      { "name": "Phạm Thị Hoa", "score": "IELTS 7.5", "avatar": "/assets/figma/icons/Background-2.png", "review": "Platform tốt nhất mình từng dùng để luyện IELTS. Reading và Listening đều rất chất lượng, đề đa dạng.", "rating": 5 },
      { "name": "Lê Quốc Bảo", "score": "IELTS 6.0", "avatar": "/assets/figma/icons/Background-3.png", "review": "Mình luyện tập mỗi ngày với bộ đề ở đây. Sau 3 tháng đã tăng từ 5.5 lên 6.0, rất hài lòng với kết quả.", "rating": 5 },
      { "name": "Ngô Thị Mai", "score": "IELTS 7.0", "avatar": "/assets/figma/icons/Background-4.png", "review": "Giao diện rất thân thiện và chuyên nghiệp. Đề thi bám sát thực tế và cập nhật thường xuyên.", "rating": 5 },
      { "name": "Đinh Văn Khoa", "score": "IELTS 6.5", "avatar": "/assets/figma/icons/Background-5.png", "review": "Trải nghiệm thi thử rất mượt mà, không khác gì thi thật. Mình đã tăng 1.0 band chỉ sau 2 tháng luyện đề đây.", "rating": 5 },
      { "name": "Vương Thị Liên", "score": "IELTS 7.0", "avatar": "/assets/figma/icons/Background-6.png", "review": "Bộ đề phong phú, giải thích chi tiết. Mình đặc biệt thích tính năng xem lại lỗi sai sau mỗi bài thi.", "rating": 5 },
      { "name": "Đặng Thu Hương", "score": "IELTS 8.0", "avatar": "/assets/figma/icons/Background-4.png", "review": "Hệ thống giao diện máy tính rất mượt, đúng với format thi thật. Đặc biệt phần Listening rất chuẩn.", "rating": 5 },
      { "name": "Vũ Thế Dũng", "score": "IELTS 6.5", "avatar": "/assets/figma/icons/Background-5.png", "review": "Luyện đề trên này giúp mình quen với áp lực thời gian. Kết quả thi thật tốt hơn mình mong đợi.", "rating": 5 },
      { "name": "Trịnh Thị Ngọc", "score": "IELTS 7.0", "avatar": "/assets/figma/icons/Background-6.png", "review": "Mình đã thử nhiều nền tảng luyện IELTS khác nhau. Đây là nơi có đề sát thực nhất và interface đẹp nhất.", "rating": 5 },
      { "name": "Cao Minh Nhật", "score": "IELTS 6.5", "avatar": "/assets/figma/icons/Background-1.png", "review": "Chất lượng đề thi cao, cập nhật liên tục. Mình học Read và Listen ở đây là chủ yếu và thấy hiệu quả rõ rệt.", "rating": 5 },
      { "name": "Phan Thị Hải", "score": "IELTS 7.5", "avatar": "/assets/figma/icons/Background-2.png", "review": "Sau khi dùng nền tảng này 3 tháng, mình đạt 7.5 thật sự bất ngờ. Phần thi thật không khác gì luyện ở đây.", "rating": 5 }
    ]
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── HEADER: Top Bar ──────────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'header/top-bar',
  '{
    "text": "🎉 Đăng ký ngay để nhận ưu đãi 50% cho tất cả gói học!",
    "link": "/subscription",
    "visible": false
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── FOOTER: CTA Banner ──────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'footer/cta-banner',
  '{
    "title": "Bắt đầu luyện thi IELTS ngay hôm nay!",
    "description": "Tham gia cùng hàng nghìn học viên đã đạt band điểm mơ ước.",
    "backgroundGradient": "linear-gradient(135deg, #D94A56 0%, #E86B75 100%)",
    "button": { "text": "Bắt đầu miễn phí", "link": "/subscription" }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── SUBSCRIPTION: Banner ─────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'subscription/banner',
  '{
    "backgroundImage": "",
    "subtitle": { "text": "PRICING" },
    "title": "Chọn gói học phù hợp với bạn",
    "description": "Đa dạng gói học với mức giá hợp lý, phù hợp với mọi nhu cầu."
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── SUBSCRIPTION: Course Packages ────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'subscription/course-packages',
  '{
    "currencySuffix": "đ",
    "popularBadgeText": "Phổ biến nhất",
    "priceSuffix": "/tháng",
    "monthText": { "singular": "tháng", "plural": "tháng" },
    "accessText": "Truy cập toàn bộ",
    "dealNoteTemplate": "Tiết kiệm {percent}%",
    "features": {
      "included": ["Truy cập tất cả bài tập", "AI chấm bài tự động", "Hỗ trợ 24/7"],
      "excluded": ["Gia sư riêng", "Workshop offline"]
    },
    "skillLabels": { "listening": "Listening", "reading": "Reading" },
    "combo": {
      "title": "Combo Listening + Reading",
      "ctaText": "Đăng ký ngay",
      "basePrice": 199000,
      "monthlyIncrementPrice": 100000,
      "plans": [
        { "name": "1 tháng", "months": 1, "price": 199000 },
        { "name": "3 tháng", "months": 3, "price": 499000, "popular": true },
        { "name": "6 tháng", "months": 6, "price": 899000, "featuredDeal": true, "dealNote": "Tiết kiệm 25%" }
      ]
    },
    "single": {
      "title": "Listening hoặc Reading",
      "ctaText": "Đăng ký ngay",
      "basePrice": 129000,
      "monthlyIncrementPrice": 80000,
      "skills": ["listening", "reading"],
      "plans": [
        { "name": "1 tháng", "months": 1, "price": 129000 },
        { "name": "3 tháng", "months": 3, "price": 329000, "popular": true },
        { "name": "6 tháng", "months": 6, "price": 599000 }
      ]
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── SUBSCRIPTION: FAQ ────────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'subscription/faq',
  $json${
    "badge": { "text": "FAQ" },
    "title": "Câu hỏi thường gặp",
    "description": "Giải đáp nhanh những câu hỏi phổ biến về cách luyện đề, gói Premium và hình thức thi máy.",
    "items": [
      {
        "question": "Làm thế nào để đăng ký tài khoản Vịt IELTS?",
        "answer": "Bạn truy cập vào trang chủ vitielts.com và chọn nút \"Đăng ký\" ở góc phải màn hình. Bạn có thể tạo tài khoản nhanh chóng bằng cách liên kết trực tiếp với Google, Facebook, hoặc sử dụng địa chỉ Email cá nhân."
      },
      {
        "question": "Tôi quên mật khẩu đăng nhập thì phải làm sao?",
        "answer": "Tại màn hình đăng nhập, hãy bấm vào dòng \"Quên mật khẩu\". Hệ thống sẽ yêu cầu bạn nhập địa chỉ Email đã đăng ký và gửi một đường link xác thực. Truy cập vào link đó để tiến hành đặt lại mật khẩu mới."
      },
      {
        "question": "Tôi có thể thay đổi địa chỉ email liên kết với tài khoản không?",
        "answer": "Hiện tại, để đảm bảo tính bảo mật và đồng bộ tiến trình học tập, hệ thống chưa hỗ trợ tự thay đổi email trực tiếp trên giao diện. Vui lòng liên hệ bộ phận hỗ trợ (Support) qua Fanpage hoặc Email để được hỗ trợ đổi thông tin."
      },
      {
        "question": "Tôi có thể đăng nhập một tài khoản trên nhiều thiết bị cùng lúc được không?",
        "answer": "Bạn có thể đăng nhập trên nhiều thiết bị (laptop, điện thoại, máy tính bảng), tuy nhiên hệ thống chỉ cho phép một phiên làm việc hoạt động tại một thời điểm. Nếu bạn làm bài test trên thiết bị thứ hai, phiên làm việc ở thiết bị thứ nhất sẽ tự động đăng xuất."
      },
      {
        "question": "Làm sao để cập nhật thông tin cá nhân và mục tiêu điểm số?",
        "answer": "Bạn truy cập vào mục \"Hồ sơ của tôi\" (My Profile) trên bảng điều khiển (Dashboard). Tại đây, bạn có thể chỉnh sửa tên hiển thị, ngày thi dự kiến và mục tiêu band điểm để hệ thống tùy chỉnh lộ trình nhắc nhở phù hợp."
      },
      {
        "question": "Tôi muốn xóa tài khoản Vịt IELTS vĩnh viễn thì làm thế nào?",
        "answer": "Bạn gửi email yêu cầu xóa tài khoản về địa chỉ vitielts8.0@gmail.com bằng chính email đã dùng để đăng ký. Hệ thống sẽ tiến hành vô hiệu hóa và xóa toàn bộ dữ liệu học tập của bạn trong vòng 7 ngày làm việc."
      },
      {
        "question": "Sự khác biệt giữa tài khoản Miễn phí và tài khoản Premium là gì?",
        "answer": "Tài khoản Miễn phí cho phép bạn trải nghiệm giao diện thi máy và làm một số bài test giới hạn. Với tài khoản Premium, bạn được mở khóa toàn bộ kho đề (bao gồm các bộ Cambridge mới nhất và đề Forecast độc quyền), cùng khả năng xem giải thích đáp án cực kỳ chi tiết."
      },
      {
        "question": "Gói Premium có giới hạn số lần làm bài thi không?",
        "answer": "Không. Khi sở hữu gói Premium, bạn có đặc quyền làm lại bất kỳ bài test nào với số lần không giới hạn. Lịch sử điểm số của từng lần làm bài sẽ được lưu lại để bạn theo dõi sự tiến bộ."
      },
      {
        "question": "Tôi có thể chia sẻ tài khoản Premium với bạn bè để học chung không?",
        "answer": "Mỗi tài khoản Premium được thiết kế để cá nhân hóa tiến trình học tập, phân tích điểm yếu và lưu trữ lịch sử riêng biệt cho một người dùng. Việc chia sẻ tài khoản sẽ làm sai lệch các thống kê này và vi phạm chính sách bảo mật của Vịt IELTS."
      },
      {
        "question": "Sau khi thanh toán thành công, bao lâu thì tài khoản Premium được kích hoạt?",
        "answer": "Nếu bạn thanh toán qua cổng thanh toán tự động (Momo, VNPay, Thẻ tín dụng), tài khoản sẽ được nâng cấp lên Premium ngay lập tức. Nếu thanh toán qua hình thức chuyển khoản thủ công, thời gian kích hoạt sẽ mất từ 15 đến 30 phút trong giờ làm việc."
      },
      {
        "question": "Bộ đề thi của gói Premium có được cập nhật mới thường xuyên không?",
        "answer": "Kho dữ liệu Premium được đội ngũ học thuật cập nhật liên tục hàng tháng. Ngay khi có xu hướng ra đề mới hoặc tài liệu Forecast chuẩn xác, hệ thống sẽ tự động bổ sung vào kho đề của bạn mà không thu thêm bất kỳ phụ phí nào."
      },
      {
        "question": "Tôi có việc bận đột xuất, tôi có thể bảo lưu gói Premium đang sử dụng không?",
        "answer": "Hệ thống hiện tại hỗ trợ bảo lưu 01 lần duy nhất cho các tài khoản đang sử dụng gói Premium từ 6 tháng trở lên. Thời gian bảo lưu tối đa là 30 ngày."
      },
      {
        "question": "Làm sao để biết gói Premium của tôi bao giờ hết hạn?",
        "answer": "Bạn truy cập vào mục \"Cài đặt tài khoản\" (Account Settings) > \"Gói cước của tôi\" (My Subscription). Hệ thống sẽ hiển thị rõ loại gói bạn đang dùng và ngày hết hạn chính xác."
      },
      {
        "question": "Vịt IELTS hiện đang hỗ trợ những phương thức thanh toán nào?",
        "answer": "Hệ thống hiện tại hỗ trợ thanh toán trực tuyến qua hình thức Chuyển khoản ngân hàng (Bank transfer / Online payment). Bạn có thể sử dụng ứng dụng ngân hàng để quét mã QR hoặc nhập thông tin chuyển khoản thủ công tới tài khoản MB Bank (Ngân hàng Quân Đội) của hệ thống."
      },
      {
        "question": "Sau khi chuyển khoản, tôi cần làm gì để tài khoản được kích hoạt?",
        "answer": "Để hệ thống kiểm tra và kích hoạt gói cước tự động, bạn bắt buộc phải nhập chính xác Nội dung chuyển khoản theo cú pháp mà hệ thống cung cấp trên màn hình (Ví dụ: VIT IELTS kèm theo một dãy số). Bạn có thể bấm vào nút sao chép nội dung chuyển khoản để tránh gõ sai."
      },
      {
        "question": "Có cần gửi biên lai cho admin sau khi thanh toán không?",
        "answer": "Không cần thiết. Sau khi hoàn tất chuyển khoản trên ứng dụng ngân hàng, bạn chỉ cần không tắt trình duyệt và chờ vài phút. Hệ thống sẽ tự động hiển thị trạng thái \"Đang kiểm tra thanh toán...\" và trả kết quả giao dịch trực tiếp trên website."
      },
      {
        "question": "Tôi đã chuyển khoản thành công nhưng bị tắt trình duyệt giữa chừng hoặc gặp sự cố thì phải làm sao?",
        "answer": "Nếu quá trình xử lý giao dịch gặp trục trặc hoặc bạn cần báo cáo sự cố thanh toán, vui lòng liên hệ ngay qua Hotline hỗ trợ nhanh: 0326752732 để được đội ngũ kỹ thuật hỗ trợ đối soát kịp thời."
      },
      {
        "question": "Làm sao để áp dụng mã giảm giá (Promo Code) khi thanh toán?",
        "answer": "Tại trang Thanh toán, bạn nhìn sang cột tóm tắt đơn hàng (Order summary) bên phải. Hãy điền chính xác mã khuyến mãi vào ô \"Nhập mã giảm giá\" và bấm nút \"Áp dụng\". Tổng số tiền cần thanh toán sẽ tự động được cập nhật trước khi bạn chuyển sang bước quét mã QR."
      },
      {
        "question": "Giao diện thi máy của Vịt IELTS có giống với khi đi thi thật tại IDP hay BC không?",
        "answer": "Có. Giao diện Vịt IELTS mô phỏng sát thi máy thực tế tại IDP và British Council đầy đủ timer, nút điều hướng, tính năng Highlight và Note giúp bạn làm quen môi trường thi trước ngày thi chính thức."
      },
      {
        "question": "Tôi có thể sử dụng các tính năng Highlight (tô sáng) hay Note (ghi chú) như khi thi thật không?",
        "answer": "Có. Giao diện làm bài trên Vịt IELTS hỗ trợ tính năng Highlight (tô sáng văn bản) và Note (ghi chú) ngay trong quá trình làm bài, tương tự giao diện thi máy thực tế tại IDP và British Council. Bạn có thể đánh dấu các từ khóa quan trọng trong bài Reading hoặc ghi chú nhanh để không bỏ sót ý khi làm bài."
      },
      {
        "question": "Tính năng \"Lớp học của tôi\" (My Classes) và \"Bài tập\" (My Assignments) dùng để làm gì?",
        "answer": "My Classes (Lớp học của tôi): Nơi bạn quản lý các lớp học IELTS đang tham gia. Nếu bạn đăng ký theo học cùng giáo viên trên nền tảng, toàn bộ lớp học và tài liệu do giáo viên giao sẽ được tập trung tại đây.\nMy Assignments (Bài tập của tôi): Hiển thị danh sách bài tập, đề thi hoặc nhiệm vụ học tập mà giáo viên giao cho bạn theo từng buổi học."
      },
      {
        "question": "Tôi tự học một mình và mua gói Premium thì có dùng được tính năng Lớp học không?",
        "answer": "Với người tự học mua gói Premium, bạn hoàn toàn có thể tự tạo và sử dụng tính năng Lớp học để tự tổ chức lộ trình ôn tập của mình tự giao bài tập, đặt deadline và theo dõi tiến độ như một \"lớp học cá nhân\" do chính bạn làm chủ."
      },
      {
        "question": "Kết quả làm bài và lịch sử điểm số của tôi có bị người khác nhìn thấy không?",
        "answer": "Hoàn toàn không. Toàn bộ kết quả làm bài, lịch sử điểm số và dữ liệu tiến trình học tập của bạn được bảo mật riêng tư theo từng tài khoản cá nhân. Không có người dùng nào khác có thể truy cập vào thông tin này. Chỉ bạn và đội ngũ giáo viên/admin (trong trường hợp bạn tham gia lớp học) mới có quyền xem."
      },
      {
        "question": "Dữ liệu học tập của tôi có bị mất nếu tôi đổi thiết bị không?",
        "answer": "Không. Toàn bộ lịch sử làm bài, điểm số và tiến trình học tập được lưu trữ trên hệ thống đám mây của Vịt IELTS. Bạn có thể đăng nhập từ bất kỳ thiết bị nào laptop, điện thoại, máy tính bảng và dữ liệu vẫn được đồng bộ đầy đủ."
      },
      {
        "question": "Vịt IELTS có chia sẻ thông tin cá nhân của tôi cho bên thứ ba không?",
        "answer": "Không. Thông tin cá nhân của bạn (họ tên, email, lịch sử học tập) được bảo mật tuyệt đối và không được chia sẻ, mua bán hoặc cung cấp cho bất kỳ bên thứ ba nào vì mục đích thương mại. Vịt IELTS chỉ sử dụng dữ liệu của bạn để cá nhân hóa trải nghiệm học tập trên nền tảng."
      },
      {
        "question": "Gói Premium hết hạn thì dữ liệu và lịch sử làm bài của tôi có bị xóa không?",
        "answer": "Không. Khi gói Premium hết hạn, toàn bộ lịch sử làm bài và điểm số của bạn vẫn được giữ nguyên hệ thống chỉ khóa quyền truy cập vào các tính năng Premium. Bạn có thể gia hạn bất kỳ lúc nào để tiếp tục học mà không mất dữ liệu đã tích lũy."
      },
      {
        "question": "Band điểm dự đoán trên Vịt IELTS có chính xác so với thi thật không?",
        "answer": "Hệ thống chấm điểm của Vịt IELTS được xây dựng dựa trên thang điểm và tiêu chí đánh giá chính thức của IELTS. Kết quả mock test phản ánh sát năng lực thực tế của bạn tại thời điểm làm bài. Tuy nhiên, điểm thi thật có thể dao động tùy vào trạng thái tâm lý và điều kiện thi trong ngày đây là lý do Vịt IELTS khuyến khích bạn luyện đề đều đặn để ổn định band điểm trước khi đăng ký thi chính thức."
      }
    ]
  }$json$::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── IELTS Exam Library: Hero Banner ──────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'ielts-exam-library/hero-banner',
  '{
    "title": "IELTS Exam Library",
    "backgroundColor": "#D94A56",
    "breadcrumb": { "homeLabel": "Trang chủ", "currentLabel": "IELTS Exam Library" }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── IELTS Practice Library: Banner ───────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'ielts-practice-library/banner',
  '{
    "listening": {
      "title": "IELTS Listening Practice",
      "description": { "line1": "Luyện tập IELTS Listening với hàng trăm bài tập", "line2": "từ dễ đến khó, sát đề thi thật nhất.", "line3": "" },
      "backgroundColor": "#D94A56",
      "button": { "text": "Bắt đầu luyện tập", "link": "/ielts-practice-library?skill=listening" }
    },
    "reading": {
      "title": "IELTS Reading Practice",
      "description": { "line1": "Luyện tập IELTS Reading với hàng trăm bài tập", "line2": "từ Academic đến General Training.", "line3": "" },
      "backgroundColor": "#2D3142",
      "button": { "text": "Bắt đầu luyện tập", "link": "/ielts-practice-library?skill=reading" }
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── SAMPLE ESSAY: Banner ─────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'sample-essay/banner',
  '{
    "writing": {
      "title": "IELTS Writing Samples",
      "description": { "line1": "Tham khảo hàng trăm bài mẫu Writing Task 1 & Task 2", "line2": "được chấm chi tiết với band score." },
      "backgroundColor": "#D94A56"
    },
    "speaking": {
      "title": "IELTS Speaking Samples",
      "description": { "line1": "Tham khảo câu trả lời mẫu cho Part 1, 2, 3", "line2": "với phân tích chi tiết và từ vựng nâng cao." },
      "backgroundColor": "#2D3142"
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── LEGAL ────────────────────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'terms-of-use',
  '{
    "banner": { "title": "Điều khoản sử dụng", "subtitle": "Vui lòng đọc kỹ trước khi sử dụng dịch vụ", "backgroundImage": "" },
    "heroImage": "",
    "content": {
      "introTitle": "Điều khoản sử dụng Vit IELTS",
      "introParagraphs": ["Chào mừng bạn đến với Vit IELTS. Bằng việc sử dụng dịch vụ, bạn đồng ý với các điều khoản sau."],
      "sections": [
        { "title": "1. Chấp nhận điều khoản", "content": "Bằng việc truy cập và sử dụng website, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này." },
        { "title": "2. Tài khoản người dùng", "content": "Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình. Mọi hoạt động trên tài khoản là trách nhiệm của bạn." }
      ]
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'privacy-policy',
  '{
    "banner": { "title": "Chính sách bảo mật", "subtitle": "Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn", "backgroundImage": "" },
    "heroImage": "",
    "content": {
      "introTitle": "Chính sách bảo mật Vit IELTS",
      "introParagraphs": ["Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ dữ liệu cá nhân."],
      "sections": [
        { "title": "1. Thông tin chúng tôi thu thập", "content": "Chúng tôi thu thập thông tin bạn cung cấp khi đăng ký tài khoản, bao gồm tên, email, và thông tin thanh toán." },
        { "title": "2. Cách chúng tôi sử dụng thông tin", "content": "Thông tin được sử dụng để cung cấp và cải thiện dịch vụ, xử lý thanh toán, và giao tiếp với bạn." }
      ]
    }
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ─── SEO: Global Config ───────────────────────────────────────────────────
INSERT INTO public.cms_configs (section_name, data, updated_at)
VALUES (
  'seo/global',
  '{
    "siteTitle": "Vit IELTS — Luyện thi IELTS Online",
    "siteDescription": "Nền tảng luyện thi IELTS Online hàng đầu Việt Nam.",
    "siteKeywords": "ielts, luyện thi ielts, thi thử ielts, ielts online",
    "ogImage": "",
    "robots": "index, follow"
  }'::jsonb,
  now()
)
ON CONFLICT (section_name) DO UPDATE SET data = EXCLUDED.data, updated_at = now();

-- ===========================================================================
-- Cleanup: Remove old section names that used to exist without home/ prefix
-- ===========================================================================
DELETE FROM public.cms_configs WHERE section_name IN (
  'hero-banner',
  'test-platform-intro',
  'why-choose-us',
  'testimonials',
  'practice-section'
);

-- ===========================================================================
-- Verification
-- ===========================================================================
SELECT section_name, updated_at FROM public.cms_configs ORDER BY section_name;
