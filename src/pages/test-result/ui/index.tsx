import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useMemo } from "react";
import { useRouter } from "next/router";
import parse from "html-react-parser";

import { SEOHeader } from "@/widgets";
import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { useProContentModal } from "@/shared/ui/pro-content";
import { calculateScore } from "@/shared/lib";
import {
  formatBandScore,
  formatResultLabel,
  getQuizScoreType,
} from "@/shared/lib/test-result-display";
import { Button } from "@/shared/ui/ds/atoms/button";
import { AppShell } from "@/widgets/layouts";

import type { IPracticeSingle, ITestResult, IUser } from "../api";
import type { ResultAnalytics } from "~services/test-analytics";
import AnswerKeys from "./answer-keys";

dayjs.extend(duration);

// Strip fill-history-correct span wrappers from answer text
const stripFillSpans = (text: string | undefined): string => {
  if (!text) return "";
  let s = String(text);
  s = s.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1",
  );
  s = s.replace(
    /<span[^>]*class\s*=\s*["']?[^"'>]*fill-history-correct[^"'>]*["']?[^>]*>(.*?)<\/span>/gi,
    "$1",
  );
  return s;
};

type PageTestResultProps = {
  post: IPracticeSingle;
  testResult: ITestResult;
  user: IUser;
  scoreData: ReturnType<typeof calculateScore>;
  analytics?: ResultAnalytics;
};

