import { Container } from "@/shared/ui";
import { IeltsTestPlatformIntro } from "./ielts-test-platform-intro";
import { HeroBanner } from "./hero-banner";
import { WhyChooseUs } from "./why-choose-us";
import { Testimonials } from "./testimonials";
import { FullTestCarousel, PracticeTest, SampleEssaysSlider } from "@/widgets/blocks";
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
      <HeroBanner config={heroBannerConfig} />
      {testPlatformIntroConfig?.badge && (
        <IeltsTestPlatformIntro config={testPlatformIntroConfig} />
      )}
      <div className="py-10">
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
      {/* Section với background gradient đỏ và cam */}
      <div
        className="w-full py-10"
        style={{
          background: practiceSectionConfig?.backgroundGradient ?? undefined,
        }}
      >
        <Container className="space-y-16">
          <FullTestCarousel
            title="IELTS Online Test"
            view_more_link={ROUTES.EXAM.ARCHIVE}
          />
          <PracticeTest
            skill="listening"
            title="IELTS Listening Practice"
            view_more_link={ROUTES.PRACTICE.ARCHIVE_LISTENING}
          />
          <PracticeTest
            skill="reading"
            title="IELTS Reading Practice"
            view_more_link={ROUTES.PRACTICE.ARCHIVE_READING}
          />
          <SampleEssaysSlider
            view_more_link={ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}
            skill="writing"
            title="IELTS Writing Sample"
          />
          <SampleEssaysSlider
            view_more_link={ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}
            skill="speaking"
            title="IELTS Speaking Sample"
          />
        </Container>
      </div>
      {whyChooseUsConfig?.badge && (
        <WhyChooseUs config={whyChooseUsConfig} />
      )}
      {testimonialsConfig?.testimonials && (
        <Testimonials config={testimonialsConfig} />
      )}
    </>
  );
};
