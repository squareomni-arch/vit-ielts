import { IPost } from "@/shared/types";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "antd";
import { useEffect, useState } from "react";
import { createClient } from "~supabase/client";
import { getPosts } from "~services/post";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import dayjs from "dayjs";
import { PostCard } from "@/pages/ielts-prediction/ui/post-card";

function RelatedPost({ post }: { post: IPost }) {
  const fallbackImage = useContentImageFallback();
  const [relatedPosts, setRelatedPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const supabase = createClient();
        const result = await getPosts(supabase, {
          page: 1,
          pageSize: 7,
        });
        // Map and filter out current post
        const mapped = (result.data || []).filter((p: any) => p.id !== post.id).map((p: any) => ({
          ...p,
          id: p.id,
          title: p.title,
          slug: p.slug,
          date: p.created_at,
          content: p.content || "",
          link: `/blog/${p.slug}`,
          featuredImage: p.featured_image
            ? { node: { sourceUrl: p.featured_image, altText: p.title } }
            : undefined,
          categories: { edges: p.categories?.map((c: any) => ({ node: { name: c.name, link: `/category/${c.slug}` } })) || [] },
          postMeta: { views: p.views || 0, proUserOnly: p.pro_user_only || false },
        })) as unknown as IPost[];
        setRelatedPosts(mapped);
      } catch (error) {
        console.error("Error fetching related posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [post.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#2D3142]">Bài viết nổi bật</h3>
        <Skeleton.Image active className="!w-full !h-[200px]" />
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (!relatedPosts.length) {
    return null;
  }

  return (
    <>
      {relatedPosts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#2D3142]">
            Bài viết nổi bật
          </h3>
          <PostCard
            title={relatedPosts[0].title}
            image={relatedPosts[0].featuredImage?.node?.sourceUrl}
            href={relatedPosts[0].link}
            date={relatedPosts[0].date ? dayjs(relatedPosts[0].date).format("DD/MM/YYYY") : undefined}
            isPro={relatedPosts[0].postMeta?.proUserOnly}
          />
        </div>
      )}

      {relatedPosts.length > 1 && (
        <div className="space-y-4 mt-8">
          <h3 className="font-bold text-lg text-[#2D3142]">
            Có thể bạn quan tâm
          </h3>

          <div className="space-y-4">
            {relatedPosts.slice(1, 7).map((rel, idx) => (
              <Link
                key={idx}
                href={rel.link}
                className="flex gap-3 group items-center"
              >
                <div className="w-[100px] h-[65px] relative rounded-lg overflow-hidden shrink-0 border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
                  <Image
                    src={resolveContentImage(rel.featuredImage?.node?.sourceUrl, fallbackImage)}
                    alt={rel.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
                <h4 className="text-sm font-semibold text-[#2D3142] group-hover:text-primary-500 line-clamp-3 transition-colors">
                  {rel.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default RelatedPost;
