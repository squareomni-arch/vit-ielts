import Link from "next/link";
import { Options, Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Empty, Skeleton } from "antd";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  PracticeTestItem,
} from "@/entities/practice-test";
import { createClient } from "~supabase/client";
import { getQuizzes } from "~services/quiz";

type Props = {
  title: string;
  view_more?: false | string;
  skill?: "listening" | "reading";
  limit?: number;
  sliderOptions?: Options;
  view_more_link?: string;
};

const defaultSliderOptions: Options = {
  type: "slide",
  perPage: 4,
  perMove: 2,
  gap: "24px",
  drag: "free",
  pagination: false,
  arrows: true,
  breakpoints: {
    850: {
      perPage: 2,
      padding: {
        right: "25%",
      },
    },
    550: {
      perPage: 1,
    },
  },
};

export const PracticeTest = ({
  title,
  view_more = "View more",
  view_more_link = "#",
  skill = "reading",
  limit = 8,
  sliderOptions: inputSliderOptions = {},
}: Props) => {
  const sliderOptions = useMemo(
    () => _.merge(defaultSliderOptions, inputSliderOptions),
    [inputSliderOptions]
  );
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const supabase = createClient();
        const result = await getQuizzes(supabase, {
          skill,
          page: 1,
          pageSize: limit,
        });
        // Map to legacy edge format for PracticeTestItem
        setQuizzes(
          (result.data || []).map((q: any) => ({
            node: {
              id: q.id,
              title: q.title,
              slug: q.slug,
              excerpt: q.excerpt || "",
              link: `/ielts-practice-library/${q.slug}`,
              featuredImage: q.featured_image
                ? { node: { sourceUrl: q.featured_image, altText: q.title } }
                : undefined,
              quizFields: {
                testsTaken: q.tests_taken || 0,
                proUserOnly: q.pro_user_only,
                skill: [q.skill, q.skill],
                type: [q.type, q.type],
                time: q.time_minutes,
              },
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching practice tests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [skill, limit]);

  return (
    <article className="space-y-6">
      <header className="flex items-center mb-[30px]">
        <h3 className="text-2xl md:text-3xl font-extrabold flex-auto">
          {title}
        </h3>
        {view_more && (
          <Link
            href={view_more_link}
            title={view_more}
            className="flex items-center group text-[15px] capitalize"
          >
            <span className="font-bold mr-2.5 group-hover:underline hidden md:block">
              {view_more}
            </span>
            <span className="material-symbols-rounded hidden! md:block!">
              chevron_right
            </span>
            <div className="md:hidden p-2 bg-gray-200 rounded-full">
              <span className="material-symbols-rounded block!">
                arrow_forward
              </span>
            </div>
          </Link>
        )}
      </header>
      {loading ? (
        <Splide options={sliderOptions} tag="section">
          {Array.from({ length: sliderOptions.perPage! }).map((_, index) => (
            <SplideSlide key={index}>
              <Skeleton active key={index} />
            </SplideSlide>
          ))}
        </Splide>
      ) : (
        <>
          {quizzes.length ? (
            <Splide options={sliderOptions} tag="section">
              {quizzes.map(({ node: item }: any) => (
                <SplideSlide key={item.id}>
                  <PracticeTestItem item={item} />
                </SplideSlide>
              ))}
            </Splide>
          ) : (
            <Empty />
          )}
        </>
      )}
    </article>
  );
};
