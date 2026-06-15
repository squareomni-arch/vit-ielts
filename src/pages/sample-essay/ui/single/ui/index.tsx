import { SEOHeader } from "@/widgets";
import Image from "next/image";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { SingleSampleEssay } from "@/pages/sample-essay/api";
import { decode } from "html-entities";
import { createClient } from "~supabase/client";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import { ROUTES } from "@/shared/routes";
import type { SampleEssay } from "~services/types/database";
import { useAuth } from "@/appx/providers";
import Link from "next/link";

function skillChipStyle(skill?: string | null): { bg: string; text: string } {
  const s = (skill || "").toLowerCase();
  if (s === "listening") return { bg: "#5281F9", text: "white" };
  if (s === "speaking") return { bg: "#7C6EF9", text: "white" };
  if (s === "reading") return { bg: "#7AC94A", text: "#191D24" };
  return { bg: "#B3E653", text: "#191D24" };
}

function essayCardGradient(skill?: string | null): string {
  const s = (skill || "").toLowerCase();
  if (s === "listening") return "linear-gradient(155deg, #5281F9 14%, #7CA1FF 86%)";
  if (s === "speaking") return "linear-gradient(155deg, #7C6EF9 14%, #A89CFF 86%)";
  if (s === "reading") return "linear-gradient(155deg, #7AC94A 14%, #A6E35E 86%)";
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

type RelatedEssay = Pick<
  SampleEssay,
  "id" | "title" | "slug" | "featured_image" | "skill" | "excerpt" | "pro_user_only"
>;

function EssayCard({
  essay,
  isPro,
  isLocked,
  fallbackImage,
}: {
  essay: RelatedEssay;
  isPro: boolean;
  isLocked: boolean;
  fallbackImage: string;
}) {
  const gradient = essayCardGradient(essay.skill);
  return (
    <Link
      href={ROUTES.SAMPLE_ESSAY.SINGLE(essay.slug)}
      className="group bg-white rounded-[24px] border border-[rgba(25,29,36,0.08)] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden no-underline hover:shadow-[0px_8px_28px_rgba(0,0,0,0.09)] transition-shadow relative"
    >
      <div className="h-[140px] relative shrink-0" style={{ background: gradient }}>
        {essay.featured_image && (
          <Image
            src={resolveContentImage(essay.featured_image, fallbackImage)}
            alt={essay.title}
            fill
            className="object-cover opacity-25 group-hover:opacity-35 transition-opacity"
            unoptimized
          />
        )}
        <div className="absolute top-[12px] left-[12px] bg-white/90 px-[10px] py-[4px] rounded-full">
          <span className="text-[11px] font-bold text-[#191D24] uppercase">{essay.skill || "ESSAY"}</span>
        </div>
        {isLocked && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="material-symbols-rounded text-white text-[28px]">lock</span>
          </div>
        )}
      </div>
      <div className="p-[20px] flex flex-col gap-[8px] flex-1">
        {isPro && (
          <span className="text-[11px] font-bold text-[#D94A56] uppercase tracking-wide">PRO</span>
        )}
        <h3 className="text-[17px] font-bold font-noto-sans text-[#191D24] tracking-[-0.34px] leading-[1.2] line-clamp-2">
          {essay.title}
        </h3>
        <p className="text-[12px] font-medium text-[#6A7282] line-clamp-2 mt-auto">{essay.excerpt || ""}</p>
      </div>
    </Link>
  );
}

