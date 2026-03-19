import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const user = await requireAdmin(req, res);
    if (!user) return;

    try {
        const { data, error } = await supabaseAdmin
            .from("orders")
            .select("order_id, user_id, package_type, duration, skill_type, amount, original_amount, discount_amount, coupon_code, status, payment_method, transfer_content, affiliate_ref, created_at, users(email, name)")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Build CSV
        const headers = ["Order ID", "Email", "Tên", "Gói", "Số tiền", "Giảm giá", "Mã giảm giá", "Trạng thái", "Phương thức", "Ngày tạo"];
        const rows = (data ?? []).map((o: Record<string, unknown>) => {
            const user = o.users as Record<string, unknown> | null;
            return [
                o.order_id,
                user?.email ?? "",
                user?.name ?? "",
                o.package_type,
                o.amount,
                o.discount_amount,
                o.coupon_code ?? "",
                o.status,
                o.payment_method ?? "",
                o.created_at,
            ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
        });

        const csv = [headers.join(","), ...rows].join("\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=orders-${new Date().toISOString().split("T")[0]}.csv`);
        return res.status(200).send(csv);
    } catch (error) {
        return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
    }
}
