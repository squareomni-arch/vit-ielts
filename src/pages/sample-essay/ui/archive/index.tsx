import { QuizLibraryNav, SEOHeader } from "@/widgets";
import { SampleEssayProps } from "../..";
import { Container, Empty } from "@/shared/ui";
import {
  Breadcrumb,
  Button,
  Input,
  InputRef,
  Pagination,
  Select,
  Space,
} from "antd";
import { useRouter } from "next/router";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import _ from "lodash";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useEffect, useState, useRef } from "react";
import { Filter } from "./filter";
import { DefaultView } from "./single-item";
import { HorizontalItem } from "./horizontal-item";

const PAGE_SIZE = 18;

export type FilterFormValues = {
  sampleSource: string | string[];
  part: string | string[];
  sort: "newest" | "oldest" | "popular" | "a-z" | "z-a";
  search: string;
  size: number;
  year: string;
  topic: string | string[];
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

  return (
    <FormProvider {...methods}>
      <SEOHeader fullHead={seo?.fullHead} title={seo?.title} />

      {/* Sample Essay Banner Section */}
      {showBanner &&
        (() => {
          const bannerData = isWriting
            ? bannerConfig.writing
            : bannerConfig.speaking;

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
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 flex flex-col items-center wrap-break-word w-full">
                    <div className="wrap-break-word">
                      {bannerData.title.line1}
                    </div>
                    <div className="relative inline-block wrap-break-word">
                      <span className="relative inline-block">
                        {bannerData.title.line2Highlighted}
                        <span
                          className="absolute bottom-0 left-0 right-0 h-3 opacity-30"
                          style={{
                            background:
                              "linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)",
                          }}
                        ></span>
                      </span>{" "}
                      <span className="wrap-break-word">
                        {bannerData.title.line2After}
                      </span>
                    </div>
                  </h1>

                  <div className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed max-w-3xl space-y-1 w-full">
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

      <Container className="pb-10">
        <div className="py-5">
          <Breadcrumb
            items={[
              {
                title: <Link href="/">Home</Link>,
              },
              {
                title: `IELTS ${_.capitalize(skill)} Sample`,
              },
            ]}
          />
        </div>
        <h1 className="pb-4 sm:pb-6 text-2xl md:text-5xl font-extrabold text-primary">
          IELTS {_.capitalize(skill)} Sample
        </h1>
        <div className="mb-12">
          <QuizLibraryNav />
        </div>
        <div className="flex -m-4 flex-wrap">
          <div className="p-4 md:w-3/12 w-full hidden sm:block">
            <div className="h-full">
              <Filter
                drawerOpen={drawerOpen}
                setDrawerOpen={setDrawerOpen}
                filterData={filterData}
                skill={skill}
              />
            </div>
          </div>
          <div className="p-4 md:w-9/12 w-full">
            <div className="flex flex-wrap justify-between gap-4 items-center">
              <div className="flex items-stretch flex-wrap -m-1.5">
                {/* {skillNav.map((item) => (
                  <div key={item.name} className="p-1.5 sm:w-auto w-1/2">
                    <Link
                      href={item.link}
                      className={twMerge(
                        "flex items-center px-2 py-1 bg-gray-200 rounded space-x-2",
                        skill === item.skill && "bg-primary text-white"
                      )}
                    >
                      <Image
                        width={20}
                        height={20}
                        src={item.icon}
                        alt={item.name}
                      />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </div>
                ))} */}
              </div>
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
              <Button onClick={() => setDrawerOpen(true)} className="sm:hidden">
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
                      { label: "A-Z", value: "a-z" },
                      { label: "Z-A", value: "z-a" },
                    ]}
                    {...field}
                  />
                )}
              />
            </div>
            <div className="pb-5 space-y-4 mt-4">
              {sampleEssays.edges.length > 0 ? (
                <>
                  <div
                    className={
                      skill === "writing" || skill === "speaking"
                        ? "space-y-4"
                        : "flex -m-1.5 flex-wrap items-stretch"
                    }
                  >
                    {sampleEssays.edges.map((item: (typeof sampleEssays.edges)[number], index: number) => (
                      <div
                        className={
                          skill === "writing" || skill === "speaking"
                            ? "w-full"
                            : "p-1.5 w-1/2 md:w-1/3"
                        }
                        key={index}
                      >
                        {skill === "writing" || skill === "speaking" ? (
                          <HorizontalItem post={item} skill={skill} />
                        ) : (
                          <DefaultView post={item} skill={skill} />
                        )}
                      </div>
                    ))}
                  </div>
                  {sampleEssays.pageInfo.offsetPagination.total - pageSize >
                    0 && (
                    <Pagination
                      className="justify-center"
                      defaultCurrent={paged}
                      defaultPageSize={pageSize}
                      total={sampleEssays.pageInfo.offsetPagination.total}
                      onChange={(page) => {
                        router.push(
                          skill === "speaking"
                            ? `${
                                ROUTES.SAMPLE_ESSAY.ARCHIVE_SPEAKING
                              }/page/${page}?${new URLSearchParams(
                                window.location.search
                              ).toString()}`
                            : `${
                                ROUTES.SAMPLE_ESSAY.ARCHIVE_WRITING
                              }/page/${page}?${new URLSearchParams(
                                window.location.search
                              ).toString()}`
                        );
                      }}
                    />
                  )}
                </>
              ) : (
                <Empty
                  title="There is no sample essay!"
                  subtitle="We will update as soon as possible."
                />
              )}
            </div>
          </div>
        </div>
      </Container>
    </FormProvider>
  );
};
