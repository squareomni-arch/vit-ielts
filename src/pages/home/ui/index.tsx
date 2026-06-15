import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { HeroBanner } from "./hero-banner";
import { WhyChooseUs } from "./why-choose-us";
import { Testimonials } from "./testimonials";
import { PracticeSection } from "./practice-section";
import { MockCollectionSection } from "./mock-collection-section";
import { CtaBanner } from "./cta-banner";
import { useAuth } from "@/appx/providers";
import { AppShell } from "@/widgets/layouts";
import { PracticeHistory, TargetScore } from "@/widgets";
import { ROUTES } from "@/shared/routes";
import Link from "next/link";
import type { HeroBannerConfig } from "./hero-banner/types";
import type { TestPlatformIntroConfig } from "./ielts-test-platform-intro/types";
import type { WhyChooseUsConfig } from "./why-choose-us/types";
import type { TestimonialsConfig } from "./testimonials/types";
import type { Quiz, ExamCollectionResponse } from "~services/types/database";

interface PageHomeProps {
  heroBannerConfig?: HeroBannerConfig;
  testPlatformIntroConfig?: TestPlatformIntroConfig;
  whyChooseUsConfig?: WhyChooseUsConfig;
  testimonialsConfig?: TestimonialsConfig;
  examQuizzes: Quiz[];
  listeningQuizzes: Quiz[];
  readingQuizzes: Quiz[];
  mockCollections: ExamCollectionResponse["data"];
  totalExamsCount: number;
  listeningCount: number;
  readingCount: number;
  writingCount: number;
  speakingCount: number;
}

export const PageHome = ({
  heroBannerConfig,
  testPlatformIntroConfig,
  whyChooseUsConfig,
  testimonialsConfig,
  examQuizzes,
  listeningQuizzes,
  readingQuizzes,
  mockCollections,
  totalExamsCount,
  listeningCount,
  readingCount,
  writingCount,
  speakingCount,
}: PageHomeProps) => {
  // const { isSignedIn } = useAuth();
  return (
    <div className="w-full bg-[#f6f7f4] flex flex-col gap-6 lg:gap-10 xl:gap-12">
      {/* === SECTION: Hero Banner === */}
      <HeroBanner config={heroBannerConfig} totalTests={totalExamsCount + listeningCount + readingCount} />

      {/* === SECTION: Platform Intro (Skill Cards) === */}
      <IeltsTestPlatformIntro
        config={testPlatformIntroConfig}
        listeningCount={listeningCount}
        readingCount={readingCount}
        writingCount={writingCount}
        speakingCount={speakingCount}
      />

      {/* === SECTION: Target Score & Practice History (Only for signed in users) === */}
      {/* {isSignedIn && (
        <div className="w-full bg-[#f6f7f4] ">
          <div className=" mx-auto bg-white rounded-[40px] px-8 sm:px-12 py-10 space-y-10">
            <TargetScore />
            <section className="space-y-6">
              <h3 className="font-display font-bold text-[32px] leading-[1.1] tracking-[-0.95px] text-[#191d24]">
                History
              </h3>
              <PracticeHistory />
            </section>
          </div>
        </div>
      )} */}

      {/* === SECTION: Practice Tests — "Practice like it's exam day" === */}
      <div data-section="practice-tests" className="w-full bg-[#f6f7f4]">
        <div className=" mx-auto bg-white rounded-[40px] px-8 sm:px-12 py-10 flex flex-col gap-10">

          {/* Section heading + View all */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="font-display font-bold text-[32px] sm:text-[38px] leading-[1.1] tracking-[-0.95px] text-[#191d24]">
              Practice like it&apos;s exam day
            </h2>
            <Link
              href={ROUTES.EXAM.ARCHIVE}
              className="inline-flex items-center gap-2 bg-white hover:bg-[#f6f7f4] border-[1.5px] border-[rgba(25,29,36,0.1)] text-[#191d24] font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[13px] rounded-full transition-colors duration-200 whitespace-nowrap shrink-0"
            >
              View all {totalExamsCount} tests
            </Link>
          </div>

          {/* === Mock Collections (bộ đề thi thử) === */}
          <MockCollectionSection collections={mockCollections} />

          <PracticeSection
            title="IELTS Listening Practice"
            viewMoreLink={ROUTES.PRACTICE.ARCHIVE_LISTENING}
            items={listeningQuizzes}
          />
          <PracticeSection
            title="IELTS Reading Practice"
            viewMoreLink={ROUTES.PRACTICE.ARCHIVE_READING}
            items={readingQuizzes}
          />
        </div>
      </div>

      {/* === SECTION: Testimonials (Marquee) — hidden === */}
      {/* <Testimonials config={testimonialsConfig} /> */}

      {/* === SECTION: Why Choose Us (dark feature grid) === */}
      <WhyChooseUs config={whyChooseUsConfig} />

      {/* === SECTION: CTA Banner (green) === */}
      <CtaBanner />
    </div>
  );
};

PageHome.Layout = AppShell;
