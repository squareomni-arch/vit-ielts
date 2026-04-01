import { Container } from "@/shared/ui";
import type { WhyChooseUsConfig } from "./types";

interface WhyChooseUsProps {
  config: WhyChooseUsConfig;
}

export const WhyChooseUs = ({ config }: WhyChooseUsProps) => {
  const { badge, title, description, statistics = [] } = config;
  return (
    <div data-section="why-choose-us" className="bg-white">
      <Container>
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Subtitle */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase wrap-break-word max-w-full bg-blue-600/10 text-blue-600"
            >
              {badge.text}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight block wrap-break-word">
            {title}
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mt-5 mb-0 wrap-break-word px-4">
            {description}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statistics.map((stat, index) => {
            // Tailwind class-based colors instead of inline styles
            const colors = [
              {
                bgColor: "bg-blue-600/10",
                borderColor: "border-blue-600/20",
                iconColor: "text-blue-600",
              },
              {
                bgColor: "bg-pink-500/10",
                borderColor: "border-pink-500/20",
                iconColor: "text-pink-500",
              },
              {
                bgColor: "bg-purple-500/10",
                borderColor: "border-purple-500/20",
                iconColor: "text-purple-500",
              },
              {
                bgColor: "bg-fuchsia-600/10",
                borderColor: "border-fuchsia-600/20",
                iconColor: "text-fuchsia-600",
              },
            ];
            const color = colors[index % colors.length];

            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md px-6 py-10 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center justify-start ${
                  index === 1 || index === 3 ? "md:mt-10" : ""
                }`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 shrink-0 ${color.bgColor} ${color.borderColor}`}
                >
                  <span
                    className={`material-symbols-rounded !text-[32px] ${color.iconColor}`}
                  >
                    {stat.icon}
                  </span>
                </div>

                {/* Number */}
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 wrap-break-word line-clamp-2">
                  {stat.value}
                </h3>

                {/* Label */}
                <span className="text-sm sm:text-base text-gray-600 wrap-break-word line-clamp-2">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};
