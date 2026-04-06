import Image from "next/image";
import type { TestimonialsConfig, ReviewItem } from "./types";
import { Button } from "@/shared/ui/ds/atoms/button";

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_REVIEWS: ReviewItem[] = [
  // Column 1
  { name: "Nguyễn Thị Lan", score: "IELTS 7.0", avatar: "/assets/figma/icons/Background-1.png", review: "Giao diện thi rất giống thi thật, giúp mình làm quen trước ngày thi. Mình đã đạt band 7.0 sau 2 tháng luyện tập liên tục.", rating: 5 },
  { name: "Trần Văn Minh", score: "IELTS 6.5", avatar: "/assets/figma/icons/Background-2.png", review: "Đề thi sát với cấu trúc thật. Mình thích cách chấm điểm tự động, tiết kiệm rất nhiều thời gian ôn luyện.", rating: 5 },
  { name: "Hoàng Minh Tuấn", score: "IELTS 7.5", avatar: "/assets/figma/icons/Background-3.png", review: "Trang web này giúp mình tập làm quen với format thi thật. Sau khi luyện đủ 30 bài, mình tự tin hơn hẳn khi thi chính thức.", rating: 5 },
  { name: "Bùi Thị Thu", score: "IELTS 6.0", avatar: "/assets/figma/icons/Background-4.png", review: "Phần Listening rất chuẩn, đúng format. Mình từng mua khóa học bên ngoài nhưng giờ luyện ở đây là đủ rồi.", rating: 5 },
  { name: "Lý Thanh Sơn", score: "IELTS 8.0", avatar: "/assets/figma/icons/Background-5.png", review: "Rất hài lòng với chất lượng đề. Hệ thống chấm điểm tức thì giúp mình biết ngay điểm yếu để cải thiện.", rating: 5 },
  // Column 2
  { name: "Phạm Thị Hoa", score: "IELTS 7.5", avatar: "/assets/figma/icons/Background-2.png", review: "Platform tốt nhất mình từng dùng để luyện IELTS. Reading và Listening đều rất chất lượng, đề đa dạng.", rating: 5 },
  { name: "Lê Quốc Bảo", score: "IELTS 6.0", avatar: "/assets/figma/icons/Background-3.png", review: "Mình luyện tập mỗi ngày với bộ đề ở đây. Sau 3 tháng đã tăng từ 5.5 lên 6.0, rất hài lòng với kết quả.", rating: 5 },
  { name: "Ngô Thị Mai", score: "IELTS 7.0", avatar: "/assets/figma/icons/Background-4.png", review: "Giao diện rất thân thiện và chuyên nghiệp. Đề thi bám sát thực tế và cập nhật thường xuyên.", rating: 5 },
  { name: "Đinh Văn Khoa", score: "IELTS 6.5", avatar: "/assets/figma/icons/Background-5.png", review: "Trải nghiệm thi thử rất mượt mà, không khác gì thi thật. Mình đã tăng 1.0 band chỉ sau 2 tháng luyện đề đây.", rating: 5 },
  { name: "Vương Thị Liên", score: "IELTS 7.0", avatar: "/assets/figma/icons/Background-6.png", review: "Bộ đề phong phú, giải thích chi tiết. Mình đặc biệt thích tính năng xem lại lỗi sai sau mỗi bài thi.", rating: 5 },
  // Column 3
  { name: "Đặng Thu Hương", score: "IELTS 8.0", avatar: "/assets/figma/icons/Background-4.png", review: "Hệ thống giao diện máy tính rất mượt, đúng với format thi thật. Đặc biệt phần Listening rất chuẩn.", rating: 5 },
  { name: "Vũ Thế Dũng", score: "IELTS 6.5", avatar: "/assets/figma/icons/Background-5.png", review: "Luyện đề trên này giúp mình quen với áp lực thời gian. Kết quả thi thật tốt hơn mình mong đợi.", rating: 5 },
  { name: "Trịnh Thị Ngọc", score: "IELTS 7.0", avatar: "/assets/figma/icons/Background-6.png", review: "Mình đã thử nhiều nền tảng luyện IELTS khác nhau. Đây là nơi có đề sát thực nhất và interface đẹp nhất.", rating: 5 },
  { name: "Cao Minh Nhật", score: "IELTS 6.5", avatar: "/assets/figma/icons/Background-1.png", review: "Chất lượng đề thi cao, cập nhật liên tục. Mình học Read và Listen ở đây là chủ yếu và thấy hiệu quả rõ rệt.", rating: 5 },
  { name: "Phan Thị Hải", score: "IELTS 7.5", avatar: "/assets/figma/icons/Background-2.png", review: "Sau khi dùng nền tảng này 3 tháng, mình đạt 7.5 thật sự bất ngờ. Phần thi thật không khác gì luyện ở đây.", rating: 5 },
];

