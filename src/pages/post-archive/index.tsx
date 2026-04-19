import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getPosts } from "~services/post";
import type { Post, VoteEntry } from "~services/types/database";

export { PageArchive } from "./ui";

/** Transform a Supabase Post into the legacy IPost shape expected by the UI */
function mapToIPost(post: Post) {
  const votes: VoteEntry[] = (post.votes as VoteEntry[]) ?? [];
  const totalRate = votes.reduce((sum, v) => sum + v.rate, 0);
  const avgRate = votes.length > 0 ? totalRate / votes.length : 0;

  return {
    id: post.id,
    databaseId: 0,
    link: `/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt || "",
    content: post.content || "",
    date: post.published_at || post.created_at,
    hasAccess: true,
    featuredImage: post.featured_image
      ? {
          node: {
            sourceUrl: post.featured_image,
            altText: post.title,
          },
        }
      : undefined,
    categories: {
      edges: (post.categories || []).map((cat: string) => ({
        node: {
          link: `/${cat.toLowerCase().replace(/\s+/g, "-")}`,
          name: cat,
          id: cat,
        },
        isPrimary: false,
      })),
    },
    seo: post.seo as Record<string, unknown> || {},
    postMeta: {
      proUserOnly: post.pro_user_only || false,
      views: post.views || 0,
    },
    rating: {
      rate: Math.round(avgRate * 10) / 10,
      count: votes.length,
    },
  };
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
  category: string
): ReturnType<GetServerSideProps> => {
  const pageSize = 12;
  const paged =
    context.query.slug?.at(-2) === "page" ? context.query.slug.at(-1) : 1;

  const supabase = createServerSupabase(context);

  let result: Awaited<ReturnType<typeof getPosts>>;
  try {
    result = await getPosts(supabase, { category, page: Number(paged), pageSize });
  } catch (error) {
    console.error("Error fetching posts archive:", error);
    return { notFound: true };
  }

  return {
    props: {
      category: {
        slug: category,
        link: `/${category.toLowerCase().replace(/\s+/g, "-")}`,
        seo: {
          title: category,
          breadcrumbs: [
            { text: "Home", url: "/" },
            { text: category, url: `/${category.toLowerCase().replace(/\s+/g, "-")}` },
          ],
        },
      },
      posts: {
        edges: result.data.map((post) => ({ node: mapToIPost(post) })),
        pageInfo: {
          offsetPagination: {
            total: result.count,
            hasMore: Number(paged) < result.totalPages,
            hasPrevious: Number(paged) > 1,
          },
        },
      },
      paged: Number(paged),
      pageSize,
    },
  };
};

