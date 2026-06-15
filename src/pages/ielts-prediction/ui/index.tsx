import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/routes";
import { Container } from "@/shared/ui";
import { FilterDropdown } from "@/shared/ui/ds/molecules/filter-dropdown";
import type { Post } from "~services/types/database";
import type { PracticeLibraryBannerConfig } from "./types";
import { ArticleCard } from "./article-card";
import { FeaturedArticle } from "./featured-article";
import { SkillCarousel } from "./skill-carousel";
import { SKILL_ORDER, SKILL_META } from "./skills";
import type { SkillFilter } from "./blog-sidebar";

interface PageProps {
  bannerConfig: PracticeLibraryBannerConfig;
  initialPosts: {
    data: Post[];
    count: number;
    pageSize: number;
  };
  /** Breadcrumb label under the hero (e.g. "IELTS Prediction" or "Blog"). */
  breadcrumbLabel?: string;
}

const DEFAULT_SECTION_CAP = 3;

// ── Newsletter CTA Banner ────────────────────────────────────────────────────
const NewsletterBanner = () => {
  const [email, setEmail] = useState("");
  return (
    <div className="flex flex-col gap-5 overflow-hidden rounded-[24px] bg-[#b3e653] px-8 py-7 shadow-[0px_6px_18px_0px_rgba(0,0,0,0.05)] lg:h-[120px] lg:flex-row lg:items-center lg:justify-between lg:py-0">
      <div className="flex flex-col gap-2">
        <p className="font-display text-[20px] font-bold leading-[1.08] tracking-[-0.44px] text-[#191d24] lg:text-[22px]">
          Get a new strategy in your inbox each week
        </p>
        <p className="font-inter text-[14px] font-medium text-[#33421a]">
          Join 28,000+ students. No spam, unsubscribe anytime.
        </p>
      </div>
      <div className="flex items-center gap-[10px]">
        <div className="flex h-12 flex-1 items-center overflow-hidden rounded-full bg-[#ffffff] pl-5 lg:w-[280px] lg:flex-none">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-transparent font-inter text-[14px] text-[#6a7282] outline-none placeholder:text-[#6a7282]"
          />
        </div>
        <button
          type="button"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#191d24] px-5 font-inter text-[14px] font-bold text-white transition-opacity hover:opacity-80 lg:w-[150px] lg:px-4"
        >
          Subscribe
        </button>
      </div>
    </div>
  );
};

// ── Section header (for skill group sections) ─────────────────────────────────
const SectionHeader = ({
  label,
  onSeeMore,
}: {
  label: string;
  onSeeMore?: () => void;
}) => (
  <div className="mb-6 flex items-center justify-between border-b border-[#e5e6e8] pb-3">
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 rounded bg-[#b3e653]" />
      <h2 className="font-display text-[24px] font-bold text-[#191d24]">{label}</h2>
    </div>
    {onSeeMore && (
      <button
        type="button"
        onClick={onSeeMore}
        className="inline-flex cursor-pointer items-center gap-0 rounded-md bg-[#f2fadd] py-1 pl-3 pr-1 font-inter text-[12px] font-semibold text-[#191d24] transition-opacity hover:opacity-80"
      >
        See more
        <span className="material-symbols-rounded text-[14px]">chevron_right</span>
      </button>
    )}
  </div>
);

export const PageIELTSPrediction = ({
  bannerConfig,
  initialPosts,
  breadcrumbLabel = "Vit IELTS",
}: PageProps) => {
  const posts = useMemo(() => initialPosts.data || [], [initialPosts.data]);
  const bannerData = bannerConfig.reading || bannerConfig.listening;

  const router = useRouter();

  // ── Skill filter via URL (?skill=...) ───────────────────────────────────────
  const skillParam = router.query.skill;
  const skill: SkillFilter =
    typeof skillParam === "string" && (SKILL_ORDER as readonly string[]).includes(skillParam)
      ? (skillParam as SkillFilter)
      : "all";

  const changeSkill = (next: SkillFilter) => {
    const query = { ...router.query };
    if (next === "all") delete query.skill;
    else query.skill = next;
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  // Scroll to top on skill filter change (after initial mount)
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [skill]);

  // ── Keyword filter state ────────────────────────────────────────────────────
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // ── Popular keywords ────────────────────────────────────────────────────────
  const MAX_KEYWORDS = 8;
  const popularKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags || []) {
        if (!tag) continue;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYWORDS)
      .map(([tag]) => tag);
  }, [posts]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const isFiltering = skill !== "all" || selectedKeywords.length > 0;

  const matchesFilters = (post: Post) => {
    if (skill !== "all" && post.skill !== skill) return false;
    if (
      selectedKeywords.length > 0 &&
      !(post.tags || []).some((t) => selectedKeywords.includes(t))
    ) {
      return false;
    }
    return true;
  };

  const filtered = useMemo(
    () => posts.filter(matchesFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, skill, selectedKeywords],
  );

  const featured = useMemo(
    () => posts.find((p) => p.is_featured) || posts[0] || null,
    [posts],
  );

  // Group (filtered) posts by skill
  const sections = useMemo(() => {
    return SKILL_ORDER.map((key) => ({
      key,
      label: SKILL_META[key].label,
      posts: filtered.filter((p) => p.skill === key),
    })).filter((s) => s.posts.length > 0);
  }, [filtered]);

  const showFeatured = !isFiltering && featured;

  const clearAll = () => {
    setSelectedKeywords([]);
    changeSkill("all");
  };

  const href = (post: Post) => ROUTES.PREDICTION.SINGLE(post.slug);

  // ── Category options for the FilterDropdown ─────────────────────────────────
  const categoryOptions = [
    ...SKILL_ORDER.map((s) => ({ value: s, label: SKILL_META[s].label })),
  ];

  // ── Keyword options for FilterDropdown ──────────────────────────────────────
  const keywordOptions = popularKeywords.map((kw) => ({ value: kw, label: kw }));

  // Derive selected skill(s) array for FilterDropdown (Category)
  const selectedSkills = skill === "all" ? [] : [skill];

  const handleCategoryChange = (values: string[]) => {
    // Pick the last-selected skill, or "all" when cleared
    const last = values[values.length - 1];
    changeSkill((last as SkillFilter) ?? "all");
  };

  // Page heading from bannerConfig
  const pageTitle = bannerData.title || breadcrumbLabel;

  return (
    <div className="min-h-screen bg-[#f6f7f4] pb-20">
      <Container>
        <div className="flex flex-col gap-7 pt-10">
          {/* ── Top header ───────────────────────────────────────────────────── */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-[10px]">
              <p className="font-inter text-[15px] font-semibold text-[#191d24]">
                {pageTitle}
              </p>
              <h1 className="font-display text-[38px] font-bold leading-[1.08] tracking-[-0.76px] text-[#191d24]">
                IELTS tips &amp; strategies
              </h1>
              <p className="font-inter text-[16px] font-normal text-[#6a7282]">
                Study guides, band-score breakdowns and exam-day advice from our teachers.
              </p>
            </div>
          </div>

          {/* ── Filter chips row ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-[10px] flex-wrap">
            <FilterDropdown
              label="Category"
              heading="CATEGORY"
              options={categoryOptions}
              selected={selectedSkills}
              onChange={handleCategoryChange}
            />
            {keywordOptions.length > 0 && (
              <FilterDropdown
                label="Keywords"
                heading="KEYWORDS"
                options={keywordOptions}
                selected={selectedKeywords}
                onChange={setSelectedKeywords}
              />
            )}
            {/* Sort chip — visual only, no sort logic in current data layer */}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(25,29,36,0.1)] bg-[#ffffff] pl-4 pr-[14px] py-[10px] font-inter text-[14px] font-semibold text-[#191d24] transition-colors"
            >
              <span className="whitespace-nowrap">Sort: Newest</span>
              <img
                src="/assets/icons/CaretDown.svg"
                width={16}
                height={16}
                alt=""
              />
            </button>
          </div>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-12">
            {/* Featured */}
            {showFeatured && featured && (
              <FeaturedArticle post={featured} href={href(featured)} />
            )}

            {/* Skill sections */}
            {sections.length > 0 ? (
              sections.map((section) => {
                const useCarousel =
                  skill === "all" && section.posts.length > DEFAULT_SECTION_CAP;
                return (
                  <section key={section.key}>
                    <SectionHeader
                      label={section.label}
                      onSeeMore={
                        skill === "all" ? () => changeSkill(section.key) : undefined
                      }
                    />
                    {useCarousel ? (
                      <SkillCarousel posts={section.posts} href={href} />
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {section.posts.map((post) => (
                          <ArticleCard key={post.id} post={post} href={href(post)} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#e5e6e8] bg-[#ffffff] px-6 py-16 text-center">
                <h3 className="font-display text-[20px] font-bold text-[#191d24]">
                  No articles found
                </h3>
                <p className="mt-2 font-inter text-[14px] text-[#6a7282]">
                  Try removing some filters or searching with a different keyword.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 rounded-full bg-[#b3e653] px-5 py-2.5 font-inter text-[14px] font-bold text-[#191d24] hover:bg-[#9ad534] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Newsletter CTA */}
            <NewsletterBanner />
          </div>
        </div>
      </Container>
    </div>
  );
};
