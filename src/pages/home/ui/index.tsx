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
import type { PracticeSectionConfig } from "@/shared/types/admin-config";

interface PageHomeProps {
  heroBannerConfig: HeroBannerConfig;
  testPlatformIntroConfig: TestPlatformIntroConfig;
  whyChooseUsConfig: WhyChooseUsConfig;
  testimonialsConfig: TestimonialsConfig;
  practiceSectionConfig: PracticeSectionConfig;
}

export const PageHome = ({
  heroBannerConfig,
  testPlatformIntroConfig,
  whyChooseUsConfig,
  testimonialsConfig,
  practiceSectionConfig,
}: PageHomeProps) => {
  const { isSignedIn } = useAuth();
  return (
    <>
      {/* === SECTION: Hero Banner === */}
      <HeroBanner config={heroBannerConfig} />
      {/* === SECTION: Platform Intro (Category Cards) === */}
      {testPlatformIntroConfig?.badge && (
        <IeltsTestPlatformIntro config={testPlatformIntroConfig} />
      )}
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
        />
        <PracticeSection
          title="IELTS Listening Practice"
          viewMoreLink={ROUTES.PRACTICE.ARCHIVE_LISTENING}
        />
        <PracticeSection
          title="IELTS Reading Practice"
          viewMoreLink={ROUTES.PRACTICE.ARCHIVE_READING}
        />
        <PracticeSection
          title="IELTS Reading Sample"
          viewMoreLink={ROUTES.EXAM.ARCHIVE}
        />
        <PracticeSection
          title="IELTS Speaking Sample"
          viewMoreLink={ROUTES.EXAM.ARCHIVE}
        />
      </div>
      {/* === SECTION: Why Choose Us (Statistics) === */}
      {whyChooseUsConfig?.badge && (
        <WhyChooseUs config={whyChooseUsConfig} />
      )}
      {/* === SECTION: Testimonials (Marquee) === */}
      {testimonialsConfig?.testimonials && (
        <Testimonials config={testimonialsConfig} />
      )}
    </>
  );
};
