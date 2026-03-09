import { Progress, Table, TableProps } from "antd";
import {
  GetPracticeHistory,
} from "../api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/appx/providers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { calculateScore } from "@/shared/lib";
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

  const columns: TableProps<
    GetPracticeHistory["testResults"]["edges"][number]["node"]
  >["columns"] = [
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
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            JSON.parse(record.testResultFields.testPart)
          ).correctAns,
      },
      {
        title: "Incorrect",
        key: "incorrectAnswers",
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            JSON.parse(record.testResultFields.testPart)
          ).incorrect,
      },
      {
        title: "Missed",
        key: "missedAnswers",
        render: (_, record) =>
          calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            JSON.parse(record.testResultFields.testPart)
          ).missed,
      },
      {
        title: "Correct Percent",
        key: "correctPercent",
        render: (_, record) => {
          const percent = calculateScore(
            JSON.parse(record.testResultFields.answers).answers,
            record.testResultFields.quiz.node,
            JSON.parse(record.testResultFields.testPart)
          ).correctPercent;

          return (
            <>
              <span>{Math.round(percent)}%</span>
              <Progress percent={percent} showInfo={false} />
            </>
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
      // Debug: Log dữ liệu để kiểm tra


      const sixtyDaysAgo = dayjs().subtract(60, "days").unix();
      const filtered = data.testResults.edges
        .map((item, idx) => {
          return {
            ...item.node,
            key: idx,
          };
        })
        .filter((item) => {
          // Check if we have a valid date to check against, or if the status is explicitly publish
          if (item.status !== 'publish' && !item.testResultFields.dateSubmitted && !item.testResultFields.dateTaken) {
            return false;
          }

          // Filter by skill (since we removed backend filtering)
          // We check equality with the skill prop. Note: skill array usually has values like ["reading", "Reading"]
          // so we check if the first element matches or if the array includes it.
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

  const handleTableChange: TableProps<
    GetPracticeHistory["testResults"]["edges"][number]["node"]
  >["onChange"] = (pagination) => {
    const current = pagination.current || 1;
    const newPageSize = pagination.pageSize || 10;

    setCurrentPage(current);
    setPageSize(newPageSize);
  };

  return (
    <Table<GetPracticeHistory["testResults"]["edges"][number]["node"]>
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
