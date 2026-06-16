import { Container } from "@/shared/ui";
import dayjs from "dayjs";
import Link from "next/link";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import { PostCard } from "@/pages/vit-ielts/ui/post-card";
import type { Post } from "~services/types/database";

type Props = {
  posts: Pick<Post, "id" | "title" | "slug" | "featured_image" | "pro_user_only" | "created_at">[];
};

export function SimilarPostsSection({ posts }: Props) {
  const fallbackImage = useContentImageFallback();

  if (!posts.length) return null;

  return (
    // === SECTION: Similar Posts ===
    <section data-section="similar-posts" className="py-12 bg-[#F8F9FA]">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-[#2D3142] font-noto-sans">
            Similar posts
          </h2>
          <Link
            href="/blog"
            className="text-sm font-semibold text-primary-500 hover:text-primary-300 transition-colors flex items-center gap-1"
          >
            All posts
            <span className="material-symbols-rounded text-base leading-none">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Grid — 4 columns, PostCard style from vit-ielts page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              href={`/blog/${post.slug}`}
              image={resolveContentImage(post.featured_image, fallbackImage)}
              title={post.title}
              date={post.created_at ? dayjs(post.created_at).format("DD/MM/YYYY") : ""}
              isPro={!!post.pro_user_only}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
