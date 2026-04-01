import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import _ from "lodash";
import { createClient } from "~supabase/client";
import { getQuizzes } from "~services/quiz";
import type { Quiz, SkillType } from "~services/types/database";
import { Container } from "@/shared/ui";
import { IPracticeTest, IPracticeTestResponses } from "@/entities/practice-test";
import { QuizLibraryNav } from "@/widgets";
import type { PracticeLibraryBannerConfig } from "./types";
import { Filter } from "./filter";
import { HeroSection } from "./hero-section";
import { PracticeCard } from "./practice-card";

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

const DEFAULT_VALUES: FilterFormValues = {
  progress: "" as FilterFormValues["progress"],
  question_form: [],
  sort: "newest",
  search: "",
  page: 1,
  size: PAGE_SIZE,
  quarter: "",
  year: "",
  source: "",
  part: "",
};

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

export const PageIELTSPracticeLibrary = ({
  quizFilterData,
  bannerConfig,
}: {
  quizFilterData: {
    years: Array<string>;
    sources: Array<string>;
    parts: Array<string>;
  };
  bannerConfig: PracticeLibraryBannerConfig;
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState<IPracticeTestResponses | null>(null);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(PAGE_SIZE);
  const router = useRouter();

  const methods = useForm<FilterFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

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

  const getData = useCallback(async (params: Record<string, unknown>) => {
    setLoading(true);
    setCalled(true);

    try {
      const supabase = createClient();
      const pagination = params.offsetPagination as { offset: number; size: number } | undefined;
      const page = pagination ? Math.floor(pagination.offset / pagination.size) + 1 : 1;
      const pageSize = pagination?.size || PAGE_SIZE;

      setCurrentPageSize(pageSize);

      const result = await getQuizzes(supabase, {
        skill: (params.skill as SkillType) || undefined,
        search: (params.search as string) || undefined,
        source: (params.source as string) || undefined,
        part: (params.part as string) || undefined,
        quarter: (params.quarter as string) || undefined,
        year: (params.year as string) || undefined,
        questionForm: ((params.question_form as string[]) || []).join(",") || undefined,
        page,
        pageSize,
      });

      const edges: Array<{ node: IPracticeTest }> = (result.data || []).map((quiz: Quiz) => ({
        node: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          featuredImage: quiz.featured_image
            ? { node: { sourceUrl: quiz.featured_image, altText: quiz.title } }
            : undefined,
          quizFields: {
            skill: [quiz.skill, quiz.skill] as IPracticeTest["quizFields"]["skill"],
            type: [
              quiz.type === "exam" ? "practice" : quiz.type,
              quiz.type === "exam" ? "practice" : quiz.type,
            ] as IPracticeTest["quizFields"]["type"],
            passages: [],
            part: quiz.part || "0",
            quarter: quiz.quarter || "",
            source: quiz.source || "",
            year: quiz.year || "",
            testsTaken: quiz.tests_taken || 0,
            proUserOnly: quiz.pro_user_only || false,
          },
        },
      }));

      setData({
        quizzes: {
          edges,
          pageInfo: {
            offsetPagination: {
              total: result.count || 0,
            },
          },
        },
      } as IPracticeTestResponses);
    } catch (error) {
      console.error("Error fetching practice tests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    const size = Number(getSingleQueryValue(router.query.size) || PAGE_SIZE);
    const page = Number(getSingleQueryValue(router.query.page) || 1);
    const offset = (page - 1) * size;
    const params: Record<string, unknown> = {
      search: getSingleQueryValue(router.query.search),
      offsetPagination: { offset, size },
      question_form: getArrayQueryValue(router.query.question_form),
      skill,
      source: getSingleQueryValue(router.query.source),
      part: getSingleQueryValue(router.query.part),
      quarter: getSingleQueryValue(router.query.quarter),
      year: getSingleQueryValue(router.query.year),
    };

    switch (getSingleQueryValue(router.query.sort) || "newest") {
      case "oldest":
        _.set(params, "orderby", [{ field: "DATE", order: "ASC" }]);
        break;
      case "a-z":
        _.set(params, "orderby", [{ field: "TITLE", order: "ASC" }]);
        break;
      case "z-a":
        _.set(params, "orderby", [{ field: "TITLE", order: "DESC" }]);
        break;
      default:
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
    }

    getData(params);
  }, [getData, router.query, skill]);

  const values = watch();

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

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [getValues, isDirty, router, values]);

  const items = data?.quizzes.edges ?? [];
  const suggestions = items.slice(0, 4);
  const currentPage = Number(getSingleQueryValue(router.query.page) || 1);
  const total = data?.quizzes.pageInfo.offsetPagination.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
  const visiblePages = buildPages(currentPage, totalPages);
  const handleSortChange = (nextSort: FilterFormValues["sort"]) => {
    setValue("sort", nextSort, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-white">
        <HeroSection
          title={bannerData.title}
          skillLabel={skill === "reading" ? "Reading" : "Listening"}
        />

        <section className="bg-[var(--color-default)] pb-16 pt-8 sm:pb-20">
          <Container className="space-y-10 py-0 sm:space-y-12">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">
                    Suggestions for you
                  </p>
                  <h2 className="mt-2 font-[var(--font-noto-sans)] text-2xl font-extrabold text-white sm:text-3xl">
                    Hand-picked practice sets
                  </h2>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[22rem] animate-pulse rounded-[28px] bg-white/10"
                      />
                    ))
                  : suggestions.map(({ node }, index) => (
                      <PracticeCard key={node.id || index} item={node} priority={index < 2} />
                    ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  <Link href="/" className="transition-colors hover:text-white">
                    Home
                  </Link>
                  <span>/</span>
                  <span>IELTS Practice Library</span>
                  <span>/</span>
                  <span className="text-secondary-400">
                    {skill === "reading" ? "Reading" : "Listening"}
                  </span>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-3">
                    <h2 className="font-[var(--font-noto-sans)] text-3xl font-extrabold text-white sm:text-4xl">
                      IELTS {_.capitalize(skill)} Practice
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                      {bannerData.description.line1} {bannerData.description.line2}{" "}
                      {bannerData.description.line3}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/12 lg:hidden"
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
                        className="w-full appearance-none rounded-full border border-white/15 bg-white/8 px-5 py-3 pr-11 text-sm font-semibold text-white outline-none transition hover:bg-white/12"
                      >
                        {SORT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="text-black">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-rounded pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </div>
                </div>

                <QuizLibraryNav />
              </div>

              <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                  <div className="sticky top-6">
                    <Filter filterData={quizFilterData} />
                  </div>
                </aside>

                <div className="space-y-6">
                  {loading ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <div
                          key={index}
                          className="h-[22rem] animate-pulse rounded-[28px] bg-white/10"
                        />
                      ))}
                    </div>
                  ) : items.length ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map(({ node }, index) => (
                        <PracticeCard key={node.id || index} item={node} />
                      ))}
                    </div>
                  ) : called ? (
                    <div className="rounded-[32px] border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/40">
                        No results
                      </p>
                      <h3 className="mt-3 font-[var(--font-noto-sans)] text-2xl font-extrabold text-white">
                        No practice tests matched the current filters.
                      </h3>
                      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/60">
                        Clear a few filters or search with a broader keyword to explore more test pages.
                      </p>
                    </div>
                  ) : null}

                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() =>
                          setValue("page", Math.max(1, currentPage - 1), { shouldDirty: true })
                        }
                        className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-35 hover:bg-white/12"
                      >
                        Prev
                      </button>
                      {visiblePages.map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setValue("page", page, { shouldDirty: true })}
                          className={`h-11 min-w-11 rounded-full px-4 text-sm font-bold transition ${
                            page === currentPage
                              ? "bg-primary text-white shadow-[0_12px_30px_rgba(217,74,86,0.28)]"
                              : "border border-white/15 bg-white/8 text-white hover:bg-white/12"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                          setValue("page", Math.min(totalPages, currentPage + 1), {
                            shouldDirty: true,
                          })
                        }
                        className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-35 hover:bg-white/12"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 bg-default/70 lg:hidden">
            <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-[var(--color-default)] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/40">
                    Filters
                  </p>
                  <h3 className="mt-2 font-[var(--font-noto-sans)] text-2xl font-extrabold text-white">
                    Refine results
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white"
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
