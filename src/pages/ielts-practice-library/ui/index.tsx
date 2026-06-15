import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { Quiz } from "~services/types/database";
import { Container } from "@/shared/ui";
import { IPracticeTest } from "@/entities/practice-test";
import { QuizLibraryNav } from "@/widgets";
import type { PracticeLibraryBannerConfig } from "./types";
import { Filter } from "./filter";
import { HeroSection } from "./hero-section";
import { PracticeCard } from "./practice-card";
import { getQuizThumbnail } from "@/shared/lib/content-image";

export type FilterFormValues = {
  progress: "pending" | "completed" | "in-progress";
  question_form: string[];
  sort: "newest" | "oldest" | "popular" | "a-z" | "z-a";
  search: string;
  page: number;
  size: number;
  quarter: string;
  year: string;
  source: string;
  part: string;
};

const PAGE_SIZE = 9;

const SORT_OPTIONS: Array<{ label: string; value: FilterFormValues["sort"] }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Popular", value: "popular" },
  { label: "A-Z", value: "a-z" },
  { label: "Z-A", value: "z-a" },
];

const getSingleQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const getArrayQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => item.split(",")).filter(Boolean);
  }
  return value ? value.split(",").filter(Boolean) : [];
};

const createQueryPayload = (values: FilterFormValues) => {
  const query: Record<string, string> = {};

  if (values.sort !== "newest") query.sort = values.sort;
  if (values.search) query.search = values.search;
  if (values.page > 1) query.page = String(values.page);
  if (values.size !== PAGE_SIZE) query.size = String(values.size);
  if (values.quarter) query.quarter = values.quarter;
  if (values.year) query.year = values.year;
  if (values.source) query.source = values.source;
  if (values.part) query.part = values.part;
  if (values.progress) query.progress = values.progress;
  if (values.question_form.length) query.question_form = values.question_form.join(",");

  return query;
};

const buildPages = (current: number, total: number) => {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);
};

const mapQuizToEdge = (quiz: Quiz): { node: IPracticeTest } => ({
  node: {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    featuredImage: { node: { sourceUrl: getQuizThumbnail(quiz.id), altText: quiz.title } },
    quizFields: {
      skill: [quiz.skill, quiz.skill] as IPracticeTest["quizFields"]["skill"],
      type: [quiz.type, quiz.type] as IPracticeTest["quizFields"]["type"],
      passages: [],
      part: quiz.part || "0",
      quarter: quiz.quarter || "",
      source: quiz.source || "",
      year: quiz.year || "",
      testsTaken: quiz.tests_taken || 0,
      proUserOnly: quiz.pro_user_only || false,
    },
  },
});

interface PageProps {
  quizFilterData: {
    years: Array<string>;
    sources: Array<string>;
    parts: Array<string>;
  };
  bannerConfig: PracticeLibraryBannerConfig;
  initialQuizzes: {
    data: Quiz[];
    count: number;
    pageSize: number;
  };
}

