import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";
import {
  getServerSideProps as getServerSidePropsArchive,
  PageArchive,
} from "@/pages/post-archive";
import {
  getServerSideProps as getServerSidePropsSingle,
  PageSingle,
} from "@/pages/post-single";
import { ComponentProps } from "react";
import {
  getServerSidePropsArchive as getServerSidePropsSampleEssayArchive,
  PageArchive as PageSampleEssayArchive,
  PageSingle as PageSampleEssaySingle,
  getServerSidePropsSingle as getServerSidePropsSampleEssaySingle,
} from "@/pages/sample-essay";
import { createServerSupabase } from "~supabase/server";

const PageHandler = (props: {
  category?: unknown;
  sampleEssays?: unknown;
  post?: unknown;
  sampleEssay?: unknown;
}) => {
  return (
    <>
      {props.category && (
        <PageArchive {...(props as ComponentProps<typeof PageArchive>)} />
      )}
      {props.post && (
        <PageSingle {...(props as ComponentProps<typeof PageSingle>)} />
      )}
      {props.sampleEssay && (
        <PageSampleEssaySingle
          {...(props as ComponentProps<typeof PageSampleEssaySingle>)}
        />
      )}
      {props.sampleEssays && (
        <PageSampleEssayArchive
          {...(props as ComponentProps<typeof PageSampleEssayArchive>)}
        />
      )}
    </>
  );
};

export default PageHandler;

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context) => {
    const slug =
      context.query.slug?.at(-2) === "page"
        ? context.query.slug?.at(-3)
        : context.query.slug?.at(-1);

    if (!slug) {
      return {
        redirect: {
          destination: "/",
          statusCode: 302,
        },
      };
    }

    // Handle known sample essay routes
    if (slug === "ielts-speaking-sample") {
      return getServerSidePropsSampleEssayArchive(context, "speaking");
    } else if (slug === "ielts-writing-sample") {
      return getServerSidePropsSampleEssayArchive(context, "writing");
    }

    // Resolve slug against Supabase tables
    const supabase = createServerSupabase(context);

    // 1. Check if slug is a post
    const { data: post } = await supabase
      .from("posts")
      .select("slug")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (post) {
      return getServerSidePropsSingle(context, slug);
    }

    // 2. Check if slug is a sample essay
    const { data: essay } = await supabase
      .from("sample_essays")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (essay) {
      return getServerSidePropsSampleEssaySingle(context, slug);
    }

    // 3. Check if slug matches a post category
    const { data: categoryPosts } = await supabase
      .from("posts")
      .select("id")
      .contains("categories", [slug])
      .eq("status", "published")
      .limit(1);

    if (categoryPosts && categoryPosts.length > 0) {
      return getServerSidePropsArchive(context, slug);
    }

    // Nothing found
    return {
      notFound: true,
    };
  }
);
