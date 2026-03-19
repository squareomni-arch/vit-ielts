import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createQuiz } from "~services/quiz";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing quiz ID" });
    }

    try {
        // Fetch original quiz with passages and questions
        const { data: original, error } = await supabaseAdmin
            .from("quizzes")
            .select(`*, passages(*, questions(*))`)
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!original) return res.status(404).json({ success: false, error: "Quiz not found" });

        // Strip IDs and create input for new quiz
        const { id: _qId, created_at: _qCa, published_at: _qPa, tests_taken: _qTt, views: _qV, votes: _qVo, passages, ...quizFields } = original;

        const cloneInput = {
            ...quizFields,
            title: `${original.title} (Copy)`,
            slug: `${original.slug}-copy-${Date.now()}`,
            status: "draft" as const,
            passages: (passages ?? []).map((p: Record<string, unknown>) => {
                const { id: _pId, quiz_id: _pQid, questions, ...passageFields } = p;
                return {
                    ...passageFields,
                    questions: ((questions as Record<string, unknown>[]) ?? []).map((q: Record<string, unknown>) => {
                        const { id: _qid, passage_id: _pid, ...questionFields } = q;
                        return questionFields;
                    }),
                };
            }),
        };

        const clonedQuiz = await createQuiz(supabaseAdmin, cloneInput as Parameters<typeof createQuiz>[1]);

        return res.status(200).json({
            success: true,
            data: clonedQuiz,
            message: "Quiz cloned successfully",
        });
    } catch (error) {
        const pgErr = error as any;
        if (pgErr?.code === "PGRST116") {
            return res.status(404).json({ success: false, error: "Quiz not found" });
        }
        console.error(`[API /api/admin/quizzes/${id}/clone]`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
