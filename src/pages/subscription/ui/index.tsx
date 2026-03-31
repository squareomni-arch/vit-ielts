import { BaseLayout } from "@/widgets/layouts";
import { Container } from "@/shared/ui";
import { SubscriptionPlans } from "./subscription-plans";
import { Testimonials } from "@/pages/home/ui/testimonials";
import { FAQ } from "./faq";
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
      {/* Banner Section */}
      <div
        className="relative min-h-[500px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${bannerConfig.backgroundImage}')`,
          backgrounize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>

        {/* Content */}
        <Container className="relative z-10 py-30">
          <div className="text-center">
            {/* Subtitle */}
            <div className="mb-5">
              <span
                className="inline-block px-4 py-2 rounded-md text-sm font-semibold text-white"
                style={{
                  backgroundColor: "rgba(255, 127, 80, 0.8)",
                }}
              >
                {bannerConfig.subtitle.text}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {bannerConfig.title}
            </h1>

            {/* Description */}
            <p className="text-lg text-white/90 max-w-2xl mx-auto mb-10">
              {bannerConfig.description}
            </p>
          </div>
        </Container>
      </div>

      {/* Subscription Plans Section */}
      <div>
        <Container>
          <SubscriptionPlans buyProLink={buyProLink} />
        </Container>
      </div>

      {/* Testimonials Section - Fullscreen Background */}
      <div className="bg-gray-50 w-full">
        <div className="testimonials-no-padding">
          <Testimonials config={testimonialsConfig} />
        </div>
      </div>

      {/* FAQ Section */}
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
