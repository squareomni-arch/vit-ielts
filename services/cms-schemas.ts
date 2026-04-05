/**
 * CMS Config Zod Schemas — Validation cho mỗi CMS section
 *
 * Dùng kèm với `writeConfigValidated()` trong cms-config.ts
 * để đảm bảo data integrity khi admin lưu config.
 *
 * @see services/cms-config.ts
 * @see src/shared/types/admin-config.ts
 */

import { z } from "zod";

// ─── Hero Banner ──────────────────────────────────────────────────────────
export const HeroBannerSchema = z.object({
    trustpilot: z.object({
        image: z.string(),
        rating: z.string(),
    }),
    headline: z.object({
        line1: z.string(),
        line2: z.string(),
        line3: z.string(),
        line4: z.string(),
    }),
    description: z.object({
        text: z.string(),
        highlightText: z.string(),
    }),
    buttons: z.object({
        primary: z.object({
            text: z.string(),
            link: z.string(),
        }),
        secondary: z
            .object({
                text: z.string(),
                link: z.string(),
            })
            .optional(),
    }),
    backgroundImage: z.string(),
    bannerImage: z.string(),
    featureCards: z.array(
        z.object({
            icon: z.string(),
            title: z.string().optional(),
            value: z.string().optional(),
            subtitle: z.string(),
            avatars: z.array(z.string()).optional(),
        }),
    ),
    decorativeShape: z.object({
        image: z.string(),
    }),
});

// ─── Test Platform Intro ──────────────────────────────────────────────────
export const TestPlatformIntroSchema = z.object({
    badge: z.object({
        text: z.string(),
    }),
    backgroundGradient: z.string(),
    title: z.object({
        line1: z.string(),
        line2: z.string(),
        line3: z.string(),
        line4: z.string(),
    }),
    categories: z.array(
        z.object({
            name: z.string(),
            href: z.string(),
            icon: z.string(),
        }),
    ),
});

// ─── Why Choose Us ────────────────────────────────────────────────────────
export const WhyChooseUsSchema = z.object({
    badge: z.object({
        text: z.string(),
    }),
    title: z.string(),
    description: z.string(),
    statistics: z.array(
        z.object({
            icon: z.string(),
            value: z.string(),
            label: z.string(),
        }),
    ),
});

// ─── Testimonials ─────────────────────────────────────────────────────────
export const TestimonialsSchema = z.object({
    title: z.string(),
    description: z.string(),
    button: z.object({
        text: z.string(),
        link: z.string(),
    }),
    testimonials: z.array(
        z.object({
            name: z.string(),
            title: z.string(),
            company: z.string(),
            quote: z.string(),
            avatar: z.string(),
        }),
    ),
});

// ─── Practice Section ─────────────────────────────────────────────────────
export const PracticeSectionSchema = z.object({
    backgroundGradient: z.string(),
});

// ─── Footer CTA Banner ───────────────────────────────────────────────────
export const FooterCtaBannerSchema = z.object({
    title: z.string(),
    description: z.string(),
    backgroundGradient: z.string(),
    button: z.object({
        text: z.string(),
        link: z.string(),
    }),
});

// ─── Practice Library Banner ──────────────────────────────────────────────
const PracticeLibrarySkillBanner = z.object({
    title: z.string(),
    description: z.object({
        line1: z.string(),
        line2: z.string(),
        line3: z.string(),
    }),
    backgroundColor: z.string(),
    button: z.object({
        text: z.string(),
        link: z.string(),
    }),
});

export const PracticeLibraryBannerSchema = z.object({
    listening: PracticeLibrarySkillBanner,
    reading: PracticeLibrarySkillBanner,
});

// ─── Exam Library Hero ────────────────────────────────────────────────────
export const ExamLibraryHeroSchema = z.object({
    title: z.string(),
    backgroundColor: z.string(),
    breadcrumb: z.object({
        homeLabel: z.string(),
        currentLabel: z.string(),
    }),
});

// ─── Course Packages ──────────────────────────────────────────────────────
const CoursePackageItemSchema = z.object({
    name: z.string(),
    months: z.number(),
    price: z.number(),
    originalPrice: z.number().optional(),
    popular: z.boolean().optional(),
    featuredDeal: z.boolean().optional(),
    dealNote: z.string().optional(),
    samePriceAsMonths: z.number().optional(),
});

