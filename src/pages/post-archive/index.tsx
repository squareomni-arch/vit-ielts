import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getPosts } from "~services/post";

export { PageArchive } from "./ui";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
  category: string
): ReturnType<GetServerSideProps> => {
  const pageSize = 12;
  const paged =
    context.query.slug?.at(-2) === "page" ? context.query.slug.at(-1) : 1;

  const supabase = createServerSupabase(context);

  const result = await getPosts(supabase, {
    category,
    page: Number(paged),
    pageSize,
  });

  return {
    props: {
      category: { slug: category },
      posts: {
        edges: result.data.map((post) => ({ node: post })),
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
