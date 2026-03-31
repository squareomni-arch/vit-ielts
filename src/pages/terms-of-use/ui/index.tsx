import { BaseLayout } from "@/widgets/layouts";
import { Container } from "@/shared/ui";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb } from "antd";
import type { TermsOfUseConfig } from "@/shared/types/admin-config";

interface PageTermsOfUseProps {
  termsOfUseConfig: TermsOfUseConfig;
}

export const PageTermsOfUse = ({ termsOfUseConfig }: PageTermsOfUseProps) => {
  const { banner, heroImage, content } = termsOfUseConfig;

  return (
    <>
      {/* Banner Section */}
      <div
        className="relative flex items-center justify-center bg-cover bg-center bg-no-repeat py-20 md:py-30"
        style={{
          backgroundImage: `url('${banner.backgroundImage}')`,
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
        <Container className="relative z-10">
          <div className="text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {banner.title}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-200 mb-3">
              {banner.subtitle}
            </p>

            {/* Breadcrumbs */}
            <Breadcrumb
              className="flex justify-center text-white [&_.ant-breadcrumb-separator]:!text-white"
              items={[
                {
                  title: <Link className="text-white" href="/">Home</Link>,
                },
                {
                  title: <span className="text-white">{banner.title}</span>
                },
              ]}
            />
          </div>
        </Container>
      </div>

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
          <div className="max-w-4xl mx-auto prose prose-lg">
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

