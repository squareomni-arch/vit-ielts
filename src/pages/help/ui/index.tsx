import Head from "next/head";
import { useState } from "react";
import { AppShell } from "@/widgets/layouts";
import { useAppContext } from "@/appx/providers";

// ── Static data ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "getting-started",
    icon: "rocket_launch",
    iconBg: "bg-brand-tint",
    iconColor: "text-brand-hover",
    title: "Getting started",
    count: 2,
  },
  {
    id: "mock-tests",
    icon: "quiz",
    iconBg: "bg-accent-blue/10",
    iconColor: "text-accent-blue",
    title: "Mock tests",
    count: 4,
  },
  {
    id: "billing",
    icon: "credit_card",
    iconBg: "bg-accent-yellow/20",
    iconColor: "text-ink-700",
    title: "Billing & plans",
    count: 12,
  },
  {
    id: "account",
    icon: "manage_accounts",
    iconBg: "bg-surface-blush",
    iconColor: "text-danger",
    title: "Account & security",
    count: 6,
  },
  {
    id: "feedback",
    icon: "rate_review",
    iconBg: "bg-accent-teal/10",
    iconColor: "text-accent-teal",
    title: "Feedback & grading",
    count: 1,
  },
  {
    id: "technical",
    icon: "build",
    iconBg: "bg-accent-violet/10",
    iconColor: "text-accent-violet",
    title: "Technical issues",
    count: 2,
  },
] as const;

