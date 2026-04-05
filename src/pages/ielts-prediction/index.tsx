import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { PracticeLibraryBannerConfig } from "./ui/types";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getQuizFilterOptions } from "~services/quiz";

export { PageIELTSPrediction } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const { resolvedUrl } = context;
    const skill = resolvedUrl.split("/").at(-1);
    const supabase = createServerSupabase(context);

    // Parallel: filter data + banner config
    const [quizFilterData, bannerConfig] = await Promise.all([
      getQuizFilterOptions(supabase).catch(() => ({
        years: [],
        sources: [],
        parts: [],
        quarters: [],
      })),
      readConfig<PracticeLibraryBannerConfig>(supabase, "ielts-prediction/banner").catch(
        () => null
      ),
    ]);

    const defaultBannerConfig: PracticeLibraryBannerConfig = {
      listening: {
        title: "IELTS Prediction Tests",
        description: {
          line1:
            "IELTS Prediction Tests Online miễn phí tại IELTS PREDICTION với đề",
          line2:
            "thi, audio, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          line3: "trải nghiệm làm bài thi thử như trên máy.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
      reading: {
        title: "IELTS Prediction Tests",
        description: {
          line1:
            "IELTS Prediction Tests Online miễn phí tại IELTS PREDICTION với đề",
          line2:
            "thi, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          line3: "trải nghiệm làm bài thi thử như trên máy.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
    };

    return {
      props: {
        quizFilterData: {
          ...quizFilterData,
          // Keep the skill in the response for UI filtering
          skill: skill || null,
        },
        bannerConfig: {
          listening: bannerConfig?.listening ?? defaultBannerConfig.listening,
          reading: bannerConfig?.reading ?? defaultBannerConfig.reading,
        },
      },
    };
  }
);
