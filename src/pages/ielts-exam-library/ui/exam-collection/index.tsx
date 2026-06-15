import { useRef } from "react";
import { decode } from "html-entities";
import { IExamCollection } from "../../api";
import { ExamItem } from "../exam-item";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";

const DEFAULT_SLIDER_OPTIONS = {
  type: "slide",
  perPage: 4,
  perMove: 1,
  gap: "24px",
  pagination: false,
  arrows: false,
  breakpoints: {
    1280: { perPage: 3 },
    1024: { perPage: 2, gap: "20px" },
    768: { perPage: 2, gap: "16px" },
    480: { perPage: 1, gap: "16px" },
  },
};

export function ExamCollection({
  loading = false,
  data,
  optionsOverride,
}: {
  loading?: boolean;
  data?: IExamCollection["data"]["reading" | "listening"][number] & { skill?: string };
  /** Override Splide options */
  optionsOverride?: Record<string, unknown>;
}) {
  const splideRef = useRef<{ splide: SplideType } | null>(null);

  const handlePrev = () => splideRef.current?.splide?.go("<");
  const handleNext = () => splideRef.current?.splide?.go(">");

  return (
    <article className="space-y-6">
      <header className="mb-5 flex items-center justify-between">
        <h3 className="text-2xl font-extrabold font-noto-sans text-ink-700 leading-tight">
          {data?.title ? (
            decode(data.title)
          ) : (
            <div className="h-8 w-64 animate-pulse rounded bg-black/5" />
          )}
        </h3>

        {/* Navigation buttons */}
        {!loading && data && data.exams.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(25,29,36,0.1)] hover:bg-[var(--color-brand-tint)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink-900)] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(25,29,36,0.1)] hover:bg-[var(--color-brand-tint)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink-900)] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </header>

      <div className="relative">
        <Splide
          ref={splideRef as any}
          hasTrack={false}
          options={{
            ...DEFAULT_SLIDER_OPTIONS,
            ...optionsOverride,
          }}
        >
          <SplideTrack>
            {loading || !data
              ? Array.from({ length: 3 }).map((_, index) => (
                  <SplideSlide key={index} className="pb-8 pt-[14px] px-1">
                    <div
                      className="h-[350px] animate-pulse rounded-[30px] bg-black/5"
                    />
                  </SplideSlide>
                ))
              : data.exams.map((item, index) => {
                  const skill = (item as any).skill || data.skill || "reading";
                  return (
                    <SplideSlide key={(item as any).id ?? index} className="pb-8 pt-[14px] px-1">
                      <ExamItem
                        item={{ ...(item as any), skill } as any}
                      />
                    </SplideSlide>
                  );
                })}
          </SplideTrack>
        </Splide>
      </div>
    </article>
  );
}

export default ExamCollection;