export const PageIELTSPracticeLibrary = ({
  quizFilterData,
  bannerConfig,
  initialQuizzes,
}: PageProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  const initialValues = useMemo<FilterFormValues>(
    () => ({
      progress: getSingleQueryValue(router.query.progress) as FilterFormValues["progress"],
      question_form: getArrayQueryValue(router.query.question_form),
      sort: (getSingleQueryValue(router.query.sort) as FilterFormValues["sort"]) || "newest",
      search: getSingleQueryValue(router.query.search),
      page: Number(getSingleQueryValue(router.query.page) || 1),
      size: Number(getSingleQueryValue(router.query.size) || PAGE_SIZE),
      quarter: getSingleQueryValue(router.query.quarter),
      year: getSingleQueryValue(router.query.year),
      source: getSingleQueryValue(router.query.source),
      part: getSingleQueryValue(router.query.part),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const methods = useForm<FilterFormValues>({ defaultValues: initialValues });

  const {
    watch,
    reset,
    setValue,
    getValues,
    formState: { isDirty },
  } = methods;

  const skill = useMemo(() => {
    const routeSkill = router.pathname.split("/").pop();
    return routeSkill === "listening" ? "listening" : "reading";
  }, [router.pathname]);

  const bannerData = skill === "listening" ? bannerConfig.listening : bannerConfig.reading;

  // Skeleton during SSR navigation
  useEffect(() => {
    const start = (url: string) => {
      if (url.split("?")[0] === router.pathname) setNavigating(true);
    };
    const end = () => setNavigating(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
    };
  }, [router.events, router.pathname]);

  // Sync form ← URL (handles back/forward + resets isDirty after our pushes)
  useEffect(() => {
    if (!router.isReady) return;
    reset({
      progress: getSingleQueryValue(router.query.progress) as FilterFormValues["progress"],
      question_form: getArrayQueryValue(router.query.question_form),
      sort: (getSingleQueryValue(router.query.sort) as FilterFormValues["sort"]) || "newest",
      search: getSingleQueryValue(router.query.search),
      page: Number(getSingleQueryValue(router.query.page) || 1),
      size: Number(getSingleQueryValue(router.query.size) || PAGE_SIZE),
      quarter: getSingleQueryValue(router.query.quarter),
      year: getSingleQueryValue(router.query.year),
      source: getSingleQueryValue(router.query.source),
      part: getSingleQueryValue(router.query.part),
    });
  }, [reset, router.isReady, router.query]);

  const values = watch();
  const valuesSignature = JSON.stringify(createQueryPayload(values));

  // Sync form → URL; non-shallow so SSR refetches with new filters
  useEffect(() => {
    if (!isDirty) return;

    const nextQuery = createQueryPayload(getValues());
    const currentQuery = createQueryPayload({
      progress: getSingleQueryValue(router.query.progress) as FilterFormValues["progress"],
      question_form: getArrayQueryValue(router.query.question_form),
      sort: (getSingleQueryValue(router.query.sort) as FilterFormValues["sort"]) || "newest",
      search: getSingleQueryValue(router.query.search),
      page: Number(getSingleQueryValue(router.query.page) || 1),
      size: Number(getSingleQueryValue(router.query.size) || PAGE_SIZE),
      quarter: getSingleQueryValue(router.query.quarter),
      year: getSingleQueryValue(router.query.year),
      source: getSingleQueryValue(router.query.source),
      part: getSingleQueryValue(router.query.part),
    });

    if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) return;

    router.push(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { scroll: false },
    );
  // Depend on the stringified query — watch() returns a fresh object on
  // every render, so depending on `values` directly would re-run this
  // effect each render and keep pushing while SSR navigation is in flight.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valuesSignature, isDirty]);

  const items = useMemo(
    () => (initialQuizzes.data || []).map(mapQuizToEdge),
    [initialQuizzes.data],
  );
  const suggestions = items.slice(0, 4);
  const currentPage = Number(getSingleQueryValue(router.query.page) || 1);
  const total = initialQuizzes.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / initialQuizzes.pageSize));
  const visiblePages = buildPages(currentPage, totalPages);
  const goToPage = (page: number) => {
    setValue("page", page, { shouldDirty: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleSortChange = (nextSort: FilterFormValues["sort"]) => {
    setValue("sort", nextSort, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-white pb-20">
        <HeroSection
          title={bannerData.title}
          skillLabel={skill === "reading" ? "Reading" : "Listening"}
        />

        <section className="mt-12">
        <Container>
          {/* === SECTION: Suggestions === */}
          <section id="ipl-suggestions" data-section="suggestions">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-noto-sans text-2xl font-bold text-[#2D3142]">
                Suggestions for you
              </h2>
              <div className="hidden sm:flex gap-2">
                <button
                  type="button"
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] text-[#2D3142] transition hover:bg-gray-50"
                  aria-label="Previous"
                >
                  <span className="material-symbols-rounded text-lg">chevron_left</span>
                </button>
                <button
                  type="button"
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] text-[#2D3142] transition hover:bg-gray-50"
                  aria-label="Next"
                >
                  <span className="material-symbols-rounded text-lg">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {navigating
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[234px] animate-pulse rounded-[30px] bg-black/5"
                    />
                  ))
                : suggestions.map(({ node }, index) => (
                    <PracticeCard key={node.id || index} item={node} priority={index < 2} />
                  ))}
            </div>
          </section>

          <hr className="my-14 border-t border-[rgba(0,0,0,0.06)]" />

          {/* === SECTION: IELTS Practice === */}
          <section id="ipl-practice" data-section="ipl-practice">
            <div className="mb-10 flex flex-col gap-6">
              <h2 className="font-noto-sans text-3xl font-extrabold text-[#2D3142]">
                IELTS Practice
              </h2>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <QuizLibraryNav />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-4 py-3 text-sm font-bold text-[#242938] transition hover:bg-gray-50 lg:hidden"
                  >
                    <span className="material-symbols-rounded text-base">tune</span>
                    Filter
                  </button>
                  <div className="relative min-w-[11rem]">
                    <select
                      value={values.sort}
                      onChange={(event) =>
                        handleSortChange(event.target.value as FilterFormValues["sort"])
                      }
                      className="w-full appearance-none rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-3 pr-11 text-sm font-semibold text-[#242938] outline-none transition hover:bg-gray-50"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-rounded pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#242938]/60">
                      keyboard_arrow_down
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-[60px] xl:gap-[80px]">
              <aside className="hidden lg:block">
                <div className="sticky top-[100px]">
                  <Filter filterData={quizFilterData} />
                </div>
              </aside>

              <div className="space-y-10">
                {navigating ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[234px] animate-pulse rounded-[30px] bg-black/5"
                      />
                    ))}
                  </div>
                ) : items.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {items.map(({ node }, index) => (
                      <PracticeCard key={node.id || index} item={node} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[30px] border border-dashed border-[rgba(0,0,0,0.1)] bg-[#FAF7EB]/50 px-6 py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#242938]/40">
                      No results
                    </p>
                    <h3 className="mt-3 font-noto-sans text-2xl font-extrabold text-[#242938]">
                      No practice tests matched the current filters.
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#242938]/60">
                      Clear a few filters or search with a broader keyword to explore more test pages.
                    </p>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-[8px] pt-4">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => goToPage(Math.max(1, currentPage - 1))}
                      className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition cursor-pointer disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
                    >
                      <span className="material-symbols-rounded text-xl">chevron_left</span>
                    </button>

                    {/* Page Numbers */}
                    {visiblePages.map((page, index, array) => {
                      const isGap = index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-[8px]">
                          {isGap && (
                            <div className="flex h-[32px] w-[32px] items-end justify-center pb-1 text-black/30 font-bold tracking-widest leading-none">
                              ...
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => goToPage(page)}
                            className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-base font-semibold transition cursor-pointer ${
                              page === currentPage
                                ? "bg-primary-500 text-white"
                                : "text-[#2D3142] hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                      className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition cursor-pointer disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
                    >
                      <span className="material-symbols-rounded text-xl">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </Container>
        </section>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
            <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2D3142]/40">
                    Filters
                  </p>
                  <h3 className="mt-1 font-noto-sans text-2xl font-extrabold text-[#2D3142]">
                    Refine results
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(0,0,0,0.1)] text-[#2D3142]"
                >
                  <span className="material-symbols-rounded">close</span>
                </button>
              </div>
              <Filter filterData={quizFilterData} mobile onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};
