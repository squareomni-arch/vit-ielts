import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";
import type { TestPlatformIntroConfig } from "./types";

interface IeltsTestPlatformIntroProps {
  config: TestPlatformIntroConfig;
}

export const IeltsTestPlatformIntro = ({
  config,
}: IeltsTestPlatformIntroProps) => {
  const { badge, backgroundGradient, title, categories = [] } = config;
  return (
    <div className="relative pt-16 md:py-16 overflow-hidden">
      {/* Gradient Shape Background - Half top with color, half bottom white */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white"></div>

        {/* Gradient Shape Decorative */}
        <div
          className="absolute rounded-full"
          style={{
            width: "254px",
            height: "254px",
            right: "26%",
            top: "294px",
            background: backgroundGradient,
            filter: "blur(200px)",
            transform: "rotate(-45deg)",
          }}
        ></div>
      </div>

      <Container className="relative z-10">
        <div className="text-center space-y-6 mb-12">
          {/* Categories Button */}
          <div className="flex justify-center">
            <span
              className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white uppercase wrap-break-word max-w-full"
              style={{
                backgroundColor: "rgba(217, 74, 86, 0.15)",
                color: "#d94a56",
              }}
            >
              {badge.text}
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight block wrap-break-word">
            <div style={{ color: "#374151" }} className="wrap-break-word">
              {title.line1}
            </div>
            <div className="wrap-break-word">
              <span style={{ color: "#374151" }}>{title.line2} </span>
              <span style={{ color: "#2563eb" }}>{title.line3} </span>
              <span
                className="bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {title.line4}
              </span>
            </div>
          </h2>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {categories.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 px-8 py-12 text-center hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative w-20 h-20 max-w-[80px] max-h-[80px] shrink-0">
                    <Image
                      src={item.icon}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain rounded-xl"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </div>
                </div>

                {/* Title */}
                <h5 className="font-semibold text-base sm:text-[22px] text-gray-900 wrap-break-word line-clamp-2 flex items-center justify-center mb-[7px]">
                  {item.name}
                </h5>

                <div
                  title="View more"
                  className="flex justify-center items-center group text-[15px]"
                >
                  <span className="font-semibold group-hover:underline hidden md:block">
                    View More
                  </span>
                  <span className="material-symbols-rounded hidden! md:block!  text-[22px]!">
                    chevron_right
                  </span>
                  <div className="md:hidden p-2 bg-gray-200 rounded-full text-[12px]!">
                    <span className="material-symbols-rounded block!">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
};
