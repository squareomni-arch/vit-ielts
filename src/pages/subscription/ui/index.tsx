import { BaseLayout } from "@/widgets/layouts";
import { SubscriptionPlans } from "./subscription-plans";
import { FAQ } from "./faq";
import type { TestimonialsConfig, FAQConfig } from "@/shared/types/admin-config";
import { useAppContext } from "@/appx/providers";
import { useMemo } from "react";
import type { SubscriptionBannerConfig } from "@/shared/types/admin-config";

interface PageSubscriptionProps {
  // testimonialsConfig is kept in the prop contract so the SSR fetch in
  // getServerSideProps remains behavior-identical; it is not rendered on this
  // page because the Figma design (3336:2055) does not include a testimonials
  // section.
  testimonialsConfig: TestimonialsConfig;
  faqConfig: FAQConfig;
  bannerConfig: SubscriptionBannerConfig;
}

export const PageSubscription = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  testimonialsConfig: _testimonialsConfig,
  faqConfig,
  // bannerConfig retained in the prop contract; Figma replaces the banner with
  // the inline pricing header, so this is intentionally unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bannerConfig: _bannerConfig,
}: PageSubscriptionProps) => {
  const appContext = useAppContext();

  const buyProLink = useMemo(() => {
    try {
      return appContext.masterData.websiteOptions.websiteOptionsFields
        .generalSettings.buyProLink;
    } catch {
      return "#";
    }
  }, [appContext]);

  return (
    <div className="bg-[#f6f7f4] min-h-screen">
      {/* === SECTION: Pricing header + billing toggle + plan cards ===
          Figma 3336:2055 — Content block, max-w-[1360px], pt-56px pb-80px */}
      <div data-section="subscription-plans" className="px-4 sm:px-6">
        <div className="mx-auto max-w-[1360px]">
          <SubscriptionPlans buyProLink={buyProLink} />
        </div>
      </div>

      {/* === SECTION: FAQ ===
          Not present in Figma frame 3336:2055, retained because faqConfig is
          fetched server-side and admin-managed CMS content lives here. */}
      <FAQ config={faqConfig} />
    </div>
  );
};

PageSubscription.Layout = BaseLayout;
