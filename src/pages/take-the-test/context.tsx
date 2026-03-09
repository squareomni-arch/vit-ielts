// file: pages/take-the-test/context.tsx

import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { ITestResult } from "@/pages/take-the-test/api";

import dayjs from "dayjs";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/routes";
import { Duration } from "dayjs/plugin/duration";
import { countQuestion } from "@/shared/lib";
import { UniqueIdentifier } from "@dnd-kit/core";
import { notification } from "antd";

export type AnswerFormValues = {
  answers: (string | number[] | object)[];
};

export interface HighlightItem {
  nodeId: string;
  text: string;
  type: "highlight" | "underline";
}

interface SavedPassageData {
  notes: any[];
  highlights: HighlightItem[];
}

type Context = {
  post: IPracticeSingle;
  testID: string;
  part: {
    current: number;
    total: number;
    setCurrent: (value: number) => void;
  };
  isFormDisabled: boolean;
  setFormDisabled: (value: boolean) => void;
  isReady: boolean;
  setIsReady: (value: boolean) => void;
  testResult: ITestResult["testResultFields"];
  timer?: Duration;
  setTimer: Dispatch<SetStateAction<Duration | undefined>>;
  handleSubmitAnswer: (data: AnswerFormValues) => void | Promise<void>;
  isNotesViewOpen: boolean;
  setIsNotesViewOpen: Dispatch<SetStateAction<boolean>>;
  selectedTextSize: string;
  setSelectedTextSize: Dispatch<SetStateAction<string>>;
  activeQuestionIndex: number;
  setActiveQuestionIndex: Dispatch<SetStateAction<number>>;

  items?: Record<string, UniqueIdentifier[]>;
  setItems?: Dispatch<SetStateAction<Record<string, UniqueIdentifier[]>>>;
  activeId?: UniqueIdentifier | null;
  overId?: UniqueIdentifier | null;
  answerOptions?: { optionText: string; }[];
  startIndex?: number;

  getQuestionStartIndex: (question: any) => number;

  savedPassageData: Record<number, SavedPassageData>;
  setSavedPassageData: Dispatch<SetStateAction<Record<number, SavedPassageData>>>;
};

export const ExamContext = createContext<Context>({
  post: {} as IPracticeSingle,
  testID: "",
  part: {
    current: 0,
    total: 0,
    setCurrent: () => { },
  },
  isFormDisabled: false,
  setFormDisabled: () => { },
  isReady: false,
  setIsReady: () => { },
  testResult: {} as ITestResult["testResultFields"],
  timer: undefined,
  setTimer: () => { },
  handleSubmitAnswer: () => { },
  isNotesViewOpen: false,
  setIsNotesViewOpen: () => { },
  selectedTextSize: "Regular",
  setSelectedTextSize: () => { },
  activeQuestionIndex: 0,
  setActiveQuestionIndex: () => { },
  items: { 'available': [] },
  setItems: () => { },
  activeId: null,
  overId: null,
  answerOptions: [],
  startIndex: 0,
  getQuestionStartIndex: () => 0,

  savedPassageData: {},
  setSavedPassageData: () => { },
});

export const useExamContext = () => {
  return useContext(ExamContext);
};

const generateSignature = (q: any) => {
  if (!q) return "null";
  const type = q.type?.[0] || "unknown";
  const title = (q.title || "").trim();
  const content = (q.question || "").substring(0, 30).trim();

  let sig = `${type}|${title}`;
  if (content) sig += `|${content}`;
  if (q.matrixQuestion?.matrixItems?.[0]) {
    sig += `|mx:${q.matrixQuestion.matrixItems[0].itemText.substring(0, 5)}`;
  }
  return sig;
};

