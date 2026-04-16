import { Options, Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import _ from "lodash";
import { useMemo, useRef } from "react";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";
import { IExamCollection } from "../../api";
import { ExamItem } from "../exam-item";
import { decode } from "html-entities";

const defaultSliderOptions: Options = {
  type: "slide",
  perPage: 3,
  perMove: 1,
  gap: "24px",
  drag: "free",
  pagination: false,
  arrows: false,
  breakpoints: {
    1280: {
      perPage: 3,
    },
    1024: {
      perPage: 2,
    },
    640: {
      perPage: 1,
      padding: {
        right: "15%",
      },
      gap: "16px",
    },
  },
};

export function ExamCollection({
  loading = false,
  data,
}: {
  loading?: boolean;
  data?: IExamCollection["data"]["reading" | "listening"][number] & { skill?: string };
}) {
  const splideRef = useRef<{ splide: SplideType } | null>(null);
  const sliderOptions = useMemo(() => _.merge(defaultSliderOptions, []), []);

  const handlePrev = () => splideRef.current?.splide?.go("<");
  const handleNext = () => splideRef.current?.splide?.go(">");

  return (
    <article className="space-y-6">
      <header className="flex items-center mb-[20px]">
        <h3 className="text-2xl md:text-3xl font-extrabold flex-auto font-noto-sans text-[#2D3142]">
          {data?.title ? (
            decode(data.title)
          ) : (
            <div className="h-8 w-64 animate-pulse rounded bg-black/5" />
          )}
        </h3>
      </header>

      <div className="relative">
        {/* Prev arrow */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous"
          className="hidden sm:flex absolute left-0 -translate-x-1/2 top-[45%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
        >
          <img
            src="/assets/figma/icons/Arrow1.svg"
            alt=""
            className="w-3 h-3 [filter:brightness(0)_invert(1)]"
            style={{ transform: "rotate(180deg)" }}
          />
        </button>

        <Splide
          ref={splideRef as any}
          hasTrack={false}
          options={sliderOptions}
          tag="section"
        >
          <SplideTrack>
            {loading || !data ? (
              Array.from({ length: sliderOptions.perPage! }).map((_, index) => (
                <SplideSlide key={index}>
                  <div className="h-[234px] animate-pulse rounded-[30px] bg-black/5" />
                </SplideSlide>
              ))
            ) : (
              <>
                {data.exams.map((item, index) => {
                  const skill = (item as any).skill || data.skill || "reading";
                  return (
                    <SplideSlide key={item.id || index} className="pb-8 pt-[14px] flex">
                      <ExamItem item={{ ...(item as any), skill } as any} />
                    </SplideSlide>
                  );
                })}
              </>
            )}
          </SplideTrack>
        </Splide>

        {/* Next arrow */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next"
          className="hidden sm:flex absolute right-0 translate-x-1/2 top-[45%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
        >
          <img
            src="/assets/figma/icons/Arrow1.svg"
            alt=""
            className="w-3 h-3 [filter:brightness(0)_invert(1)]"
          />
        </button>
      </div>
    </article>
  );
}

export default ExamCollection;
