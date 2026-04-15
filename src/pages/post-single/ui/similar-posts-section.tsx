"use client";

import { useEffect, useState } from "react";
import { Container } from "@/shared/ui";
import { Spinner } from "@/shared/ui/ds/atoms/spinner";
import { createClient } from "~supabase/client";
import { getPosts } from "~services/post";
import dayjs from "dayjs";
import Link from "next/link";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import { PostCard } from "@/pages/ielts-prediction/ui/post-card";

// ─── Types ──────────────────────────────────────────────────────────────────

type SimilarPost = {
  id: string | number;
  title: string;
  link: string;
  date: string;
  featuredImage?: string;
  isPro: boolean;
};

function mapToSimilarPost(p: any, fallbackImage: string): SimilarPost {
  return {
    id: p.id,
    title: p.title,
    link: `/blog/${p.slug}`,
    date: p.created_at ? dayjs(p.created_at).format("DD/MM/YYYY") : "",
    featuredImage: resolveContentImage(p.featured_image, fallbackImage),
    isPro: p.pro_user_only || false,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  currentPostId: string | number;
  /** Categories of the current post — used to find same-tag articles */
  categories: string[];
};

export function SimilarPostsSection({ currentPostId, categories }: Props) {
  const fallbackImage = useContentImageFallback();
  const [posts, setPosts] = useState<SimilarPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const supabase = createClient();
        const primaryCategory = categories?.[0];

        if (primaryCategory) {
          // 1️⃣ Fetch posts in the same category
          const byCat = await getPosts(supabase, {
            category: primaryCategory,
            page: 1,
            pageSize: 8,
          });

          const sameCat = (byCat.data || []).filter(
            (p: any) => String(p.id) !== String(currentPostId)
          );

          if (sameCat.length >= 4) {
            setPosts(sameCat.slice(0, 4).map((p: any) => mapToSimilarPost(p, fallbackImage)));
            return;
          }

          // 2️⃣ Not enough — pad with latest posts
          const byLatest = await getPosts(supabase, { page: 1, pageSize: 12 });
          const usedIds = new Set([
            String(currentPostId),
            ...sameCat.map((p: any) => String(p.id)),
          ]);
          const extras = (byLatest.data || []).filter(
            (p: any) => !usedIds.has(String(p.id))
          );

          const combined = [...sameCat, ...extras].slice(0, 4);
          setPosts(combined.map((p: any) => mapToSimilarPost(p, fallbackImage)));
        } else {
          // 3️⃣ No category — show latest posts
          const result = await getPosts(supabase, { page: 1, pageSize: 9 });
          const mapped = (result.data || [])
            .filter((p: any) => String(p.id) !== String(currentPostId))
            .slice(0, 4)
            .map((p: any) => mapToSimilarPost(p, fallbackImage));
          setPosts(mapped);
        }
      } catch (err) {
        console.error("SimilarPostsSection: fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPostId, categories, fallbackImage]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <section data-section="similar-posts" className="py-12 bg-[#F8F9FA]">
        <Container>
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        </Container>
      </section>
    );
  }

  if (!posts.length) return null;

  return (
    // === SECTION: Similar Posts ===
    <section data-section="similar-posts" className="py-12 bg-[#F8F9FA]">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-[#2D3142] font-noto-sans">
            Bài viết tương tự
          </h2>
          <Link
            href="/blog"
            className="text-sm font-semibold text-primary-500 hover:text-primary-300 transition-colors flex items-center gap-1"
          >
            Tất cả bài viết
            <span className="material-symbols-rounded text-base leading-none">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Grid — 4 columns, PostCard style from ielts-prediction page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              href={post.link}
              image={post.featuredImage}
              title={post.title}
              date={post.date}
              isPro={post.isPro}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
