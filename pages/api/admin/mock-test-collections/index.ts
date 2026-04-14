import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

function slugify(text: string): string {
    const dm: Record<string, string> = {
        à:"a",á:"a",ả:"a",ã:"a",ạ:"a",
        ă:"a",ằ:"a",ắ:"a",ẳ:"a",ẵ:"a",ặ:"a",
        â:"a",ầ:"a",ấ:"a",ẩ:"a",ẫ:"a",ậ:"a",
        đ:"d",
        è:"e",é:"e",ẻ:"e",ẽ:"e",ẹ:"e",
        ê:"e",ề:"e",ế:"e",ể:"e",ễ:"e",ệ:"e",
        ì:"i",í:"i",ỉ:"i",ĩ:"i",ị:"i",
        ò:"o",ó:"o",ỏ:"o",õ:"o",ọ:"o",
        ô:"o",ồ:"o",ố:"o",ổ:"o",ỗ:"o",ộ:"o",
        ơ:"o",ờ:"o",ớ:"o",ở:"o",ỡ:"o",ợ:"o",
        ù:"u",ú:"u",ủ:"u",ũ:"u",ụ:"u",
        ư:"u",ừ:"u",ứ:"u",ử:"u",ữ:"u",ự:"u",
        ỳ:"y",ý:"y",ỷ:"y",ỹ:"y",ỵ:"y",
    };
    return text.toLowerCase().split("").map(ch => dm[ch] || ch).join("")
        .replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    // ────────────────────────────────────────────────
    // GET  /api/admin/mock-test-collections
    // ────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const { search, page = "1", pageSize = "20" } = req.query;
            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 20;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            let query = supabaseAdmin
                .from("mock_test_collections")
                .select("id, title, slug, mock_test_ids, featured_image, created_at", { count: "exact" });

            if (search && typeof search === "string") {
                query = query.ilike("title", `%${search}%`);
            }

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
            console.error("[API /api/admin/mock-test-collections] GET", error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ────────────────────────────────────────────────
    // POST /api/admin/mock-test-collections
    // ────────────────────────────────────────────────
    if (req.method === "POST") {
        try {
            const { title } = req.body;
            if (!title) {
                return res.status(400).json({ success: false, error: "Title is required" });
            }

            const baseSlug = slugify(title);
            const uniqueSuffix = Date.now().toString(36).slice(-5);
            const slug = baseSlug ? `${baseSlug}-${uniqueSuffix}` : `collection-${uniqueSuffix}`;

            const { data, error } = await supabaseAdmin
                .from("mock_test_collections")
                .insert({ title, slug, mock_test_ids: [], featured_image: null })
                .select()
                .single();

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "create",
                entityType: "mock_test_collection",
                entityId: data.id,
                entityTitle: title,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error("[API /api/admin/mock-test-collections] POST", error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
