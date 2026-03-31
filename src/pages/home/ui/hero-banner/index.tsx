import { Container } from "@/shared/ui";
import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";
import type { HeroBannerConfig } from "./types";

interface HeroBannerProps {
  config: HeroBannerConfig;
}

// Helper function để kiểm tra xem URL có phải là external URL không
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// Helper function để kiểm tra URL có hợp lệ không (loại bỏ fakepath)
const isValidImageUrl = (url: string): boolean => {
  if (!url || !url.trim()) return false;
  // Loại bỏ các đường dẫn fakepath (local file paths)
  if (url.includes('fakepath') || url.includes('C:\\') || url.includes('C:/')) {
    return false;
  }
  // Chấp nhận URL external hoặc relative path hợp lệ
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

export const HeroBanner = ({ config }: HeroBannerProps) => {
  const {
    trustpilot = { image: '', rating: '' },
    headline = { line1: '', line2: '', line3: '', line4: '' },
    description = { text: '', highlightText: '' },
    buttons = { primary: { text: '', link: '#' } },
    backgroundImage = '',
    bannerImage = '',
    featureCards = [],
    decorativeShape,
  } = config || {};

  // Chọn card có avatars (nếu có), fallback về card thứ 2
  const enrolledCard =
    featureCards.find(
      (card) => Array.isArray(card.avatars) && card.avatars.length > 0
    ) || featureCards[1] || null;

  // Validate và format backgroundImage URL
  const getBackgroundImageUrl = () => {
    if (!backgroundImage) return '';
    // Nếu là URL external, dùng trực tiếp
    if (isExternalUrl(backgroundImage)) {
      return backgroundImage;
    }
    // Nếu là relative path, đảm bảo có dấu / ở đầu
    return backgroundImage.startsWith('/') ? backgroundImage : `/${backgroundImage}`;
  };

  return (
    <div
      className="relative overflow-hidden py-12 md:py-35"
      style={{
        background: backgroundImage ? `url('${getBackgroundImageUrl()}') no-repeat center center` : 'none',
        backgrounize: "cover",
      }}
    >
      {/* Background Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pink shape behind woman's head */}
        <div
          className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(251, 207, 232, 0.6) 0%, rgba(244, 114, 182, 0.4) 100%)",
          }}
        ></div>
        {/* Light blue shape upper right */}
        <div
          className="absolute top-1/3 right-1/6 w-72 h-72 rounded-full blur-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(191, 219, 254, 0.5) 0%, rgba(147, 197, 253, 0.3) 100%)",
          }}
        ></div>
        {/* Gradient bottom right */}
        <div
          className="absolute bottom-0 right-0 w-full h-1/2"
          style={{
            background:
              "linear-gradient(to top, rgba(224, 231, 255, 0.3) 0%, transparent 100%)",
          }}
        ></div>
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Side - Content */}
          <div className="w-full lg:w-7/12 space-y-6 relative">
            {/* Decorative Color Shape Above Trustpilot */}
            <div className="absolute -top-4 -right-4 w-32 h-32 opacity-30 pointer-events-none">
              <div
                className="w-full h-full rounded-full blur-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(167, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.3) 100%)",
                }}
              ></div>
            </div>

            {/* Trustpilot Rating */}
            <div className="flex items-center gap-3 relative z-10 flex-wrap">
              <div className="relative max-w-[220px] max-h-[26px] shrink-0">
                {trustpilot.image.startsWith('http://') || trustpilot.image.startsWith('https://') ? (
                  <img
                    src={trustpilot.image}
                    alt="Trustpilot"
                    className="object-contain w-full h-full"
                    style={{ maxWidth: "220px", maxHeight: "26px" }}
                  />
                ) : (
                  <Image
                    src={trustpilot.image}
                    alt="Trustpilot"
                    width={220}
                    height={26}
                    unoptimized
                    className="object-contain w-full h-full"
                  />
                )}
              </div>
              <span
                className="text-base font-medium wrap-break-word"
                style={{ color: "#22c55e" }}
              >
                {trustpilot.rating}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight wrap-break-word">
              <span style={{ color: "#374151" }}>{headline.line1}</span>
              <br className="!block" />
              <span style={{ color: "#374151" }}>{headline.line2} </span>
              <span style={{ color: "#2563eb" }}>{headline.line3} </span>
              <span style={{ color: "#a855f7" }}>{headline.line4}</span>
            </h1>

            {/* Description */}
            <p
              className="text-lg sm:text-xl md:text-2xl leading-relaxed wrap-break-word"
              style={{ color: "#22c55e" }}
            >
              {description.text}{" "}
              <span className="font-medium">{description.highlightText}</span>
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={buttons.primary.link} className="shrink-0">
                <Button
                  type="primary"
                  size="large"
                  className="h-12 px-4 sm:px-8 rounded-lg text-sm sm:text-base font-medium border-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-white w-full sm:w-auto"
                  style={{
                    backgroundColor: "#d94a56",
                  }}
                >
                  <span className="flex items-center gap-2 justify-center">
                    <span className="truncate max-w-[200px] sm:max-w-none">
                      {buttons.primary.text}
                    </span>
                    <span className="material-symbols-rounded shrink-0">
                      arrow_forward
                    </span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side - Banner Image with Overlays */}
          <div className="w-full lg:w-5/12 relative">
            <div className="relative">
              {/* Background shapes behind image */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Pink shape behind head */}
                <div
                  className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-2xl opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(251, 207, 232, 0.8) 0%, rgba(244, 114, 182, 0.6) 100%)",
                  }}
                ></div>
                {/* Light blue shape */}
                <div
                  className="absolute top-1/3 right-1/6 w-56 h-56 rounded-full blur-2xl opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(191, 219, 254, 0.7) 0%, rgba(147, 197, 253, 0.5) 100%)",
                  }}
                ></div>
              </div>

              {/* Main Banner Image */}
              {bannerImage && isValidImageUrl(bannerImage) && (
                <div className="relative aspect-square max-w-lg mx-auto w-full">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden max-h-[600px]">
                    {isExternalUrl(bannerImage) ? (
                      // External URL (ImgBB) - use regular img tag
                      <img
                        src={bannerImage}
                        alt="Banner"
                        className="w-full h-full object-contain"
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                        onError={(e) => {
                          console.error("Failed to load banner image:", bannerImage);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      // Local/relative URL - use Next.js Image
                      <Image
                        src={bannerImage}
                        alt="Banner"
                        fill
                        className="object-contain"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                        unoptimized={bannerImage.startsWith('/img-admin/')}
                        onError={(e) => {
                          console.error("Failed to load banner image:", bannerImage);
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Feature Card 1 - Top Right */}
              {featureCards[0] && (
                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-3 animate-float max-w-[200px] sm:max-w-[250px]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                    {isExternalUrl(featureCards[0].icon) ? (
                      <img
                        src={featureCards[0].icon}
                        alt="Icon"
                        className="object-contain w-full h-full"
                        style={{ width: "48px", height: "48px" }}
                      />
                    ) : (
                      <Image
                        src={featureCards[0].icon}
                        alt="Icon"
                        width={48}
                        height={48}
                        unoptimized
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {featureCards[0].title && (
                      <h6 className="font-bold text-sm sm:text-base text-gray-900 wrap-break-word line-clamp-2">
                        {featureCards[0].title}
                      </h6>
                    )}
                    <p
                      className="text-xs sm:text-sm wrap-break-word line-clamp-2"
                      style={{ color: "#ec4899" }}
                    >
                      {featureCards[0].subtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Enrolled Card - Middle Left */}
              {enrolledCard && (
                <div className="absolute bottom-1/4 left-0 bg-white rounded-xl shadow-lg p-3 sm:p-5 animate-float-delayed max-w-[200px] sm:max-w-[250px]">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                      {isExternalUrl(enrolledCard.icon) ? (
                        <img
                          src={enrolledCard.icon}
                          alt="Icon"
                          className="object-contain w-full h-full"
                          style={{ width: "48px", height: "48px" }}
                        />
                      ) : (
                        <Image
                          src={enrolledCard.icon}
                          alt="Icon"
                          width={48}
                          height={48}
                          unoptimized
                          className="object-contain w-full h-full"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {enrolledCard.value && (
                        <h6 className="font-bold text-lg sm:text-xl text-gray-900 wrap-break-word line-clamp-1">
                          {enrolledCard.value}
                        </h6>
                      )}
                      <p
                        className="text-xs sm:text-sm wrap-break-word line-clamp-2"
                        style={{ color: "#22c55e" }}
                      >
                        {enrolledCard.subtitle}
                      </p>
                    </div>
                  </div>
                  {/* Profile Avatars */}
                  {enrolledCard.avatars && (
                    <div className="flex -space-x-2 flex-wrap">
                      {enrolledCard.avatars
                        .slice(0, 5)
                        .map((avatar, i) => {
                          // Bỏ qua avatar không hợp lệ nhưng không chặn cả mảng
                          if (!isValidImageUrl(avatar)) {
                            return null;
                          }

                          return (
                            <div
                              key={i}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden relative shrink-0"
                            >
                              {isExternalUrl(avatar) ? (
                                <img
                                  src={avatar}
                                  alt={`Student ${i + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error("Failed to load avatar:", avatar);
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Image
                                  src={avatar}
                                  alt={`Student ${i + 1}`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  onError={() => {
                                    console.error("Failed to load avatar:", avatar);
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Feature Card 2 - Bottom Right */}
              {featureCards[2] && (
                <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-3 animate-float-delayed-2 max-w-[200px] sm:max-w-[250px]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                    {isExternalUrl(featureCards[2].icon) ? (
                      <img
                        src={featureCards[2].icon}
                        alt="Icon"
                        className="object-contain w-full h-full"
                        style={{ width: "48px", height: "48px" }}
                      />
                    ) : (
                      <Image
                        src={featureCards[2].icon}
                        alt="Icon"
                        width={48}
                        height={48}
                        unoptimized
                        className="object-contain w-full h-full"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {featureCards[2].value && (
                      <h6 className="font-bold text-lg sm:text-xl text-gray-900 wrap-break-word line-clamp-1">
                        {featureCards[2].value}
                      </h6>
                    )}
                    <p
                      className="text-xs sm:text-sm wrap-break-word line-clamp-2"
                      style={{ color: "#22c55e" }}
                    >
                      {featureCards[2].subtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-delayed-2 {
          animation: float 3s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};
