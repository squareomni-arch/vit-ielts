import Link from "next/link";
import { Options, Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Skeleton } from "antd";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { DefaultView } from "@/pages/sample-essay/ui/archive/single-item";
import { createClient } from "~supabase/client";
import { getSampleEssays } from "~services/sample-essay";

type Props = {
  title: string;
  view_more?: false | string;
  skill?: "speaking" | "writing";
  limit?: number;
  sliderOptions?: Options;
  view_more_link?: string;
};

const defaultSliderOptions: Options = {
  type: "slide",
  perPage: 4,
  perMove: 1,
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

export const SampleEssaysSlider = ({
  title,
  view_more = "View more",
  view_more_link = "#",
  skill = "speaking",
  limit = 4,
  sliderOptions: inputSliderOptions = {},
}: Props) => {
  const sliderOptions = useMemo(
    () => _.merge(defaultSliderOptions, inputSliderOptions),
    [inputSliderOptions]
  );
  const [loading, setLoading] = useState(true);
  const [essays, setEssays] = useState<any[]>([]);

  useEffect(() => {
    const fetchEssays = async () => {
      try {
        const supabase = createClient();
        const result = await getSampleEssays(supabase, {
          skill,
          page: 1,
          pageSize: limit,
        });
        // Map to legacy edge format for DefaultView
        setEssays(
          (result.data || []).map((essay: any) => ({
            node: {
              id: essay.id,
              title: essay.title,
              slug: essay.slug,
              excerpt: essay.excerpt || "",
              link: `/sample-essay/${essay.slug}`,
              featuredImage: essay.featured_image
                ? { node: { sourceUrl: essay.featured_image, altText: essay.title } }
                : undefined,
              sampleEssayType: {
                nodes: [{ name: essay.skill || skill }],
              },
              sampleEssayFields: {
                part: essay.part || "",
                topic: essay.topic || "",
              },
              postMeta: {
                proUserOnly: essay.pro_user_only ?? false,
              },
              speakingSampleEssayFields: skill === "speaking" ? {
                part: essay.part ? [essay.part, essay.part.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())] : ["part-1", "Part 1"],
                questionType: essay.question_type ? (Array.isArray(essay.question_type) ? essay.question_type : [essay.question_type]) : [],
              } : undefined,
              writingSampleEssayFields: skill === "writing" ? {
                task: essay.task ? [essay.task, essay.task.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())] : ["task-1", "Task 1"],
                topic: essay.topic ? (Array.isArray(essay.topic) ? essay.topic : [essay.topic]) : [],
              } : undefined,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching sample essays:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEssays();
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
      <Splide options={sliderOptions} tag="section">
        {loading ? (
          Array.from({ length: sliderOptions.perPage! }).map((_, index) => (
            <SplideSlide key={index}>
              <Skeleton active key={index} />
            </SplideSlide>
          ))
        ) : (
          <>
            {essays.length ? (
              essays.map((item, index) => (
                <SplideSlide key={index}>
                  <div className="p-0.5 h-full">
                    <DefaultView post={item} skill={skill} />
                  </div>
                </SplideSlide>
              ))
            ) : (
              <>{""}</>
            )}
          </>
        )}
      </Splide>
    </article>
  );
};
