import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { calculateScore } from "@/shared/lib";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";

dayjs.extend(duration);

const calcTimeTaken = (testTime: string | number, timeLeft: string) => {
  const total = dayjs.duration({ minutes: Number(testTime) });
  const [minutes, seconds] = (timeLeft || "0:00").split(":").map(Number);
  const remainingDuration = dayjs.duration({ minutes: seconds ? seconds : 0, seconds: seconds !== undefined ? seconds : minutes });
  const finalMinutes = isNaN(minutes) ? 0 : minutes;
  const finalSeconds = isNaN(seconds) ? 0 : seconds;
  const remainingDur = dayjs.duration({ minutes: finalMinutes, seconds: finalSeconds });
  const spent = total.subtract(remainingDur);
  const formattedTime = `${spent.minutes() + spent.hours() * 60}:${String(spent.seconds()).padStart(2, "0")}`;
  return formattedTime;
};

export type TestHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  title: string;
};

export const TestHistoryModal = ({ isOpen, onClose, quizId, title }: TestHistoryModalProps) => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    if (!isOpen || !currentUser?.id || !quizId) return;

    setLoading(true);
    setCurrentPage(1); // Reset page on open
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch history first so we always have it even if quiz fetch errors out
        const { data: historyRes, error: historyErr } = await supabase
          .from("test_results")
          .select("id, score, answers, test_part, time_left, test_time, created_at, submitted_at")
          .eq("quiz_id", quizId)
          .eq("user_id", currentUser.id)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50);

        if (historyErr) {
          console.error("Failed to fetch test_results", historyErr);
        } else if (historyRes) {
          setHistory(historyRes);
        }

        // Fetch quiz for scoring details & slug
        const { data: quizRes, error: quizErr } = await supabase
          .from("quizzes")
          .select("id, title, slug, skill, type, time_minutes, passages(*, questions(*))")
          .eq("id", quizId)
          .single();
          
        if (quizErr) {
          console.error("Failed to fetch quiz for scoring", quizErr);
        } else if (quizRes) {
          setQuizData(quizRes);
        }
      } catch (err) {
        console.error("Failed to fetch practice history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, currentUser?.id, quizId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const testSlug = quizData?.slug || quizId;

  // Render Table
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#00000080] p-4 font-['Noto_Sans']">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[12px] shadow-2xl w-full max-w-[1200px] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative flex justify-center py-6 px-10 border-b border-gray-100">
          <h2 className="text-[22px] font-bold text-[#2D3142]">{title}</h2>
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <span className="material-symbols-rounded text-[28px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 lg:px-10 pb-6 pt-6">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="w-8 h-8 border-4 border-t-primary-500 border-gray-200 rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 text-[#6A7282]">
              Bạn chưa làm bài test này. Hãy bắt đầu ngay!
            </div>
          ) : (
            <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-[#2D3142] font-bold">
                      <th className="py-4 px-5">Quiz</th>
                      <th className="py-4 px-4 text-center">Taken on</th>
                      <th className="py-4 px-4 text-center">Time</th>
                      <th className="py-4 px-4 text-center">Taken</th>
                      <th className="py-4 px-4 text-center">Questions</th>
                      <th className="py-4 px-4 text-center">Correct</th>
                      <th className="py-4 px-4 text-center">Incorrect</th>
                      <th className="py-4 px-4 text-center">Missed</th>
                      <th className="py-4 px-4 text-center">Result</th>
                      <th className="py-4 px-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                    {history.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item, idx) => {
                      const dateToCheck = item.submitted_at || item.created_at;
                      const dayDisplay = dayjs(dateToCheck).format("DD/MM/YYYY");
                      const timeDisplay = dayjs(dateToCheck).format("HH:mm:ss");
                      
                      let correct = 0;
                      let incorrect = 0;
                      let missed = 0;
                      let totalQuestions = 0;
                      let score10 = 0;
                      
                      if (quizData && item.answers) {
                        try {
                          const parsedAnswers = Array.isArray(item.answers) ? item.answers : (item.answers.answers || []);
                          const scoreResult = calculateScore(parsedAnswers, quizData, item.test_part || "all");
                          correct = scoreResult?.correctAns ?? 0;
                          incorrect = scoreResult?.incorrect ?? 0;
                          missed = scoreResult?.missed ?? 0;
                          
                          totalQuestions = quizData.passages?.reduce((acc: number, passage: any) => 
                            acc + (passage.questions?.reduce((qAcc: number, q: any) => qAcc + (q.explanations?.length || 0), 0) || 0)
                          , 0) || 0;
                          
                          if (totalQuestions === 0) totalQuestions = correct + incorrect + missed;
                          
                          const total = correct + incorrect + missed;
                          if (total > 0) score10 = (correct / total) * 10;
                          
                        } catch (e) {
                          console.error("Score parse error", e);
                        }
                      }
                      
                      const timeSpent = item.time_left 
                        ? calcTimeTaken(item.test_time || quizData?.time_minutes || 60, item.time_left) 
                        : "0:00";
                        
                      const isMockTest = quizData?.type === 'exam' || quizData?.type === 'academic' || quizData?.type === 'general';
                      let displayScoreOutput: string;
                      let isPass: boolean;

                      if (isMockTest) {
                        const displayScoreStr = Number.isInteger(score10) ? score10.toString() : score10.toFixed(1);
                        displayScoreOutput = `${displayScoreStr}/10`;
                        isPass = score10 >= 5;
                      } else {
                        const total = correct + incorrect + missed;
                        displayScoreOutput = `${correct}/${total}`;
                        isPass = total > 0 && correct / total >= 0.5;
                      }

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-5 font-medium text-[#2D3142]">{title}</td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col text-xs font-semibold text-[#8B92A5]">
                              <span>{dayDisplay}</span>
                              <span>{timeDisplay}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{timeSpent}</td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{history.length - idx}</td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{totalQuestions}</td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{correct}</td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{incorrect}</td>
                          <td className="py-4 px-4 text-center font-semibold text-[#2D3142]">{missed}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`font-bold ${isPass ? "text-[#1B8C40]" : "text-[#D94A56]"}`}>
                              {displayScoreOutput}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Link href={ROUTES.TEST_RESULT(item.id)} className="text-[#8B92A5] hover:text-[#2D3142] font-semibold text-sm">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 lg:px-10 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <span className="text-sm text-gray-500">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-primary-500"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <span className="text-sm text-gray-500">bài làm</span>
          </div>

          <div className="flex justify-center gap-4">
            <Link 
              href={ROUTES.TAKE_THE_TEST(testSlug)}
              className="w-[140px] h-[40px] rounded-full bg-[#D94A56] hover:bg-[#E3636E] font-semibold text-white flex items-center justify-center transition-colors shadow-sm"
            >
              Thử lại <span className="material-symbols-rounded text-[20px] ml-1">refresh</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-rounded text-xl">chevron_left</span>
            </button>
            <span className="text-sm text-gray-700 font-medium">
              {currentPage} / {Math.ceil(history.length / pageSize) || 1}
            </span>
            <button
              disabled={currentPage >= Math.ceil(history.length / pageSize)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-rounded text-xl">chevron_right</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
