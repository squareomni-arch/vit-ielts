import Link from "next/link";
import Image from "next/image";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import dayjs from "dayjs";
import { PostCard } from "@/pages/vit-ielts/ui/post-card";
import type { Post } from "~services/types/database";

type SidebarPost = Pick<
  Post,
  "id" | "title" | "slug" | "featured_image" | "pro_user_only" | "created_at"
>;

function RelatedPost({ relatedPosts }: { relatedPosts: SidebarPost[] }) {
  const fallbackImage = useContentImageFallback();

  if (!relatedPosts.length) return null;

  const featured = relatedPosts[0];

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[#2D3142]">Featured posts</h3>
        <PostCard
          title={featured.title}
          image={featured.featured_image ?? undefined}
          href={`/blog/${featured.slug}`}
          date={featured.created_at ? dayjs(featured.created_at).format("DD/MM/YYYY") : undefined}
          isPro={!!featured.pro_user_only}
        />
      </div>

      {relatedPosts.length > 1 && (
        <div className="space-y-4 mt-8">
          <h3 className="font-bold text-lg text-[#2D3142]">
            You might like
          </h3>

          <div className="space-y-4">
            {relatedPosts.slice(1, 4).map((rel) => (
              <Link
                key={rel.id}
                href={`/blog/${rel.slug}`}
                className="flex gap-3 group items-center"
              >
                <div className="w-[100px] h-[65px] relative rounded-lg overflow-hidden shrink-0 border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
                  <Image
                    src={resolveContentImage(rel.featured_image ?? undefined, fallbackImage)}
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
