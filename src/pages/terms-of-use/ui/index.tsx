import { BaseLayout } from "@/widgets/layouts";
import { Container } from "@/shared/ui";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "antd";
import { HeroBanner as DSHeroBanner } from "@/shared/ui/ds";
import type { TermsOfUseConfig } from "@/shared/types/admin-config";

interface PageTermsOfUseProps {
  termsOfUseConfig: TermsOfUseConfig;
}

export const PageTermsOfUse = ({ termsOfUseConfig }: PageTermsOfUseProps) => {
  const { banner, heroImage, content } = termsOfUseConfig;

  return (
    <>
      {/* Banner Section */}
      <DSHeroBanner 
        title={banner.title}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: banner.title }
        ]}
      />

      {/* Content Section */}
      <div className="bg-white py-16">
        <Container>
          {/* Hero Image */}
          <div className="mb-12 rounded-lg overflow-hidden shadow-lg">
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={heroImage}
                alt={banner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {content.introTitle}
            </h2>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              {content.introParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}

              {content.sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {section.title}
                  </h3>
                  <p>{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};

PageTermsOfUse.Layout = BaseLayout;

