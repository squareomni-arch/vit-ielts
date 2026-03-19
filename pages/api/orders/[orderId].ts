import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getOrderById, updateOrderStatus } from "~services/order";

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

  // ── GET: Lấy thông tin order ──
  if (req.method === "GET") {
    try {
      const order = await getOrderById(supabaseAdmin, orderId);

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
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
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // ── PUT/PATCH: Cập nhật status ──
  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const { status } = req.body;

      if (!status || !["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ success: false, error: "Valid status is required" });
      }

      // Lấy order hiện tại để check previous status
      const currentOrder = await getOrderById(supabaseAdmin, orderId);
      if (!currentOrder) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      // Update status
      const updatedOrder = await updateOrderStatus(supabaseAdmin, orderId, status);

      // TODO(task-09): Affiliate commission khi pending → completed
      // Khi currentOrder.status === "pending" && status === "completed" && currentOrder.affiliate_ref
      // → Tính hoa hồng affiliate qua Supabase

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
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
