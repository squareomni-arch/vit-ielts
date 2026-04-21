// === SECTION: Dashboard Stats Cards ===
// Figma: 3 horizontal stat cards — orange, blue, green
// Geometric: desktop 3-col grid, gap ~24px; mobile 1-col stacked
//   Each card: icon circle (left) + label + value (right)
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/appx/providers";
import { formatBandScore } from "@/shared/lib";
import { createClient } from "~supabase/client";

type StatItem = {
  iconSrc: string;
  label: string;
  value: string;
  bgColor: string;
};

export const DashboardStats = () => {
  const { currentUser } = useAuth();
  const [totalTime, setTotalTime] = useState("0 Giờ 0 Phút");
  const [totalTests, setTotalTests] = useState(0);
  const [totalScore, setTotalScore] = useState("0.0");

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser?.id) return;
      try {
        const supabase = createClient();
        const { data: results } = await supabase
          .from("test_results")
          .select("quiz_id, time_left, score")
          .eq("user_id", currentUser.id)
          .eq("status", "published");

        if (!results || results.length === 0) return;

        const quizIds = [...new Set(results.map((r) => r.quiz_id))].filter(Boolean);
        let quizMap = new Map();
        
        if (quizIds.length > 0) {
          const { data: quizzes } = await supabase
            .from("quizzes")
            .select("id, time_minutes")
            .in("id", quizIds);
          quizMap = new Map((quizzes || []).map((q) => [q.id, q.time_minutes || 60]));
        }

        let totalTimeMin = 0;
        let totalScoreSum = 0;

        results.forEach((r) => {
          const timeLimit = quizMap.get(r.quiz_id) || 60;
          let leftMin = 0;
          if (r.time_left && typeof r.time_left === "string") {
            const [m, s] = r.time_left.split(":");
            leftMin = Number(m) + (Number(s) || 0) / 60;
          }
          const spent = timeLimit - leftMin;
          if (spent > 0) {
            totalTimeMin += spent;
          }

          if (r.score) {
            totalScoreSum += Number(r.score);
          }
        });

        const hours = Math.floor(totalTimeMin / 60);
        const mins = Math.floor(totalTimeMin % 60);
        setTotalTime(`${hours} Giờ ${mins} Phút`);
        setTotalTests(results.length);
        
        setTotalScore(formatBandScore(totalScoreSum) ?? "0.0");
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };

    fetchStats();
  }, [currentUser?.id]);

  const stats: StatItem[] = [
    {
      iconSrc: "/assets/figma/icons/count.svg",
      label: "Tổng thời gian làm test",
      value: totalTime,
      bgColor: "#FC945A",
    },
    {
      iconSrc: "/assets/figma/icons/Note.svg",
      label: "Bài test đã hoàn thành",
      value: String(totalTests),
      bgColor: "#2F80ED",
    },
    {
      iconSrc: "/assets/figma/icons/Goal.svg",
      label: "Số điểm đã đạt được",
      value: String(totalScore),
      bgColor: "#27AE60",
    },
  ];

  return (
    <div
      data-section="dashboard-stats"
      className="grid grid-cols-1 sm:grid-cols-3 gap-6"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-stretch rounded-[100px] overflow-hidden max-w-full"
          style={{
             backgroundColor: stat.bgColor,
             border: `6px solid ${stat.bgColor}`,
          }}
        >
          {/* Icon block */}
          <div
            className="flex-shrink-0 flex items-center justify-center p-[26px] aspect-square w-[92px] h-[92px]"
          >
            <Image src={stat.iconSrc} alt={stat.label} width={40} height={40} className="w-full h-full object-contain brightness-0 invert" />
          </div>
          {/* Text block */}
          <div 
            className="flex flex-col justify-center px-4 sm:px-5 py-2 min-w-0 flex-1 bg-white rounded-r-[34px]"
          >
            <p className="text-[#2D3142] font-semibold text-base whitespace-nowrap overflow-hidden text-ellipsis line-clamp-1">
              {stat.label}
            </p>
            <p className="text-2xl font-normal leading-tight mt-1" style={{ color: stat.bgColor }}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
