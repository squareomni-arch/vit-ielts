import Link from "next/link";
import { Options, Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Skeleton } from "antd";
import Image from "next/image";
import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "~supabase/client";
import { getPosts } from "~services/post";

type Props = {
  title: string;
  view_more?: false | string;
  categoryIds?: number[];
  tagIds?: number[];
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

export const BlogPost = ({
  title,
  view_more = "View more",
  view_more_link = "#",
  categoryIds,
  tagIds,
  limit = 4,
  sliderOptions: inputSliderOptions = {},
}: Props) => {
  const sliderOptions = useMemo(
    () => _.merge(defaultSliderOptions, inputSliderOptions),
    [inputSliderOptions]
  );
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const supabase = createClient();
        const result = await getPosts(supabase, {
          page: 1,
          pageSize: limit,
        });
        // Map to legacy edge format
        setPosts(
          (result.data || []).map((post: any) => ({
            node: {
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || "",
              link: `/blog/${post.slug}`,
              featuredImage: post.featured_image
                ? { node: { sourceUrl: post.featured_image, altText: post.title } }
                : undefined,
            },
          }))
        );
      } catch (error) {
        console.error("Error fetching blog posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [limit]);

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
            {posts.length ? (
              posts.map(({ node: item }, index) => (
                <SplideSlide key={index}>
                  <div className="space-y-3 h-full flex flex-col">
                    <Link href={item.link} title={item.title} className="block">
                      <div className="relative overflow-hidden aspect-[3/2] bg-gray-200 rounded-lg">
                        <Image
                          src={
                            item.featuredImage?.node.sourceUrl ||
                            "https://placehold.co/600x400"
                          }
                          alt={item.featuredImage?.node.altText || item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </Link>
                    <div className="space-y-1">
                      <Link
                        href={item.link}
                        title={item.title}
                        className="block"
                      >
                        <h4 className="text-base sm:text-xl hover:underline font-semibold line-clamp-2">
                          {item.title}
                        </h4>
                      </Link>
                      <p
                        className="text-gray-500 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: item.excerpt }}
                      ></p>
                    </div>
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
