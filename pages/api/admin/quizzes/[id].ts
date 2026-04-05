import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getQuizBySlug, updateQuiz, deleteQuiz } from "~services/quiz";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing quiz ID" });
    }

    if (req.method === "GET") {
        try {
            // Get quiz with passages and questions
            const { data, error } = await supabaseAdmin
                .from("quizzes")
                .select(`*, passages(*, questions(*))`)
                .eq("id", id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, error: "Quiz not found" });

            // Sort passages and questions by sort_order
            if (data.passages) {
                data.passages.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
                data.passages.forEach((p: { questions?: { sort_order: number }[] }) => {
                    if (p.questions) {
                        p.questions.sort((a, b) => a.sort_order - b.sort_order);
                    }
                });
            }

            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as any;
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Quiz not found" });
            }
            console.error(`[API /api/admin/quizzes/${id}] GET`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    if (req.method === "PUT") {
        try {
            const input = req.body;
            const quiz = await updateQuiz(supabaseAdmin, id, input);

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: input.status === "published" ? "publish" : "update",
                entityType: "quiz",
                entityId: id,
                entityTitle: input.title || quiz?.title,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, data: quiz });
        } catch (error) {
            console.error(`[API /api/admin/quizzes/${id}] PUT`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    if (req.method === "DELETE") {
        try {
            await deleteQuiz(supabaseAdmin, id);

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "quiz",
                entityId: id,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, message: "Quiz deleted" });
        } catch (error) {
            console.error(`[API /api/admin/quizzes/${id}] DELETE`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
