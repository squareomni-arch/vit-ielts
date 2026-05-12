import { Container } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { Breadcrumb, Avatar, TestCard } from "@/shared/ui/ds";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import { useCallback, useEffect, useState, useRef } from "react";
import SharePost from "./share-post";
import RelatedEssays from "./related-essays";
import { SingleSampleEssay } from "@/pages/sample-essay/api";
import { decode } from "html-entities";
import { createClient } from "~supabase/client";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import { ROUTES } from "@/shared/routes";
import type { SampleEssay } from "~services/types/database";
import { Splide, SplideSlide, SplideTrack } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";
import type { Splide as SplideType } from "@splidejs/splide";
import { useAuth } from "@/appx/providers";

export const PageSingle = ({
  sampleEssay: post,
  relatedEssays = [],
}: {
  sampleEssay: SingleSampleEssay;
  relatedEssays?: Pick<
    SampleEssay,
    | "id"
    | "title"
    | "slug"
    | "featured_image"
    | "skill"
    | "excerpt"
    | "pro_user_only"
  >[];
}) => {
  const fallbackImage = useContentImageFallback();
  const splideRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const { currentUser } = useAuth();
  const viewerIsPro = Boolean(currentUser?.userData?.isPro);

  const handleCopyLink = () => {
    const url = window.location.href;
    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(onSuccess)
        .catch(() => {
          const ta = document.createElement("textarea");
          ta.value = url;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          onSuccess();
        });
    } else {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onSuccess();
    }
  };

  // Increment view count via Supabase
  const incrementViews = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.rpc("increment_sample_essay_views", { essay_id: post.id });
    } catch (err) {
      console.warn("Failed to increment views:", err);
    }
  }, [post.id]);

  const breadcrumbs = post.seo?.breadcrumbs || [];
  const breadcrumbItems = breadcrumbs.map((item: any) => ({
    label: decode(item.text),
    href: item.url,
  }));

  const readingTime = Math.ceil(post.content.length / 200);

  useEffect(() => {
    const thirtyPercentOfReadTime = readingTime * 0.3;
    const timeout = setTimeout(async () => {
      await incrementViews();
    }, thirtyPercentOfReadTime * 1000);

    return () => clearTimeout(timeout);
  }, [post.id, readingTime, incrementViews]);

  return (
    <>
      <SEOHeader
        fullHead={post.seo?.fullHead}
        title={post.seo?.title}
        description={post.excerpt}
        image={post.featuredImage?.node.sourceUrl}
      />
      <div className="min-h-screen pb-20 bg-white relative px-4 sm:px-6">
        <div
          className="absolute inset-x-0 top-0 h-[380px] md:h-[420px] pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,74,86,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(217,74,86,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: "center top",
          }}
        />
        <div className="absolute top-[380px] md:top-[420px] left-0 w-full h-[10px] bg-[#D94A56] z-0" />
        <Container className="max-w-[1360px] relative z-10 pt-[160px] md:pt-[220px] mb-8">
          {/* Use same 3-column layout so the header aligns with the middle content column */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left spacer — matches left sidebar width */}
            <div className="hidden lg:block w-[220px] shrink-0" />

            {/* Header Box — aligned with middle column */}
            <div className="w-full lg:flex-1 min-w-0">
              <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] px-[20px] md:px-[61px] py-[30px] md:py-[50px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-left">
                <div className="mb-[23px]">
                  <Breadcrumb items={breadcrumbItems} />
                </div>
                <h1 className="text-3xl md:text-[40px] font-extrabold text-[#2D3142] font-noto-sans leading-tight mb-[23px]">
                  {post.title}
                </h1>
                <div className="flex items-center justify-between pt-[23px]">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={
                          post.author?.node?.userData?.avatar?.node?.sourceUrl
                        }
                        fallback={post.author?.node?.name?.charAt(0) || "A"}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-[#2D3142]">
                        {post.author?.node?.name || "Administrator"}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-[#6A7282]">
                      {post.date
                        ? new Date(post.date).toLocaleDateString("vi-VN")
                        : "14/12/2025"}
                    </div>
                  </div>
                  <button
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-[#2D3142] cursor-pointer"
                    title="Share"
                    onClick={() =>
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                        "_blank",
                      )
                    }
                  >
                    <span className="material-symbols-rounded text-[24px] align-middle">
                      ios_share
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right spacer — matches right sidebar width */}
            <div className="hidden lg:block w-[280px] shrink-0" />
          </div>
        </Container>
        <Container className="max-w-[1360px] relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Fixed details */}
            <div className="w-full lg:w-[220px] shrink-0 relative z-10">
              <div className="sticky top-35 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[#2D3142] mb-3">
                    Sample Essay
                  </h3>
                  <p className="text-sm text-[#6A7282] leading-relaxed">
                    Review high-scoring IELTS sample essays to improve your
                    writing and speaking skills. Practice makes perfect.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <button
                    className={`flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${copied ? "text-[#27AE60]" : "text-[#6A7282] hover:text-[#D94A56]"}`}
                    onClick={handleCopyLink}
                  >
                    <span className="material-symbols-rounded text-lg">
                      {copied ? "check_circle" : "content_copy"}
                    </span>
                    {copied ? "Đã copy!" : "Copy link"}
                  </button>
                  <button
                    className="flex items-center gap-3 text-sm font-medium text-[#6A7282] hover:text-[#D94A56] transition-colors cursor-pointer"
                    onClick={() =>
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                        "_blank",
                      )
                    }
                  >
                    <span className="material-symbols-rounded text-lg">
                      share
                    </span>
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Column: Main Content */}
            <div className="w-full lg:flex-1 min-w-0 space-y-6 relative z-10">
              <div className="aspect-[21/10] relative rounded-[24px] overflow-hidden border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
                <Image
                  src={resolveContentImage(
                    post.featuredImage?.node.sourceUrl,
                    fallbackImage,
                  )}
                  alt={post.featuredImage?.node.altText || post.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="flex gap-x-2">
                    <p className="text-xs text-gray-600 flex items-center space-x-1">
                      <span className="material-symbols-rounded text-lg! leading-none!">
                        visibility
                      </span>
                      <span>{post.postMeta?.views || 0}</span>
                    </p>
                    <p className="text-xs text-gray-600 flex items-center space-x-1">
                      <span className="material-symbols-rounded text-lg! leading-none!">
                        calendar_month
                      </span>
                      <span>{dayjs(post.date).format("DD/MM/YYYY")}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] p-6 md:p-8 mt-6 overflow-hidden">
                  <div
                    className="text-sm md:text-base text-[#2D3142] leading-relaxed prose prose-sm md:prose-base max-w-none prose-p:!mb-2 prose-strong:font-extrabold prose-strong:text-[#1a1d2b] break-words [overflow-wrap:anywhere] [&_*]:[overflow-wrap:anywhere] [&_strong]:font-extrabold [&_strong]:text-[#1a1d2b] [&_b]:font-extrabold [&_b]:text-[#1a1d2b] [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:overflow-x-auto [&_pre]:overflow-x-auto [&_ol]:pl-6 [&_ul]:pl-6"
                    dangerouslySetInnerHTML={{
                      __html: (post.content || "").replace(
                        /&nbsp;|\u00A0/g,
                        " ",
                      ),
                    }}
                  ></div>
                </div>
                <div className="p-4">
                  <SharePost />
                </div>
              </div>
            </div>

            {/* Right Column: Related items */}
            <div className="w-full lg:w-[280px] shrink-0 relative z-10">
              <div className="sticky top-35 space-y-8">
                <RelatedEssays currentId={post.id} skill={post.skill} />
              </div>
            </div>
          </div>
        </Container>

        {/* Bottom: Bài viết liên quan carousel */}
        {relatedEssays.length > 0 && (
          <Container className="max-w-[1360px] mt-16 relative z-10">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#2D3142]">
                Bài viết liên quan
              </h2>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => splideRef.current?.splide?.go("<")}
                aria-label="Previous"
                className="hidden sm:flex absolute left-0 -translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
              >
                <Image
                  src="/assets/figma/icons/Arrow1.svg"
                  alt="Previous"
                  width={12}
                  height={12}
                  className="[filter:brightness(0)_invert(1)]"
                  style={{ transform: "rotate(180deg)" }}
                />
              </button>

              <Splide
                ref={splideRef as any}
                hasTrack={false}
                options={{
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
                }}
              >
                <SplideTrack>
                  {relatedEssays.slice(0, 8).map((essay) => {
                    const essayIsPro =
                      essay.pro_user_only ||
                      (essay as any).proUserOnly ||
                      false;
                    return (
                      <SplideSlide key={essay.id} className="pb-8 pt-[14px] px-1">
                        <TestCard
                          image={essay.featured_image ?? undefined}
                          title={essay.title}
                          skill={essay.skill as any}
                          isPro={essayIsPro}
                          // Lock icon should reflect whether the *current viewer*
                          // would be blocked, not just whether the content is
                          // gated. Pro users with active access shouldn't see
                          // a lock on related Pro essays.
                          isLocked={essayIsPro && !viewerIsPro}
                          href={ROUTES.SAMPLE_ESSAY.SINGLE(essay.slug)}
                          actionText="Xem thêm"
                        />
                      </SplideSlide>
                    );
                  })}
                </SplideTrack>
              </Splide>

              <button
                type="button"
                onClick={() => splideRef.current?.splide?.go(">")}
                aria-label="Next"
                className="hidden sm:flex absolute right-0 translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
              >
                <Image
                  src="/assets/figma/icons/Arrow1.svg"
                  alt="Next"
                  width={12}
                  height={12}
                  className="[filter:brightness(0)_invert(1)]"
                />
              </button>
            </div>
          </Container>
        )}
      </div>
    </>
  );
};
