import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { Button } from "@/shared/ui/ds";
import { TestCardWithScore } from "@/entities/practice-test";
import { useProContentModal } from "@/shared/ui/pro-content";
import { SEOHeader } from "@/widgets";
import { AppShell } from "@/widgets/layouts";
import { decode } from "html-entities";
import Image from "next/image";
import Link from "next/link";
import { IPracticeSingle } from "../api";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import { useState } from "react";
import {
  resolveContentImage,
  useContentImageFallback,
} from "@/shared/lib/content-image";
import { getMediaImage } from "@/shared/lib/media-image";

function skillChipStyle(skill: string): { bg: string; text: string } {
  const s = skill.toLowerCase();
  if (s === "listening") return { bg: "#5281F9", text: "white" };
  if (s === "speaking") return { bg: "#7C6EF9", text: "white" };
  if (s === "reading") return { bg: "#7AC94A", text: "#191D24" };
  return { bg: "#B3E653", text: "#191D24" }; // writing / default
}

function skillLabel(skill: string): string {
  const map: Record<string, string> = {
    writing: "Writing",
    speaking: "Speaking",
    listening: "Listening",
    reading: "Reading",
  };
  return map[skill.toLowerCase()] ?? skill.charAt(0).toUpperCase() + skill.slice(1);
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

export function PageVitIELTSSingle({ post }: { post: IPracticeSingle }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const [copied, setCopied] = useState(false);
  const fallbackImage = useContentImageFallback();

  const actionHref = currentUser
    ? ROUTES.TAKE_THE_TEST(post.slug)
    : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug));

  const requiresUpgrade =
    post.quizFields.proUserOnly && !currentUser?.userData?.isPro;

  const handleStartPractice = (e: React.MouseEvent) => {
    if (requiresUpgrade) {
      e.preventDefault();
      if (!currentUser) {
        window.location.href = ROUTES.LOGIN(ROUTES.PREDICTION.SINGLE(post.slug));
        return;
      }
      openProContentModal();
    }
  };

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

  const skill = post.quizFields.skill[0];
  const label = skillLabel(skill);
  const chip = skillChipStyle(skill);
  const authorName = post.author.node.name || "VitIELTS";
  const authorSrc = post.author.node.userData.avatar?.node.sourceUrl;
  const initials = getInitials(authorName);
  const avatarColor = avatarBg(authorName);

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
          href={ROUTES.EXAM.ARCHIVE}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#9AD534] hover:opacity-75 transition-opacity no-underline"
        >
          <span className="material-symbols-rounded text-[18px] leading-none">arrow_back</span>
          Back to IELTS {label} Prediction
        </Link>
      </div>

      {/* Article header */}
      <div className="space-y-[16px] mb-[28px]">
        <span
          className="inline-flex items-center text-[13px] font-bold px-[14px] py-[7px] rounded-full"
          style={{ backgroundColor: chip.bg, color: chip.text }}
        >
          IELTS {label.toUpperCase()} PREDICTION
        </span>
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
              {post.date ? new Date(post.date).toLocaleDateString("vi-VN") : ""}
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
        <div className="relative rounded-[24px] overflow-hidden h-[240px] md:h-[360px] lg:h-[420px] w-full mb-[32px]">
          <Image
            src={getMediaImage(resolveContentImage(post.featuredImage.node.sourceUrl, fallbackImage), { width: 1200 })}
            alt={post.featuredImage.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Overview */}
      {post.excerpt && (
        <div className="bg-white rounded-[20px] border border-[rgba(25,29,36,0.08)] p-[24px] md:p-[28px] mb-[20px]">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <span className="material-symbols-rounded text-[20px] text-[#191D24] leading-none">info</span>
            <h3 className="text-[17px] font-bold text-[#191D24]">Overview</h3>
          </div>
          <div
            className="prose max-w-none text-[15px] text-[#6A7282] leading-[1.65]"
            dangerouslySetInnerHTML={{ __html: post.excerpt }}
          />
        </div>
      )}

      {/* Start test CTA */}
      <div className="flex justify-center gap-4 py-[28px] mb-[8px]">
        <Button
          variant="primary"
          href={requiresUpgrade ? undefined : actionHref}
          onClick={requiresUpgrade ? handleStartPractice : undefined}
          className="min-w-[200px] !rounded-full px-10 py-3 h-auto text-base font-bold"
          leftIcon={
            <span className="material-symbols-rounded text-[20px] leading-none">play_circle</span>
          }
        >
          Start practice test
        </Button>
      </div>

      {/* Download PDF (hidden when unavailable — preserving logic) */}
      {false && post.quizFields.pdf?.node?.mediaItemUrl && (
        <div className="bg-white rounded-[20px] border border-[rgba(25,29,36,0.08)] p-[24px] md:p-[28px] mb-[20px]">
          <a
            href={post.quizFields.pdf?.node?.mediaItemUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 text-[#191D24] no-underline hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-rounded text-[22px]">picture_as_pdf</span>
            <span className="text-[15px] font-semibold">{post.title}</span>
          </a>
        </div>
      )}

      {/* More prediction tests */}
      {(post.relatedPracticeQuizzes?.length ?? 0) > 0 && (
        <div className="mt-[12px] mb-[48px]">
          <h2 className="text-[22px] md:text-[24px] font-bold font-noto-sans text-[#191D24] tracking-[-0.48px] mb-[22px]">
            More {label} prediction tests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
            {post.relatedPracticeQuizzes!.slice(0, 8).map((quiz, i) => (
              <TestCardWithScore
                key={quiz.databaseId}
                quizId={String(quiz.databaseId)}
                title={quiz.title}
                image={quiz.featuredImage || undefined}
                skill={skill}
                part={normalizeSectionBadge(skill, i + 1).label}
                isPro={post.quizFields.proUserOnly}
                href={ROUTES.PREDICTION.SINGLE(quiz.slug)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

PageVitIELTSSingle.Layout = AppShell;
