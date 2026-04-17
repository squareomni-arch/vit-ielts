import type { SEOType } from "@/shared/types";

export const GET_SAMPLE_ESSAYS = "";

export type GET_SAMPLE_ESSAY_VARIABLES = {
  skill?: "speaking" | "writing" | "reading" | "listening";
  orderby?: {
    field: string;
    order: string;
  }[];
  quarter?: string;
  questionType?: string;
  search?: string;
  year?: string;
  offsetPagination?: {
    offset: number;
    size: number;
  };
};

export type SampleEssay = {
  id: string;
  slug: string;
  title: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  sampleEssayFields: {
    quarter: [string, string];
  };
  speakingSampleEssayFields: {
    part: [string, string];
    questionType: [string, string];
  };
  writingSampleEssayFields: {
    topic: [string, string];
    task: [string, string];
  };
  hasAccess: boolean;
  postMeta: {
    views: number;
    proUserOnly: boolean;
  };
};

export type SampleEssayResponse = {
  sampleEssayType: {
    sampleEssays: {
      edges: {
        node: SampleEssay;
      }[];
      pageInfo: {
        offsetPagination: {
          total: number;
          hasMore: boolean;
          hasPrevious: boolean;
        };
      };
    };
    seo: SEOType;
  };
};

export const GET_FILTER_DATA = "";

export type GET_FILTER_DATA_RESPONSE = {
  sampleSources: {
    nodes: {
      name: string;
      slug: string;
    }[];
  };
  annualPeriods: {
    nodes: {
      name: string;
      slug: string;
    }[];
  };
};

export const GET_SAMPLE_ESSAY_BY_SLUG = "";

export type SingleSampleEssay = {
  id: string;
  slug: string;
  title: string;
  date: string;
  skill?: string | null;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  sampleEssayFields: {
    quarter: [string, string];
  };
  speakingSampleEssayFields: {
    part: [string, string];
    questionType: string[];
  };
  writingSampleEssayFields: {
    topic: string[];
    task: [string, string];
  };
  postMeta: {
    views: number;
    proUserOnly: boolean;
  };
  content: string;
  seo: SEOType;
  hasAccess: boolean;
};

export type GET_SAMPLE_ESSAY_BY_SLUG_VARIABLES = {
  id: string;
};

export type GET_SAMPLE_ESSAY_BY_SLUG_RESPONSE = {
  sampleEssay: SingleSampleEssay;
};
