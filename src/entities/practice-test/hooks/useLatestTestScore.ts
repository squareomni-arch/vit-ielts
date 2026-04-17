import { useEffect, useState } from "react";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import {
  calculateStoredScoreResult,
  formatResultLabel,
  getQuizType,
  getResultToneClassName,
  normalizeStoredAnswers,
  toLegacyQuizForScore,
} from "@/shared/lib";

export const useLatestTestScore = (quizId?: string) => {
  const { currentUser } = useAuth();
  const [score, setScore] = useState<number | string | undefined>(undefined);
  const [scoreClassName, setScoreClassName] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !quizId) {
      setScore(undefined);
      setScoreClassName(undefined);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchScore = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("test_results")
          .select("score, answers, test_part, quizzes!inner(id, type, score_type, status)")
          .eq("quiz_id", quizId)
          .eq("user_id", currentUser.id)
          .eq("status", "published")
          .eq("quizzes.status", "published")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (!error && data !== null && data.score !== undefined && data.score !== null) {
          const quizInfo = Array.isArray(data.quizzes) ? data.quizzes[0] : data.quizzes;
          const quizType = getQuizType(quizInfo?.type);
          const normalizedAnswers = normalizeStoredAnswers(data.answers);

          let formattedScore = formatResultLabel({
            quizType,
            storedScore: data.score,
            answers: normalizedAnswers,
          });

          if (!formattedScore && quizType === "practice") {
            const { data: quizData } = await supabase
              .from("quizzes")
              .select("type, status, passages(*, questions(*))")
              .eq("id", quizId)
              .eq("status", "published")
              .maybeSingle();

            if (!isMounted) {
              return;
            }

            if (quizData) {
              const scoreResult = calculateStoredScoreResult({
                quiz: toLegacyQuizForScore(quizData),
                answers: data.answers,
                testPart: data.test_part,
              });

              formattedScore = formatResultLabel({
                quizType,
                storedScore: data.score,
                scoreResult,
                answers: data.answers,
              });
            }
          }

          setScore(formattedScore);
          setScoreClassName(getResultToneClassName(quizType));
        } else {
          setScore(undefined);
          setScoreClassName(undefined);
        }
      } catch (err) {
        console.error("Failed to fetch score", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchScore();

    return () => {
      isMounted = false;
    };
  }, [currentUser, quizId]);

  return { score, scoreClassName, loading };
};
