import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { ExamLibraryHeroConfig } from "./ui/types";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";

export { PageIELTSExamLibrary } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);

    let heroConfig: ExamLibraryHeroConfig;

    try {
      const config = await readConfig<ExamLibraryHeroConfig>(
        supabase,
        "ielts-exam-library/hero-banner"
      );
      heroConfig = config ?? {
        title: "IELTS Reading Practice Tests",
        breadcrumb: {
          homeLabel: "Trang chủ",
          currentLabel: "Reading",
          items: [
            { label: "Trang chủ", href: "/" },
            { label: "Reading" },
          ],
        },
      };
    } catch {
      heroConfig = {
        title: "IELTS Reading Practice Tests",
        breadcrumb: {
          homeLabel: "Trang chủ",
          currentLabel: "Reading",
          items: [
            { label: "Trang chủ", href: "/" },
            { label: "Reading" },
          ],
        },
      };
    }

    return {
      props: {
        heroConfig,
      },
    };
  }
);
