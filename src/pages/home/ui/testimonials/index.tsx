import Image from "next/image";
import type { TestimonialsConfig, ReviewItem } from "./types";
import { Button } from "@/shared/ui/ds/atoms/button";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_REVIEWS: ReviewItem[] = [
  // Column 1
  { name: "Nguyễn Thị Lan", score: "IELTS 7.0", avatar: "/intro-mascot.png", review: "The exam interface feels just like the real test, which helped me get comfortable before test day. I reached Band 7.0 after 2 months of consistent practice.", rating: 5 },
  { name: "Trần Văn Minh", score: "IELTS 6.5", avatar: "/intro-mascot.png", review: "The questions closely follow the real test structure. I love the automatic scoring — it saves so much prep time.", rating: 5 },
  { name: "Hoàng Minh Tuấn", score: "IELTS 7.5", avatar: "/intro-mascot.png", review: "This platform helped me get used to the real exam format. After completing 30 tests, I felt much more confident on test day.", rating: 5 },
  { name: "Bùi Thị Thu", score: "IELTS 6.0", avatar: "/intro-mascot.png", review: "The Listening section is spot-on with the right format. I used to buy courses elsewhere, but practising here is more than enough.", rating: 5 },
  { name: "Lý Thanh Sơn", score: "IELTS 8.0", avatar: "/intro-mascot.png", review: "Very happy with the quality of the tests. The instant scoring tells me exactly where to improve.", rating: 5 },
  // Column 2
  { name: "Phạm Thị Hoa", score: "IELTS 7.5", avatar: "/intro-mascot.png", review: "The best platform I've ever used for IELTS prep. Reading and Listening are both top quality with a wide variety of tests.", rating: 5 },
  { name: "Lê Quốc Bảo", score: "IELTS 6.0", avatar: "/intro-mascot.png", review: "I practised here every day and went from 5.5 to 6.0 in 3 months. Very pleased with the result.", rating: 5 },
  { name: "Ngô Thị Mai", score: "IELTS 7.0", avatar: "/intro-mascot.png", review: "The interface is very user-friendly and professional. Questions are realistic and updated regularly.", rating: 5 },
  { name: "Đinh Văn Khoa", score: "IELTS 6.5", avatar: "/intro-mascot.png", review: "The mock test experience is incredibly smooth — indistinguishable from the real thing. I jumped 1.0 band in just 2 months.", rating: 5 },
  { name: "Vương Thị Liên", score: "IELTS 7.0", avatar: "/intro-mascot.png", review: "Extensive test bank with detailed explanations. I especially love the answer review feature after each test.", rating: 5 },
  // Column 3
  { name: "Đặng Thu Hương", score: "IELTS 8.0", avatar: "/intro-mascot.png", review: "The computer-based interface is very smooth and true to the actual exam format. The Listening section is especially accurate.", rating: 5 },
  { name: "Vũ Thế Dũng", score: "IELTS 6.5", avatar: "/intro-mascot.png", review: "Practising here got me used to time pressure. My actual test score was better than I expected.", rating: 5 },
  { name: "Trịnh Thị Ngọc", score: "IELTS 7.0", avatar: "/intro-mascot.png", review: "I've tried many IELTS platforms. This one has the most realistic questions and the best-looking interface.", rating: 5 },
  { name: "Cao Minh Nhật", score: "IELTS 6.5", avatar: "/intro-mascot.png", review: "High-quality tests updated continuously. Reading and Listening practice here is my main study method and the results speak for themselves.", rating: 5 },
  { name: "Phan Thị Hải", score: "IELTS 7.5", avatar: "/intro-mascot.png", review: "After 3 months on this platform I scored 7.5 — I was genuinely surprised. The real test felt no different from practising here.", rating: 5 },
];

const DEFAULTS: TestimonialsConfig = {
  title: "What our students say",
  description:
    "Real experiences from students who practised with exam-realistic tests and got comfortable with the computer-based interface before their test day.",
  cta: { text: "See More Reviews", link: "#" },
  reviews: DEFAULT_REVIEWS,
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="material-symbols-rounded text-[#b3e653] filled text-base">
        star
      </span>
    ))}
  </div>
);

// ─── ReviewCard ───────────────────────────────────────────────────────────────

const ReviewCard = ({ name, score, avatar, review, rating }: ReviewItem) => (
  <div className="relative bg-white rounded-[20px] shadow-[0px_6px_18px_0px_rgba(25,29,36,0.08)] p-5 flex flex-col gap-3 overflow-hidden shrink-0 border border-[#e5e6e8]">
    {/* Decorative quote mark */}
    <div className="absolute top-3 right-4 text-5xl font-serif text-[#191d24] opacity-5 leading-none select-none pointer-events-none">
      "
    </div>

    {/* Avatar + name + score */}
    <div className="flex items-center gap-3 relative z-10">
      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-[#f6f7f4]">
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
        <p className="font-display font-bold text-[#191d24] text-sm leading-tight truncate">{name}</p>
        <p className="font-inter font-bold text-xs text-[#b3e653] mt-0.5">{score}</p>
      </div>
    </div>

    {/* Review text */}
    <p className="font-inter text-sm text-[#6a7282] leading-relaxed line-clamp-4 relative z-10">{review}</p>

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
    <ScrollFadeIn data-section="testimonials" className="w-full bg-[#f6f7f4] ">
      <div className="relative overflow-hidden bg-[#242938] rounded-[40px] w-full  mx-auto flex flex-col">

        {/* === Mobile layout (< lg) === */}
        <div className="lg:hidden relative z-10 flex flex-col gap-6 py-10 px-6 sm:px-8">
          {/* Text + CTA */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display font-bold text-[32px] text-white leading-[1.1] tracking-[-0.95px]">
              {c.title}
            </h2>
            <p className="font-inter font-normal text-sm text-white/70 leading-relaxed">
              {c.description}
            </p>
            <div className="mt-2 mb-[20px]">
              <Button variant="white" size="lg" href={c.cta?.link ?? "#"}>
                {c.cta?.text ?? "See more"}
              </Button>
            </div>
          </div>
          {/* Vertical list cards — 1 per row */}
          <div className="flex flex-col gap-4">
            {reviews.slice(0, 5).map((r, i) => (
              <ReviewCard key={i} {...r} />
            ))}
          </div>
        </div>

        {/* === Desktop layout (>= lg) === */}
        <div className="hidden lg:grid relative z-10 flex-1 w-full lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-8 lg:gap-12 items-center py-10 lg:py-14 px-6 sm:px-8 lg:px-14 xl:px-12">
          {/* Left: Content block */}
          <div className="flex flex-col gap-4 lg:self-start lg:mt-[52px]">
            <h2 className="font-display font-bold text-[36px] text-white leading-[1.1] tracking-[-0.95px] max-w-[250px]">
              {c.title}
            </h2>
            <p className="font-inter font-normal text-base text-white/70 leading-relaxed">
              {c.description}
            </p>
            <div className="mt-4">
              <Button variant="white" size="lg" href={c.cta?.link ?? "#"}>
                {c.cta?.text ?? "See more"}
              </Button>
            </div>
          </div>
          {/* Right: 3-column infinite scroll */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 self-center w-full" aria-label="Student reviews">
            <ScrollColumn reviews={col1} direction="down" />
            <ScrollColumn reviews={col2} direction="up" />
            <div className="hidden xl:block">
              <ScrollColumn reviews={col3} direction="down" />
            </div>
          </div>
        </div>
      </div>
    </ScrollFadeIn>
  );
};
