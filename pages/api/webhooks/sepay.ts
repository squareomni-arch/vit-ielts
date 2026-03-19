import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabaseAdmin } from "~supabase/admin";
import {
  getOrderByTransferContent,
  completeOrder,
} from "~services/order";
import { activateProAccount, getUserProfile } from "~services/user";
import {
  sendOrderConfirmEmail,
  sendAdminNotificationEmail,
} from "~services/email";
import { dbg } from "~lib/debug";

const log = dbg.webhook;

// ============================================================
// Types
// ============================================================

interface SepayWebhookPayload {
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: string;
  description?: string;
  transferAmount?: number;
  referenceCode?: string;
  accumulated?: number;
  id?: number;
}

// ============================================================
// Signature Verification (Blocker #1)
// ============================================================

/**
 * Verify HMAC-SHA256 signature from Sepay webhook.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    // Buffers of different lengths → signature is invalid
    return false;
  }
}

// ============================================================
// Handler
// ============================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Blocker #1: Verify webhook signature ──
  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature =
      (req.headers["x-sepay-signature"] as string) ||
      (req.headers["authorization"] as string) ||
      "";

    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      log.error("[Sepay Webhook] Invalid or missing signature");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
  }

  try {
    const payload: SepayWebhookPayload = req.body;
    log(
      `[Sepay Webhook] Raw payload received:`,
      JSON.stringify(payload, null, 2),
    );

    const amount = Number(payload.transferAmount);
    const content = payload.content || "";

    // Validate payload
    if (!amount || !content) {
      return res.status(400).json({
        error: "Missing required fields: transferAmount or content",
        received: payload,
      });
    }

    // ── Parse orderId from content ──
    // Format: "IELTS PREDICTION 17691622312585779 FT26023000837022 ..."
    let orderId = "";

    const orderIdPattern = /IELTS\s+PREDICTION\s+(\d+)/i;
    const match = content.match(orderIdPattern);

    if (match) {
      const fullPattern = /IELTS\s+PREDICTION\s*\d+/i;
      const fullMatch = content.match(fullPattern);
      if (fullMatch) {
        orderId = fullMatch[0].replace(/\s+/g, " ").trim();
      } else {
        orderId = `IELTS PREDICTION ${match[1]}`;
      }
    } else {
      orderId = content.trim();
      log.warn(
        `[Sepay Webhook] Could not parse orderId from content, using full content: ${orderId}`,
      );
    }

    log(`[Sepay Webhook] Parsed payment notification:`, {
      amount,
      orderId,
      originalContent: content,
      accountNumber: payload.accountNumber,
      gateway: payload.gateway,
      transactionDate: payload.transactionDate || new Date().toISOString(),
    });

    // ── Find order ──
    let order = await getOrderByTransferContent(supabaseAdmin, orderId);

    // Retry with numeric part only if not found
    if (!order) {
      const orderIdNumbers = orderId
        .replace("IELTS PREDICTION", "")
        .trim();
      if (orderIdNumbers) {
        order = await getOrderByTransferContent(
          supabaseAdmin,
          orderIdNumbers,
        );
      }
    }

    if (!order) {
      log.error(`[Sepay Webhook] Order not found:`, {
        searchedOrderId: orderId,
      });
      return res.status(404).json({
        error: "Order not found",
        orderId,
        searchedContent: content,
      });
    }

    log(`[Sepay Webhook] Found order:`, {
      orderId: order.order_id,
      transferContent: order.transfer_content,
      amount: order.amount,
      status: order.status,
      userId: order.user_id,
    });

    // ── Verify amount (allow 1000 VND tolerance) ──
    if (Math.abs(order.amount - amount) > 1000) {
      log.error(`[Sepay Webhook] Amount mismatch:`, {
        expected: order.amount,
        received: amount,
        orderId: order.order_id,
      });
      return res.status(400).json({
        error: "Amount mismatch",
        expected: order.amount,
        received: amount,
      });
    }

    // ── Blocker #2: Atomically mark order as completed FIRST ──
    // completeOrder() only transitions pending → completed.
    // If the order was already completed, updated=false → return early (idempotent).
    const { updated } = await completeOrder(supabaseAdmin, order.order_id);

    if (!updated) {
      log(
        `[Sepay Webhook] Order already processed (not pending): ${order.order_id}`,
      );
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId: order.order_id,
      });
    }

    log(
      `[Sepay Webhook] ✔ Order status updated: ${order.order_id} → completed`,
    );

    // ── Fetch user info ──
    let userEmail: string | null = null;
    let userName: string | null = null;

    if (order.user_id && !order.user_id.startsWith("temp_")) {
      try {
        const userProfile = await getUserProfile(supabaseAdmin, order.user_id);
        if (userProfile) {
          userEmail = userProfile.email || null;
          userName = userProfile.name || null;
          log(
            `[Sepay Webhook] Fetched user info: ${userName} (${userEmail})`,
          );
        }
      } catch (userError) {
        log.error(
          "[Sepay Webhook] Error fetching user profile:",
          userError,
        );
      }
    }

    // ── Activate Pro account ──
    if (order.user_id && !order.user_id.startsWith("temp_")) {
      try {
        log(
          `[Sepay Webhook] Starting ProAccount update for user: ${order.user_id}`,
        );
        await activateProAccount(
          supabaseAdmin,
          order.user_id,
          order.duration,
          order.package_type === "single" && order.skill_type
            ? [order.skill_type]
            : null,
        );
        log(
          `[Sepay Webhook] ✔ ProAccount updated successfully for user: ${order.user_id}`,
        );
      } catch (updateError) {
        log.error(`[Sepay Webhook] ✗ Error updating ProAccount:`, updateError);
        // Continue — order is already marked completed
      }
    } else {
      log(
        `[Sepay Webhook] Skipping ProAccount update: invalid userId (${order.user_id})`,
      );
    }

    // ── Send customer email ──
    if (userEmail && userName) {
      try {
        log(
          `[Sepay Webhook] Sending customer email to: ${userEmail}`,
        );
        await sendOrderConfirmEmail(
          userEmail,
          userName,
          order.order_id,
          order.amount,
          order.duration,
        );
        log(`[Sepay Webhook] ✔ Customer email sent successfully`);
      } catch (emailError) {
        log.error(
          `[Sepay Webhook] ✗ Error sending customer email:`,
          emailError,
        );
      }
    } else {
      log.warn(
        `[Sepay Webhook] Skipping customer email: missing userEmail or userName`,
      );
    }

    // ── Send admin notification email ──
    try {
      const adminEmail =
        process.env.ADMIN_EMAIL || "admin@ieltspredictiontest.com";
      log(`[Sepay Webhook] Sending admin email to: ${adminEmail}`);
      await sendAdminNotificationEmail(
        order.order_id,
        userName || "Khách hàng",
        userEmail || "N/A",
        order.amount,
        order.duration,
      );
      log(`[Sepay Webhook] ✔ Admin email sent successfully`);
    } catch (emailError) {
      log.error(
        `[Sepay Webhook] ✗ Error sending admin email:`,
        emailError,
      );
    }

    log(`[Sepay Webhook] ✔ Successfully processed order:`, {
      orderId: order.order_id,
      amount,
      userId: order.user_id,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      orderId: order.order_id,
      status: "completed",
      amount,
    });
  } catch (error) {
    log.error("[Sepay Webhook] Error processing webhook:", error);
    log.error(
      "[Sepay Webhook] Request body:",
      JSON.stringify(req.body, null, 2),
    );

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      ...(process.env.NODE_ENV === "development" &&
        error instanceof Error && { stack: error.stack }),
    });
  }
}
