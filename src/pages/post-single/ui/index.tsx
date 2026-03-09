import { Container } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { Breadcrumb, Card } from "antd";
import Link from "next/link";
import { IPost } from "@/shared/types";
import Image from "next/image";
import { StarRating } from "@/entities";
import dayjs from "dayjs";
import { useCallback, useEffect } from "react";
import SharePost from "./share-post";
import RelatedPost from "./related-post";
import { decode } from "html-entities";
import { createClient } from "~supabase/client";

export const PageSingle = ({ post }: { post: IPost }) => {
  // Increment view count via Supabase
  const incrementViews = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.rpc("increment_post_views", { post_id: post.id });
    } catch (err) {
      // Silently fail — view counting is not critical
      console.warn("Failed to increment views:", err);
    }
  }, [post.id]);

  const breadcrumbItems = (post.seo?.breadcrumbs || []).map((item, index) => ({
    title:
      index === (post.seo?.breadcrumbs?.length ?? 0) - 1 ? (
        decode(item.text)
      ) : (
        <Link href={item.url}>{decode(item.text)}</Link>
      ),
  }));

  const readingTime = Math.ceil(post.content.length / 200);

  useEffect(() => {
    const thirtyPercentOfReadTime = readingTime * 0.3;
    const timeout = setTimeout(async () => {
      await incrementViews();
    }, thirtyPercentOfReadTime * 1000);

    return () => clearTimeout(timeout);
  }, [post.id, readingTime, incrementViews]);

  return (
    <>
      <SEOHeader fullHead={post.seo.fullHead} title={post.seo.title} />
      <Container>
        <div className="flex -m-4 flex-wrap justify-center">
          <div className="p-4 md:w-8/12 w-full">
            <div className="py-5">
              <Breadcrumb items={breadcrumbItems} />
            </div>
            <div className="pb-5 space-y-6">
              <Card classNames={{ body: "p-4" }}>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={
                      post.featuredImage?.node.sourceUrl ||
                      "https://placehold.co/600x400"
                    }
                    alt={post.featuredImage?.node.altText || post.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="mt-5 space-y-1.5">
                  <h1 className="text-xl font-semibold text-red-800">
                    {post.title}
                  </h1>
                  <div className="flex justify-between">
                    <StarRating post={post} />
                    <div className="flex gap-x-2">
                      <p className="text-xs text-gray-600 flex items-center space-x-1">
                        <span className="material-symbols-rounded text-lg! leading-none!">
                          visibility
                        </span>
                        <span>{post.postMeta.views || 0}</span>
                      </p>
                      <p className="text-xs text-gray-600 flex items-center space-x-1">
                        <span className="material-symbols-rounded text-lg! leading-none!">
                          calendar_month
                        </span>
                        <span>{dayjs(post.date).format("DD/MM/YYYY")}</span>
                      </p>
                    </div>
                  </div>
                  {post.categories?.edges?.length > 0 && (
                    <div className="flex items-center text-xs font-nunito flex-wrap gap-x-2 gap-y-1">
                      <span className="material-symbols-rounded filled text-red-800 text-3xl!">
                        shoppingmode
                      </span>
                      {post.categories?.edges?.map(({ node }, index) => (
                        <Link
                          href={node.link}
                          key={index}
                          className="block bg-gray-200 rounded-full font-extrabold text-gray-500 hover:text-red-800 duration-150"
                        >
                          <span className="px-3 py-1 block">{node.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  className="prose max-w-none mt-4"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                ></div>
              </Card>
              <div className="p-4">
                <SharePost />
              </div>
              <Card>
                <RelatedPost post={post} />
              </Card>
              {/* <Card><CommentSection post={post} /></Card> */}
            </div>
          </div>
          {/* <div className="p-4 md:w-4/12 w-full">
            <div className="h-full"></div>
          </div> */}
        </div>
      </Container>
    </>
  );
};
