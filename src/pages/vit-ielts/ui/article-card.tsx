import Link from "next/link";
import dayjs from "dayjs";
import { ProBadge } from "@/shared/ui/pro-badge";
import { skillLabel } from "./skills";
import type { Post } from "~services/types/database";

/**
 * Blog article card — Figma "Article Card" (node 3514:124).
 * Gradient image area (160px) with skill tag chip, title, excerpt,
 * divider, read-time / date meta.
 */

// Skill → gradient mapping, matching Figma color ramps
const SKILL_GRADIENTS: Record<string, string> = {
  reading:   "linear-gradient(155deg, #7ac94a 14%, #a6e35e 86%)",
  writing:   "linear-gradient(155deg, #7ac94a 14%, #a6e35e 86%)",
  speaking:  "linear-gradient(155deg, #7c6ef9 14%, #a89cff 86%)",
  listening: "linear-gradient(155deg, #5281f9 14%, #7ca1ff 86%)",
};

const DEFAULT_GRADIENT = "linear-gradient(155deg, #5281f9 14%, #7ca1ff 86%)";

export const ArticleCard = ({ post, href }: { post: Post; href: string }) => {
  const label = skillLabel(post.skill);
  const gradient = SKILL_GRADIENTS[post.skill ?? ""] ?? DEFAULT_GRADIENT;
  const date = post.published_at ? dayjs(post.published_at).format("MMM YYYY") : "";
  // Estimate read time: ~200 words/min, use excerpt length as rough proxy
  const wordCount = ((post.excerpt || "") + " " + post.title).split(/\s+/).length;
  const readMin = Math.max(3, Math.ceil(wordCount / 30)); // keep at least 3 min

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[24px] bg-[#ffffff] border border-[rgba(25,29,36,0.1)] shadow-[0px_6px_18px_0px_rgba(0,0,0,0.06)] hover:shadow-[0px_10px_28px_0px_rgba(0,0,0,0.12)] transition-shadow"
    >
      {/* Image area with gradient + skill tag */}
      <div
        className="relative flex h-[160px] shrink-0 items-start overflow-hidden pl-4 pt-4"
        style={{ background: gradient }}
      >
        {post.pro_user_only && (
          <ProBadge className="absolute right-3 top-3 shadow-sm" />
        )}
        {label && (
          <div className="flex items-center overflow-hidden rounded-full bg-[#ffffff] px-[10px] py-[5px]">
            <span className="font-inter text-[11px] font-bold tracking-[0.44px] text-[#191d24] whitespace-nowrap uppercase">
              {label}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-[10px] bg-[#ffffff] p-6">
        <h3 className="font-display text-[19px] font-bold leading-[1.3] text-[#191d24] line-clamp-2">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="font-inter text-[14px] font-normal leading-[1.45] text-[#6a7282] line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="h-px w-full bg-[rgba(25,29,36,0.1)]" />

        <p className="font-inter text-[13px] font-normal text-[#6a7282]">
          {readMin} min read{date ? ` · ${date}` : ""}
        </p>
      </div>
    </Link>
  );
};
