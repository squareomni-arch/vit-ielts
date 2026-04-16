import { IPracticeSingle } from "@/pages/ielts-practice-single/api";

export const GET_EXAM_COLLECTIONS = "";

export type IExamCollection = {
  data: {
    reading: Array<{
      id: string;
      title: string;
      exams: Array<{
        id: string;
        title: string;
        featuredImage?: string;
        link: string;
        slug: string;
        quizFields: IPracticeSingle["quizFields"] & { scoreType?: string | null };
      }>;
    }>;
    listening: Array<{
      id: string;
      title: string;
      exams: Array<{
        id: string;
        title: string;
        featuredImage?: string;
        link: string;
        slug: string;
        quizFields: IPracticeSingle["quizFields"] & { scoreType?: string | null };
      }>;
    }>;
  };
  pageInfo: {
    total: number;
    currentPage: number;
  };
};

export type IExamCollectionResponse = {
  examCollection: IExamCollection;
};

export const TAKE_THE_TEST = "";

export type TakeTheTestResponse = {
  takeTheTest: {
    data: {
      id: string;
      quiz: number;
      test_part: string;
      test_time: string;
    };
  };
};

export type TakeTheTestVariables = {
  quizId: string;
  testPart: string;
  testTime: number;
  testMode: string;
};
