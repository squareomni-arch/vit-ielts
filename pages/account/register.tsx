import { withGuest, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { RegisterPageConfig } from "@/shared/types/admin-config";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getQuizzes } from "~services/quiz";

export { PageRegister as default } from "@/pages/account/register";

// Wrapper function để đọc register page config từ Supabase
const withRegisterConfig = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabase(context);

  let registerConfig: RegisterPageConfig;
  let totalTests = 920;

  try {
    const config = await readConfig<RegisterPageConfig>(supabase, "account/register");
    registerConfig = {
      backgroundColor: config?.backgroundColor || "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
    };
  } catch {
    registerConfig = {
      backgroundColor: "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
    };
  }

  try {
    const [examRes, listeningRes, readingRes] = await Promise.all([
      getQuizzes(supabase, { type: "exam", pageSize: 1 }).catch(() => ({ count: 0 })),
      getQuizzes(supabase, { skill: "listening", type: "practice", pageSize: 1 }).catch(() => ({ count: 0 })),
      getQuizzes(supabase, { skill: "reading", type: "practice", pageSize: 1 }).catch(() => ({ count: 0 })),
    ]);
    const count = (examRes.count || 0) + (listeningRes.count || 0) + (readingRes.count || 0);
    if (count > 0) totalTests = count;
  } catch (err) {
    console.error("Error fetching register tests count:", err);
  }

  return {
    props: {
      registerConfig,
      totalTests,
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  withGuest,
  withRegisterConfig
);
