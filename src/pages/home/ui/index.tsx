import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { HeroBanner } from "./hero-banner";
import { WhyChooseUs } from "./why-choose-us";
import { Testimonials } from "./testimonials";
import { PracticeSection } from "./practice-section";
import { ROUTES } from "@/shared/routes";
import type { HeroBannerConfig } from "./hero-banner/types";
import type { TestPlatformIntroConfig } from "./ielts-test-platform-intro/types";
import type { WhyChooseUsConfig } from "./why-choose-us/types";
import type { TestimonialsConfig } from "./testimonials/types";
import type { Quiz, SampleEssay } from "~services/types/database";

interface PageHomeProps {
  heroBannerConfig?: HeroBannerConfig;
  testPlatformIntroConfig?: TestPlatformIntroConfig;
  whyChooseUsConfig?: WhyChooseUsConfig;
  testimonialsConfig?: TestimonialsConfig;
  examQuizzes: Quiz[];
  listeningQuizzes: Quiz[];
  readingQuizzes: Quiz[];
  writingSamples: SampleEssay[];
  speakingSamples: SampleEssay[];
}

export const PageHome = ({
  heroBannerConfig,
  testPlatformIntroConfig,
  whyChooseUsConfig,
  testimonialsConfig,
  examQuizzes,
  listeningQuizzes,
  readingQuizzes,
  writingSamples,
  speakingSamples,
}: PageHomeProps) => {
  return (
    <>
      {/* === SECTION: Hero Banner === */}
      <HeroBanner config={heroBannerConfig} />
      {/* === SECTION: Platform Intro (Category Cards) === */}
      <IeltsTestPlatformIntro config={testPlatformIntroConfig} />

      {/* === SECTION: Practice Tests Carousel === */}
      <div data-section="practice-tests" className="w-full bg-white flex flex-col gap-8 pb-10 pt-4 px-4 sm:px-6">
        <PracticeSection
          title="IELTS Online Test"
          viewMoreLink={ROUTES.EXAM.ARCHIVE}
          items={examQuizzes}
          useExamModal={true}
        />
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
        {/* === SECTION: Writing Sample Carousel === */}
        <PracticeSection
          title="IELTS Writing Sample"
          viewMoreLink={ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}
          items={writingSamples as unknown as Quiz[]}
          getItemHref={(item) => ROUTES.SAMPLE_ESSAY.SINGLE(item.slug)}
          actionText="Xem thêm"
          hideAttempts={true}
        />
        {/* === SECTION: Speaking Sample Carousel === */}
        <PracticeSection
          title="IELTS Speaking Sample"
          viewMoreLink={ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}
          items={speakingSamples as unknown as Quiz[]}
          getItemHref={(item) => ROUTES.SAMPLE_ESSAY.SINGLE(item.slug)}
          actionText="Xem thêm"
          hideAttempts={true}
        />
      </div>
      {/* === SECTION: Testimonials (Marquee) === */}
      <Testimonials config={testimonialsConfig} />
      {/* === SECTION: Why Choose Us (Statistics) === */}
      <WhyChooseUs config={whyChooseUsConfig} />
    </>
  );
};
