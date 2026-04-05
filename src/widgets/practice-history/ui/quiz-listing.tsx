import { Progress, Table, TableProps } from "antd";
import {
  GetPracticeHistory,
} from "../api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/appx/providers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { calculateScore } from "@/shared/lib";
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
  const percent = Math.round((spent.asMinutes() / total.asMinutes()) * 100);

  const formattedTime = `${spent.minutes() + spent.hours() * 60}:${String(
    spent.seconds()
  ).padStart(2, "0")}`;

  const totalTime = `${Number(total.minutes()) + total.hours() * 60}:${String(
    total.seconds()
  ).padStart(2, "0")}`;

  return {
    totalTime,
    spent: formattedTime,
    percent,
  };
};

type NodeType = GetPracticeHistory["testResults"]["edges"][number]["node"];
type NodeWithScore = NodeType & { key: number; _scoreResult?: ScoreResult };

export const QuizListing = ({ skill }: { skill: "listening" | "reading" }) => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<GetPracticeHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const getData = useCallback(async (params: { quizSkill: string; authorId: string }) => {
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

      // Map to legacy format
      if (results) {
        // We need to also fetch quiz data for each result
        const quizIds = [...new Set(results.map((r: any) => r.quiz_id))];
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, title, slug, skill, type, time_minutes, passages(*, questions(*))")
          .in("id", quizIds);

        const quizMap = new Map((quizzes || []).map((q: any) => [q.id, q]));

        const edges = results.map((r: any) => {
          const quiz = quizMap.get(r.quiz_id) || {};
          return {
            node: {
              id: r.id,
              status: r.status === "published" ? "publish" : r.status,
              testResultFields: {
                dateTaken: r.started_at ? String(dayjs(r.started_at).unix()) : null,
                dateSubmitted: r.submitted_at ? String(dayjs(r.submitted_at).unix()) : String(dayjs(r.created_at).unix()),
                testTime: String((quiz as any).time_minutes || 60),
                timeLeft: r.time_left || "0:00",
                answers: JSON.stringify({ answers: r.answers || [] }),
                testPart: JSON.stringify(r.test_part || "all"),
                quiz: {
                  node: {
                    title: (quiz as any).title || "",
                    slug: (quiz as any).slug || "",
                    quizFields: {
                      skill: [(quiz as any).skill || skill, (quiz as any).skill || skill],
                      type: [(quiz as any).type || "practice"],
                      passages: ((quiz as any).passages || []).map((p: any) => ({
                        questions: (p.questions || []).map((q: any) => ({
                          explanations: q.answers || [],
                        })),
                      })),
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
            pageInfo: { total: results.length },
          },
        } as any);
      }
    } catch (error) {
      console.error("Error fetching practice history:", error);
    } finally {
      setLoading(false);
    }
  }, [skill]);

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
          // Sử dụng dateTaken nếu có, nếu không thì dùng dateSubmitted
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
            record.testResultFields.timeLeft
          ).spent,
      },
      {
        title: "Questions",
        key: "questions",
        dataIndex: ["testResultFields", "quiz", "node", "quizFields", "passages"],
        render: (_, record) =>
          record.testResultFields.quiz.node.quizFields.passages.reduce(
            (acc, passage) =>
              acc +
              passage.questions.reduce(
                (acc, question) => acc + question.explanations.length,
                0
              ),
            0
          ),
      },
      {
        title: "Correct",
        key: "correctAnswers",
        render: (_, record) => (record as NodeWithScore)._scoreResult?.correctAns ?? 0,
      },
      {
        title: "Incorrect",
        key: "incorrectAnswers",
        render: (_, record) => (record as NodeWithScore)._scoreResult?.incorrect ?? 0,
      },
      {
        title: "Missed",
        key: "missedAnswers",
        render: (_, record) => (record as NodeWithScore)._scoreResult?.missed ?? 0,
      },
      {
        title: "Result",
        key: "result",
        render: (_, record) => {
          const scoreResult = (record as NodeWithScore)._scoreResult;
          const correct = scoreResult?.correctAns ?? 0;
          const incorrect = scoreResult?.incorrect ?? 0;
          const missed = scoreResult?.missed ?? 0;
          const total = correct + incorrect + missed;

          return (
            <span className="font-medium">{correct}/{total}</span>
          );
        },
      },
      {
        key: "details",
        render: (_, record) => (
          <Link href={ROUTES.TEST_RESULT(record.id)}>View</Link>
        ),
      },
    ];

  // Filter để chỉ hiển thị bài làm trong 60 ngày gần nhất và paginate client-side
  const { filteredDataSource, paginatedDataSource } = useMemo(() => {
    if (data) {
      const sixtyDaysAgo = dayjs().subtract(60, "days").unix();
      const filtered = data.testResults.edges
        .map((item, idx) => {
          // Pre-compute score once per row
          let scoreResult: ScoreResult | undefined;
          try {
            scoreResult = calculateScore(
              JSON.parse(item.node.testResultFields.answers).answers,
              item.node.testResultFields.quiz.node,
              JSON.parse(item.node.testResultFields.testPart)
            );
          } catch {
            scoreResult = undefined;
          }

          return {
            ...item.node,
            key: idx,
            _scoreResult: scoreResult,
          } as NodeWithScore;
        })
        .filter((item) => {
          // Check if we have a valid date to check against, or if the status is explicitly publish
          if (item.status !== 'publish' && !item.testResultFields.dateSubmitted && !item.testResultFields.dateTaken) {
            return false;
          }

          // Filter by skill
          const itemSkill = item.testResultFields.quiz.node.quizFields.skill?.[0]?.toLowerCase();
          if (itemSkill !== skill.toLowerCase()) {
            return false;
          }

          // Sử dụng dateTaken nếu có, nếu không thì dùng dateSubmitted
          const dateToCheck = item.testResultFields.dateTaken
            ? Number(item.testResultFields.dateTaken)
            : Number(item.testResultFields.dateSubmitted);
          return dateToCheck >= sixtyDaysAgo;
        })
        .sort((a, b) => {
          // Sắp xếp theo ngày mới nhất trước
          const dateA = a.testResultFields.dateTaken
            ? Number(a.testResultFields.dateTaken)
            : Number(a.testResultFields.dateSubmitted);
          const dateB = b.testResultFields.dateTaken
            ? Number(b.testResultFields.dateTaken)
            : Number(b.testResultFields.dateSubmitted);
          return dateB - dateA;
        });

      // Paginate client-side
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginated = filtered.slice(startIndex, endIndex);

      return {
        filteredDataSource: filtered,
        paginatedDataSource: paginated,
      };
    }
    return {
      filteredDataSource: [],
      paginatedDataSource: [],
    };
  }, [data, currentPage, pageSize]);

  useEffect(() => {
    if (currentUser?.id) {
      getData({
        quizSkill: skill,
        authorId: currentUser.id,
      });
    }
  }, [currentUser, getData, skill]);

  const handleTableChange: TableProps<NodeWithScore>["onChange"] = (pagination) => {
    const current = pagination.current || 1;
    const newPageSize = pagination.pageSize || 10;

    setCurrentPage(current);
    setPageSize(newPageSize);
  };

  return (
    <Table<NodeWithScore>
      columns={columns}
      dataSource={paginatedDataSource}
      scroll={{ x: 768 }}
      loading={loading}
      size="small"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: filteredDataSource.length, // Sử dụng số lượng đã filter
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
        showTotal: (total) => `Hiển thị ${total} bài làm trong 60 ngày gần nhất`,
      }}
      onChange={handleTableChange}
    />
  );
};