export function PageTestResult({
  post,
  testResult,
  user,
  scoreData,
  analytics,
}: PageTestResultProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  const numericScore = useMemo(() => {
    const liveScore = Number(scoreData.score);
    if (Number.isFinite(liveScore) && liveScore > 0) return liveScore;
    const savedScore = Number(testResult.testResultFields.score);
    if (Number.isFinite(savedScore)) return savedScore;
    return 0;
  }, [scoreData.score, testResult.testResultFields.score]);

  const timeSpent = useMemo(() => {
    const total = dayjs.duration({
      minutes: testResult.testResultFields.testTime,
    });

    const tlRaw = testResult.testResultFields.timeLeft || "0:0";
    const [mPart, sPart] = tlRaw.split(":");
    const mNum = Number(mPart) || 0;
    const sNum = Math.abs(Number(sPart) || 0);
    const remainingSecs = mNum < 0 ? mNum * 60 - sNum : mNum * 60 + sNum;

    const totalSecs = total.asSeconds();
    const percent =
      totalSecs > 0
        ? Math.round(
            (Math.max(0, totalSecs - remainingSecs) / totalSecs) * 100,
          )
        : 0;

    const sign = remainingSecs < 0 ? "-" : "";
    const absSecs = Math.abs(remainingSecs);
    const displayMinutes = Math.floor(absSecs / 60);
    const displaySeconds = absSecs % 60;
    const formattedTime = `${sign}${displayMinutes}:${String(displaySeconds).padStart(2, "0")}`;

    const totalTime = `${Number(total.minutes()) + total.hours() * 60}:${String(
      total.seconds(),
    ).padStart(2, "0")}`;

    return { totalTime, spent: formattedTime, percent };
  }, [
    testResult.testResultFields.testTime,
    testResult.testResultFields.timeLeft,
  ]);

  const skill = useMemo(() => post.quizFields.skill[0], [post.quizFields.skill]);
  const quizType = useMemo(
    () => post.quizFields.type?.[0] ?? "practice",
    [post.quizFields.type],
  );
  const scoreType = useMemo(
    () => getQuizScoreType(post.quizFields.scoreType),
    [post.quizFields.scoreType],
  );

  const isBandResult =
    quizType === "exam" ||
    quizType === "academic" ||
    quizType === "general";

  const displayScoreStr =
    formatResultLabel({
      quizType,
      scoreType,
      storedScore: testResult.testResultFields.score,
      scoreResult: scoreData,
      answers: testResult.testResultFields.answers,
    }) ??
    (isBandResult
      ? (formatBandScore(numericScore) ?? numericScore.toFixed(1))
      : `${scoreData.correctAns}/${scoreData.total_questions}`);

  const scoreLabel = isBandResult ? "Band Score" : "Câu đúng";

  // Accuracy %
  const accuracyPct =
    scoreData.total_questions > 0
      ? Math.round((scoreData.correctAns / scoreData.total_questions) * 100)
      : 0;

  // Passage breakdown
  const passageEntries = Object.entries(scoreData.details);

  // User display name
  const userName = user.name || (currentUser as any)?.user_metadata?.name || "User";

  const skillLabel =
    skill === "listening" ? "LISTENING" : skill === "reading" ? "READING" : skill.toUpperCase();
  const quizTypeLabel =
    quizType === "academic" ? "Academic" :
    quizType === "general" ? "General" :
    quizType === "exam" ? "Exam" :
    quizType === "practice" ? "Practice" : quizType;

  const submittedDate = dayjs(
    testResult.testResultFields.dateSubmitted || testResult.testResultFields.dateTaken,
  ).format("D MMM YYYY");

  // Has duration data
  const hasDuration = Boolean(
    testResult.testResultFields.testTime && testResult.testResultFields.testTime > 0,
  );

  // ── Explanation preview: find the first incorrect question with a non-empty explanation ──
  const explanationPreview = useMemo(() => {
    // Flatten all parts → details to find first incorrect entry with a question number
    const allDetails: { globalNum: number; userAnswer: string; answer: string }[] = [];
    Object.values(scoreData.details).forEach((part) => {
      const startNum = parseInt(part.questionRange.match(/\d+/)?.[0] || "1", 10);
      part.details.forEach((q, idx) => {
        allDetails.push({ globalNum: startNum + idx, userAnswer: q.userAnswer ?? "", answer: q.answer });
      });
    });

    // Walk passages to find first incorrect question that has an explanation
    for (const passage of post.quizFields.passages) {
      for (const question of passage.questions) {
        const startIdx = (question as any).startIndex ?? 0;
        const expContent = question.explanations?.[0]?.content;
        if (!expContent || String(expContent).trim() === "") continue;

        // Check if any sub-question at startIdx is incorrect
        const detail = allDetails.find((d) => d.globalNum === startIdx + 1);
        if (!detail || detail.userAnswer === detail.answer) continue;

        // Found a good candidate
        const qText = question.question || question.instructions || question.title || "";
        const isMissed = !detail.userAnswer || String(detail.userAnswer).trim() === "";

        return {
          questionNum: startIdx + 1,
          questionText: qText,
          userAnswer: isMissed ? "—" : stripFillSpans(detail.userAnswer),
          correctAnswer: stripFillSpans(detail.answer),
          explanation: expContent,
        };
      }
    }
    return null;
  }, [scoreData.details, post.quizFields.passages]);

  // Keep hooks referenced; behavior stays unchanged.
  void openProContentModal;
  void userName;

  return (
    <>
      <SEOHeader fullHead="" title="Test Result | IELTS Exam Library" />

      <div className="flex flex-col gap-7">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-1.5">
          {/* Eyebrow */}
          <p className="text-eyebrow font-bold font-display tracking-[8px] text-brand-hover uppercase">
            RESULTS · {skillLabel}
          </p>
          {/* Title */}
          <h1 className="font-display font-bold text-heading-1 text-ink-900">
            {post.title}
          </h1>
          {/* Meta */}
          <p className="text-body-s font-body text-ink-muted">
            Submitted {submittedDate}
            {hasDuration ? ` · ${timeSpent.spent}` : ""}
            {" · "}{quizTypeLabel}
          </p>
          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outlined"
              size="md"
              onClick={() => router.push(ROUTES.TAKE_THE_TEST(post.slug))}
            >
              Retake test
            </Button>
            <Button
              variant="dark"
              size="md"
              onClick={() => router.push(ROUTES.TEST_RESULT_EXPLANATION(testResult.id))}
            >
              Review answers
            </Button>
          </div>
        </div>

        {/* ── Score Hero row ── */}
        <div className="flex gap-5 items-stretch flex-col md:flex-row">

          {/* Band Score ring card */}
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-7 flex flex-col gap-3 items-center justify-center md:w-[300px] shrink-0">
            {/* Large ring: solid green circle with white inset */}
            <div
              className="rounded-full flex items-center justify-center shrink-0 bg-brand"
              style={{ width: 170, height: 170, padding: 19 }}
            >
              <div className="bg-surface-card rounded-full w-full h-full flex flex-col items-center justify-center gap-0.5">
                <span className="font-display font-bold text-[46px] leading-none text-ink-900">
                  {displayScoreStr}
                </span>
                <span className="font-body font-bold text-[11px] text-ink-muted uppercase tracking-wide">
                  {isBandResult ? "BAND" : "SCORE"}
                </span>
              </div>
            </div>
            <p className="font-body font-medium text-body-s text-ink-muted">
              Estimated band score
            </p>
            <p className="font-body font-bold text-[15px] text-ink-900">
              {scoreData.correctAns} of {scoreData.total_questions} correct
            </p>
          </div>

          {/* Answer breakdown card */}
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-7 flex-1 flex flex-col justify-between gap-5 min-w-0">
            <p className="font-display font-bold text-title-m text-ink-900">
              Answer breakdown
            </p>

            {/* Segmented progress bar */}
            <div className="flex h-3.5 rounded-lg overflow-hidden w-full">
              {scoreData.total_questions > 0 && (
                <>
                  <div
                    className="bg-brand h-full"
                    style={{ flex: scoreData.correctAns }}
                  />
                  <div
                    className="bg-accent-rose h-full"
                    style={{ flex: scoreData.incorrect }}
                  />
                  <div
                    className="bg-border-hairline h-full"
                    style={{ flex: scoreData.missed }}
                  />
                </>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-[4px] bg-brand shrink-0" />
                <span className="font-body font-semibold text-body-s text-ink-900">
                  Correct&nbsp;&nbsp;{scoreData.correctAns}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-[4px] bg-accent-rose shrink-0" />
                <span className="font-body font-semibold text-body-s text-ink-900">
                  Incorrect&nbsp;&nbsp;{scoreData.incorrect}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-[4px] bg-border-hairline shrink-0" />
                <span className="font-body font-semibold text-body-s text-ink-900">
                  Skipped&nbsp;&nbsp;{scoreData.missed}
                </span>
              </div>
            </div>

            {/* Time info — only when duration data exists */}
            {hasDuration && (
              <div className="flex gap-2.5 items-center">
                <span className="material-symbols-rounded text-[18px] text-ink-muted leading-none">
                  schedule
                </span>
                <p className="font-body text-body-s text-ink-muted">
                  Completed in {timeSpent.spent} — time limit {timeSpent.totalTime}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat Cards row ── */}
        <div className="flex gap-5 flex-wrap">
          {/* Accuracy */}
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-[22px] flex-1 min-w-[140px] flex flex-col gap-2.5">
            <div className="bg-brand-surface rounded-xl w-[42px] h-[42px] shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-bold text-[22px] text-ink-900">
                {accuracyPct}%
              </span>
              <span className="font-body text-[13px] text-ink-muted">Accuracy</span>
            </div>
          </div>

          {/* Score / Band */}
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-[22px] flex-1 min-w-[140px] flex flex-col gap-2.5">
            <div className="rounded-xl w-[42px] h-[42px] shrink-0 bg-[rgba(82,129,249,0.16)]" />
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-bold text-[22px] text-ink-900">
                {displayScoreStr}
              </span>
              <span className="font-body text-[13px] text-ink-muted">{scoreLabel}</span>
            </div>
          </div>

          {/* Time taken — only if duration data exists */}
          {hasDuration && (
            <div className="bg-surface-card border border-border-hairline rounded-3xl p-[22px] flex-1 min-w-[140px] flex flex-col gap-2.5">
              <div className="rounded-xl w-[42px] h-[42px] shrink-0 bg-[rgba(252,148,89,0.16)]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display font-bold text-[22px] text-ink-900">
                  {timeSpent.spent}
                </span>
                <span className="font-body text-[13px] text-ink-muted">Time taken</span>
              </div>
            </div>
          )}

          {/* Percentile — only when analytics data is available */}
          {analytics?.percentile != null && (
            <div className="bg-surface-card border border-border-hairline rounded-3xl p-[22px] flex-1 min-w-[140px] flex flex-col gap-2.5">
              <div className="rounded-xl w-[42px] h-[42px] shrink-0 bg-[rgba(34,197,94,0.14)]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display font-bold text-[22px] text-ink-900">
                  Top {100 - analytics.percentile}%
                </span>
                <span className="font-body text-[13px] text-ink-muted">
                  Percentile
                </span>
              </div>
            </div>
          )}

          {/* Band uplift — only when a prior result exists */}
          {analytics?.bandUplift != null && (
            <div className="bg-surface-card border border-border-hairline rounded-3xl p-[22px] flex-1 min-w-[140px] flex flex-col gap-2.5">
              <div className="rounded-xl w-[42px] h-[42px] shrink-0 bg-[rgba(168,85,247,0.14)]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display font-bold text-[22px] text-ink-900">
                  {analytics.bandUplift > 0 ? "+" : ""}
                  {analytics.bandUplift}
                </span>
                <span className="font-body text-[13px] text-ink-muted">Band uplift</span>
              </div>
            </div>
          )}
        </div>

        {/* ── By passage / part breakdown — only if data exists ── */}
        {passageEntries.length > 0 && (
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-7 flex flex-col gap-[18px]">
            <p className="font-display font-bold text-title-m text-ink-900">
              By {skill === "listening" ? "part" : "passage"}
            </p>
            {passageEntries.map(([key, part]) => {
              const totalInPassage = part.details.length;
              const correctInPassage = part.details.filter((d) => d.correct).length;
              const fillPct = totalInPassage > 0 ? correctInPassage / totalInPassage : 0;
              const partLabel = skill === "listening" ? "Part" : "Passage";
              return (
                <div key={key} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-body font-semibold text-[15px] text-ink-900">
                      {partLabel} {Number(key) + 1}
                      {part.questionRange ? ` — ${part.questionRange}` : ""}
                    </span>
                    <span className="font-body font-bold text-body-s text-ink-900">
                      {correctInPassage} / {totalInPassage}
                    </span>
                  </div>
                  <div className="bg-brand-surface h-[10px] rounded-[6px] w-full max-w-[400px] overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-[6px]"
                      style={{ width: `${fillPct * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Answer Key card ── */}
        <div className="bg-surface-card border border-border-hairline rounded-3xl p-7">
          <AnswerKeys data={scoreData} skill={skill as "listening" | "reading"} />
        </div>

        {/* ── Explanation preview card — only if a backed explanation exists ── */}
        {explanationPreview && (
          <div className="bg-surface-card border border-border-hairline rounded-3xl p-7 flex flex-col gap-5">
            {/* Eyebrow */}
            <p className="text-eyebrow font-bold font-display tracking-[8px] text-brand-hover uppercase">
              EXPLANATION · QUESTION {explanationPreview.questionNum}
            </p>
            {/* Question text */}
            {explanationPreview.questionText && (
              <p className="font-display font-bold text-[18px] text-ink-900 leading-snug">
                &ldquo;{parse(explanationPreview.questionText)}&rdquo;
              </p>
            )}
            {/* Your answer / Correct answer */}
            <div className="bg-brand-tint rounded-xl px-5 py-3">
              <p className="font-body text-body-s text-ink-muted">
                Your answer:{" "}
                <span className="text-ink-900 font-semibold">
                  {parse(explanationPreview.userAnswer)}
                </span>
                {" · "}
                Correct answer:{" "}
                <span className="text-ink-900 font-semibold">
                  {parse(explanationPreview.correctAnswer)}
                </span>
              </p>
            </div>
            {/* Explanation paragraph */}
            <p className="font-body text-body-m text-ink-body leading-relaxed">
              {parse(explanationPreview.explanation)}
            </p>
          </div>
        )}

        {/* ── CTA row ── */}
        <div className="flex items-center gap-3 pb-4">
          <Button
            variant="dark"
            size="md"
            onClick={() => router.push(ROUTES.TEST_RESULT_EXPLANATION(testResult.id))}
          >
            Review all answers
          </Button>
          <Button
            variant="outlined"
            size="md"
            onClick={() => router.back()}
          >
            Back to tests
          </Button>
        </div>

      </div>
    </>
  );
}

PageTestResult.Layout = AppShell;
