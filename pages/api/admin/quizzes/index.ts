import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createQuiz } from "~services/quiz";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { search, skill, type, status, page = "1", pageSize = "20" } = req.query;
            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 20;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            let query = supabaseAdmin
                .from("quizzes")
                .select("id, title, slug, skill, type, status, tests_taken, pro_user_only, created_at, featured_image", { count: "exact" });

            if (search && typeof search === "string") {
                query = query.ilike("title", `%${search}%`);
            }
            if (skill && typeof skill === "string") query = query.eq("skill", skill);
            if (type && typeof type === "string") query = query.eq("type", type);
            if (status && typeof status === "string") query = query.eq("status", status);

            query = query.order("created_at", { ascending: false }).range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            return res.status(200).json({
                success: true,
                data: data ?? [],
                count: count ?? 0,
                page: pageNum,
                pageSize: size,
                totalPages: Math.ceil((count ?? 0) / size),
            });
        } catch (error) {
            console.error("[API /api/admin/quizzes]", error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    if (req.method === "POST") {
        try {
            const input = req.body;
            const quiz = await createQuiz(supabaseAdmin, input);
            return res.status(200).json({ success: true, data: quiz });
        } catch (error) {
            console.error("[API /api/admin/quizzes] POST", error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
