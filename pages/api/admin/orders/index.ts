import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { search, status, page = "1", pageSize = "20", dateFrom, dateTo } = req.query;
            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 20;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            let query = supabaseAdmin
                .from("orders")
                .select("*, users(id, email, name)", { count: "exact" });

            if (search && typeof search === "string") {
                query = query.or(`order_id.ilike.%${search}%,transfer_content.ilike.%${search}%`);
            }
            if (status && typeof status === "string") query = query.eq("status", status);
            if (dateFrom && typeof dateFrom === "string") query = query.gte("created_at", dateFrom);
            if (dateTo && typeof dateTo === "string") query = query.lte("created_at", dateTo);

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
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
