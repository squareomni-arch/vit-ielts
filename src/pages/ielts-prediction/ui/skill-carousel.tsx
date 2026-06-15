import { useRef } from "react";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";
import { ArticleCard } from "./article-card";
import type { Post } from "~services/types/database";

/**
 * Horizontal carousel of article cards for a skill section — same Splide setup
 * as the homepage practice carousel, so sections with more than a row of posts
 * scroll instead of being capped.
 */
export const SkillCarousel = ({
  posts,
  href,
}: {
  posts: Post[];
  href: (post: Post) => string;
}) => {
  const splideRef = useRef<{ splide: SplideType } | null>(null);
  const handlePrev = () => splideRef.current?.splide?.go("<");
  const handleNext = () => splideRef.current?.splide?.go(">");

  if (posts.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous"
        className="hidden sm:flex absolute left-0 -translate-x-1/2 top-[40%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#191d24] hover:bg-[#374151] shadow-lg transition-colors"
      >
        <img
          src="/assets/icons/ArrowLeft.svg"
          alt=""
          className="w-3 h-3 [filter:brightness(0)_invert(1)]"
        />
      </button>

      <Splide
        ref={splideRef as never}
        hasTrack={false}
        options={{
          type: "slide",
          perPage: 3,
          perMove: 1,
          gap: "24px",
          pagination: false,
          arrows: false,
          breakpoints: {
            1024: { perPage: 2, gap: "20px" },
            640: { perPage: 1, gap: "16px" },
          },
        }}
      >
        <SplideTrack>
          {posts.map((post) => (
            <SplideSlide key={post.id} className="pb-6 pt-[14px] px-1">
              <ArticleCard post={post} href={href(post)} />
            </SplideSlide>
          ))}
        </SplideTrack>
      </Splide>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next"
        className="hidden sm:flex absolute right-0 translate-x-1/2 top-[40%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#191d24] hover:bg-[#374151] shadow-lg transition-colors"
      >
        <img
          src="/assets/icons/ArrowRight.svg"
          alt=""
          className="w-3 h-3 [filter:brightness(0)_invert(1)]"
        />
      </button>
    </div>
  );
};
