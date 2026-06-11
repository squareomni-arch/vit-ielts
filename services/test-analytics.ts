/**
 * Test Analytics Service
 *
 * Computes percentile rank and band uplift for a given test result.
 * Read-only — never mutates any row.
 *
 * getResultAnalytics:
 *   - percentile: percentage of OTHER finished results on the same quiz that
 *     the current score strictly beats (null when sample is too small).
 *   - bandUplift: current score minus the user's most-recent prior finished
 *     result on the same quiz (null when no prior result exists).
 *   - sampleSize: number of other finished results used for percentile calc.
 *
 * Guard rules:
 *   - percentile is null  when sampleSize < MIN_SAMPLE_SIZE (5)
 *   - bandUplift is null  when the user has no earlier result on the same quiz
 *   - Any Supabase error → all nulls (defensive try/catch)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const MIN_SAMPLE_SIZE = 5;
const FINISHED_STATUS = "published";

export type ResultAnalytics = {
    percentile: number | null;
    bandUplift: number | null;
    sampleSize: number;
};

export type GetResultAnalyticsParams = {
    quizId: string;
    userId: string;
    score: number;
    /** The current result's own ID — excluded from "other results" used for percentile */
    resultId: string;
};

export async function getResultAnalytics(
    supabase: SupabaseClient,
    { quizId, userId, score, resultId }: GetResultAnalyticsParams,
): Promise<ResultAnalytics> {
    try {
        // ── 1. Percentile via SECURITY DEFINER RPC ──
        // RLS ("User own test results") lets a user read only their own rows, so
        // the cohort percentile must be computed server-side. The RPC returns
        // only aggregate numbers — no other users' rows are exposed.
        const { data: pctRows, error: otherErr } = await supabase.rpc(
            "get_score_percentile",
            { p_quiz_id: quizId, p_score: score, p_exclude_result: resultId },
        );

        if (otherErr) {
            return { percentile: null, bandUplift: null, sampleSize: 0 };
        }

        const pct = Array.isArray(pctRows) ? pctRows[0] : pctRows;
        const sampleSize: number = pct?.sample_size ?? 0;

        let percentile: number | null = null;
        if (sampleSize >= MIN_SAMPLE_SIZE && pct?.percentile != null) {
            // RPC already returns the percentile (% of cohort strictly beaten),
            // e.g. 82 → displayed as "Top 18%".
            percentile = pct.percentile;
        }

        // ── 2. Band uplift: user's most-recent PRIOR finished result on same quiz ──
        const { data: priorRows, error: priorErr } = await supabase
            .from("test_results")
            .select("score, submitted_at")
            .eq("quiz_id", quizId)
            .eq("user_id", userId)
            .eq("status", FINISHED_STATUS)
            .neq("id", resultId)
            .order("submitted_at", { ascending: false })
            .limit(1);

        if (priorErr) {
            // Percentile already computed; return it with null uplift
            return { percentile, bandUplift: null, sampleSize };
        }

        let bandUplift: number | null = null;
        if (priorRows && priorRows.length > 0) {
            const priorScore = priorRows[0].score;
            if (typeof priorScore === "number" && Number.isFinite(priorScore)) {
                // Round to one decimal to match IELTS band precision
                bandUplift = Math.round((score - priorScore) * 10) / 10;
            }
        }

        return { percentile, bandUplift, sampleSize };
    } catch {
        return { percentile: null, bandUplift: null, sampleSize: 0 };
    }
}
