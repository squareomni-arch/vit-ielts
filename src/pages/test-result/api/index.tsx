import type { SEOType } from "@/shared/types";

export const GET_TEST_RESULT = "";

export type ITestResult = {
  id: string;
  testResultFields: {
    answers: string;
    dateSubmitted: string;
    dateTaken: string;
    score: number;
    quiz: {
      node: {
        id: string;
      };
    };
    testPart: string;
    testTime: number;
    timeLeft: string;
  };
  status: "publish" | "draft";
  authorId: string;
};

export type ITestResultResponse = {
  testResult: ITestResult;
};

export type ITestResultVariables = {
  id: string;
};

// =================== QUERY ĐÃ ĐƯỢC CẬP NHẬT ===================
export const GET_PRACTICE_SINGLE = "";
// =============================================================

export type IPracticeSingleResponse = {
  quiz: IPracticeSingle;
};

export type IPracticeSingle = {
  id: string;
  title: string;
  excerpt: string;
  seo: SEOType;
  link: string;
  slug: string;
  author: {
    node: {
      name: string;
    };
  };
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  quizFields: {
    testsTaken: number;
    proUserOnly: boolean;
    type: [string, string];
    skill: [string, string];
    time: number;
    scoreType: [string, string];
    audio?: {
      node: {
        id: string;
        mediaItemUrl: string;
      };
    };
    passages: {
      title: string;
      passage_content: string;
      audio_start?: string;
      audio_end?: string;
      questions: (IQuestion & {
        startIndex?: number;
      })[];
    }[];
  };
};

export type IQuestion = {
  question_form: [string, string];
  title: string;
  type: [string, string];
  question?: string;
  instructions?: string;
  list_of_questions?: {
    question: string;
    options: {
      content: string;
    }[];
    correct: number;
  }[];
  list_of_options?: {
    option: string;
    correct?: boolean;
  }[];
  explanations: {
    content: string;
  }[];
  optionChoose?: number | string;
  matchingQuestion?: {
    layoutType?: 'standard' | 'summary' | 'heading' | 'list';
    summaryText?: string;
    matchingItems?: {
      questionPart: string;
      correctAnswer: string;
    }[];
    answerOptions?: {
      optionText: string;
    }[];
  };
  matrixQuestion?: {
    matrixCategories: {
      categoryLetter: string;
      categoryText: string;
    }[];
    matrixItems: {
      itemText: string;
      correctCategoryLetter: string;
    }[];
    layoutType?: "standard" | "simple";
    legendTitle?: string;
  };
};

export const GET_USER = "";

export type IUser = {
  name: string;
  userData: {
    avatar?: {
      node: {
        mediaDetails: {
          sizes: Array<{
            sourceUrl: string;
            width: string;
          }>;
        };
        srcSet: string;
      };
    };
  };
};

export type IUserResponse = {
  user: IUser;
};