export const ExamProvider = ({
  post,
  testID,
  testResult,
  children,
}: {
  post: IPracticeSingle;
  testID: string;
  testResult: ITestResult["testResultFields"];
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const [part, setPart] = useState(0);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [timer, setTimer] = useState<Duration>();



  const [isNotesViewOpen, setIsNotesViewOpen] = useState(false);
  const [selectedTextSize, setSelectedTextSize] = useState("Regular");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const [savedPassageData, setSavedPassageData] = useState<Record<number, SavedPassageData>>({});

  const { refMap, sigMap, idMap } = useMemo(() => {
    const rMap = new Map<any, number>();
    const sMap = new Map<string, number>();
    const iMap = new Map<string, number>();

    if (!post?.quizFields?.passages) return { refMap: rMap, sigMap: sMap, idMap: iMap };
    let absoluteQuestionIndex = 0;
    post.quizFields.passages.forEach((passage, pIndex) => {
      passage.questions.forEach((q, qIndex) => {
        if ((q as any).id) iMap.set((q as any).id, absoluteQuestionIndex);
        rMap.set(q, absoluteQuestionIndex);
        const signature = generateSignature(q);
        sMap.set(signature, absoluteQuestionIndex);

        let questionCount = 1;
        const questionType = q.type?.[0];
        if (questionType === "matching" &&
          String(q.matchingQuestion?.layoutType).trim().toLowerCase() === "heading") {
          let gapCount = 0;
          (passage.passage_content || "").replace(/\{(.*?)\}/g, () => { gapCount++; return ""; });
          questionCount = gapCount > 0 ? gapCount : 1;
        } else if (questionType === "checkbox") {
          // @ts-ignore
          questionCount = Number(q.optionChoose) || 1;
        } else {
          questionCount = countQuestion({ questions: [q] });
        }
        if (isNaN(questionCount) || questionCount < 1) questionCount = 1;
        absoluteQuestionIndex += questionCount;
      });
    });
    return { refMap: rMap, sigMap: sMap, idMap: iMap };
  }, [post]);

  const getQuestionStartIndex = useCallback((targetQuestion: any) => {
    if (!targetQuestion) return 0;
    if (targetQuestion.id && idMap.has(targetQuestion.id)) return idMap.get(targetQuestion.id) || 0;
    if (refMap.has(targetQuestion)) return refMap.get(targetQuestion) || 0;
    const sig = generateSignature(targetQuestion);
    if (sigMap.has(sig)) return sigMap.get(sig) || 0;
    return 0;
  }, [refMap, sigMap, idMap]);

  // Submit test answers via API route
  const handleSubmitAnswer = useCallback(async (data: AnswerFormValues) => {
    try {
      const response = await fetch("/api/test-flow/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: testID,
          answers: data,
          timeLeft: timer?.format("mm:ss") || "00:00",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Submit failed");
      }

      await router.push(ROUTES.TEST_RESULT(testID));
    } catch (error: any) {
      console.error("Submit Failed in Handler:", error);
      notification.error({
        message: "Submission Error",
        description: error?.message || "Failed to submit test. Please check your internet connection.",
        duration: 5,
      });
    }
  }, [testID, timer, router]);

  const contextValue = useMemo(
    () => ({
      post,
      testID,
      part: {
        current: part,
        total: post.quizFields.passages.length,
        setCurrent: setPart,
      },
      isFormDisabled,
      setFormDisabled: setIsFormDisabled,
      isReady,
      setIsReady,
      testResult,
      timer,
      setTimer,
      handleSubmitAnswer,
      isNotesViewOpen,
      setIsNotesViewOpen,
      selectedTextSize,
      setSelectedTextSize,
      activeQuestionIndex,
      setActiveQuestionIndex,
      getQuestionStartIndex,
      savedPassageData,
      setSavedPassageData,
    }),
    [
      post,
      testID,
      part,
      isFormDisabled,
      isReady,
      testResult,
      timer,
      handleSubmitAnswer,
      isNotesViewOpen,
      selectedTextSize,
      activeQuestionIndex,
      getQuestionStartIndex,
      savedPassageData,
    ]
  );

  return (
    <ExamContext.Provider value={contextValue as Context}>{children}</ExamContext.Provider>
  );
};