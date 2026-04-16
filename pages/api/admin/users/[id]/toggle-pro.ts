import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { activateProAccount, calculateProExpirationDate } from "~services/user";
import { requireAdmin } from "~lib/admin-auth";
import dayjs from "dayjs";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing user ID" });
    }

    try {
        const { action, durationMonths, durationDays, note } = req.body;

        // ── Activate: theo tháng hoặc theo ngày ──────────────────
        if (action === "activate") {
            let expirationDate: string;

            if (durationDays && Number(durationDays) > 0) {
                // Theo ngày: lấy current Pro status rồi tính thêm ngày
                const { data: currentUser } = await supabaseAdmin
                    .from("users")
                    .select("is_pro, pro_expiration_date")
                    .eq("id", id)
                    .single();

                const base = currentUser?.is_pro && currentUser?.pro_expiration_date
                    && dayjs(currentUser.pro_expiration_date).isAfter(dayjs())
                    ? dayjs(currentUser.pro_expiration_date)
                    : dayjs();

                expirationDate = base.add(Number(durationDays), "day").format("YYYY-MM-DD");

                const { data, error } = await supabaseAdmin
                    .from("users")
                    .update({ is_pro: true, pro_expiration_date: expirationDate })
                    .eq("id", id)
                    .select("is_pro, pro_expiration_date")
                    .single();

                if (error) throw error;

                return res.status(200).json({
                    success: true,
                    message: `Pro activated for ${durationDays} day(s)${note ? ` — Lý do: ${note}` : ""}`,
                    data,
                });
            }

            // Theo tháng (mặc định)
            const months = Number(durationMonths ?? 1);
            const result = await activateProAccount(supabaseAdmin, id, months);
            return res.status(200).json({
                success: true,
                message: `Pro activated for ${months} month(s)${note ? ` — Lý do: ${note}` : ""}`,
                data: result,
            });
        }

        // ── Deactivate ───────────────────────────────────────────
        if (action === "deactivate") {
            const { data, error } = await supabaseAdmin
                .from("users")
                .update({ is_pro: false })
                .eq("id", id)
                .select("is_pro, pro_expiration_date")
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: `Pro deactivated${note ? ` — Lý do: ${note}` : ""}`,
                data,
            });
        }

        // ── Extend / Set ngày PRO trực tiếp ──────────────────────
        if (action === "set-date") {
            const { expirationDate } = req.body;
            if (!expirationDate) {
                return res.status(400).json({ success: false, error: "Missing expirationDate" });
            }

            const parsedDate = dayjs(expirationDate);
            if (!parsedDate.isValid()) {
                return res.status(400).json({ success: false, error: "Invalid expirationDate format" });
            }

            const isPro = parsedDate.isAfter(dayjs());
            const { data, error } = await supabaseAdmin
                .from("users")
                .update({ is_pro: isPro, pro_expiration_date: parsedDate.format("YYYY-MM-DD") })
                .eq("id", id)
                .select("is_pro, pro_expiration_date")
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: `Pro expiration date set to ${parsedDate.format("DD/MM/YYYY")}${note ? ` — Lý do: ${note}` : ""}`,
                data,
            });
        }

        return res.status(400).json({ success: false, error: "Invalid action. Use 'activate', 'deactivate', or 'set-date'" });
    } catch (error) {
        console.error(`[API /api/admin/users/${id}/toggle-pro]`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
