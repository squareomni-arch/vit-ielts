import { Container } from "@/shared/ui";
import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { HeroBanner } from "./hero-banner";
import { WhyChooseUs } from "./why-choose-us";
import { Testimonials } from "./testimonials";
import { PracticeSection } from "./practice-section";
import { useAuth } from "@/appx/providers";
import { PracticeHistory, TargetScore } from "@/widgets";
import { ROUTES } from "@/shared/routes";
import type { HeroBannerConfig } from "./hero-banner/types";
import type { TestPlatformIntroConfig } from "./ielts-test-platform-intro/types";
import type { WhyChooseUsConfig } from "./why-choose-us/types";
import type { TestimonialsConfig } from "./testimonials/types";
import type { Quiz } from "~services/types/database";

interface PageHomeProps {
  heroBannerConfig?: HeroBannerConfig;
  testPlatformIntroConfig?: TestPlatformIntroConfig;
  whyChooseUsConfig?: WhyChooseUsConfig;
  testimonialsConfig?: TestimonialsConfig;
  examQuizzes: Quiz[];
  listeningQuizzes: Quiz[];
  readingQuizzes: Quiz[];
}

export const PageHome = ({
  heroBannerConfig,
  testPlatformIntroConfig,
  whyChooseUsConfig,
  testimonialsConfig,
  examQuizzes,
  listeningQuizzes,
  readingQuizzes,
}: PageHomeProps) => {
  const { isSignedIn } = useAuth();
  return (
    <>
      {/* === SECTION: Hero Banner === */}
      <HeroBanner config={heroBannerConfig} />
      {/* === SECTION: Platform Intro (Category Cards) === */}
      <IeltsTestPlatformIntro config={testPlatformIntroConfig} />
      {/* === SECTION: User Dashboard (Target Score + Practice History) === */}
      <div data-section="user-dashboard" className="py-10">
        <Container className="space-y-16">
          {isSignedIn && (
            <>
              <div>
                <TargetScore />
              </div>
              <section className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-extrabold">
                  Practice History
                </h3>
                <PracticeHistory />
              </section>
            </>
          )}
        </Container>
      </div>
      {/* === SECTION: Practice Tests Carousel === */}
      <div data-section="practice-tests" className="w-full bg-white flex flex-col gap-8 pb-10 pt-4">
        <PracticeSection
          title="IELTS Online Test"
          viewMoreLink={ROUTES.EXAM.ARCHIVE}
          items={examQuizzes}
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
      </div>
      {/* === SECTION: Testimonials (Marquee) === */}
      <Testimonials config={testimonialsConfig} />
      {/* === SECTION: Why Choose Us (Statistics) === */}
      <WhyChooseUs config={whyChooseUsConfig} />
    </>
  );
};