const POPULAR_QUESTIONS = [
  // Getting Started (Category: getting-started)
  {
    id: "q1",
    category: "getting-started",
    question: "Làm thế nào để đăng ký tài khoản Vịt IELTS?",
    answer: "Bạn truy cập vào trang chủ vitielts.com và chọn nút \"Đăng ký\" ở góc phải màn hình. Bạn có thể tạo tài khoản nhanh chóng bằng cách liên kết trực tiếp với Google, Facebook, hoặc sử dụng địa chỉ Email cá nhân."
  },
  {
    id: "q5",
    category: "getting-started",
    question: "Làm sao để cập nhật thông tin cá nhân và mục tiêu điểm số?",
    answer: "Bạn truy cập vào mục \"Hồ sơ của tôi\" (My Profile) trên bảng điều khiển (Dashboard). Tại đây, bạn có thể chỉnh sửa tên hiển thị, ngày thi dự kiến và mục tiêu band điểm để hệ thống tùy chỉnh lộ trình nhắc nhở phù hợp."
  },

  // Account & Security (Category: account)
  {
    id: "q2",
    category: "account",
    question: "Tôi quên mật khẩu đăng nhập thì phải làm sao?",
    answer: "Tại màn hình đăng nhập, hãy bấm vào dòng \"Quên mật khẩu\". Hệ thống sẽ yêu cầu bạn nhập địa chỉ Email đã đăng ký và gửi một đường link xác thực. Truy cập vào link đó để tiến hành đặt lại mật khẩu mới."
  },
  {
    id: "q3",
    category: "account",
    question: "Tôi có thể thay đổi địa chỉ email liên kết với tài khoản không?",
    answer: "Hiện tại, để đảm bảo tính bảo mật và đồng bộ tiến trình học tập, hệ thống chưa hỗ trợ tự thay đổi email trực tiếp trên giao diện. Vui lòng liên hệ bộ phận hỗ trợ (Support) qua Fanpage hoặc Email để được hỗ trợ đổi thông tin."
  },
  {
    id: "q4",
    category: "account",
    question: "Tôi có thể đăng nhập một tài khoản trên nhiều thiết bị cùng lúc được không?",
    answer: "Bạn có thể đăng nhập trên nhiều thiết bị (laptop, điện thoại, máy tính bảng), tuy nhiên hệ thống chỉ cho phép một phiên làm việc hoạt động tại một thời điểm. Nếu bạn làm bài test trên thiết bị thứ hai, phiên làm việc ở thiết bị thứ nhất sẽ tự động đăng xuất."
  },
  {
    id: "q6",
    category: "account",
    question: "Tôi muốn xóa tài khoản Vịt IELTS vĩnh viễn thì làm thế nào?",
    answer: "Bạn gửi email yêu cầu xóa tài khoản về địa chỉ vitielts8.0@gmail.com bằng chính email đã dùng để đăng ký. Hệ thống sẽ tiến hành vô hiệu hóa và xóa toàn bộ dữ liệu học tập của bạn trong vòng 7 ngày làm việc."
  },
  {
    id: "q23",
    category: "account",
    question: "Kết quả làm bài và lịch sử điểm số của tôi có bị người khác nhìn thấy không?",
    answer: "Hoàn toàn không. Toàn bộ kết quả làm bài, lịch sử điểm số và dữ liệu tiến trình học tập của bạn được bảo mật riêng tư theo từng tài khoản cá nhân. Không có người dùng nào khác có thể truy cập vào thông tin này. Chỉ bạn và đội ngũ giáo viên/admin (trong trường hợp bạn tham gia lớp học) mới có quyền xem."
  },
  {
    id: "q25",
    category: "account",
    question: "Vịt IELTS có chia sẻ thông tin cá nhân của tôi cho bên thứ ba không?",
    answer: "Không. Thông tin cá nhân của bạn (họ tên, email, lịch sử học tập) được bảo mật tuyệt đối và không được chia sẻ, mua bán hoặc cung cấp cho bất kỳ bên thứ ba nào vì mục đích thương mại. Vịt IELTS chỉ sử dụng dữ liệu của bạn để cá nhân hóa trải nghiệm học tập trên nền tảng."
  },

  // Billing & Plans (Category: billing)
  {
    id: "q7",
    category: "billing",
    question: "Sự kết hợp giữa tài khoản Miễn phí và tài khoản Premium là gì?",
    answer: "Tài khoản Miễn phí cho phép bạn trải nghiệm giao diện thi máy và làm một số bài test giới hạn. Với tài khoản Premium, bạn được mở khóa toàn bộ kho đề (bao gồm các bộ Cambridge mới nhất và đề Forecast độc quyền), cùng khả năng xem giải thích đáp án cực kỳ chi tiết."
  },
  {
    id: "q8",
    category: "billing",
    question: "Gói Premium có giới hạn số lần làm bài thi không?",
    answer: "Không. Khi sở hữu gói Premium, bạn có đặc quyền làm lại bất kỳ bài test nào với số lần không giới hạn. Lịch sử điểm số của từng lần làm bài sẽ được lưu lại để bạn theo dõi sự tiến bộ."
  },
  {
    id: "q9",
    category: "billing",
    question: "Tôi có thể chia sẻ tài khoản Premium với bạn bè để học chung không?",
    answer: "Mỗi tài khoản Premium được thiết kế để cá nhân hóa tiến trình học tập, phân tích điểm yếu và lưu trữ lịch sử riêng biệt cho một người dùng. Việc chia sẻ tài khoản sẽ làm sai lệch các thống kê này và vi phạm chính sách bảo mật của Vịt IELTS."
  },
  {
    id: "q10",
    category: "billing",
    question: "Sau khi thanh toán thành công, bao lâu thì tài khoản Premium được kích hoạt?",
    answer: "Nếu bạn thanh toán qua cổng thanh toán tự động (Momo, VNPay, Thẻ tín dụng), tài khoản sẽ được nâng cấp lên Premium ngay lập tức. Nếu thanh toán qua hình thức chuyển khoản thủ công, thời gian kích hoạt sẽ mất từ 15 đến 30 phút trong giờ làm việc."
  },
  {
    id: "q11",
    category: "billing",
    question: "Bộ đề thi của gói Premium có được cập nhật mới thường xuyên không?",
    answer: "Kho dữ liệu Premium được đội ngũ học thuật cập nhật liên tục hàng tháng. Ngay khi có xu hướng ra đề mới hoặc tài liệu Forecast chuẩn xác, hệ thống sẽ tự động bổ sung vào kho đề của bạn mà không thu thêm bất kỳ phụ phí nào."
  },
  {
    id: "q12",
    category: "billing",
    question: "Tôi có việc bận đột xuất, tôi có thể bảo lưu gói Premium đang sử dụng không?",
    answer: "Hệ thống hiện tại hỗ trợ bảo lưu 01 lần duy nhất cho các tài khoản đang sử dụng gói Premium từ 6 tháng trở lên. Thời gian bảo lưu tối đa là 30 ngày."
  },
  {
    id: "q13",
    category: "billing",
    question: "Làm sao để biết gói Premium của tôi bao giờ hết hạn?",
    answer: "Bạn truy cập vào mục \"Cài đặt tài khoản\" (Account Settings) > \"Gói cước của tôi\" (My Subscription). Hệ thống sẽ hiển thị rõ loại gói bạn đang dùng và ngày hết hạn chính xác."
  },
  {
    id: "q14",
    category: "billing",
    question: "Vịt IELTS hiện đang hỗ trợ những phương thức thanh toán nào?",
    answer: "Hệ thống hiện tại hỗ trợ thanh toán trực tuyến qua hình thức Chuyển khoản ngân hàng (Bank transfer / Online payment). Bạn có thể sử dụng ứng dụng ngân hàng để quét mã QR hoặc nhập thông tin chuyển khoản thủ công tới tài khoản MB Bank (Ngân hàng Quân Đội) của hệ thống."
  },
  {
    id: "q15",
    category: "billing",
    question: "Sau khi chuyển khoản, tôi cần làm gì để tài khoản được kích hoạt?",
    answer: "Để hệ thống kiểm tra và kích hoạt gói cước tự động, bạn bắt buộc phải nhập chính xác Nội dung chuyển khoản theo cú pháp mà hệ thống cung cấp trên màn hình (Ví dụ: VIT IELTS kèm theo một dãy số). Bạn có thể bấm vào nút sao chép nội dung chuyển khoản để tránh gõ sai."
  },
  {
    id: "q16",
    category: "billing",
    question: "Có cần gửi biên lai cho admin sau khi thanh toán không?",
    answer: "Không cần thiết. Sau khi hoàn tất chuyển khoản trên ứng dụng ngân hàng, bạn chỉ cần không tắt trình duyệt và chờ vài phút. Hệ thống sẽ tự động hiển thị trạng thái \"Đang kiểm tra thanh toán...\" và trả kết quả giao dịch trực tiếp trên website."
  },
  {
    id: "q18",
    category: "billing",
    question: "Làm sao để áp dụng mã giảm giá (Promo Code) khi thanh toán?",
    answer: "Tại trang Thanh toán, bạn nhìn sang cột tóm tắt đơn hàng (Order summary) bên phải. Hãy điền chính xác mã khuyến mãi vào ô \"Nhập mã giảm giá\" và bấm nút \"Áp dụng\". Tổng số tiền cần thanh toán sẽ tự động được cập nhật trước khi bạn chuyển sang bước quét mã QR."
  },
  {
    id: "q26",
    category: "billing",
    question: "Gói Premium hết hạn thì dữ liệu và lịch sử làm bài của tôi có bị xóa không?",
    answer: "Không. Khi gói Premium hết hạn, toàn bộ lịch sử làm bài và điểm số của bạn vẫn được giữ nguyên hệ thống chỉ khóa quyền truy cập vào các tính năng Premium. Bạn có thể gia hạn bất kỳ lúc nào để tiếp tục học mà không mất dữ liệu đã tích lũy."
  },

  // Mock Tests (Category: mock-tests)
  {
    id: "q19",
    category: "mock-tests",
    question: "Giao diện thi máy của Vịt IELTS có giống với khi đi thi thật tại IDP hay BC không?",
    answer: "Có. Giao diện Vịt IELTS mô phỏng sát thi máy thực tế tại IDP và British Council đầy đủ timer, nút điều hướng, tính năng Highlight và Note giúp bạn làm quen môi trường thi trước ngày thi chính thức."
  },
  {
    id: "q20",
    category: "mock-tests",
    question: "Tôi có thể sử dụng các tính năng Highlight (tô sáng) hay Note (ghi chú) như khi thi thật không?",
    answer: "Có. Giao diện làm bài trên Vịt IELTS hỗ trợ tính năng Highlight (tô sáng văn bản) và Note (ghi chú) ngay trong quá trình làm bài, tương tự giao diện thi máy thực tế tại IDP và British Council. Bạn có thể đánh dấu các từ khóa quan trọng trong bài Reading hoặc ghi chú nhanh để không bỏ sót ý khi làm bài."
  },
  {
    id: "q21",
    category: "mock-tests",
    question: "Tính năng \"Lớp học của tôi\" (My Classes) và \"Bài tập\" (My Assignments) dùng để làm gì?",
    answer: "My Classes (Lớp học của tôi): Nơi bạn quản lý các lớp học IELTS đang tham gia. Nếu bạn đăng ký theo học cùng giáo viên trên nền tảng, toàn bộ lớp học và tài liệu do giáo viên giao sẽ được tập trung tại đây.\nMy Assignments (Bài tập của tôi): Hiển thị danh sách bài tập, đề thi hoặc nhiệm vụ học tập mà giáo viên giao cho bạn theo từng buổi học."
  },
  {
    id: "q22",
    category: "mock-tests",
    question: "Tôi tự học một mình và mua gói Premium thì có dùng được tính năng Lớp học không?",
    answer: "Với người tự học mua gói Premium, bạn hoàn toàn có thể tự tạo và sử dụng tính năng Lớp học để tự tổ chức lộ trình ôn tập của mình tự giao bài tập, đặt deadline và theo dõi tiến độ như một \"lớp học cá nhân\" do chính bạn làm chủ."
  },

  // Feedback & Grading (Category: feedback)
  {
    id: "q27",
    category: "feedback",
    question: "Band điểm dự đoán trên Vịt IELTS có chính xác so với thi thật không?",
    answer: "Hệ thống chấm điểm của Vịt IELTS được xây dựng dựa trên thang điểm và tiêu chí đánh giá chính thức của IELTS. Kết quả mock test phản ánh sát năng lực thực tế của bạn tại thời điểm làm bài. Tuy nhiên, điểm thi thật có thể dao động tùy vào trạng thái tâm lý và điều kiện thi trong ngày đây là lý do Vịt IELTS khuyến khích bạn luyện đề đều đặn để ổn định band điểm trước khi đăng ký thi chính thức."
  },

  // Technical Issues (Category: technical)
  {
    id: "q17",
    category: "technical",
    question: "Tôi đã chuyển khoản thành công nhưng bị tắt trình duyệt giữa chừng hoặc gặp sự cố thì phải làm sao?",
    answer: "Nếu quá trình xử lý giao dịch gặp trục trặc hoặc bạn cần báo cáo sự cố thanh toán, vui lòng liên hệ ngay qua Hotline hỗ trợ nhanh: 055 956 2767 để được đội ngũ kỹ thuật hỗ trợ đối soát kịp thời."
  },
  {
    id: "q24",
    category: "technical",
    question: "Dữ liệu học tập của tôi có bị mất nếu tôi đổi thiết bị không?",
    answer: "Không. Toàn bộ lịch sử làm bài, điểm số và tiến trình học tập được lưu trữ trên hệ thống đám mây của Vịt IELTS. Bạn có thể đăng nhập từ bất kỳ thiết bị nào laptop, điện thoại, máy tính bảng và dữ liệu vẫn được đồng bộ đầy đủ."
  }
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export const PageHelp = () => {
  const {
    masterData: {
      allSettings: { generalSettingsTitle },
      websiteOptions: {
        websiteOptionsFields: {
          generalSettings: { email },
        },
      },
    },
  } = useAppContext();

  // Search query for client-side filtering
  const [query, setQuery] = useState("");

  // Selected category for filtering (null means all topics)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Track which FAQ item is open (first one open by default)
  const [openId, setOpenId] = useState<string | null>("q1");

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  // Derived filtered data — case-insensitive, matches question text or answer
  const normalised = query.trim().toLowerCase();
  const isFiltering = normalised.length > 0;

  const filteredQuestions = POPULAR_QUESTIONS.filter((q) => {
    // 1. Filter by category if one is selected
    if (selectedCategoryId && q.category !== selectedCategoryId) {
      return false;
    }
    // 2. Filter by search query if there is one
    if (normalised.length > 0) {
      return (
        q.question.toLowerCase().includes(normalised) ||
        q.answer.toLowerCase().includes(normalised)
      );
    }
    return true;
  });

  const filteredCategories = isFiltering
    ? CATEGORIES.filter((c) => c.title.toLowerCase().includes(normalised))
    : CATEGORIES;

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId((prev) => {
      const next = prev === categoryId ? null : categoryId;
      // When changing category, reset open ID to first question in that category if any
      const firstInNext = POPULAR_QUESTIONS.find((q) => q.category === next);
      setOpenId(firstInNext ? firstInNext.id : null);
      return next;
    });
  };

  return (
    <>
      <Head>
        <title>{`Help & Support | ${generalSettingsTitle}`}</title>
      </Head>

      {/* ── Page heading ── */}
      <div className="mb-8">
        <h1 className="text-heading-1 font-display font-bold text-ink-900 mb-2">
          Help &amp; Support
        </h1>
        <p className="text-body-m text-ink-muted">
          Find answers fast, or reach our team.
        </p>
      </div>

      {/* ── Dark hero search card ── */}
      <div className="bg-ink-900 rounded-2xl p-8 mb-8 flex flex-col items-center text-center gap-6">
        <h2 className="text-heading-2 font-display font-bold text-surface-card">
          How can we help?
        </h2>
        <div className="flex w-full max-w-xl gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help…"
            aria-label="Search for help"
            className="
              flex-1 px-4 py-3 rounded-xl
              bg-ink-700 text-surface-card placeholder:text-ink-muted
              border border-border-hairline/20
              text-body-m outline-none
            "
          />
          <button
            type="button"
            onClick={() => setQuery(query.trim())}
            aria-label="Search"
            className="
              px-6 py-3 rounded-xl
              bg-brand text-ink-900
              font-semibold text-body-m
              hover:bg-brand-hover transition-colors duration-200
              cursor-pointer
            "
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Browse by topic ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-heading-2 font-display font-bold text-ink-900">
            Browse by topic
          </h2>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId(null);
                setOpenId("q1");
              }}
              className="text-body-s font-semibold text-[#D94A56] hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
        {isFiltering && filteredCategories.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`
                  rounded-2xl p-5 shadow-primary
                  flex items-center gap-4 text-left w-full
                  hover:shadow-md transition-all duration-200
                  cursor-pointer border-2
                  ${isActive 
                    ? "border-[#D94A56] bg-brand-tint" 
                    : "border-transparent bg-surface-card"
                  }
                `}
              >
                {/* Icon tile */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg}`}
                >
                  <span
                    className={`material-symbols-rounded text-2xl! ${cat.iconColor}`}
                  >
                    {cat.icon}
                  </span>
                </div>
                {/* Text */}
                <div>
                  <p className="text-label-bold font-bold text-ink-900">
                    {cat.title}
                  </p>
                  <p className="text-body-s text-ink-muted">
                    {cat.count} articles
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </section>

      {/* ── Popular questions ── */}
      <section className="mb-8">
        <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-5">
          {selectedCategoryId 
            ? `Questions in ${CATEGORIES.find((c) => c.id === selectedCategoryId)?.title}`
            : "Popular questions"
          }
        </h2>
        {isFiltering && filteredQuestions.length === 0 && filteredCategories.length === 0 ? (
          <p className="text-body-m text-ink-muted py-4">
            No results found for &ldquo;{query.trim()}&rdquo;. Try a different search term.
          </p>
        ) : isFiltering && filteredQuestions.length === 0 ? (
          <p className="text-body-m text-ink-muted py-4">
            No matching questions found for &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
        <div className="bg-surface-card rounded-2xl shadow-primary overflow-hidden divide-y divide-border-hairline">
          {filteredQuestions.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="
                    w-full flex items-center justify-between
                    px-6 py-4 text-left
                    hover:bg-brand-tint transition-colors duration-150
                    cursor-pointer
                  "
                  aria-expanded={isOpen}
                >
                  <span className="text-body-m font-semibold text-ink-900 pr-4">
                    {item.question}
                  </span>
                  <span
                    className={`
                      material-symbols-rounded text-xl! text-ink-muted shrink-0
                      transition-transform duration-200
                      ${isOpen ? "rotate-180" : "rotate-0"}
                    `}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1">
                    <p className="text-body-s text-ink-700 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </section>

      {/* ── Still need help? CTA ── */}
      <section>
        <div className="bg-brand rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-heading-2 font-display font-bold text-ink-900 mb-1">
              Still need help?
            </h2>
            <p className="text-body-m text-ink-700">
              Our support team is happy to assist you.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* VISUAL-ONLY: Live chat — no backend handler, coming soon */}
            <button
              type="button"
              aria-label="Live chat (coming soon)"
              className="
                px-6 py-3 rounded-xl
                bg-ink-900 text-surface-card
                font-semibold text-body-m
                hover:bg-ink-700 transition-colors duration-200
                cursor-pointer
              "
            >
              Live chat
            </button>
            {/* Email us — mailto link */}
            <a
              href={`mailto:${email || "vitielts8.0@gmail.com"}`}
              className="
                px-6 py-3 rounded-xl
                bg-surface-card text-ink-900
                font-semibold text-body-m
                border border-border-hairline
                hover:bg-brand-tint transition-colors duration-200
                no-underline
              "
            >
              Email us
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

PageHelp.Layout = AppShell;