const DEFAULTS: TestimonialsConfig = {
  title: "Phản hồi từ học viên",
  description:
    "Trải nghiệm thực tế từ học viên đã luyện đề sát cấu trúc thi thật và làm quen giao diện thi máy trước ngày thi.",
  cta: { text: "Xem Thêm Phản Hồi", link: "#" },
  reviews: DEFAULT_REVIEWS,
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="material-symbols-rounded text-yellow-400 filled text-base">
        star
      </span>
    ))}
  </div>
);

// ─── ReviewCard ───────────────────────────────────────────────────────────────

const ReviewCard = ({ name, score, avatar, review, rating }: ReviewItem) => (
  <div className="relative bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3 overflow-hidden shrink-0">
    {/* Decorative quote mark */}
    <div className="absolute top-3 right-4 text-5xl font-serif text-primary-500 opacity-10 leading-none select-none pointer-events-none">
      "
    </div>

    {/* Avatar + name + score */}
    <div className="flex items-center gap-3 relative z-10">
      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#FAF7EB]">
        <Image
          src={avatar}
          alt={name}
          fill
          sizes="44px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-[#2D3142] text-sm leading-tight truncate">{name}</p>
        <p className="text-xs text-primary-500 font-semibold mt-0.5">{score}</p>
      </div>
    </div>

    {/* Review text */}
    <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 relative z-10">{review}</p>

    {/* Star rating */}
    <div className="relative z-10 mt-auto">
      <StarRating count={rating} />
    </div>
  </div>
);

// ─── ScrollColumn — infinite vertical carousel ────────────────────────────────

const ScrollColumn = ({
  reviews,
  direction,
}: {
  reviews: ReviewItem[];
  direction: "down" | "up";
}) => {
  const items = [...reviews, ...reviews];
  const animClass =
    direction === "down" ? "animate-scroll-down" : "animate-scroll-up";

  return (
    <div
      className="overflow-hidden h-[360px] sm:h-[420px] lg:h-[520px] xl:h-[560px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]"
    >
      <div className={`flex flex-col gap-4 ${animClass}`}>
        {items.map((r, i) => (
          <ReviewCard key={i} {...r} />
        ))}
      </div>
    </div>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────

interface TestimonialsProps {
  config?: TestimonialsConfig;
}

export const Testimonials = ({ config }: TestimonialsProps) => {
  const c = { ...DEFAULTS, ...config };
  const reviews = c.reviews?.length ? c.reviews : DEFAULT_REVIEWS;

  // Split reviews into 3 columns (5 each for 15 total)
  const perCol = Math.ceil(reviews.length / 3);
  const col1 = reviews.slice(0, perCol);
  const col2 = reviews.slice(perCol, perCol * 2);
  const col3 = reviews.slice(perCol * 2);

  return (
    <div data-section="testimonials" className="w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative overflow-hidden bg-primary-500 rounded-[30px] w-full min-h-[560px] lg:min-h-[700px] max-w-[1566px] mx-auto flex flex-col">
        {/* === Decorative SVG === */}
        <div
          className="absolute pointer-events-none select-none left-[-43px] top-[347px] w-[517px] h-[517px] z-0"
          aria-hidden="true"
        >
          <Image
            src="/assets/figma/icons/feedback2.svg"
            alt=""
            width={517}
            height={517}
            className="opacity-20"
            unoptimized
          />
        </div>

        {/* === Main layout === */}
        <div className="relative z-10 flex-1 w-full flex flex-col lg:grid lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-8 lg:gap-12 items-center py-10 lg:py-14 px-6 sm:px-8 lg:px-14 xl:px-20">

          {/* ── Left: Content block ── */}
          <div className="flex flex-col gap-4 lg:self-start lg:mt-[52px]">
            <h2 className="font-noto-sans font-bold text-[36px] text-white leading-tight">
              {c.title}
            </h2>
            <p className="font-noto-sans font-semibold text-base text-white/90 leading-relaxed">
              {c.description}
            </p>

            {/* CTA Button */}
            <div className="mt-4">
              <Button
                variant="white"
                size="lg"
                href={c.cta?.link ?? "#"}
              >
                {c.cta?.text ?? "Xem Thêm Phản Hồi"}
              </Button>
            </div>
          </div>

          {/* ── Right: 3-column infinite scroll feed ── */}
          <div
            className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4 self-center w-full"
            aria-label="Phản hồi từ học viên"
          >
            <ScrollColumn reviews={col1} direction="down" />
            <ScrollColumn reviews={col2} direction="up" />
            <div className="hidden xl:block">
              <ScrollColumn reviews={col3} direction="down" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
