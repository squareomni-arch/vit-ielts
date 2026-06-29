import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const {
                search, skill, status, type,
                scoreMin, scoreMax,
                page = "1", pageSize = "20",
                sort = "created_at", order = "desc",
            } = req.query;

            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 20;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            // skill/type live on the embedded quizzes row and CAN be filtered in
            // the DB via an inner join — no need to pull every row into Node.
            const wantsQuizFilter = !!(
                (skill && typeof skill === "string") ||
                (type && typeof type === "string")
            );
            // search spans two relations (users.email/name OR quizzes.title), which
            // PostgREST can't express as one filter, so it stays a JS post-filter —
            // but over a bounded recent window, never the whole table.
            const wantsSearch = !!(search && typeof search === "string");
            // ponytail: search scans the most-recent SEARCH_SCAN_CAP rows to bound
            // memory; add a pg trigram/FTS index if admins need full-history search.
            const SEARCH_SCAN_CAP = 1000;

            const quizEmbed = wantsQuizFilter
                ? "quizzes!inner(title, skill, type)"
                : "quizzes(title, skill, type)";

            let query = supabaseAdmin
                .from("test_results")
                .select(
                    `id, user_id, quiz_id, score, status, test_time, submitted_at, created_at, users(email, name), ${quizEmbed}`,
                    { count: "exact" },
                );

            // ── DB-level filters ──
            if (status && typeof status === "string") {
                query = query.eq("status", status);
            }

            if (scoreMin && typeof scoreMin === "string") {
                const min = parseFloat(scoreMin);
                if (!isNaN(min)) query = query.gte("score", min);
            }

            if (scoreMax && typeof scoreMax === "string") {
                const max = parseFloat(scoreMax);
                if (!isNaN(max)) query = query.lte("score", max);
            }

            if (skill && typeof skill === "string") {
                query = query.eq("quizzes.skill", skill);
            }

            if (type && typeof type === "string") {
                query = query.eq("quizzes.type", type);
            }

            // Sort
            const sortField = typeof sort === "string" ? sort : "created_at";
            const ascending = order === "asc";
            query = query.order(sortField, { ascending });

            // Searching joined text needs a JS post-filter → scan a bounded recent
            // window. Everything else paginates in the DB.
            if (wantsSearch) {
                query = query.range(0, SEARCH_SCAN_CAP - 1);
            } else {
                query = query.range(from, to);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            let filtered = data ?? [];

            // ── Search post-filter (cross-relation, can't be a DB filter) ──
            if (wantsSearch) {
                const q = (search as string).toLowerCase();
                filtered = filtered.filter((r: any) =>
                    (r.users?.email?.toLowerCase().includes(q)) ||
                    (r.users?.name?.toLowerCase().includes(q)) ||
                    (r.quizzes?.title?.toLowerCase().includes(q))
                );
            }

            // Manual pagination only when search post-filtered the window; skill/type
            // are DB-side now, so their count + page come straight from PostgREST.
            const filteredCount = wantsSearch ? filtered.length : (count ?? 0);
            const pageData = wantsSearch ? filtered.slice(from, from + size) : filtered;

            return res.status(200).json({
                success: true,
                data: pageData,
                count: filteredCount,
                page: pageNum,
                pageSize: size,
                totalPages: Math.ceil(filteredCount / size),
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing id" });
            const { error } = await supabaseAdmin.from("test_results").delete().eq("id", id);
            if (error) throw error;
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
