/**
 * Progress Service — Vit IELTS
 *
 * Aggregates a user's test_results (joined to quizzes) for the My Progress page.
 * All functions are read-only; no DB mutations occur here.
 *
 * Usage in getServerSideProps:
 *   const overview = await getProgressOverview(supabase, user.id);
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type SkillAverage = {
    skill: string;
    /** Average band score, rounded to nearest 0.5, or null if no results. */
    average: number | null;
    count: number;
};

export type RecentResultItem = {
    id: string;
    title: string;
    /** e.g. "Reading · 5 Jun 2026" */
    meta: string;
    /** e.g. "Band 7.0" */
    bandLabel: string;
    score: number;
    submittedAt: string;
};

export type ProgressOverview = {
    /** Latest overall band across all skills (null = no results). */
    latestBand: number | null;
    /** Total published test results for this user. */
    totalTests: number;
    /** Per-skill averages/counts. Contains reading and listening (from quizzes table). */
    skillAverages: SkillAverage[];
    /** Up to 5 most recent submitted results. */
    recentResults: RecentResultItem[];
    /**
     * Band data points ordered oldest→newest for the trend chart.
     * Each entry is the average band for that submitted_at day (ISO date string).
     * At most 8 data points (last 8 days that had at least one submission).
     */
    bandTrend: Array<{ date: string; band: number }>;
};

/** Empty/safe default — returned when queries fail or user has no results. */
const EMPTY_OVERVIEW: ProgressOverview = {
    latestBand: null,
    totalTests: 0,
    skillAverages: [],
    recentResults: [],
    bandTrend: [],
};

// ============================================================================
// Helpers
// ============================================================================

/** Round to nearest IELTS half-band (0.5 step). */
function roundIelts(n: number): number {
    return Math.round(n * 2) / 2;
}

/** Format a date string like "5 Jun 2026". */
function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// ============================================================================
// Main function
// ============================================================================

/**
 * Aggregate a user's test progress from test_results joined to quizzes.
 *
 * Only considers results with status = 'published' (submitted tests).
 * Degrades gracefully on DB error — returns EMPTY_OVERVIEW, never throws.
 */
export async function getProgressOverview(
    supabase: SupabaseClient,
    userId: string,
): Promise<ProgressOverview> {
    try {
        // Fetch all published results for the user, joining quiz skill + title.
        // Ordered newest-first; we'll reverse for trend later.
        const { data, error } = await supabase
            .from("test_results")
            .select(
                `id, score, submitted_at,
                 quizzes ( id, title, skill )`,
            )
            .eq("user_id", userId)
            .eq("status", "published")
            .not("score", "is", null)
            .not("submitted_at", "is", null)
            .order("submitted_at", { ascending: false });

        if (error || !data) {
            return EMPTY_OVERVIEW;
        }

        if (data.length === 0) {
            return EMPTY_OVERVIEW;
        }

        // ── Types ──────────────────────────────────────────────────────────────
        type Row = {
            id: string;
            score: number | null;
            submitted_at: string | null;
            quizzes: { id: string; title: string; skill: string } | null;
        };

        const rows = data as unknown as Row[];

        // ── Total tests ────────────────────────────────────────────────────────
        const totalTests = rows.length;

        // ── Latest band ────────────────────────────────────────────────────────
        // rows[0] is newest (order desc above)
        const latestBand =
            rows[0].score !== null ? roundIelts(rows[0].score) : null;

        // ── Per-skill averages ─────────────────────────────────────────────────
        const skillBuckets = new Map<string, number[]>();

        for (const row of rows) {
            const skill = row.quizzes?.skill;
            if (!skill || row.score === null) continue;
            if (!skillBuckets.has(skill)) skillBuckets.set(skill, []);
            skillBuckets.get(skill)!.push(row.score);
        }

        const skillOrder = ["listening", "reading", "writing", "speaking"];
        const skillAverages: SkillAverage[] = skillOrder
            .filter((s) => skillBuckets.has(s))
            .map((skill) => {
                const scores = skillBuckets.get(skill)!;
                const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                return { skill, average: roundIelts(avg), count: scores.length };
            });

        // ── Recent results (up to 5) ───────────────────────────────────────────
        const recentResults: RecentResultItem[] = rows.slice(0, 5).map((row) => {
            const skill = row.quizzes?.skill ?? "";
            const skillLabel =
                skill.charAt(0).toUpperCase() + skill.slice(1);
            const dateLabel = row.submitted_at
                ? formatDate(row.submitted_at)
                : "";
            const band = row.score !== null ? roundIelts(row.score) : 0;

            return {
                id: row.id,
                title: row.quizzes?.title ?? "Unknown test",
                meta: `${skillLabel} · ${dateLabel}`.trim().replace(/^·\s*/, ""),
                bandLabel: `Band ${band}`,
                score: band,
                submittedAt: row.submitted_at ?? "",
            };
        });

        // ── Band trend (last 8 days with submissions) ──────────────────────────
        // Group by ISO date (YYYY-MM-DD), average scores per day.
        const dayBuckets = new Map<string, number[]>();

        for (const row of rows) {
            if (!row.submitted_at || row.score === null) continue;
            const day = row.submitted_at.slice(0, 10); // YYYY-MM-DD
            if (!dayBuckets.has(day)) dayBuckets.set(day, []);
            dayBuckets.get(day)!.push(row.score);
        }

        // Sort days ascending (oldest → newest), take last 8
        const sortedDays = Array.from(dayBuckets.keys()).sort();
        const trendDays = sortedDays.slice(-8);

        const bandTrend = trendDays.map((date) => {
            const scores = dayBuckets.get(date)!;
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return { date, band: roundIelts(avg) };
        });

        return {
            latestBand,
            totalTests,
            skillAverages,
            recentResults,
            bandTrend,
        };
    } catch {
        // Never crash the page — return empty state
        return EMPTY_OVERVIEW;
    }
}
