import { Table, type TableProps } from "antd";
import { GetPracticeHistory } from "../api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/appx/providers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {
  calculateStoredScoreResult,
  formatResultLabel,
  getQuizScoreType,
  getQuizType,
  getResultToneClassName,
  normalizeStoredAnswers,
  normalizeTestPart,
  toLegacyQuizForScore,
} from "@/shared/lib";
import type { ScoreResult } from "@/shared/lib/calculateScore";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { createClient } from "~supabase/client";

dayjs.extend(duration);

const calcTimeTaken = (testTime: string, timeLeft: string) => {
  const total = dayjs.duration({
    minutes: Number(testTime),
  });

  const [minutes, seconds] = timeLeft.split(":").map(Number);
  const remainingDuration = dayjs.duration({ minutes, seconds });
  const spent = total.subtract(remainingDuration);

  return `${spent.minutes() + spent.hours() * 60}:${String(
    spent.seconds(),
  ).padStart(2, "0")}`;
};

type NodeType = GetPracticeHistory["testResults"]["edges"][number]["node"];
type NodeWithScore = NodeType & { key: number; _scoreResult?: ScoreResult };

export const QuizListing = ({
  skill,
}: {
  skill: "listening" | "reading";
}) => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [data, setData] = useState<GetPracticeHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const getData = useCallback(
    async (params: { quizSkill: string; authorId: string }) => {
      setLoading(true);

      try {
        const supabase = createClient();
        const { data: results } = await supabase
          .from("test_results")
          .select("*")
          .eq("user_id", params.authorId)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!results?.length) {
          setData({
            testResults: {
              edges: [],
              pageInfo: { total: 0 },
            },
          } as GetPracticeHistory);
          return;
        }

        const quizIds = [...new Set(results.map((result: any) => result.quiz_id))];
        // Select only columns that calculateScore actually needs. Avoid
        // passages(*, questions(*)) — the SELECT * variant pulls every column
        // including audio_start/audio_end/title/etc. and was hitting Postgres'
        // 8s statement_timeout on prod. The slim version below cuts payload
        // and per-row work without changing displayed data.
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select(
            // start_question_number is required for scoring practice
            // extracts (e.g. a Passage 3 quiz with start=27): without it,
            // calculateScore reads answers from slots 0–13 instead of 26–39
            // and every question shows up as "missed" in history.
            `id, title, slug, skill, type, score_type, status, time_minutes,
             passages(content, sort_order, start_question_number,
               questions(type, question_text, list_of_questions, list_of_options,
                         matching_question, matrix_question, explanations, sort_order)
             )`,
          )
          .in("id", quizIds)
          .eq("status", "published");

        const quizMap = new Map((quizzes || []).map((quiz: any) => [quiz.id, quiz]));

        const edges = results
          .filter((result: any) => quizMap.has(result.quiz_id))
          .map((result: any) => {
            const quiz = quizMap.get(result.quiz_id);
            const legacyQuiz = toLegacyQuizForScore(quiz as any);
            const passageCount = legacyQuiz.quizFields.passages.length;

            return {
              node: {
                id: result.id,
                status: result.status === "published" ? "publish" : result.status,
                testResultFields: {
                  // test_results has no started_at column — use created_at as
                  // the proxy for "when the user started the attempt".
                  dateTaken: String(dayjs(result.created_at).unix()),
                  dateSubmitted: result.submitted_at
                    ? String(dayjs(result.submitted_at).unix())
                    : String(dayjs(result.created_at).unix()),
                  score: result.score ?? 0,
                  testTime: String((quiz as any)?.time_minutes || 60),
                  timeLeft: result.time_left || "0:00",
                  answers: JSON.stringify(normalizeStoredAnswers(result.answers)),
                  testPart: JSON.stringify(
                    normalizeTestPart(result.test_part, passageCount),
                  ),
                  quiz: {
                    node: {
                      title: (quiz as any)?.title || "",
                      slug: (quiz as any)?.slug || "",
                      quizFields: {
                        ...legacyQuiz.quizFields,
                        skill: [
                          (quiz as any)?.skill || params.quizSkill,
                          (quiz as any)?.skill || params.quizSkill,
                        ],
                        scoreType: [
                          (quiz as any)?.score_type || "percentage",
                          (quiz as any)?.score_type || "percentage",
                        ],
                      },
                    },
                  },
                },
              },
            };
          });

        setData({
          testResults: {
            edges,
            pageInfo: { total: edges.length },
          },
        } as GetPracticeHistory);
      } catch (error) {
        console.error("Error fetching practice history:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const columns: TableProps<NodeWithScore>["columns"] = [
    {
      title: "Quiz",
      dataIndex: ["testResultFields", "quiz", "node", "title"],
      key: "quiz",
    },
    {
      title: <div className="text-center">Taken on</div>,
      dataIndex: ["testResultFields", "dateTaken"],
      key: "dateTaken",
      render: (dateTaken, record) => {
        const dateToDisplay = dateTaken
          ? Number(dateTaken)
          : Number(record.testResultFields.dateSubmitted);

        return (
          <div className="text-center">
            <p>{dayjs.unix(dateToDisplay).format("DD/MM/YYYY")}</p>
            <span className="text-gray-600 text-xs">
              {dayjs.unix(dateToDisplay).format("HH:mm:ss")}
            </span>
          </div>
        );
      },
    },
    {
      title: "Time Taken",
      key: "timeTaken",
      render: (_, record) =>
        calcTimeTaken(
          record.testResultFields.testTime,
          record.testResultFields.timeLeft,
        ),
    },
    {
      title: "Questions",
      key: "questions",
      render: (_, record) =>
        (record as NodeWithScore)._scoreResult?.total_questions ?? 0,
    },
    {
      title: "Correct",
      key: "correctAnswers",
      render: (_, record) =>
        (record as NodeWithScore)._scoreResult?.correctAns ?? 0,
    },
    {
      title: "Incorrect",
      key: "incorrectAnswers",
      render: (_, record) =>
        (record as NodeWithScore)._scoreResult?.incorrect ?? 0,
    },
    {
      title: "Missed",
      key: "missedAnswers",
      render: (_, record) =>
        (record as NodeWithScore)._scoreResult?.missed ?? 0,
    },
    {
      title: "Result",
      key: "result",
      render: (_, record) => {
        const quizType =
          getQuizType(record.testResultFields.quiz.node.quizFields.type) ??
          "practice";
        const scoreType = getQuizScoreType(
          record.testResultFields.quiz.node.quizFields.scoreType,
        );
        const resultLabel = formatResultLabel({
          quizType,
          scoreType,
          storedScore: record.testResultFields.score,
          scoreResult: (record as NodeWithScore)._scoreResult,
          answers: record.testResultFields.answers,
        });

        if (!resultLabel) {
          return <span className="font-medium text-gray-400">—</span>;
        }

        return (
          <span
            className={`font-bold ${getResultToneClassName(
              quizType,
              scoreType,
            )}`}
          >
            {resultLabel}
          </span>
        );
      },
    },
    {
      key: "details",
      render: (_, record) => <Link href={ROUTES.TEST_RESULT(record.id)}>View</Link>,
    },
  ];

  const { filteredDataSource } = useMemo(() => {
    if (!data) {
      return { filteredDataSource: [] as NodeWithScore[] };
    }

    const sixtyDaysAgo = dayjs().subtract(60, "days").unix();

    const filtered = data.testResults.edges
      .map((item, index) => {
        let scoreResult: ScoreResult | undefined;

        try {
          scoreResult =
            calculateStoredScoreResult({
              quiz: item.node.testResultFields.quiz.node as any,
              answers: item.node.testResultFields.answers,
              testPart: item.node.testResultFields.testPart,
            }) ?? undefined;
        } catch {
          scoreResult = undefined;
        }

        return {
          ...item.node,
          key: index,
          _scoreResult: scoreResult,
        } as NodeWithScore;
      })
      .filter((item) => {
        if (
          item.status !== "publish" &&
          !item.testResultFields.dateSubmitted &&
          !item.testResultFields.dateTaken
        ) {
          return false;
        }

        const itemSkill =
          item.testResultFields.quiz.node.quizFields.skill?.[0]?.toLowerCase();
        if (itemSkill !== skill.toLowerCase()) {
          return false;
        }

        const dateToCheck = item.testResultFields.dateTaken
          ? Number(item.testResultFields.dateTaken)
          : Number(item.testResultFields.dateSubmitted);

        return dateToCheck >= sixtyDaysAgo;
      })
      .sort((left, right) => {
        const dateLeft = left.testResultFields.dateTaken
          ? Number(left.testResultFields.dateTaken)
          : Number(left.testResultFields.dateSubmitted);
        const dateRight = right.testResultFields.dateTaken
          ? Number(right.testResultFields.dateTaken)
          : Number(right.testResultFields.dateSubmitted);

        return dateRight - dateLeft;
      });

    return {
      filteredDataSource: filtered,
    };
  }, [data, skill]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    getData({
      quizSkill: skill,
      authorId: currentUser.id,
    });
  }, [currentUser?.id, getData, skill]);

  const handleTableChange: TableProps<NodeWithScore>["onChange"] = (
    pagination,
  ) => {
    const current = pagination.current || 1;
    const newPageSize = pagination.pageSize || 10;

    setCurrentPage(current);
    setPageSize(newPageSize);
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table<NodeWithScore>
        columns={columns}
        dataSource={filteredDataSource}
        scroll={{ x: 768 }}
        loading={loading}
        size="small"
        pagination={{
          current: currentPage,
          pageSize,
          total: filteredDataSource.length,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (total) =>
            `Hiển thị ${total} bài làm trong 60 ngày gần nhất`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};
