import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getPosts } from "~services/post";
import type { Post } from "~services/types/database";
import type { PracticeLibraryBannerConfig } from "@/pages/vit-ielts/ui/types";
import { PageVitIELTS } from "@/pages/vit-ielts/ui";
import { AppShell } from "@/widgets/layouts";

/**
 * General knowledge-sharing blog. Same layout / sidebar / skill filter as
 * /vit-ielts — it just lists posts whose categories contain "Blog"
 * (set in the post editor's "Phân loại" field). Skill, tags, featured and the
 * filtering behaviour are identical.
 */
const BLOG_CATEGORY = "Blog";
const PAGE_SIZE = 100;

const getSingleQueryValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const DEFAULT_BANNER: PracticeLibraryBannerConfig = {
  listening: {
    title: "Blog",
    description: {
      line1: "Tips, strategies and knowledge for IELTS success",
      line2: "updated regularly by VitIELTS.",
      line3: "",
    },
    backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
    button: { text: "", link: "#" },
  },
  reading: {
    title: "Blog",
    description: {
      line1: "Tips, strategies and knowledge for IELTS success",
      line2: "updated regularly by VitIELTS.",
      line3: "",
    },
    backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
    button: { text: "", link: "#" },
  },
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);
    const size = Number(getSingleQueryValue(context.query.size) || PAGE_SIZE);

    const [bannerConfig, postsResult] = await Promise.all([
      readConfig<PracticeLibraryBannerConfig>(supabase, "blog/banner").catch(() => null),
      getPosts(supabase, { category: BLOG_CATEGORY, page: 1, pageSize: size }).catch(
        () => ({ data: [] as Post[], count: 0 }),
      ),
    ]);

    return {
      props: {
        bannerConfig: JSON.parse(
          JSON.stringify({
            listening: bannerConfig?.listening ?? DEFAULT_BANNER.listening,
            reading: bannerConfig?.reading ?? DEFAULT_BANNER.reading,
          }),
        ),
        initialPosts: {
          data: postsResult.data,
          count: postsResult.count,
          pageSize: size,
        },
      },
    };
  },
);

export function PageBlog(props: {
  bannerConfig: PracticeLibraryBannerConfig;
  initialPosts: { data: Post[]; count: number; pageSize: number };
}) {
  return <PageVitIELTS {...props} breadcrumbLabel="Blog" />;
}

PageBlog.Layout = AppShell;
