import { Container } from "@/shared/ui";
import { Button } from "@/shared/ui/ds/atoms/button";
import Image from "next/image";
import Link from "next/link";
import type { TestimonialsConfig } from "./types";

interface TestimonialsProps {
  config: TestimonialsConfig;
}

const StarRating = () => {
  return (
    <div className="flex mt-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="material-symbols-rounded text-yellow-500 filled text-lg"
        >
          star
        </span>
      ))}
    </div>
  );
};

const TestimonialCard = ({
  name,
  title,
  company,
  quote,
  avatar,
}: {
  name: string;
  title: string;
  company: string;
  quote: string;
  avatar: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 min-w-[280px] sm:min-w-[320px] max-w-[320px] h-full flex flex-col overflow-hidden">
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Quote Icon */}
        <div className="absolute -top-2 -right-2 opacity-30 w-10 h-10 sm:w-12 sm:h-[42px] shrink-0 z-0 pointer-events-none">
          <Image
            src="/img-admin/quote.svg"
            alt="quote"
            width={48}
            height={42}
            className="object-contain w-full h-full"
            unoptimized
          />
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 min-w-[48px] max-w-[48px]">
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover"
              unoptimized
              sizes="48px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-bold text-gray-900 text-sm wrap-break-word line-clamp-1">
              {name}
            </h5>
            <span className="text-xs text-gray-600 wrap-break-word line-clamp-2">
              {title} <i>{company}</i>
            </span>
          </div>
        </div>

        {/* Quote */}
        <p className="text-sm text-gray-700 leading-relaxed mb-2 wrap-break-word line-clamp-5 flex-1 min-h-0 relative z-10">
          {quote}
        </p>

        {/* Star Rating */}
        <div className="relative z-10 mt-auto">
          <StarRating />
        </div>
      </div>
    </div>
  );
};

export const Testimonials = ({ config }: TestimonialsProps) => {
  const { title, description, button, testimonials = [] } = config;

  // Duplicate testimonials for seamless loop
  // Create a copy before reversing to avoid mutating the original array
  const reversedTestimonials = [...testimonials].reverse();
  const testimonialsRow1 = [...testimonials, ...testimonials];
  const testimonialsRow2 = [...reversedTestimonials, ...reversedTestimonials];

  return (
    <div data-section="testimonials" className="bg-white py-10 md:py-10 overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Side - Introduction */}
          <div className="lg:col-span-3 pl-0 pr-4 lg:pr-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight wrap-break-word">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-5 wrap-break-word line-clamp-4">
              {description}
            </p>
            <Link href={button.link} className="inline-block w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full sm:w-auto px-4 sm:px-6 py-3 text-sm sm:text-base rounded-lg"
                rightIcon={<span className="material-symbols-rounded shrink-0 text-xl">arrow_forward</span>}
              >
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {button.text}
                </span>
              </Button>
            </Link>
          </div>

          {/* Right Side - Testimonials */}
          <div className="lg:col-span-9 overflow-hidden">
            {/* Row 1 - Scroll Right to Left */}
            <div className="overflow-hidden pt-12 pb-8">
              <div className="flex gap-4 sm:gap-5 animate-marquee-right-left">
                {testimonialsRow1.map((testimonial, index) => (
                  <TestimonialCard key={`row1-${index}`} {...testimonial} />
                ))}
              </div>
            </div>

            {/* Row 2 - Scroll Left to Right */}
            <div className="overflow-hidden pb-12">
              <div className="flex gap-4 sm:gap-5 animate-marquee-left-right">
                {testimonialsRow2.map((testimonial, index) => (
                  <TestimonialCard key={`row2-${index}`} {...testimonial} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes marquee-right-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-left-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-marquee-right-left {
          animation: marquee-right-left 40s linear infinite;
        }

        .animate-marquee-left-right {
          animation: marquee-left-right 40s linear infinite;
        }

        .animate-marquee-right-left:hover,
        .animate-marquee-left-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
