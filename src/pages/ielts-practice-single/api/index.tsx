import type { SEOType } from "@/shared/types";

export const GET_PRACTICE_SINGLE = "";

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
  hasAccess: boolean;
  relatedPracticeQuizzes: {
    id: string;
    databaseId: number;
    title: string;
    featuredImage: false | string;
    excerpt: string;
    slug: string;
  }[];
  author: {
    node: {
      userData: {
        avatar?: {
          node: {
            sourceUrl: string;
          };
        };
      };
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
    type: ["academic" | "general" | "practice", string];
    skill: ["reading" | "listening", string];
    time: number;
    scoreType: ["band", string] | ["percentage", string];
    audio?: {
      node: {
        id: string;
        mediaItemUrl: string;
        databaseId: number;
      };
    };
    passages: {
      title: string;
      passage_content: string;
      audio_start?: string;
      audio_end?: string;
      start_question_number?: number;
      questions: {
        startIndex?: number;
        question_form: [
          (
            | "summary_completion"
            | "true_false_not_given"
            | "multiple_choice"
            | "matching_paragraph_information"
            | "matching_name"
            | "yes_no_not_given"
            | "matching_headings"
            | "sentence_completion"
            | "list_selection"
            | "short_answer"
            | "matching_sentence_endings"
            | "table_completion"
            | "diagram_completion"
            | "flow_chart_completion"
            | "choose_a_title"
            | "uncategorized"
          ),
          string
        ];
        title: string;
        type: [
          "fillup" | "radio" | "select" | "checkbox" | "matching" | "matrix",
          string
        ];
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
          optionsTitle?: string;
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
      }[];
    }[];
    pdf?: {
      node: {
        id: string;
        mediaItemUrl: string;
        databaseId: number;
      };
    };
  };
};