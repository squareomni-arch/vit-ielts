import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { Container } from "@/shared/ui";
import { QuizLibraryNav, SEOHeader } from "@/widgets";
import { createClient } from "~supabase/client";
import { getExamCollections } from "~services/exam-collection";
import { ExamLibraryHeroBanner } from "./hero-banner";
import { Filter } from "./filter";
import { ExamItem } from "./exam-item";
import type { ExamLibraryHeroConfig } from "./types";
import type { IExamCollection, IExamCollectionResponse } from "../api";

export type FilterFormValues = {
  type: "all" | "academic" | "general";
  skill: "all" | "reading" | "listening";
  collection: string;
  sort: "newest" | "popular" | "high-ranking";
  search: string;
  page: number;
  size: number;
};

const PAGE_SIZE = 9;

const DEFAULT_VALUES: FilterFormValues = {
  type: "all",
  skill: "all",
  collection: "",
  sort: "newest",
  search: "",
  page: 1,
  size: PAGE_SIZE,
};

const SORT_OPTIONS: Array<{ label: string; value: FilterFormValues["sort"] }> = [
  { label: "Newest", value: "newest" },
  { label: "Popular", value: "popular" },
  { label: "High Ranking", value: "high-ranking" },
];

const buildPages = (current: number, total: number) => {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
};

interface PageIELTSExamLibraryProps {
  heroConfig: ExamLibraryHeroConfig;
}

type FlatExam = IExamCollection["data"]["reading"][number]["exams"][number] & {
  skill: "reading" | "listening";
  collectionTitle: string;
};

export const PageIELTSExamLibrary = ({ heroConfig }: PageIELTSExamLibraryProps) => {
  const router = useRouter();
  const methods = useForm<FilterFormValues>({ defaultValues: DEFAULT_VALUES });
  const {
    watch,
    setValue,
    formState: { isDirty },
  } = methods;

  const [data, setData] = useState<IExamCollectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const values = watch();

  const getData = useCallback(async (params: Record<string, unknown>) => {
    setLoading(true);
    setCalled(true);
    try {
      const supabase = createClient();
      const result = await getExamCollections(supabase, {
        type:
          params.type && params.type !== "all"
            ? (params.type as "academic" | "general")
            : undefined,
        search: (params.search as string) || undefined,
        page: 1,
        pageSize: 200,
      });
      setData({
        examCollection: {
          data: result.data,
          pageInfo: { total: result.pageInfo.total },
        },
      } as IExamCollectionResponse);
    } catch (error) {
      console.error("Error fetching exam collections:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync form ← router query
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    methods.reset({
      type: (q.type as FilterFormValues["type"]) || "all",
      skill: (q.skill as FilterFormValues["skill"]) || "all",
      collection: (q.collection as string) || "",
      sort: (q.sort as FilterFormValues["sort"]) || "newest",
      search: (q.search as string) || "",
      page: Number(q.page) || 1,
      size: PAGE_SIZE,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  // Fetch when relevant query params change
  useEffect(() => {
    if (!router.isReady) return;
    getData({
      type: router.query.type || "all",
      search: router.query.search || "",
    });
  }, [getData, router.isReady, router.query.type, router.query.search]);

  // Sync form → router query
  useEffect(() => {
    if (!isDirty) return;
    const q: Record<string, string> = {};
    if (values.type && values.type !== "all") q.type = values.type;
    if (values.skill && values.skill !== "all") q.skill = values.skill;
    if (values.collection) q.collection = values.collection;
    if (values.search) q.search = values.search;
    if (values.sort !== "newest") q.sort = values.sort;
    if (values.page > 1) q.page = String(values.page);

    const currentQ = JSON.stringify(router.query);
    const nextQ = JSON.stringify(q);
    if (currentQ === nextQ) return;

    router.replace({ pathname: router.pathname, query: q }, undefined, {
      shallow: true,
      scroll: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, isDirty]);

  // Flatten all exams from all collections, filtered by skill + collection
  const allExams = useMemo<FlatExam[]>(() => {
    if (!data?.examCollection?.data) return [];
    const reading = (data.examCollection.data.reading || []).flatMap((col) =>
      col.exams.map((exam) => ({
        ...exam,
        skill: "reading" as const,
        collectionTitle: col.title,
      }))
    );
    const listening = (data.examCollection.data.listening || []).flatMap((col) =>
      col.exams.map((exam) => ({
        ...exam,
        skill: "listening" as const,
        collectionTitle: col.title,
      }))
    );

    let merged: FlatExam[];
    const skill = values.skill || "all";
    if (skill === "reading") merged = reading;
    else if (skill === "listening") merged = listening;
    else merged = [...reading, ...listening];

    // Filter by collection
    if (values.collection) {
      merged = merged.filter((e) => e.collectionTitle === values.collection);
    }

    return merged;
  }, [data, values.skill, values.collection]);

  const currentPage = values.page || 1;
  const totalItems = allExams.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const visiblePages = buildPages(currentPage, totalPages);
  const pagedExams = allExams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Unique collection titles for filter sidebar
  const availableCollections = useMemo<string[]>(() => {
    if (!data?.examCollection?.data) return [];
    const readingCols = (data.examCollection.data.reading || []).map((c) => c.title);
    const listeningCols = (data.examCollection.data.listening || []).map((c) => c.title);
    const all = [...readingCols, ...listeningCols];
    return Array.from(new Set(all));
  }, [data]);

  return (
    <FormProvider {...methods}>
      <SEOHeader fullHead={""} title={"IELTS Exam Library"} />

      <div className="min-h-screen bg-white pb-20">
        <ExamLibraryHeroBanner config={heroConfig} />

        <Container className="mt-12 px-0">
          {/* === SECTION: Mock Tests === */}
          <section id="iel-main" data-section="iel-main">
            <div className="mb-10 flex flex-col gap-6">
              <h2 className="font-noto-sans text-3xl font-extrabold text-[#2D3142]">
                IELTS Mock Tests
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
                      onChange={(e) => {
                        setValue("sort", e.target.value as FilterFormValues["sort"], {
                          shouldDirty: true,
                        });
                        setValue("page", 1, { shouldDirty: true });
                      }}
                      className="w-full appearance-none rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-3 pr-11 text-sm font-semibold text-[#242938] outline-none transition hover:bg-gray-50"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
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
              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-[100px]">
                  <Filter collections={availableCollections} />
                </div>
              </aside>

              {/* Grid */}
              <div className="space-y-10">
                {loading ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <div key={i} className="h-[234px] animate-pulse rounded-[30px] bg-black/5" />
                    ))}
                  </div>
                ) : pagedExams.length ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {pagedExams.map((exam) => (
                      <ExamItem key={exam.id} item={exam} />
                    ))}
                  </div>
                ) : called ? (
                  <div className="rounded-[30px] border border-dashed border-[rgba(0,0,0,0.1)] bg-[#FAF7EB]/50 px-6 py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#242938]/40">
                      No results
                    </p>
                    <h3 className="mt-3 font-noto-sans text-2xl font-extrabold text-[#242938]">
                      No mock tests matched the current filters.
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#242938]/60">
                      Clear a few filters or search with a broader keyword to explore more tests.
                    </p>
                  </div>
                ) : null}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-[8px] pt-4">
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

        {/* Mobile Filter Drawer */}
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
              <Filter mobile collections={availableCollections} onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};
