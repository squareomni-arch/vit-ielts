import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { HeroBannerConfig } from "./ui/hero-banner/types";
import type { TestPlatformIntroConfig } from "./ui/ielts-test-platform-intro/types";
import type { PracticeSectionConfig } from "@/shared/types/admin-config";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getQuizzes } from "~services/quiz";
import type { Quiz } from "~services/types/database";

export { PageHome } from "./ui";

// Type definitions (giữ nguyên — UI components vẫn cần)
interface WhyChooseUsConfig {
  badge: { text: string };
  title: string;
  description: string;
  statistics: Array<{
    icon: string;
    value: string;
    label: string;
  }>;
}

interface TestimonialsConfig {
  title: string;
  description: string;
  button: { text: string; link: string };
  testimonials: Array<{
    name: string;
    title: string;
    company: string;
    quote: string;
    avatar: string;
  }>;
}

// Default configs
const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  trustpilot: {
    image: "/img-admin/o-trustpilot.png",
    rating: "Excellent 4.9 out of 5",
  },
  headline: {
    line1: "Education Is The Best",
    line2: "Key",
    line3: "Success",
    line4: "In Life",
  },
  description: {
    text: "Luyện tập và thi thử IELTS Online trên máy tính miễn phí.",
    highlightText: "Start now!",
  },
  buttons: {
    primary: { text: "Start Practicing", link: "#" },
  },
  backgroundImage: "",
  bannerImage: "/img-admin/o-banner.png",
  featureCards: [],
  decorativeShape: {
    image: "/img-admin/o-shape-1.png",
  },
};

const DEFAULT_TESTIMONIALS: TestimonialsConfig = {
  title: "Testimonials",
  description: "Họ nói gì về chúng tôi?",
  button: { text: "Đăng ký ngay", link: "#" },
  testimonials: [],
};

/**
 * Home page — fetch ALL CMS configs in parallel via readConfig(),
 * replacing 5 separate internal-API-fetch wrapper functions (~300 lines).
 */
export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);

    // Parallel fetch of all CMS configs + quiz carousels
    const [
      heroBanner,
      testPlatformIntro,
      whyChooseUs,
      testimonials,
      practiceSection,
      examQuizzes,
      listeningQuizzes,
      readingQuizzes,
    ] = await Promise.all([
      readConfig<HeroBannerConfig>(supabase, "home/hero-banner").catch(() => null),
      readConfig<TestPlatformIntroConfig>(supabase, "home/test-platform-intro").catch(() => null),
      readConfig(supabase, "home/why-choose-us").catch(() => null),
      readConfig(supabase, "home/testimonials").catch(() => null),
      readConfig<PracticeSectionConfig>(supabase, "home/practice-section").catch(() => null),
      getQuizzes(supabase, { type: "exam", pageSize: 8 }).catch(() => ({ data: [] as Quiz[] })),
      getQuizzes(supabase, { skill: "listening", type: "practice", pageSize: 8 }).catch(() => ({ data: [] as Quiz[] })),
      getQuizzes(supabase, { skill: "reading", type: "practice", pageSize: 8 }).catch(() => ({ data: [] as Quiz[] })),
    ]);

    return {
      props: {
        heroBannerConfig: heroBanner ?? DEFAULT_HERO_BANNER,
        testPlatformIntroConfig: testPlatformIntro ?? {},
        whyChooseUsConfig: whyChooseUs ?? {},
        testimonialsConfig: testimonials ?? DEFAULT_TESTIMONIALS,
        practiceSectionConfig: practiceSection ?? {},
        examQuizzes: examQuizzes.data,
        listeningQuizzes: listeningQuizzes.data,
        readingQuizzes: readingQuizzes.data,
      },
    };
  }
);
