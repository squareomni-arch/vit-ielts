import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { getOrderById, updateOrderStatus } from "~services/order";
import { isAdminRole } from "~lib/parseRoles";

type ResponseData = {
  success: boolean;
  order?: Record<string, unknown>;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ success: false, error: "Order ID is required" });
  }

  // Require auth for all methods
  const supabase = createApiSupabase(req, res);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // ── GET: Lấy thông tin order (chủ sở hữu hoặc admin) ──
  if (req.method === "GET") {
    try {
      const order = await getOrderById(supabaseAdmin, orderId);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      if (order.user_id !== user.id) {
        const { data: profile } = await supabaseAdmin
          .from("users")
          .select("roles")
          .eq("id", user.id)
          .maybeSingle();
        if (!isAdminRole(profile?.roles)) {
          return res.status(404).json({ success: false, error: "Order not found" });
        }
      }

      return res.status(200).json({
        success: true,
        order: {
          id: order.id,
          orderId: order.order_id,
          orderFields: {
            packageType: order.package_type,
            duration: order.duration,
            skillType: order.skill_type,
            amount: order.amount,
            status: order.status,
            paymentMethod: order.payment_method,
            transferContent: order.transfer_content,
            createdAt: order.created_at,
          },
        },
      });
    } catch (error) {
      console.error("[API /api/orders/[orderId]] GET error:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // ── PUT/PATCH: Admin-only status change ──
  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("roles")
        .eq("id", user.id)
        .maybeSingle();
      if (!isAdminRole(profile?.roles)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      const { status } = req.body;

      if (!status || !["pending", "completed", "cancelled", "expired"].includes(status)) {
        return res.status(400).json({ success: false, error: "Valid status is required" });
      }

      const currentOrder = await getOrderById(supabaseAdmin, orderId);
      if (!currentOrder) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      const updatedOrder = await updateOrderStatus(supabaseAdmin, orderId, status);

      return res.status(200).json({
        success: true,
        order: {
          id: updatedOrder.id,
          orderId: updatedOrder.order_id,
          orderFields: {
            packageType: updatedOrder.package_type,
            duration: updatedOrder.duration,
            skillType: updatedOrder.skill_type,
            amount: updatedOrder.amount,
            status: updatedOrder.status,
            paymentMethod: updatedOrder.payment_method,
            transferContent: updatedOrder.transfer_content,
            createdAt: updatedOrder.created_at,
          },
        },
      });
    } catch (error) {
      console.error("[API /api/orders/[orderId]] PUT/PATCH error:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
