import { useEffect, useMemo, useState } from "react";

import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { SEOHeader } from "@/widgets";
import { AppShell } from "@/widgets/layouts";
import { ExamLibraryHeroBanner } from "./hero-banner";
import { Filter } from "./filter";
import { ExamCollection } from "./exam-collection";
import type { ExamLibraryHeroConfig } from "./types";
import type { ExamCollectionResponse } from "~services/types/database";
import { BatchResultsProvider } from "./batch-results-context";

export type FilterFormValues = {
  type: "all" | "academic" | "general";
  skill: "all" | "reading" | "listening";
  collection: string;
  sort: "newest" | "popular" | "high-ranking";
  search: string;
  /** Comma-separated canonical question-form slugs, or empty string for "all" */
  questionForm: string;
  /** "pro" | "free" | "" (empty = all) */
  subscription: "pro" | "free" | "";
  /** Comma-separated part counts, e.g. "1,3" — empty string = all */
  parts: string;
  page: number;
  size: number;
};

const PAGE_SIZE = 5;

const buildPages = (current: number, total: number) => {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
};

interface PageIELTSExamLibraryProps {
  heroConfig: ExamLibraryHeroConfig;
  initialData: ExamCollectionResponse;
}

export const PageIELTSExamLibrary = ({
  heroConfig,
  initialData,
}: PageIELTSExamLibraryProps) => {
  const router = useRouter();

  // Derive initial form values from the URL so back/forward and direct links
  // hydrate the form correctly. SSR has already resolved data based on the
  // same query, so the form just mirrors the server state.
  const initialValues = useMemo<FilterFormValues>(
    () => ({
      type: (router.query.type as FilterFormValues["type"]) || "academic",
      skill: (router.query.skill as FilterFormValues["skill"]) || "reading",
      collection: (router.query.collection as string) || "",
      sort: (router.query.sort as FilterFormValues["sort"]) || "newest",
      search: (router.query.search as string) || "",
      questionForm: (router.query.questionForm as string) || "",
      subscription: ((router.query.subscription as string) || "") as FilterFormValues["subscription"],
      parts: (router.query.parts as string) || "",
      page: Number(router.query.page) || 1,
      size: PAGE_SIZE,
    }),
    // initialValues are seeded once per SSR navigation; the form mutates after
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const methods = useForm<FilterFormValues>({ defaultValues: initialValues });
  const {
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = methods;

  const values = watch();

  const [navigating, setNavigating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local search draft in the toolbar search box
  const [searchDraft, setSearchDraft] = useState(values.search ?? "");

  useEffect(() => {
    setSearchDraft(values.search ?? "");
  }, [values.search]);

  // Skeleton state during SSR navigation triggered by filter changes
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

  // After every URL change (including the ones we trigger ourselves),
  // reset the form to mirror the URL and clear isDirty. This makes
  // back/forward navigation work, and resets the dirty flag so the next
  // user interaction can fire the form→URL effect again.
  useEffect(() => {
    if (!router.isReady) return;
    reset({
      type: (router.query.type as FilterFormValues["type"]) || "academic",
      skill: (router.query.skill as FilterFormValues["skill"]) || "reading",
      collection: (router.query.collection as string) || "",
      sort: (router.query.sort as FilterFormValues["sort"]) || "newest",
      search: (router.query.search as string) || "",
      questionForm: (router.query.questionForm as string) || "",
      subscription: ((router.query.subscription as string) || "") as FilterFormValues["subscription"],
      parts: (router.query.parts as string) || "",
      page: Number(router.query.page) || 1,
      size: PAGE_SIZE,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  // Sync form → URL; non-shallow so SSR re-runs and props refresh
  useEffect(() => {
    if (!isDirty) return;
    const q: Record<string, string> = {};
    if (values.type) q.type = values.type;
    if (values.skill) q.skill = values.skill;
    if (values.collection) q.collection = values.collection;
    if (values.search) q.search = values.search;
    if (values.sort !== "newest") q.sort = values.sort;
    if (values.questionForm) q.questionForm = values.questionForm;
    if (values.subscription) q.subscription = values.subscription;
    if (values.parts) q.parts = values.parts;
    if (values.page > 1) q.page = String(values.page);

    const currentQ = JSON.stringify(router.query);
    const nextQ = JSON.stringify(q);
    if (currentQ === nextQ) return;

    router.push({ pathname: router.pathname, query: q }, undefined, {
      scroll: false,
    });
  // Depend on primitive values, not the watch() object — watch() returns a
  // new reference every render, which would fire this effect every render
  // and keep pushing while SSR navigation is still in flight.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.type, values.skill, values.collection, values.search, values.sort, values.questionForm, values.subscription, values.parts, values.page, isDirty]);

  // Group exams by collection, filtering individual exams by search term
  const groupedCollections = useMemo(() => {
    const map = new Map<string, any>();
    const skillParam = values.skill || "all";

    // Prepare search words for client-side filtering of individual exams
    const searchWords = values.search
      ? values.search.toLowerCase().split(/\s+/).filter((w) => w.length > 0)
      : [];

    // Client-side filter: keep only exams whose title matches ALL search words.
    // When a search like "28" matched a collection via range detection (e.g.
    // "Test 21-40"), the server returns all exams inside that collection. We
    // narrow down to only the relevant items here.
    const examMatchesSearch = (exam: any): boolean => {
      if (searchWords.length === 0) return true;
      const title = (exam.title || "").toLowerCase();
      return searchWords.every((word) => title.includes(word));
    };

    if (skillParam === "all" || skillParam === "reading") {
       (initialData.data.reading || []).forEach(col => {
           if (values.collection && col.title !== values.collection) return;
           const mappedExams = col.exams
             .map((e: any) => ({ ...e, skill: "reading" }))
             .filter(examMatchesSearch);
           if (mappedExams.length > 0) {
             map.set(col.id, { ...col, exams: mappedExams });
           }
       });
    }

    if (skillParam === "all" || skillParam === "listening") {
       (initialData.data.listening || []).forEach(col => {
           if (values.collection && col.title !== values.collection) return;
           const mappedExams = col.exams
             .map((e: any) => ({ ...e, skill: "listening" }))
             .filter(examMatchesSearch);
           if (mappedExams.length === 0) return;
           if (map.has(col.id)) {
               map.get(col.id).exams.push(...mappedExams);
           } else {
               map.set(col.id, { ...col, exams: mappedExams });
           }
       });
    }

    return Array.from(map.values());
  }, [initialData, values.skill, values.collection, values.search]);

  const currentPage = values.page || 1;
  const totalPages = initialData.pageInfo?.totalPages ?? 1;
  const visiblePages = buildPages(currentPage, totalPages);
  const pagedCols = groupedCollections;
  const goToPage = (page: number) => {
    setValue("page", page, { shouldDirty: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const availableCollections = useMemo<string[]>(() => {
    const readingCols = (initialData.data.reading || []).map((c) => c.title);
    const listeningCols = (initialData.data.listening || []).map((c) => c.title);
    return Array.from(new Set([...readingCols, ...listeningCols]));
  }, [initialData]);

  const allQuizIds = useMemo(() => {
    const ids: string[] = [];
    for (const col of pagedCols) {
      for (const exam of col.exams ?? []) {
        if (exam.id) ids.push(exam.id);
      }
    }
    return ids;
  }, [pagedCols]);

  const applyToolbarSearch = () => {
    setValue("search", searchDraft.trim(), { shouldDirty: true });
    setValue("page", 1, { shouldDirty: true });
  };

  const total = initialData.pageInfo?.total;

  return (
    <FormProvider {...methods}>
      <SEOHeader fullHead={""} title={"IELTS Exam Library"} />

      <div className="py-6 sm:py-8">
        {/* ══ PAGE HEADER (Figma 3410:221) ══
            Title + subtitle on the left. Search / avatar / bell on the
            right are rendered by the app-shell header widget; here we
            only render the title area per our scope. */}
        <ExamLibraryHeroBanner config={heroConfig} total={total} />
      </div>

      {/* ══ TOOLBAR (Figma 3410:224) ══
          Left: filter chips   Right: search box + mobile filter btn */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline pb-4 mb-6">
        {/* Left: chip filters */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Filter collections={availableCollections} />
        </div>

        {/* Right: search box + mobile filter button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Toolbar search — Figma node 3410:236 */}
          <div className="relative flex items-center h-9 w-44 sm:w-52 rounded-full border border-border-hairline bg-surface-card overflow-hidden focus-within:border-brand transition">
            <span className="material-symbols-rounded pl-3 text-[16px] text-ink-muted pointer-events-none">
              search
            </span>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyToolbarSearch();
                }
              }}
              onBlur={applyToolbarSearch}
              placeholder="Search tests…"
              className="flex-1 h-full bg-transparent px-2.5 text-body-s text-ink-700 outline-none placeholder:text-ink-muted"
            />
          </div>

          {/* Mobile filter button — visible only below lg */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-hairline bg-surface-card px-3.5 py-1.5 text-body-s font-semibold text-ink-700 transition hover:bg-primary-100 lg:hidden cursor-pointer"
          >
            <span className="material-symbols-rounded text-[16px]">tune</span>
            Filter
          </button>
        </div>
      </div>

      {/* ══ COLLECTIONS LIST — full-width (no sidebar) ══ */}
      <section id="iel-main" data-section="iel-main">
        <BatchResultsProvider quizIds={allQuizIds}>
          <div className="space-y-12 min-w-0">
            {navigating ? (
              <div className="space-y-12">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <ExamCollection key={i} loading={true} />
                ))}
              </div>
            ) : pagedCols.length ? (
              <div className="space-y-12">
                {pagedCols.map((col) => (
                  <ExamCollection key={col.id} data={col} />
                ))}
              </div>
            ) : (
              <div className="rounded-[30px] border border-dashed border-border-hairline bg-primary-50 px-6 py-16 text-center">
                <p className="text-caption-bold font-bold uppercase tracking-[0.24em] text-ink-900/40">
                  No results
                </p>
                <h3 className="mt-3 font-display text-heading-2 font-bold text-ink-900">
                  No mock tests matched the current filters.
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-body-s leading-7 text-ink-muted">
                  Clear a few filters or search with a broader keyword to explore more tests.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-[8px] pt-4">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-ink-700 transition cursor-pointer disabled:cursor-not-allowed disabled:text-ink-900/30 hover:bg-primary-100"
                >
                  <span className="material-symbols-rounded text-xl">chevron_left</span>
                </button>

                {visiblePages.map((page, index, array) => {
                  const isGap = index > 0 && page - array[index - 1] > 1;
                  return (
                    <div key={page} className="flex items-center gap-[8px]">
                      {isGap && (
                        <div className="flex h-8 w-8 items-end justify-center pb-1 text-ink-900/30 font-bold tracking-widest leading-none">
                          ...
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-body-s font-semibold transition cursor-pointer ${
                          page === currentPage
                            ? "bg-brand text-ink-900"
                            : "text-ink-700 hover:bg-primary-100"
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
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-ink-700 transition cursor-pointer disabled:cursor-not-allowed disabled:text-ink-900/30 hover:bg-primary-100"
                >
                  <span className="material-symbols-rounded text-xl">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </BatchResultsProvider>
      </section>

      {/* Mobile Filter Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 lg:hidden">
          <div className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-surface-card p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-caption-bold font-bold uppercase tracking-[0.24em] text-ink-900/40">
                  Filters
                </p>
                <h3 className="mt-1 font-display text-heading-2 font-bold text-ink-900">
                  Refine results
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-hairline text-ink-700 cursor-pointer hover:bg-primary-100 transition"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <Filter
              mobile
              collections={availableCollections}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </FormProvider>
  );
};

PageIELTSExamLibrary.Layout = AppShell;
