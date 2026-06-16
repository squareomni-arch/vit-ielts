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
  '{
    "badge": { "text": "FAQ" },
    "title": "Câu hỏi thường gặp",
    "description": "Tìm hiểu thêm về dịch vụ của chúng tôi.",
    "items": [
      { "question": "Tôi có thể dùng thử miễn phí không?", "answer": "Có! Bạn có thể dùng thử miễn phí với một số bài tập cơ bản trước khi quyết định đăng ký gói học." },
      { "question": "Tôi có thể hủy đăng ký bất cứ lúc nào không?", "answer": "Có, bạn có thể hủy đăng ký bất cứ lúc nào. Gói học sẽ tiếp tục hoạt động cho đến hết thời hạn đã thanh toán." },
      { "question": "Phương thức thanh toán nào được chấp nhận?", "answer": "Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng, ví điện tử MoMo, ZaloPay." }
    ]
  }'::jsonb,
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
