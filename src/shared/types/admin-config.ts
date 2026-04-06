// ─── Re-export UI config types (single source of truth) ───────────────────────
export type { HeroBannerConfig } from "@/pages/home/ui/hero-banner/types";
export type { TestPlatformIntroConfig } from "@/pages/home/ui/ielts-test-platform-intro/types";
export type { WhyChooseUsConfig } from "@/pages/home/ui/why-choose-us/types";
export type { TestimonialsConfig, ReviewItem } from "@/pages/home/ui/testimonials/types";

// ─── Other config types (not yet refactored — keep as-is) ────────────────────

export interface FooterCtaBannerConfig {
  title: string;
  description: string;
  backgroundGradient: string;
  button: {
    text: string;
    link: string;
  };
}

export interface PracticeLibraryBannerConfig {
  listening: {
    title: string;
    description: {
      line1: string;
      line2: string;
      line3: string;
    };
    backgroundColor: string;
    button: {
      text: string;
      link: string;
    };
  };
  reading: {
    title: string;
    description: {
      line1: string;
      line2: string;
      line3: string;
    };
    backgroundColor: string;
    button: {
      text: string;
      link: string;
    };
  };
}

export interface ExamLibraryHeroConfig {
  title: string;
  backgroundColor: string;
  breadcrumb: {
    homeLabel: string;
    currentLabel: string;
  };
}

export type SkillType = "listening" | "reading";

export interface CoursePackageItem {
  name: string;
  months: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  featuredDeal?: boolean;
  dealNote?: string;
  samePriceAsMonths?: number;
}

export interface CoursePackagesConfig {
  currencySuffix: string;
  popularBadgeText: string;
  priceSuffix: string;
  monthText: {
    singular: string;
    plural: string;
  };
  accessText: string;
  dealNoteTemplate: string;
  features: {
    included: string[];
    excluded: string[];
  };
  skillLabels: {
    listening: string;
    reading: string;
  };
  combo: {
    title: string;
    ctaText: string;
    basePrice?: number;
    monthlyIncrementPrice?: number;
    plans: CoursePackageItem[];
  };
  single: {
    title: string;
    ctaText: string;
    basePrice?: number;
    monthlyIncrementPrice?: number;
    skills: SkillType[];
    plans: CoursePackageItem[];
  };
}

export interface FAQConfig {
  badge: {
    text: string;
  };
  title: string;
  description: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface TermsOfUseConfig {
  banner: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  heroImage: string;
  content: {
    introTitle: string;
    introParagraphs: string[];
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
}

export interface PrivacyPolicyConfig {
  banner: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  heroImage: string;
  content: {
    introTitle: string;
    introParagraphs: string[];
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
}

export interface PracticeSectionConfig {
  backgroundGradient: string;
}

export interface LoginPageConfig {
  backgroundColor: string;
}

export interface RegisterPageConfig {
  backgroundColor: string;
}

export interface SubscriptionBannerConfig {
  backgroundImage: string;
  subtitle: {
    text: string;
  };
  title: string;
  description: string;
}

export interface SampleEssayBannerConfig {
  writing: {
    title: string;
    description: {
      line1: string;
      line2: string;
    };
    backgroundColor: string;
  };
  speaking: {
    title: string;
    description: {
      line1: string;
      line2: string;
    };
    backgroundColor: string;
  };
}

// Re-export TopBarConfig từ header types
export type { TopBarConfig } from "@/widgets/layouts/base/ui/header/types";