export const PageSingle = ({
  sampleEssay: post,
  relatedEssays = [],
  sidebarEssays = [],
}: {
  sampleEssay: SingleSampleEssay;
  relatedEssays?: RelatedEssay[];
  sidebarEssays?: Pick<SampleEssay, "id" | "slug" | "title" | "featured_image">[];
}) => {
  const fallbackImage = useContentImageFallback();
  const [copied, setCopied] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const { currentUser } = useAuth();
  const viewerIsPro = Boolean(currentUser?.userData?.isPro);

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
      await supabase.rpc("increment_sample_essay_views", { essay_id: post.id });
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

  const chip = skillChipStyle(post.skill);
  const authorName = (post as any).author?.node?.name || "VitIELTS";
  const authorSrc = (post as any).author?.node?.userData?.avatar?.node?.sourceUrl;
  const initials = getInitials(authorName);
  const avatarColor = avatarBg(authorName);
  const allRelated = [...relatedEssays, ...sidebarEssays.map((e) => ({
    ...e,
    skill: post.skill,
    excerpt: "",
    pro_user_only: false,
  }) as RelatedEssay)].slice(0, 6);

  const backHref =
    post.skill === "reading"
      ? `${ROUTES.EXAM.ARCHIVE}?skill=reading`
      : post.skill === "speaking"
        ? `${ROUTES.EXAM.ARCHIVE}?skill=speaking`
        : post.skill === "listening"
          ? `${ROUTES.EXAM.ARCHIVE}?skill=listening`
          : `${ROUTES.EXAM.ARCHIVE}?skill=writing`;

  return (
    <>
      <SEOHeader
        fullHead={post.seo?.fullHead}
        title={post.seo?.title}
        description={post.excerpt}
        image={post.featuredImage?.node.sourceUrl}
      />

      {/* Back link */}
      <div className="mb-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#9AD534] hover:opacity-75 transition-opacity no-underline"
        >
          <span className="material-symbols-rounded text-[18px] leading-none">arrow_back</span>
          Back to essay library
        </Link>
      </div>

      {/* Article header */}
      <div className="space-y-[16px] mb-[28px]">
        {post.skill && (
          <span
            className="inline-flex items-center text-[13px] font-bold px-[14px] py-[7px] rounded-full"
            style={{ backgroundColor: chip.bg, color: chip.text }}
          >
            {post.skill.toUpperCase()}
          </span>
        )}
        <h1 className="text-[30px] md:text-[40px] lg:text-[44px] font-extrabold font-noto-sans text-[#191D24] leading-[1.12] tracking-[-0.88px]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-[16px] md:text-[18px] text-[#6A7282] leading-[1.55]">
            {decode(post.excerpt.replace(/<[^>]+>/g, "").trim())}
          </p>
        )}
      </div>

      {/* Byline */}
      <div className="flex items-center justify-between mb-[30px]">
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
        <div className="relative rounded-[24px] overflow-hidden h-[240px] md:h-[360px] lg:h-[420px] w-full mb-[36px]">
          <Image
            src={resolveContentImage(post.featuredImage.node.sourceUrl, fallbackImage)}
            alt={post.featuredImage.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Essay body */}
      <div
        className="text-[16px] md:text-[18px] text-[#2E3640] leading-[1.75] mb-[40px]
          prose prose-lg max-w-none
          prose-headings:font-noto-sans prose-headings:text-[#191D24] prose-headings:tracking-tight
          prose-h2:text-[22px] md:prose-h2:text-[24px] prose-h2:font-bold prose-h2:tracking-[-0.48px] prose-h2:leading-[1.15] prose-h2:mt-[36px] prose-h2:mb-[12px]
          prose-h3:text-[19px] prose-h3:font-bold prose-h3:mt-[24px] prose-h3:mb-[10px]
          prose-p:text-[16px] prose-p:md:text-[18px] prose-p:leading-[1.75] prose-p:mb-[20px]
          prose-strong:font-bold prose-strong:text-[#191D24]
          [&_blockquote]:pl-[20px] [&_blockquote]:border-l-[5px] [&_blockquote]:border-[#B3E653] [&_blockquote]:my-[24px] [&_blockquote]:not-italic
          [&_blockquote]:text-[18px] [&_blockquote]:font-semibold [&_blockquote]:text-[#191D24] [&_blockquote]:leading-[1.5]
          [&_blockquote_p]:mb-0
          [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:pl-6 [&_ul]:pl-6
          break-words [overflow-wrap:anywhere]"
        dangerouslySetInnerHTML={{ __html: (post.content || "").replace(/&nbsp;| /g, " ") }}
      />

      {/* Author card */}
      <div className="bg-white border border-[rgba(25,29,36,0.08)] rounded-[20px] p-[24px] md:p-[28px] mb-[52px]">
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

      {/* Related essays */}
      {allRelated.length > 0 && (
        <div className="mb-[52px]">
          <h2 className="text-[22px] md:text-[24px] font-bold font-noto-sans text-[#191D24] tracking-[-0.48px] mb-[22px]">
            More sample essays
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
            {allRelated.slice(0, 6).map((essay) => {
              const essayIsPro = Boolean(essay.pro_user_only);
              return (
                <EssayCard
                  key={essay.id}
                  essay={essay}
                  isPro={essayIsPro}
                  isLocked={essayIsPro && !viewerIsPro}
                  fallbackImage={fallbackImage}
                />
              );
            })}
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
    </>
  );
};
