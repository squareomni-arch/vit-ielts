import { QuizLibraryNav, SEOHeader } from "@/widgets";
import { SampleEssayProps } from "../..";
import { Container, Empty } from "@/shared/ui";
import {
  Button,
  Input,
  InputRef,
  Pagination,
  Select,
  Space,
} from "antd";
import { HeroBanner as DSHeroBanner } from "@/shared/ui/ds";
import { useRouter } from "next/router";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import _ from "lodash";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { Filter } from "./filter";
import { HorizontalItem } from "./horizontal-item";

const PAGE_SIZE = 18;

const buildPages = (current: number, total: number) => {
  if (total <= 1) return [1];
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);
};

export type FilterFormValues = {
  sampleSource: string | string[];
  part: string | string[];
  sort: "newest" | "oldest" | "popular" | "a-z" | "z-a";
  search: string;
  size: number;
  year: string;
  topic: string | string[];
  task: string;
  passage: string;
  questionType: string;
  quarter: string;
};

export const PageArchive = ({
  sampleEssays,
  seo,
  pageSize,
  paged,
  skill,
  filterData,
  bannerConfig,
}: SampleEssayProps) => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchInputRef = useRef<InputRef>(null);
  const isSyncingFromUrl = useRef(false); // Flag để tránh vòng lặp
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      sort: "newest",
      search: "",
      size: PAGE_SIZE,
    },
  });
  const {
    watch,
    formState: { isDirty },
    setValue,
    reset,
    getValues,
  } = methods;

  const handleSearch = () => {
    if (searchInputRef.current) {
      setValue("search", searchInputRef.current.input?.value || "", {
        shouldDirty: true,
      });
    }
  };

  // 1. Sync từ URL vào Form (chỉ khi router.query thay đổi, không trigger isDirty)
  useEffect(() => {
    if (!router.isReady) return;

    isSyncingFromUrl.current = true; // Đánh dấu đang sync từ URL

    const currentValues = getValues();
    const urlParams = _.omit(router.query, ["slug"]);

    // Chuyển đổi array string từ URL thành array
    const formData: Partial<FilterFormValues> = {
      ...currentValues,
      sort: (urlParams.sort as FilterFormValues["sort"]) || "newest",
      search: (urlParams.search as string) || "",
      size: urlParams.size ? Number(urlParams.size) : PAGE_SIZE,
      year: (urlParams.year as string) || "",
      topic: (urlParams.topic as string) || "",
      part: (urlParams.part as string) || "",
      questionType: (urlParams.questionType as string) || "",
      quarter: (urlParams.quarter as string) || "",
      sampleSource: (urlParams.sampleSource as string) || "",
    };

    // Chuyển đổi string thành array cho các field có thể là array
    if (urlParams.topic) {
      const topicValue = Array.isArray(urlParams.topic)
        ? urlParams.topic[0]
        : urlParams.topic;
      if (typeof topicValue === "string") {
        formData.topic = topicValue.includes(",")
          ? topicValue.split(",")
          : topicValue;
      }
    }
    if (urlParams.part) {
      const partValue = Array.isArray(urlParams.part)
        ? urlParams.part[0]
        : urlParams.part;
      if (typeof partValue === "string") {
        formData.part = partValue.includes(",")
          ? partValue.split(",")
          : partValue;
      }
    }

    // Reset form với giá trị từ URL (không trigger isDirty)
    reset(formData as FilterFormValues, { keepDirty: false });

    // Reset flag sau một tick để cho phép useEffect 2 chạy lại nếu cần
    setTimeout(() => {
      isSyncingFromUrl.current = false;
    }, 0);
  }, [router.query, router.isReady, reset, getValues]);

  const filterValues = watch();

  // 2. Sync từ Form ra URL (chỉ khi form thay đổi và isDirty = true)
  useEffect(() => {
    if (!isDirty || !router.isReady || isSyncingFromUrl.current) return;

    const formValues = filterValues;

    // Tạo params mới từ form values
    const params: Record<string, string> = {};

    Object.keys(formValues).forEach((key) => {
      const value = formValues[key as keyof FilterFormValues];

      // Bỏ qua các giá trị mặc định/rỗng
      if (
        value === "all" ||
        !value ||
        value === "newest" ||
        (key === "size" && value === PAGE_SIZE) ||
        (key === "search" && value === "")
      ) {
        return;
      }

      if (_.isArray(value)) {
        if (value.length > 0) {
          params[key] = value.join(",");
        }
      } else {
        params[key] = value.toString();
      }
    });

    // So sánh với URL hiện tại để tránh push không cần thiết
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });

    const newQueryString = queryParams.toString();
    const currentQueryString = new URLSearchParams(
      window.location.search
    ).toString();

    // Chỉ push nếu query string thực sự thay đổi
    if (newQueryString !== currentQueryString) {
      const newPath = newQueryString
        ? `${
            skill === "speaking"
              ? ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING
              : ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING
          }?${newQueryString}`
        : skill === "speaking"
        ? ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING
        : ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING;

      // Bỏ shallow: true để trigger getServerSideProps và fetch data mới
      router.push(newPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues, isDirty, router.isReady, skill]);

  const isWriting = skill === "writing";
  const isSpeaking = skill === "speaking";
  const showBanner = isWriting || isSpeaking;

  const items = sampleEssays?.edges ?? [];
  const suggestions = items.slice(0, 4);
  const currentPage = paged;
  const total = sampleEssays?.pageInfo?.offsetPagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visiblePages = buildPages(currentPage, totalPages);

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-white pb-20 overflow-x-hidden">
        <SEOHeader fullHead={seo?.fullHead} title={seo?.title} />

        {/* Sample Essay Page Header Section */}
        {showBanner &&
          (() => {
            const bannerData = isWriting
              ? bannerConfig.writing
              : bannerConfig.speaking;

            return (
              <DSHeroBanner
                title={bannerData.title}
                breadcrumbs={[
                  { label: "Trang chủ", href: "/" },
                  { label: skill === "writing" ? "Writing Samples" : "Speaking Samples" },
                ]}
              />
            );
          })()}

        <Container className="mt-12 px-4 sm:px-6">
          {/* === SECTION: Suggestions === */}
          <section id="ipl-suggestions" data-section="suggestions">
            <div className="mb-6 flex items-center justify-between">
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((item: (typeof sampleEssays.edges)[number], index: number) => (
                <HorizontalItem post={item} skill={skill as "speaking" | "writing"} key={index} />
              ))}
            </div>
          </section>

          <hr className="my-14 border-t border-[rgba(0,0,0,0.06)]" />

          {/* === SECTION: Sample Essay === */}
          <section id="sample-essay" data-section="sample-essay">
            <div className="mb-10 flex flex-col gap-6">
              <h2 className="font-noto-sans text-3xl font-extrabold text-[#2D3142]">
                IELTS {_.capitalize(skill)} Sample
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
                      value={filterValues.sort}
                      onChange={(event) => {
                        setValue("sort", event.target.value as FilterFormValues["sort"], { shouldDirty: true });
                      }}
                      className="w-full appearance-none rounded-full border border-[rgba(0,0,0,0.1)] bg-white px-5 py-3 pr-11 text-sm font-semibold text-[#242938] outline-none transition hover:bg-gray-50"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="a-z">A-Z</option>
                      <option value="z-a">Z-A</option>
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
                  <Filter
                    drawerOpen={drawerOpen}
                    setDrawerOpen={setDrawerOpen}
                    filterData={filterData}
                    skill={skill}
                  />
                </div>
              </aside>

              <div className="space-y-10">
                {items.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((item: (typeof sampleEssays.edges)[number], index: number) => (
                        <HorizontalItem post={item} skill={skill as "speaking" | "writing"} key={index} />
                      ))}
                    </div>
                    {totalPages > 1 && (() => {
                      const handlePageChange = (page: number) => {
                        router.push(
                          skill === "speaking"
                            ? `${ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING}/page/${page}?${new URLSearchParams(window.location.search).toString()}`
                            : `${ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING}/page/${page}?${new URLSearchParams(window.location.search).toString()}`
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      };

                      return (
                        <div className="flex flex-wrap items-center justify-center gap-[8px] pt-4">
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition cursor-pointer disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
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
                                  onClick={() => handlePageChange(page)}
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

                          <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[6px] text-[#2D3142] transition cursor-pointer disabled:cursor-not-allowed disabled:text-black/30 hover:bg-gray-50"
                          >
                            <span className="material-symbols-rounded text-xl">chevron_right</span>
                          </button>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div className="rounded-[30px] border border-dashed border-[rgba(0,0,0,0.1)] bg-[#FAF7EB]/50 px-6 py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#242938]/40">
                      No results
                    </p>
                    <h3 className="mt-3 font-noto-sans text-2xl font-extrabold text-[#242938]">
                      Không tìm thấy bài mẫu nào.
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#242938]/60">
                      Thử bỏ bớt filter hoặc tìm kiếm từ khóa khác xem sao bạn nhé.
                    </p>
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
              <Filter drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} filterData={filterData} skill={skill} />
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};

