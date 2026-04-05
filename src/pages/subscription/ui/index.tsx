import { BaseLayout } from "@/widgets/layouts";
import { Container } from "@/shared/ui";
import { SubscriptionPlans } from "./subscription-plans";
import { Testimonials } from "@/pages/home/ui/testimonials";
import { FAQ } from "./faq";
import { HeroBanner } from "@/shared/ui/ds";
import { ROUTES } from "@/shared/routes";
import dynamic from "next/dynamic";
import type { TestimonialsConfig } from "@/pages/home/ui/testimonials/types";
import type { FAQConfig } from "@/shared/types/admin-config";
import { useAppContext } from "@/appx/providers";
import { useMemo } from "react";

const AffiliateTracker = dynamic(
  () => import("@/widgets/affiliate-tracker").then((mod) => mod.default),
  { ssr: false }
);

import type { SubscriptionBannerConfig } from "@/shared/types/admin-config";

interface PageSubscriptionProps {
  testimonialsConfig: TestimonialsConfig;
  faqConfig: FAQConfig;
  bannerConfig: SubscriptionBannerConfig;
}

export const PageSubscription = ({ testimonialsConfig, faqConfig, bannerConfig }: PageSubscriptionProps) => {
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
    <>
      <AffiliateTracker />
      {/* === SECTION: Subscription Banner === */}
      <HeroBanner
        title={bannerConfig.title || "Subscription"}
        breadcrumbs={[
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "Subscription" },
        ]}
      />

      {/* === SECTION: Subscription Plans === */}
      <div data-section="subscription-plans">
        <Container>
          <SubscriptionPlans buyProLink={buyProLink} />
        </Container>
      </div>

      {/* === SECTION: Testimonials === */}
      <div data-section="subscription-testimonials" className="bg-gray-50 w-full">
        <div className="testimonials-no-padding">
          <Testimonials config={testimonialsConfig} />
        </div>
      </div>

      {/* === SECTION: FAQ === */}
      <FAQ config={faqConfig} />

      <style jsx global>{`
        .testimonials-no-padding > div {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          background-color: rgb(249 250 251) !important; /* bg-gray-50 */
        }
      `}</style>
    </>
  );
};

PageSubscription.Layout = BaseLayout;