export const CoursePackagesSchema = z.object({
    currencySuffix: z.string(),
    popularBadgeText: z.string(),
    priceSuffix: z.string(),
    monthText: z.object({
        singular: z.string(),
        plural: z.string(),
    }),
    accessText: z.string(),
    dealNoteTemplate: z.string(),
    features: z.object({
        included: z.array(z.string()),
        excluded: z.array(z.string()),
    }),
    skillLabels: z.object({
        listening: z.string(),
        reading: z.string(),
    }),
    combo: z.object({
        title: z.string(),
        ctaText: z.string(),
        basePrice: z.number().optional(),
        monthlyIncrementPrice: z.number().optional(),
        plans: z.array(CoursePackageItemSchema),
    }),
    single: z.object({
        title: z.string(),
        ctaText: z.string(),
        basePrice: z.number().optional(),
        monthlyIncrementPrice: z.number().optional(),
        skills: z.array(z.enum(["listening", "reading"])),
        plans: z.array(CoursePackageItemSchema),
    }),
});

// ─── FAQ ──────────────────────────────────────────────────────────────────
export const FAQSchema = z.object({
    badge: z.object({
        text: z.string(),
    }),
    title: z.string(),
    description: z.string(),
    items: z.array(
        z.object({
            question: z.string(),
            answer: z.string(),
        }),
    ),
});

// ─── Subscription Banner ──────────────────────────────────────────────────
export const SubscriptionBannerSchema = z.object({
    backgroundImage: z.string(),
    subtitle: z.object({
        text: z.string(),
    }),
    title: z.string(),
    description: z.string(),
});

// ─── Login Page ───────────────────────────────────────────────────────────
export const LoginPageSchema = z.object({
    backgroundColor: z.string(),
});

// ─── Register Page ────────────────────────────────────────────────────────
export const RegisterPageSchema = z.object({
    backgroundColor: z.string(),
});

// ─── Terms of Use ─────────────────────────────────────────────────────────
const LegalContentSchema = z.object({
    banner: z.object({
        title: z.string(),
        subtitle: z.string(),
        backgroundImage: z.string(),
    }),
    heroImage: z.string(),
    content: z.object({
        introTitle: z.string(),
        introParagraphs: z.array(z.string()),
        sections: z.array(
            z.object({
                title: z.string(),
                content: z.string(),
            }),
        ),
    }),
});

export const TermsOfUseSchema = LegalContentSchema;
export const PrivacyPolicySchema = LegalContentSchema;

// ─── Top Bar (Header) ────────────────────────────────────────────────────
export const TopBarSchema = z.object({
    text: z.string(),
    link: z.string().optional(),
    visible: z.boolean().optional(),
}).passthrough(); // Allow additional props from TopBarConfig

// ─── Sample Essay Banner ─────────────────────────────────────────────────
export const SampleEssayBannerSchema = z.object({}).passthrough();

// ═════════════════════════════════════════════════════════════════════════
// Registry: section_name → Zod schema (for validation in unified API)
// ═════════════════════════════════════════════════════════════════════════

export const CMS_SECTION_SCHEMAS: Record<string, z.ZodType> = {
    // Home page sections
    "hero-banner": HeroBannerSchema,
    "test-platform-intro": TestPlatformIntroSchema,
    "why-choose-us": WhyChooseUsSchema,
    "testimonials": TestimonialsSchema,
    "practice-section": PracticeSectionSchema,

    // Library banners
    "ielts-exam-library/hero-banner": ExamLibraryHeroSchema,
    "ielts-practice-library/banner": PracticeLibraryBannerSchema,

    // Subscription
    "subscription/banner": SubscriptionBannerSchema,
    "subscription/course-packages": CoursePackagesSchema,
    "subscription/faq": FAQSchema,

    // Header / Footer
    "header/top-bar": TopBarSchema,
    "footer/cta-banner": FooterCtaBannerSchema,

    // Account pages
    "account/login": LoginPageSchema,
    "account/register": RegisterPageSchema,

    // Legal pages
    "terms-of-use": TermsOfUseSchema,
    "privacy-policy": PrivacyPolicySchema,

    // Sample Essay
    "sample-essay/banner": SampleEssayBannerSchema,
};

/**
 * Validate config data against a known schema.
 * Returns `true` if valid or no schema exists for the section.
 * Throws ZodError if validation fails.
 */
export function validateCmsConfig(sectionName: string, data: unknown): boolean {
    const schema = CMS_SECTION_SCHEMAS[sectionName];
    if (!schema) return true; // No schema = skip validation
    schema.parse(data);
    return true;
}
