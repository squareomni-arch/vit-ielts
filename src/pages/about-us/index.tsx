import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";
import type { WhyChooseUsConfig } from "@/pages/home/ui/why-choose-us/types";
import type { TestimonialsConfig } from "@/pages/home/ui/testimonials/types";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";

export { PageAboutUs } from "./ui";

const withAboutUsConfigs = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  const supabase = createServerSupabase(context);

  const [whyChooseUsConfig, testimonialsConfig] = await Promise.all([
    readConfig<WhyChooseUsConfig>(supabase, "home/why-choose-us").catch(() => null),
    readConfig<TestimonialsConfig>(supabase, "home/testimonials").catch(() => null),
  ]);

  return {
    props: {
      whyChooseUsConfig: whyChooseUsConfig ?? {},
      testimonialsConfig: testimonialsConfig ?? {},
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  withAboutUsConfigs
);
