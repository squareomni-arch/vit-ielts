import { BaseLayout } from "@/widgets/layouts";
import { WhyChooseUs } from "@/pages/home/ui/why-choose-us";
import { Testimonials } from "@/pages/home/ui/testimonials";
import { Container } from "@/shared/ui";
import Link from "next/link";
import { AboutContent } from "./about-content";
import type { WhyChooseUsConfig } from "@/pages/home/ui/why-choose-us/types";
import type { TestimonialsConfig } from "@/pages/home/ui/testimonials/types";

interface PageAboutUsProps {
  whyChooseUsConfig: WhyChooseUsConfig;
  testimonialsConfig: TestimonialsConfig;
}

export const PageAboutUs = ({
  whyChooseUsConfig,
  testimonialsConfig,
}: PageAboutUsProps) => {
  return (
    <>
      {/* Banner Section */}
      <div
        className="relative flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/img-admin/bg-image-11.jpg')",
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
                How We Work
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Take Challenge for Build Your Life. <br />
              The World Most for Back to Your Life.
            </h1>

          </div>
        </Container>
      </div>

      {/* About Content Section */}
      <div id="about-content">
        <AboutContent />
      </div>

      {/* Why Choose Us Section */}
      <div id="why-choose-us">
        <WhyChooseUs config={whyChooseUsConfig} />
      </div>

      {/* What Our Learners Say Section */}
      <Testimonials config={testimonialsConfig} />
    </>
  );
};

PageAboutUs.Layout = BaseLayout;

