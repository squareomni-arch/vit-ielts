import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { updateOrderStatus } from "../../../../services/order";
import { activateProAccount } from "../../../../services/user";
import { requireAdmin } from "../../../../lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing order ID" });
    }

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("orders")
                .select("*, users(id, email, name, is_pro, pro_expiration_date)")
                .eq("id", id)
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as any;
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Order not found" });
            }
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { status, activatePro, durationMonths = 1 } = req.body;

            if (!status) return res.status(400).json({ success: false, error: "Missing status" });

            // Update order status
            const order = await updateOrderStatus(supabaseAdmin, id, status);

            // If manually confirming, optionally activate Pro
            if (status === "completed" && activatePro && order.user_id) {
                // Fetch order details to get package_type and skill_type
                const { data: orderDetail } = await supabaseAdmin
                    .from("orders")
                    .select("package_type, skill_type")
                    .eq("order_id", id)
                    .single();

                const proSkills =
                    orderDetail?.package_type === "single" && orderDetail?.skill_type
                        ? [orderDetail.skill_type]
                        : null;

                await activateProAccount(supabaseAdmin, order.user_id, Number(durationMonths), proSkills);
            }

            return res.status(200).json({ success: true, data: order, message: "Order updated" });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
