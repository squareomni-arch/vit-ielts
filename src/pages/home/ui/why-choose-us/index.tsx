import { Container } from "@/shared/ui";
import type { WhyChooseUsConfig } from "./types";

interface WhyChooseUsProps {
  config: WhyChooseUsConfig;
}

export const WhyChooseUs = ({ config }: WhyChooseUsProps) => {
  const { badge, title, description, statistics = [] } = config;
  return (
    <div className="bg-white">
      <Container>
        {/* Header Section */}
        <div className="text-center mb-16">
          {/* Subtitle */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase wrap-break-word max-w-full"
              style={{
                backgroundColor: "rgba(37, 99, 235, 0.1)",
                color: "#2563eb",
              }}
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
            // Màu sắc mặc định cho từng card (không quản lý qua config)
            const colors = [
              {
                bgColor: "rgba(37, 99, 235, 0.1)",
                borderColor: "rgba(37, 99, 235, 0.2)",
                iconColor: "#2563eb",
              },
              {
                bgColor: "rgba(236, 72, 153, 0.1)",
                borderColor: "rgba(236, 72, 153, 0.2)",
                iconColor: "#ec4899",
              },
              {
                bgColor: "rgba(167, 85, 247, 0.1)",
                borderColor: "rgba(167, 85, 247, 0.2)",
                iconColor: "#a855f7",
              },
              {
                bgColor: "rgba(192, 38, 211, 0.1)",
                borderColor: "rgba(192, 38, 211, 0.2)",
                iconColor: "#c026d3",
              },
            ];
            const color = colors[index % colors.length];

            return (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md px-6 py-10 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center justify-start ${index === 1 || index === 3 ? "md:mt-10" : ""
                  }`}
              >
                {/* Icon Circle */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 shrink-0"
                  style={{
                    backgroundColor: color.bgColor,
                    borderColor: color.borderColor,
                  }}
                >
                  <span
                    className="material-symbols-rounded !text-[32px]"
                    style={{ color: color.iconColor }}
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
