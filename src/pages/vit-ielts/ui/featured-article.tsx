import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import { skillLabel } from "./skills";
import type { Post } from "~services/types/database";

/**
 * Featured Article hero card — Figma node 3336:2162.
 * Horizontal layout: gradient/image left (500px) + body right with
 * FEATURED badge, skill eyebrow, title, excerpt, dark CTA button, meta.
 */
export const FeaturedArticle = ({ post, href }: { post: Post; href: string }) => {
  const fallbackImage = useContentImageFallback();
  const imageSrc = resolveContentImage(post.featured_image || undefined, fallbackImage);
  const isLogoFallback = !post.featured_image && imageSrc.includes("logo.png");
  const label = skillLabel(post.skill);
  const date = post.published_at ? dayjs(post.published_at).format("MMM D, YYYY") : "";
  const wordCount = ((post.excerpt || "") + " " + post.title).split(/\s+/).length;
  const readMin = Math.max(3, Math.ceil(wordCount / 30));

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[28px] bg-[#ffffff] border border-[rgba(25,29,36,0.1)] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] hover:shadow-[0px_12px_32px_0px_rgba(0,0,0,0.10)] transition-shadow md:flex-row"
    >
      {/* Left — image / gradient area */}
      <div
        className="relative min-h-[220px] shrink-0 overflow-hidden md:w-[440px] md:min-h-0"
        style={{
          background: isLogoFallback
            ? "linear-gradient(147deg, #5281f9 14%, #7ca1ff 86%)"
            : undefined,
        }}
      >
        {/* FEATURED badge */}
        <div className="absolute left-6 top-6 z-10 flex items-start overflow-hidden rounded-full bg-[#ffffff] px-3 py-[6px]">
          <span className="font-inter text-[11px] font-bold text-[#191d24]">FEATURED</span>
        </div>

        {!isLogoFallback ? (
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            unoptimized
          />
        ) : (
          /* Show gradient bg; logo not rendered in the gradient version */
          <div className="absolute inset-0 bg-[linear-gradient(147deg,#5281f9_14%,#7ca1ff_86%)]" />
        )}
      </div>

      {/* Right — body */}
      <div className="flex flex-1 flex-col gap-[14px] p-10 justify-center">
        {label && (
          <p className="font-inter text-[12px] font-bold text-[#9ad534] whitespace-nowrap uppercase tracking-[0.02em]">
            {label}
          </p>
        )}

        <h2 className="font-display text-[28px] font-bold leading-[1.08] tracking-[-0.56px] text-[#191d24]">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="font-inter text-[15px] font-normal text-[#6a7282] line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* CTA */}
        <div className="inline-flex h-12 w-[150px] items-center justify-center rounded-full bg-[#191d24] px-4">
          <span className="font-inter text-[14px] font-bold text-white">Read article</span>
        </div>

        {/* Meta */}
        <p className="font-inter text-[13px] font-medium text-[#6a7282]">
          {readMin} min read{date ? ` · ${date}` : ""}
        </p>
      </div>
    </Link>
  );
};
