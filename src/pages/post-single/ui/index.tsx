import { SEOHeader } from "@/widgets";
import Link from "next/link";
import { IPost } from "@/shared/types";
import Image from "next/image";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { decode } from "html-entities";
import { createClient } from "~supabase/client";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import { getMediaImage } from "@/shared/lib/media-image";
import { ProBadge } from "@/shared/ui/pro-badge";
import type { Post } from "~services/types/database";
import { ROUTES } from "@/shared/routes";

type SidebarOrSimilarPost = Pick<
  Post,
  "id" | "title" | "slug" | "featured_image" | "pro_user_only" | "categories" | "created_at" | "views"
>;

function skillChipStyle(skillName: string): { bg: string; text: string } {
  const s = skillName.toLowerCase();
  if (s.includes("listening")) return { bg: "#5281F9", text: "white" };
  if (s.includes("speaking")) return { bg: "#7C6EF9", text: "white" };
  if (s.includes("reading")) return { bg: "#7AC94A", text: "#191D24" };
  return { bg: "#B3E653", text: "#191D24" };
}

function cardGradient(categories?: string[] | null): string {
  const cat = (categories?.[0] || "").toLowerCase();
  if (cat.includes("listening")) return "linear-gradient(155deg, #5281F9 14%, #7CA1FF 86%)";
  if (cat.includes("speaking")) return "linear-gradient(155deg, #7C6EF9 14%, #A89CFF 86%)";
  if (cat.includes("reading")) return "linear-gradient(155deg, #7AC94A 14%, #A6E35E 86%)";
  return "linear-gradient(155deg, #B3E653 14%, #C4F16B 86%)";
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return p.length >= 2
    ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#7C6EF9", "#5281F9", "#F9A352", "#2EC4B6", "#F95281"];
function avatarBg(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function KeepReadingCard({
  href,
  title,
  featuredImage,
  categories,
  date,
  fallbackImage,
}: {
  href: string;
  title: string;
  featuredImage?: string | null;
  categories?: string[] | null;
  date?: string | null;
  fallbackImage: string;
}) {
  const gradient = cardGradient(categories);
  const label = (categories?.[0] || "IELTS").toUpperCase();
  return (
    <Link
      href={href}
      className="group bg-white rounded-[24px] border border-[rgba(25,29,36,0.08)] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden no-underline hover:shadow-[0px_8px_28px_rgba(0,0,0,0.09)] transition-shadow"
    >
      <div className="h-[160px] relative shrink-0" style={featuredImage ? undefined : { background: gradient }}>
        {featuredImage && (
          <Image
            src={resolveContentImage(featuredImage, fallbackImage)}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute top-[14px] left-[14px] bg-white/90 backdrop-blur-sm px-[10px] py-[5px] rounded-full">
          <span className="text-[11px] font-bold text-[#191D24] uppercase tracking-wide">{label}</span>
        </div>
      </div>
      <div className="p-[22px] flex flex-col gap-[10px] flex-1">
        <h3 className="text-[18px] font-bold font-noto-sans text-[#191D24] tracking-[-0.36px] leading-[1.2] line-clamp-2">
          {title}
        </h3>
        <div className="mt-auto pt-[10px] border-t border-[rgba(25,29,36,0.06)]">
          <p className="text-[12px] font-medium text-[#6A7282]">
            {date ? dayjs(date).format("MMM YYYY") : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

export const PageSingle = ({
  post,
  similarPosts = [],
  relatedPosts = [],
}: {
  post: IPost & {
    pro_user_only?: boolean;
    author?: { node?: { name?: string; userData?: { avatar?: { node?: { sourceUrl?: string } } } } };
  };
  similarPosts?: SidebarOrSimilarPost[];
  relatedPosts?: SidebarOrSimilarPost[];
}) => {
  const isProPost = (post as any).pro_user_only || post.postMeta?.proUserOnly || false;
  const fallbackImage = useContentImageFallback();
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleCopyLink = () => {
    const url = window.location.href;
    const onSuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        onSuccess();
      });
    } else {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onSuccess();
    }
  };

  const handleShare = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      "_blank",
    );

  const incrementViews = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.rpc("increment_post_views", { post_id: post.id });
    } catch (err) {
      console.warn("Failed to increment views:", err);
    }
  }, [post.id]);

  const plainText = (post.content || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  const readingTime = Math.max(1, Math.ceil(plainText.split(/\s+/).filter(Boolean).length / 200));

  useEffect(() => {
    const timeout = setTimeout(incrementViews, readingTime * 0.3 * 1000);
    return () => clearTimeout(timeout);
  }, [post.id, readingTime, incrementViews]);

  const skill = post.categories?.edges?.[0]?.node?.name || "";
  const chip = skillChipStyle(skill);
  const authorName = post.author?.node?.name || "VitIELTS";
  const authorSrc = post.author?.node?.userData?.avatar?.node?.sourceUrl;
  const initials = getInitials(authorName);
  const avatarColor = avatarBg(authorName);
  const excerptText = post.excerpt
    ? decode(post.excerpt.replace(/<[^>]+>/g, "").trim())
    : "";
  const allPosts = similarPosts.length > 0 ? similarPosts : relatedPosts;

  return (
    <div className="w-full max-w-[1360px] mx-auto">
      <SEOHeader
        fullHead={post.seo?.fullHead}
        title={post.seo?.title}
        description={post.excerpt}
        image={post.featuredImage?.node.sourceUrl}
      />

      {/* Back link */}
      <div className="mb-8">
        <Link
          href={ROUTES.BLOG.ARCHIVE}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#9AD534] hover:opacity-75 transition-opacity no-underline"
        >
          <span className="material-symbols-rounded text-[18px] leading-none">arrow_back</span>
          Back to all articles
        </Link>
      </div>

      {/* Article header */}
      <div className="space-y-[16px] mb-[28px]">
        {skill && (
          <span
            className="inline-flex items-center text-[13px] font-bold px-[14px] py-[7px] rounded-full"
            style={{ backgroundColor: chip.bg, color: chip.text }}
          >
            {skill.toUpperCase()}
          </span>
        )}
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-[32px] md:text-[42px] lg:text-[46px] font-extrabold font-noto-sans text-[#191D24] leading-[1.12] tracking-[-0.9px]">
            {post.title}
          </h1>
          {isProPost && <ProBadge className="mt-2 shrink-0" />}
        </div>
        {excerptText && (
          <p className="text-[16px] md:text-[19px] text-[#6A7282] leading-[1.55]">
            {excerptText}
          </p>
        )}
      </div>

      {/* Byline */}
      <div className="flex items-center justify-between mb-[32px]">
        <div className="flex items-center gap-[12px]">
          {authorSrc ? (
            <img src={authorSrc} alt={authorName} className="w-[48px] h-[48px] rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[17px]"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-[15px] font-bold text-[#191D24]">{authorName}</p>
            <p className="text-[13px] text-[#6A7282]">
              IELTS Coach · {readingTime} min read
              {post.date ? ` · ${dayjs(post.date).format("MMM D, YYYY")}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[10px]">
          <button
            onClick={handleCopyLink}
            className="w-[44px] h-[44px] rounded-full bg-white border border-[rgba(25,29,36,0.12)] flex items-center justify-center hover:bg-[#F6F7F4] transition-colors cursor-pointer"
            title={copied ? "Copied!" : "Copy link"}
          >
            <span className="material-symbols-rounded text-[20px] text-[#191D24] leading-none">
              {copied ? "check" : "link"}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="w-[44px] h-[44px] rounded-full bg-white border border-[rgba(25,29,36,0.12)] flex items-center justify-center hover:bg-[#F6F7F4] transition-colors cursor-pointer"
            title="Share"
          >
            <span className="material-symbols-rounded text-[20px] text-[#191D24] leading-none">share</span>
          </button>
        </div>
      </div>

      {/* Cover image */}
      {post.featuredImage?.node.sourceUrl && (
        <div className="relative rounded-[24px] overflow-hidden h-[260px] md:h-[380px] lg:h-[450px] w-full mb-[40px]">
          <Image
            src={getMediaImage(resolveContentImage(post.featuredImage.node.sourceUrl, fallbackImage), { width: 1200 })}
            alt={post.featuredImage.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Article body */}
      <div
        className="text-[16px] md:text-[18px] text-[#2E3640] leading-[1.75] mb-[40px]
          prose prose-lg max-w-none
          prose-headings:font-noto-sans prose-headings:text-[#191D24] prose-headings:tracking-tight
          prose-h2:text-[22px] md:prose-h2:text-[26px] prose-h2:font-bold prose-h2:tracking-[-0.52px] prose-h2:leading-[1.15] prose-h2:mt-[40px] prose-h2:mb-[14px]
          prose-h3:text-[19px] prose-h3:font-bold prose-h3:mt-[28px] prose-h3:mb-[10px]
          prose-p:text-[16px] prose-p:md:text-[18px] prose-p:leading-[1.75] prose-p:mb-[20px]
          prose-strong:font-bold prose-strong:text-[#191D24]
          [&_blockquote]:pl-[20px] [&_blockquote]:border-l-[5px] [&_blockquote]:border-[#B3E653] [&_blockquote]:my-[28px] [&_blockquote]:not-italic
          [&_blockquote]:text-[18px] [&_blockquote]:font-semibold [&_blockquote]:text-[#191D24] [&_blockquote]:leading-[1.5]
          [&_blockquote_p]:mb-0
          [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:pl-6 [&_ul]:pl-6
          break-words [overflow-wrap:anywhere]"
        dangerouslySetInnerHTML={{ __html: (post.content || "").replace(/&nbsp;| /g, " ") }}
      />

      {/* Tags */}
      {(post.categories?.edges?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-[10px] mb-[40px]">
          {post.categories!.edges.map(({ node }, i) => (
            <Link
              key={i}
              href={node.link}
              className="inline-flex items-center px-[14px] py-[8px] rounded-full border border-[rgba(25,29,36,0.15)] bg-white text-[13px] font-semibold text-[#191D24] hover:border-[#B3E653] hover:bg-[#F6F7F4] transition-colors no-underline"
            >
              {node.name}
            </Link>
          ))}
        </div>
      )}

      {/* Author card */}
      <div className="bg-white border border-[rgba(25,29,36,0.08)] rounded-[20px] p-[24px] md:p-[28px] mb-[56px]">
        <div className="flex items-center gap-[14px] mb-[14px]">
          {authorSrc ? (
            <img src={authorSrc} alt={authorName} className="w-[56px] h-[56px] rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-[56px] h-[56px] rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[20px]"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-[17px] font-bold text-[#191D24]">{authorName}</p>
            <p className="text-[14px] text-[#6A7282]">IELTS Coach</p>
          </div>
        </div>
        <p className="text-[14px] text-[#6A7282] leading-[1.6] mb-[18px]">
          Expert IELTS coaching to help you achieve your target band score. Helping thousands of students every year.
        </p>
        <Link
          href={ROUTES.ACCOUNT.MY_PROFILE}
          className="inline-flex items-center px-[22px] py-[10px] rounded-full border border-[rgba(25,29,36,0.15)] bg-white text-[14px] font-bold text-[#191D24] hover:border-[#191D24] transition-colors no-underline"
        >
          View profile
        </Link>
      </div>

      {/* Keep reading */}
      {allPosts.length > 0 && (
        <div className="mb-[56px]">
          <h2 className="text-[22px] md:text-[24px] font-bold font-noto-sans text-[#191D24] tracking-[-0.48px] mb-[22px]">
            Keep reading
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px] md:gap-[22px]">
            {allPosts.slice(0, 4).map((p, idx) => (
              <div
                key={p.id}
                className={
                  idx === 2
                    ? "hidden lg:block"
                    : idx === 3
                    ? "hidden xl:block"
                    : "block"
                }
              >
                <KeepReadingCard
                  href={`/blog/${p.slug}`}
                  title={p.title}
                  featuredImage={p.featured_image}
                  categories={p.categories}
                  date={p.created_at}
                  fallbackImage={fallbackImage}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter CTA */}
      <div
        className="rounded-[24px] py-[28px] px-[24px] md:px-[40px]"
        style={{ backgroundColor: "#B3E653" }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-[20px]">
          <div>
            <p className="text-[19px] md:text-[22px] font-bold font-noto-sans text-[#191D24] tracking-[-0.44px] leading-[1.2] mb-[6px]">
              Get a new strategy in your inbox each week
            </p>
            <p className="text-[13px] md:text-[14px] font-medium text-[#33421A]">
              Join 28,000+ students. No spam, unsubscribe anytime.
            </p>
          </div>
          <div className="flex items-center gap-[10px] w-full md:w-auto shrink-0">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 md:w-[200px] h-[46px] pl-[18px] pr-[14px] rounded-full bg-white text-[14px] text-[#6A7282] outline-none border-none placeholder:text-[#9BA4B4] min-w-0"
            />
            <button className="h-[46px] px-[22px] rounded-full bg-[#191D24] text-white text-[14px] font-bold whitespace-nowrap hover:opacity-90 transition-opacity cursor-pointer shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
