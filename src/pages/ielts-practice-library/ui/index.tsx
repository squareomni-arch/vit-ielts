import { Container, Empty } from "@/shared/ui";
import {
  Breadcrumb,
  Button,
  Divider,
  Input,
  Pagination,
  Select,
  Skeleton,
  Space,
} from "antd";
import type { InputRef } from "antd/es/input";
import Link from "next/link";
import { Filter } from "./filter";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { QuizLibraryNav } from "@/widgets";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, useRef } from "react";
import _ from "lodash";
import {
  IPracticeTestResponses,
  PracticeTestItem,
} from "@/entities/practice-test";
import { QUESTION_FORMS } from "@/shared/constants";
import { PracticeTest } from "@/widgets/blocks";
import type { PracticeLibraryBannerConfig } from "./types";
import { createClient } from "~supabase/client";
import { getQuizzes } from "~services/quiz";

export type FilterFormValues = {
  progress: "pending" | "completed" | "in-progress";
  question_form: (typeof QUESTION_FORMS)[number]["value"][];
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
  const router = useRouter();
  const searchInputRef = useRef<InputRef>(null);
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      sort: "newest",
      search: "",
      page: 1,
      size: PAGE_SIZE,
    },
  });
  const {
    watch,
    formState: { isDirty },
    setValue,
    reset, // <-- ĐÃ THÊM
    getValues, // <-- ĐÃ THÊM
  } = methods;

  const handleSearch = () => {
    if (searchInputRef.current) {
      setValue("search", searchInputRef.current.input?.value || "", {
        shouldDirty: true,
      });
    }
  };

  const [data, setData] = useState<IPracticeTestResponses | null>(null);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(PAGE_SIZE);

  const getData = useCallback(async (params: any) => {
    setLoading(true);
    setCalled(true);
    try {
      const supabase = createClient();
      const { search, offsetPagination, skill, source, part, quarter, year, question_form, orderby } = params;
      const page = offsetPagination ? Math.floor(offsetPagination.offset / offsetPagination.size) + 1 : 1;
      const pageSize = offsetPagination?.size || PAGE_SIZE;
      setCurrentPageSize(pageSize);

      const result = await getQuizzes(supabase, {
        skill: skill || undefined,
        search: search || undefined,
        source: source || undefined,
        part: part || undefined,
        quarter: quarter || undefined,
        year: year || undefined,
        questionForm: question_form || undefined,
        page,
        pageSize,
      });

      // Map to legacy format expected by components
      const edges = (result.data || []).map((quiz: any) => ({
        node: {
          id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          link: `/ielts-practice-library/${quiz.skill}/${quiz.slug}`,
          featuredImage: quiz.featured_image
            ? { node: { sourceUrl: quiz.featured_image, altText: quiz.title } }
            : null,
          quizFields: {
            skill: [quiz.skill],
            type: [quiz.type || "practice"],
            part: [quiz.part || "0"],
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
      } as any);
    } catch (error) {
      console.error("Error fetching practice tests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Logic đồng bộ từ URL vào Form
  useEffect(() => {
    if (!router.isReady) return;
    const { page, ...rest } = router.query;
    const currentValues = getValues();
    reset({
      ...currentValues,
      ...rest,
      page: page ? Number(page) : 1,
    } as FilterFormValues);
  }, [router.query, router.isReady, reset, getValues]);

  // 2. Logic gọi API dựa trên router params
  useEffect(() => {
    const {
      sort,
      search,
      page,
      size: pageSize,
      question_form,
      source,
      part,
      quarter,
      year,
    } = router.query;
    const size = Number(pageSize) || PAGE_SIZE;
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * size;

    const params: any = {
      search,
      offsetPagination: {
        offset,
        size,
      },
      size: "LARGE",
      question_form,
      skill: router.pathname.split("/").pop(),
      source,
      part,
      quarter,
      year,
    };

    switch (sort) {
      case "newest":
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
      case "oldest":
        _.set(params, "orderby", [{ field: "DATE", order: "ASC" }]);
        break;
      case "popular":
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
  }, [getData, router.pathname, router.query]);

  const filterValues = watch();

  // 3. Logic Sync Form ra URL (Sửa lỗi Pagination bị hỏng và Reset Page khi filter)
  useEffect(() => {
    if (!isDirty) return;

    const formValues = watch();
    const currentRouterQuery = router.query;

    // --- BƯỚC 1: KIỂM TRA CÁC FILTER KHÁC PAGE/SIZE CÓ THAY ĐỔI KHÔNG ---
    let nonPageFilterChanged = false;

    // Các keys cần so sánh (Tất cả trừ page, size)
    const keysToCheck: Array<keyof FilterFormValues> = [
      "progress",
      "question_form",
      "sort",
      "search",
      "quarter",
      "year",
      "source",
      "part",
    ];

    const normalize = (
      value: string | string[] | number | undefined,
      key: string
    ) => {
      if (_.isNil(value) || value === "") return undefined;
      // Xử lý giá trị mặc định/rỗng để không bị coi là thay đổi
      if (key === "sort" && value === "newest") return undefined;
      if (key === "search" && value === "") return undefined;
      if (_.isArray(value) && value.length === 0) return undefined;

      return _.isArray(value) ? value.join(",") : String(value);
    };

    for (const key of keysToCheck) {
      const formValue = normalize(formValues[key], key);
      const urlValue = normalize(currentRouterQuery[key], key);

      // So sánh giá trị đã chuẩn hóa
      if (formValue !== urlValue) {
        nonPageFilterChanged = true;
        break;
      }
    }

    // --- BƯỚC 2: TẠO QUERY STRING MỚI VÀ SYNC RA URL ---
    const queryParams = new URLSearchParams();

    Object.keys(formValues).forEach((key) => {
      const value = formValues[key as keyof FilterFormValues];

      // Xóa tham số nếu là giá trị mặc định, rỗng, hoặc page=1, hoặc size=PAGE_SIZE
      if (
        value === "all" ||
        !value ||
        (key === "sort" && value === "newest") ||
        (key === "page" && value === 1) ||
        (key === "size" && value === PAGE_SIZE)
      ) {
        queryParams.delete(key);
      } else {
        if (_.isArray(value)) {
          if (value.length === 0) {
            queryParams.delete(key);
          } else {
            queryParams.set(key, value.join(","));
          }
        } else queryParams.set(key, value.toString());
      }
    });

    // 3. ÁP DỤNG NGHIỆP VỤ RESET PAGE
    // Nếu có filter khác page/size thay đổi VÀ page đang không phải 1
    if (nonPageFilterChanged && formValues.page !== 1) {
      // Cập nhật form state để page=1, điều này sẽ kích hoạt useEffect này chạy lại
      // Lần chạy lại tiếp theo sẽ push router với page=1 (tức là không có param 'page' trên URL)
      setValue("page", 1, { shouldDirty: true });
      return; // Thoát để lần chạy tiếp theo mới push router
    }

    // Nếu có filter khác page/size thay đổi, VÀ page ĐÃ là 1 (hoặc sau khi đã reset về 1)
    if (nonPageFilterChanged) {
      queryParams.delete("page");
    }

    const newSearch = queryParams.toString();
    const currentSearch = window.location.search.replace(/^\?/, "");

    // Chỉ push nếu URL thực sự thay đổi để tránh lỗi và vòng lặp vô hạn
    if (newSearch !== currentSearch) {
      router.push({ search: newSearch }, undefined, {
        shallow: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues, isDirty, router, setValue]);

  const skill = router.pathname.split("/").pop() || "";
  const isListening = skill === "listening";
  const isReading = skill === "reading";
  const showBanner = isListening || isReading;

  return (
    <FormProvider {...methods}>
      {/* <SEOHeader fullHead={category.seo.fullHead} title={category.seo.title} /> */}

      {/* Practice Banner Section */}
      {showBanner &&
        (() => {
          const bannerData = isListening
            ? bannerConfig.listening
            : bannerConfig.reading;

          return (
            <div
              className="relative w-full py-12 md:py-16 flex items-center justify-center overflow-hidden"
              style={{
                background:
                  bannerData.backgroundColor ||
                  "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
              }}
            >
              <Container className="relative z-10 px-4">
                <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 wrap-break-word w-full px-4">
                    {bannerData.title}
                  </h1>
                  <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-3xl space-y-1 w-full px-4">
                    {bannerData.description.line1 && (
                      <div className="wrap-break-word">
                        {bannerData.description.line1}
                      </div>
                    )}
                    {bannerData.description.line2 && (
                      <div className="wrap-break-word">
                        {bannerData.description.line2}
                      </div>
                    )}
                    {bannerData.description.line3 && (
                      <div className="wrap-break-word">
                        {bannerData.description.line3}
                      </div>
                    )}
                  </div>
                  <Link href={bannerData.button.link} className="inline-block">
                    <Button
                      type="primary"
                      style={{
                        background: "#d94a56",
                        borderColor: "#d94a56",
                        color: "#ffffff",
                      }}
                      className="hover:bg-[#c0394a]! hover:border-[#c0394a]! px-4 sm:px-6 py-2 h-[48px] text-sm md:text-base font-normal rounded-lg w-full sm:w-auto"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-none inline-block">
                        {bannerData.button.text}
                      </span>
                    </Button>
                  </Link>
                </div>
              </Container>
            </div>
          );
        })()}

      <Container className="space-y-12 pb-5">
        <div className="space-y-2">
          <div className="pt-5 pb-3">
            <Breadcrumb
              items={[
                {
                  title: <Link href="/">Home</Link>,
                },
                {
                  title: "IELTS Practice Library",
                },
                {
                  title: _.capitalize(router.pathname.split("/").pop() || ""),
                },
              ]}
            />
          </div>
          <PracticeTest title="Suggestions for you" view_more={false} />
          <Divider className="my-8!" />
          <h1 className="pb-4 text-3xl md:text-5xl font-extrabold text-primary">
            IELTS {_.capitalize(router.pathname.split("/").pop() || "")}{" "}
            Practice
          </h1>
          <QuizLibraryNav />
        </div>
        <div className="flex flex-wrap -m-3">
          <div className="hidden sm:block w-1/3 md:w-1/4 p-3">
            <Filter
              filterData={quizFilterData}
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
            />
          </div>
          <div className="w-full sm:w-2/3 md:w-3/4 p-3 space-y-4">
            {data && (
              <div className="flex flex-wrap justify-between sm:justify-end gap-4">
                <div className="w-full sm:hidden">
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      ref={searchInputRef}
                      size="large"
                      allowClear
                      onClear={() => {
                        setValue("search", "", { shouldDirty: true });
                      }}
                      defaultValue={router.query.search?.toString() || ""}
                      placeholder="Search"
                      onPressEnter={handleSearch}
                    />
                    <Button
                      size="large"
                      type="primary"
                      icon={
                        <span className="material-symbols-rounded flex">
                          search
                        </span>
                      }
                      onClick={handleSearch}
                    />
                  </Space.Compact>
                </div>
                <Button
                  onClick={() => setDrawerOpen(true)}
                  className="sm:hidden"
                >
                  <span className="material-symbols-rounded">filter_alt</span>
                  <span className="leading-none">Filter</span>
                </Button>
                <Controller
                  name="sort"
                  control={methods.control}
                  render={({ field }) => (
                    <Select<FilterFormValues["sort"]>
                      options={[
                        { label: "Newest", value: "newest" },
                        { label: "Oldest", value: "oldest" },
                        { label: "Popular", value: "popular" },
                        { label: "A-Z", value: "a-z" },
                        { label: "Z-A", value: "z-a" },
                      ]}
                      {...field}
                    />
                  )}
                />
              </div>
            )}
            <div className="flex flex-wrap -m-3">
              {loading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <div className="w-full sm:w-1/2 md:w-1/3 p-3" key={index}>
                      <Skeleton active />
                    </div>
                  ))
                : data?.quizzes.edges.map(({ node: item }, index) => (
                    <div className="w-full sm:w-1/2 md:w-1/3 p-3" key={index}>
                      <PracticeTestItem item={item} />
                    </div>
                  ))}
              {called && !loading && !data?.quizzes.edges.length && (
                <div className="w-full p-3">
                  <Empty title="No practice tests found!" />
                </div>
              )}
            </div>
            {called &&
              !loading &&
              data &&
              data.quizzes.pageInfo.offsetPagination.total > PAGE_SIZE && (
                <Pagination
                  // [FIX] Dùng 'current' để đồng bộ với URL/state
                  current={router.query.page ? Number(router.query.page) : 1}
                  pageSize={currentPageSize}
                  total={data.quizzes.pageInfo.offsetPagination.total || 0}
                  showSizeChanger={false}
                  onChange={(page, pageSize) => {
                    setValue("size", pageSize, {
                      shouldDirty: true,
                    });
                    setValue("page", page, {
                      shouldDirty: true,
                    });
                  }}
                  className="mt-5 justify-center"
                />
              )}
          </div>
        </div>
      </Container>
    </FormProvider>
  );
};
