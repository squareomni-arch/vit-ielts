import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { PracticeLibraryBannerConfig } from "./ui/types";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getPosts } from "~services/post";
import type { Post } from "~services/types/database";

export { PageIELTSPrediction } from "./ui";

// The blog redesign groups all posts by skill on a single page (featured hero
// + per-skill sections) with client-side filtering, so we fetch a large batch
// up front instead of paginating 9 at a time.
const PAGE_SIZE = 100;

const getSingleQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);
    const { query } = context;

    const size = Number(getSingleQueryValue(query.size) || PAGE_SIZE);
    const page = Number(getSingleQueryValue(query.page) || 1);
    const search = getSingleQueryValue(query.search) || undefined;

    const [bannerConfig, postsResult] = await Promise.all([
      readConfig<PracticeLibraryBannerConfig>(supabase, "vit-ielts/banner").catch(
        () => null
      ),
      getPosts(supabase, {
        category: "Vit IELTS",
        search,
        page,
        pageSize: size,
      }).catch(() => ({ data: [] as Post[], count: 0 })),
    ]);

    const defaultBannerConfig: PracticeLibraryBannerConfig = {
      listening: {
        title: "Vit IELTS Tests",
        description: {
          line1:
            "Free Vit IELTS Practice Tests online at VitIELTS — with full",
          line2:
            "tests, audio, transcripts, answer keys, detailed vocabulary explanations and",
          line3: "a computer-based test experience.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Learn more",
          link: "#",
        },
      },
      reading: {
        title: "Vit IELTS Tests",
        description: {
          line1:
            "Free Vit IELTS Practice Tests online at VitIELTS — with full",
          line2:
            "tests, transcripts, answer keys, detailed vocabulary explanations and",
          line3: "a computer-based test experience.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Learn more",
          link: "#",
        },
      },
    };

    return {
      props: {
        bannerConfig: {
          listening: bannerConfig?.listening ?? defaultBannerConfig.listening,
          reading: bannerConfig?.reading ?? defaultBannerConfig.reading,
        },
        initialPosts: {
          data: postsResult.data,
          count: postsResult.count,
          pageSize: size,
        },
      },
    };
  }
);
