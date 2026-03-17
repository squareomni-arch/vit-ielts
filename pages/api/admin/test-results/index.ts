import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "../../../../lib/admin-auth";

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

            const hasPostFilters = !!(
                (search && typeof search === "string") ||
                (skill && typeof skill === "string") ||
                (type && typeof type === "string")
            );

            let query = supabaseAdmin
                .from("test_results")
                .select(
                    "id, user_id, quiz_id, score, status, test_time, submitted_at, created_at, users(email, name), quizzes(title, skill, type)",
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

            // Sort
            const sortField = typeof sort === "string" ? sort : "created_at";
            const ascending = order === "asc";
            query = query.order(sortField, { ascending });

            // If post-fetch filters exist, fetch ALL rows; otherwise use DB pagination
            if (!hasPostFilters) {
                query = query.range(from, to);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            let filtered = data ?? [];

            // ── Post-fetch filters (joined columns can't be filtered in Supabase) ──
            if (search && typeof search === "string") {
                const q = search.toLowerCase();
                filtered = filtered.filter((r: any) =>
                    (r.users?.email?.toLowerCase().includes(q)) ||
                    (r.users?.name?.toLowerCase().includes(q)) ||
                    (r.quizzes?.title?.toLowerCase().includes(q))
                );
            }

            if (skill && typeof skill === "string") {
                filtered = filtered.filter((r: any) => r.quizzes?.skill === skill);
            }

            if (type && typeof type === "string") {
                filtered = filtered.filter((r: any) => r.quizzes?.type === type);
            }

            // Manual pagination when post-fetch filters were applied
            const filteredCount = hasPostFilters ? filtered.length : (count ?? 0);
            const pageData = hasPostFilters ? filtered.slice(from, from + size) : filtered;

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
