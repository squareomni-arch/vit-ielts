import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/appx/providers";
import { createClient } from "~supabase/client";

/**
 * Batch test results context — fetches all user results for a set of quiz IDs
 * in a SINGLE query, eliminating the N+1 pattern where each ExamItem card
 * fires its own Supabase request.
 *
 * Usage:
 *   <BatchResultsProvider quizIds={allVisibleQuizIds}>
 *     <ExamItem item={...} />
 *   </BatchResultsProvider>
 *
 * Inside ExamItem:
 *   const results = useBatchResults(quizId);
 */

interface TestResultRow {
  id: string;
  quiz_id: string;
  status: string;
  score: number | null;
  answers: { answers: unknown[]; totalCorrect?: number; totalQuestions?: number } | null;
}

type ResultsMap = Map<string, TestResultRow[]>;

const BatchResultsContext = createContext<ResultsMap>(new Map());

export function BatchResultsProvider({
  quizIds,
  children,
}: {
  quizIds: string[];
  children: React.ReactNode;
}) {
  const { currentUser } = useAuth();
  const [resultsMap, setResultsMap] = useState<ResultsMap>(new Map());

  // Stable key to avoid re-fetching when array reference changes but content is same
  const idsKey = useMemo(() => [...quizIds].sort().join(","), [quizIds]);

  useEffect(() => {
    if (!currentUser?.id || quizIds.length === 0) {
      setResultsMap(new Map());
      return;
    }

    const fetchBatch = async () => {
      try {
        const supabase = createClient();
        const { data: results } = await supabase
          .from("test_results")
          .select("id, quiz_id, status, score, answers")
          .eq("user_id", currentUser.id)
          .eq("status", "published")
          .in("quiz_id", quizIds)
          .order("created_at", { ascending: false });

        // Group by quiz_id
        const map: ResultsMap = new Map();
        for (const row of results ?? []) {
          const existing = map.get(row.quiz_id) ?? [];
          existing.push(row);
          map.set(row.quiz_id, existing);
        }
        setResultsMap(map);
      } catch (error) {
        console.error("[BatchResultsProvider] Error fetching batch results:", error);
      }
    };

    fetchBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, idsKey]);

  return (
    <BatchResultsContext.Provider value={resultsMap}>
      {children}
    </BatchResultsContext.Provider>
  );
}

/**
 * Get test results for a single quiz from the batch context.
 * Returns an array of TestResultRow sorted by created_at desc (latest first).
 */
export function useBatchResults(quizId: string): TestResultRow[] {
  const map = useContext(BatchResultsContext);
  return map.get(quizId) ?? [];
}
