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
  answers: (string | number | number[] | object | null)[];
};

export interface HighlightItem {
  nodeId: string;
  text: string;
  type: "highlight" | "underline";
  color?: string;
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
      // If passage has a custom start number, reset the absolute index
      const explicitStart = (passage as any).start_question_number;
      if (explicitStart && !isNaN(Number(explicitStart))) {
        absoluteQuestionIndex = Number(explicitStart) - 1;
      }

      passage.questions.forEach((q, qIndex) => {
        if ((q as any).id) iMap.set((q as any).id, absoluteQuestionIndex);
        rMap.set(q, absoluteQuestionIndex);
        const signature = generateSignature(q);
        sMap.set(signature, absoluteQuestionIndex);

        let questionCount = countQuestion({ 
          questions: [q],
          passage_content: passage.passage_content 
        } as any);
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
      // Pass quizId + testPart so the server can salvage the submission if
      // the original draft row has been pruned (cleanup cron) or removed
      // by a concurrent retake from another tab.
      let parsedTestPart: number[] | undefined;
      try {
        const tp = (testResult as any)?.testPart;
        if (typeof tp === "string" && tp.trim() !== "") {
          parsedTestPart = JSON.parse(tp);
        } else if (Array.isArray(tp)) {
          parsedTestPart = tp;
        }
      } catch {
        parsedTestPart = undefined;
      }
      const response = await fetch("/api/test-flow/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: testID,
          answers: data,
          timeLeft: timer?.format("mm:ss") || "00:00",
          quizId: post?.id,
          testPart: parsedTestPart,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || `Submit failed (HTTP ${response.status})`);
      }

      // Hard-navigate so a render error on the result page can't trap the
      // user on /take-the-test with their submission already persisted.
      // router.push has been observed to fail silently in production,
      // leaving students staring at the test screen with no feedback.
      // Prefer the id the server returned — when the original draft row
      // was missing the server inserts a brand-new row whose id differs
      // from the in-memory testID, and the old id would 404 on /test-result.
      const resultId = result?.data?.id || testID;
      const target = ROUTES.TEST_RESULT(resultId);
      try {
        await router.push(target);
      } catch {
        window.location.href = target;
        return;
      }
      // Belt-and-suspenders: if router.push resolved but didn't actually
      // change the URL within 1.5s, force a hard nav.
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/take-the-test")) {
          window.location.href = target;
        }
      }, 1500);
    } catch (error: any) {
      console.error("Submit Failed in Handler:", error);
      // Surface to the server log too so we can correlate with student reports.
      try {
        void fetch("/api/log-client-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `submit-failed: ${error?.message ?? String(error)}`,
            stack: error?.stack,
            url: typeof window !== "undefined" ? window.location.href : undefined,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          }),
          keepalive: true,
        }).catch(() => undefined);
      } catch {
        // swallow
      }
      notification.error({
        message: "Submission Error",
        description: error?.message || "Failed to submit test. Please check your internet connection.",
        duration: 5,
      });
    }
  }, [testID, timer, router, post?.id, testResult]);

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