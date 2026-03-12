import { Container } from "@/shared/ui";
import { Breadcrumb, Empty, Pagination, Spin, Tabs } from "antd";
import Link from "next/link";
import { Filter } from "./filter";
import { FormProvider, useForm } from "react-hook-form";
import { QuizLibraryNav, SEOHeader } from "@/widgets";
import {
  IELTSListeningExamIcon,
  IELTSReadingExamIcon,
} from "@/shared/ui/icons";
import {
  IExamCollection,
  IExamCollectionResponse,
} from "../api";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import ExamCollection from "./exam-collection";
import _ from "lodash";
import type { ExamLibraryHeroConfig } from "./types";
import { createClient } from "~supabase/client";
import { getExamCollections } from "~services/exam-collection";

export type FilterFormValues = {
  type: "all" | "academic" | "general";
  sort: "newest" | "popular" | "high-ranking";
  search: string;
  page: number;
  size: number;
};

const PAGE_SIZE = 10;

interface PageIELTSExamLibraryProps {
  heroConfig: ExamLibraryHeroConfig;
}

export const PageIELTSExamLibrary = ({
  heroConfig,
}: PageIELTSExamLibraryProps) => {
  const router = useRouter();
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      type: "all",
    },
  });
  const {
    setValue,
    watch,
    formState: { isDirty },
  } = methods;

  const [data, setData] = useState<IExamCollectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [called, setCalled] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(PAGE_SIZE);

  const getData = useCallback(async (params: any) => {
    setLoading(true);
    setCalled(true);
    try {
      const supabase = createClient();
      const { type, search, offsetPagination } = params;
      const page = offsetPagination ? Math.floor(offsetPagination.offset / offsetPagination.size) + 1 : 1;
      const pageSize = offsetPagination?.size || PAGE_SIZE;
      setCurrentPageSize(pageSize);

      const result = await getExamCollections(supabase, {
        type: type && type !== "all" ? type : undefined,
        search: search || undefined,
        page,
        pageSize,
      });

      setData({
        examCollection: {
          data: result.data,
          pageInfo: {
            total: result.pageInfo.total,
          },
        },
      } as any);
    } catch (error) {
      console.error("Error fetching exam collections:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { type, sort, search, page, size: pageSize } = router.query;
    const size = Number(pageSize) || PAGE_SIZE;
    const offset = (Number(page) - 1) * size || 0;
    const params = {
      type,
      sort,
      search,
      offsetPagination: {
        offset,
        size,
      },
    };

    getData(params);
  }, [getData, router.query]);

  const [activeKey, setActiveKey] = useState<string>("reading");

  useEffect(() => {
    if (!data) return;
    const reading = data.examCollection?.data?.reading || [];
    const listening = data.examCollection?.data?.listening || [];
    setActiveKey(
      reading.length === 0 && listening.length > 0
        ? "listening"
        : "reading"
    );
  }, [data]);

  const filterValues = watch();

  useEffect(() => {
    if (!isDirty) return;
    const queryParams = new URLSearchParams(window.location.search);
    Object.keys(filterValues).forEach((key) => {
      const value = filterValues[key as keyof FilterFormValues];
      if (
        value === "all" ||
        !value ||
        value === "newest" ||
        (key === "page" && value === 1) ||
        (key === "size" && value === PAGE_SIZE)
      ) {
        queryParams.delete(key);
      } else {
        queryParams.set(key, value.toString());
      }
    });

    const defaultFilter = _.merge(
      {
        type: "all",
        sort: "newest",
        size: PAGE_SIZE,
      },
      router.query
    );

    const isKeyDifferent = Object.keys(defaultFilter).some(
      (key) =>
        key !== "page" &&
        defaultFilter[key] !== filterValues[key as keyof FilterFormValues]
    );
    if (isKeyDifferent) {
      queryParams.delete("page");
    }

    router.push({ search: queryParams.toString() }, undefined, {
      shallow: true,
    });
  }, [filterValues, isDirty, router]);

  return (
    <FormProvider {...methods}>
      <SEOHeader fullHead={""} title={"IELTS Exam Library"} />

      {/* Hero Banner Section */}
      <div
        className="relative w-full py-12 sm:py-16 md:py-24 flex items-center justify-center"
        style={{
          background:
            heroConfig.backgroundColor ||
            "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
        }}
      >
        <Container className="flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 mb-4 wrap-break-word max-w-full">
            {heroConfig.title}
          </h1>
          <Breadcrumb
            items={[
              {
                title: (
                  <Link href="/" className="wrap-break-word">
                    {heroConfig.breadcrumb.homeLabel}
                  </Link>
                ),
              },
              {
                title: (
                  <span className="wrap-break-word">
                    {heroConfig.breadcrumb.currentLabel}
                  </span>
                ),
              },
            ]}
            className="text-gray-500"
          />
        </Container>
      </div>
      <Container className="space-y-4 pb-20">
        <div className="space-y-2 mt-4">
          <QuizLibraryNav />
          <Filter />
        </div>
        <Spin spinning={loading || !called}>
          <Tabs
            type="card"
            activeKey={activeKey}
            onTabClick={setActiveKey}
            items={[
              {
                key: "reading",
                label: `Reading (${
                  _.sum(
                    (data?.examCollection?.data?.reading || []).map(
                      (item) => item.exams.length
                    )
                  ) || 0
                })`,
                children: (
                  <IELTSExamLibraryTab
                    data={data?.examCollection?.data?.reading}
                    loading={loading || !called}
                  />
                ),
                icon: (
                  <IELTSReadingExamIcon className="inline-block" width={18} />
                ),
              },
              {
                key: "listening",
                label: `Listening (${
                  _.sum(
                    (data?.examCollection?.data?.listening || []).map(
                      (item) => item.exams.length
                    )
                  ) || 0
                })`,
                children: (
                  <IELTSExamLibraryTab
                    data={data?.examCollection?.data?.listening}
                    loading={loading || !called}
                  />
                ),
                icon: (
                  <IELTSListeningExamIcon className="inline-block" width={18} />
                ),
              },
            ]}
          />
          {data && (data.examCollection?.pageInfo?.total || 0) >= PAGE_SIZE && (
            <Pagination
              defaultCurrent={router.query.page ? Number(router.query.page) : 1}
              total={data?.examCollection?.pageInfo?.total || 0}
              pageSize={currentPageSize}
              showSizeChanger={false}
              onChange={(page, pageSize) => {
                setValue("size", pageSize, {
                  shouldDirty: true,
                });
                setValue("page", page, {
                  shouldDirty: true,
                });
              }}
              className="mt-5"
            />
          )}
        </Spin>
      </Container>
    </FormProvider>
  );
};

const IELTSExamLibraryTab = ({
  data,
  loading = true,
}: {
  data?: IExamCollection["data"]["reading" | "listening"];
  loading?: boolean;
}) => {
  return !loading && data?.length ? (
    <div className="space-y-6">
      {data.map((item) => (
        <ExamCollection key={item.id} data={item} loading={loading} />
      ))}
    </div>
  ) : (
    <>
      {loading && !data?.length ? (
        <ExamCollection />
      ) : (
        <div className="min-h-96 flex items-center justify-center">
          <Empty />
        </div>
      )}
    </>
  );
};
