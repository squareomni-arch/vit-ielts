import { createClient } from "~supabase/client";

// ============================================================================
// Types
// ============================================================================

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  monthDays: number;
};

export type DailyActivity = {
  date: string;
  reading: number;
  listening: number;
  total: number;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch streak summary stats using RPC.
 */
export async function fetchStreakSummary(
  userId: string
): Promise<StreakSummary> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_study_streak_summary", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching streak summary:", error);
    return { currentStreak: 0, longestStreak: 0, totalDays: 0, monthDays: 0 };
  }

  const result = data as any;
  return {
    currentStreak: result?.current_streak ?? 0,
    longestStreak: result?.longest_streak ?? 0,
    totalDays: result?.total_days ?? 0,
    monthDays: result?.month_days ?? 0,
  };
}

/**
 * Fetch monthly activity data using RPC.
 */
export async function fetchMonthlyActivities(
  userId: string,
  year: number,
  month: number
): Promise<DailyActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_monthly_activities", {
    p_user_id: userId,
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error("Error fetching monthly activities:", error);
    return [];
  }

  return (data as any[]) ?? [];
}
