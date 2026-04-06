import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import _ from "lodash";
import { createClient } from "~supabase/client";
import { TestCard } from "@/shared/ui/ds";
import type { Post } from "~services/types/database";
import { getPosts } from "~services/post";
import dayjs from "dayjs";
import { Container } from "@/shared/ui";
import type { PracticeLibraryBannerConfig } from "./types";
import { Filter } from "./filter";
import { HeroSection } from "./hero-section";

export type FilterFormValues = {
  sort: "newest" | "oldest" | "a-z" | "z-a";
  search: string;
  page: number;
  size: number;
};

const PAGE_SIZE = 9;

const DEFAULT_VALUES: FilterFormValues = {
  sort: "newest",
  search: "",
  page: 1,
  size: PAGE_SIZE,
};

const SORT_OPTIONS: Array<{ label: string; value: FilterFormValues["sort"] }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A-Z", value: "a-z" },
  { label: "Z-A", value: "z-a" },
];

const createQueryPayload = (values: FilterFormValues) => {
  const query: Record<string, string> = {};

  if (values.sort !== "newest") query.sort = values.sort;
  if (values.search) query.search = values.search;
  if (values.page > 1) query.page = String(values.page);
  if (values.size !== PAGE_SIZE) query.size = String(values.size);

  return query;
};

const getSingleQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const buildPages = (current: number, total: number) => {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);
};

export const PageIELTSPrediction = ({
  bannerConfig,
}: {
  bannerConfig: PracticeLibraryBannerConfig;
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState<any>(null);
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

  const bannerData = bannerConfig.reading || bannerConfig.listening;

  const getData = useCallback(async (params: Record<string, unknown>) => {
    setLoading(true);
    setCalled(true);

    try {
      const supabase = createClient();
      const pagination = params.offsetPagination as { offset: number; size: number } | undefined;
      const page = pagination ? Math.floor(pagination.offset / pagination.size) + 1 : 1;
      const pageSize = pagination?.size || PAGE_SIZE;

      setCurrentPageSize(pageSize);

      const result = await getPosts(supabase, {
        category: "IELTS Prediction",
        search: (params.search as string) || undefined,
        page,
        pageSize,
      });

      setData({
        posts: {
          edges: (result.data || []).map((post: Post) => ({
            node: post,
          })),
          pageInfo: {
            offsetPagination: {
              total: result.count || 0,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    reset({
      sort: (getSingleQueryValue(router.query.sort) as FilterFormValues["sort"]) || "newest",
      search: getSingleQueryValue(router.query.search),
      page: Number(getSingleQueryValue(router.query.page) || 1),
      size: Number(getSingleQueryValue(router.query.size) || PAGE_SIZE),
    });
  }, [reset, router.isReady, router.query]);

  useEffect(() => {
    const size = Number(getSingleQueryValue(router.query.size) || PAGE_SIZE);
    const page = Number(getSingleQueryValue(router.query.page) || 1);
    const offset = (page - 1) * size;
    const params: Record<string, unknown> = {
      search: getSingleQueryValue(router.query.search),
      offsetPagination: { offset, size },
      skill,
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
      sort: (getSingleQueryValue(router.query.sort) as FilterFormValues["sort"]) || "newest",
      search: getSingleQueryValue(router.query.search),
      page: Number(getSingleQueryValue(router.query.page) || 1),
      size: Number(getSingleQueryValue(router.query.size) || PAGE_SIZE),
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

  const items = data?.posts?.edges ?? [];

  const currentPage = Number(getSingleQueryValue(router.query.page) || 1);
  const total = data?.posts?.pageInfo.offsetPagination.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
  const visiblePages = buildPages(currentPage, totalPages);
  const handleSortChange = (nextSort: FilterFormValues["sort"]) => {
    setValue("sort", nextSort, { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-white pb-20">
        <HeroSection
          title={bannerData.title}
          skillLabel="IELTS Prediction"
        />

        <Container className="mt-12 px-0">
          {/* === SECTION: IELTS Practice === */}
          <section id="ipl-practice" data-section="ipl-practice">
            <div className="mb-10 flex flex-col gap-6">
              <h2 className="font-noto-sans text-3xl font-extrabold text-[#2D3142]">
                IELTS Prediction
              </h2>
              
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-end">

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

            <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-[80px] xl:gap-[100px]">
              <aside className="hidden lg:block">
                <div className="sticky top-[100px]">
                  <Filter />
                </div>
              </aside>

              <div className="space-y-10">
                {loading ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[400px] w-full max-w-[356px] animate-pulse rounded-[30px] bg-black/5"
                      />
                    ))}
                  </div>
                ) : items.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map(({ node }: { node: Post }, index: number) => (
                      <TestCard
                        key={node.id || index}
                        image={node.featured_image || undefined}
                        title={node.title}
                        subtitle={node.published_at ? dayjs(node.published_at).format("DD/MM/YYYY") : undefined}
                        actionText="Chi tiết"
                        href={`/${node.slug}`}
                      />
                    ))}
                  </div>
                ) : called ? (
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
                ) : null}

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-[8px] pt-4">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setValue("page", Math.max(1, currentPage - 1), { shouldDirty: true })
                      }
                      className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
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
                            onClick={() => setValue("page", page, { shouldDirty: true })}
                            className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-base font-semibold transition ${
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
                      onClick={() =>
                        setValue("page", Math.min(totalPages, currentPage + 1), {
                          shouldDirty: true,
                        })
                      }
                      className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
                    >
                      <span className="material-symbols-rounded text-xl">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </Container>

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
              <Filter mobile onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};
