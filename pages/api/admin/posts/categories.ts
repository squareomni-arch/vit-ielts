import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

/**
 * GET /api/admin/posts/categories
 *
 * Trả về danh sách tất cả categories đã được sử dụng trong bảng posts.
 * Dùng để hiển thị gợi ý trong admin post editor.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        // Fetch categories column from all posts (only what we need)
        const { data, error } = await supabaseAdmin
            .from("posts")
            .select("categories")
            .not("categories", "is", null);

        if (error) throw error;

        // Flatten, dedupe, sort — categories is string[]
        const allCategories = (data ?? [])
            .flatMap((row: { categories: string[] | null }) => row.categories ?? [])
            .filter((cat: string) => typeof cat === "string" && cat.trim().length > 0);

        const unique = [...new Set(allCategories)].sort((a: string, b: string) =>
            a.localeCompare(b, "vi")
        );

        return res.status(200).json({ success: true, data: unique });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
