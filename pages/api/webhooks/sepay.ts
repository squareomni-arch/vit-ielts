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
  sendExpiredOrderPaymentAlert,
  sendNewCommissionEmail,
} from "~services/email";
import { resolveAffiliateRef, createCommissionWithWaiting } from "~services/affiliate";
import { completePayoutFromWebhook } from "~services/payout";
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
// Authorization (SePay "API Key" scheme)
// ============================================================

/**
 * SePay's "Api Key" auth scheme: it sends the secret directly in the
 * Authorization header as `Apikey <SECRET>`. We compare against the
 * configured secret with a timing-safe equality check.
 *
 * The earlier HMAC-SHA256 implementation never matched because
 *   (a) SePay does not sign the body, and
 *   (b) Next.js' default bodyParser meant we were HMAC-ing a
 *       re-stringified object, not the original bytes.
 */
function verifyApiKey(authHeader: string, secret: string): boolean {
  const expected = `Apikey ${secret}`;
  const a = Buffer.from(authHeader, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
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
  // Hard-fail if secret is not configured — webhook must NEVER accept
  // unauthenticated requests in any environment.
  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("[Sepay Webhook] SEPAY_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Webhook misconfigured" });
  }

  const authHeader = (req.headers["authorization"] as string) || "";

  if (!verifyApiKey(authHeader, webhookSecret)) {
    log.error("[Sepay Webhook] Invalid or missing Authorization header");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  try {
    const payload: SepayWebhookPayload = req.body;
    log(
      `[Sepay Webhook] Raw payload received:`,
      JSON.stringify(payload, null, 2),
    );

    // ── Parse content to determine type: ORDER or PAYOUT ──
    const amount = Number(payload.transferAmount);
    const content = payload.content || "";
    const transferType = payload.transferType || "in";

    // Validate payload
    if (!amount || !content) {
      return res.status(400).json({
        error: "Missing required fields: transferAmount or content",
        received: payload,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // BRANCH 1: PAYOUT AUTO-CONFIRMATION (transferType = "out")
    // Content format: "PAYOUT {uuid}"
    // ═══════════════════════════════════════════════════════════
    const payoutMatch = content.match(/PAYOUT\s+([0-9a-f-]{36})/i);
    if (payoutMatch && transferType === "out") {
      const payoutId = payoutMatch[1];
      log(`[Sepay Webhook] Detected PAYOUT transfer for payout #${payoutId}`);

      try {
        const { updated, payout } = await completePayoutFromWebhook(
          supabaseAdmin,
          payoutId,
          {
            sepayId: payload.id ?? 0,
            amount,
            referenceCode: payload.referenceCode ?? "",
            transactionDate: payload.transactionDate ?? new Date().toISOString(),
          },
        );

        if (updated) {
          log(`[Sepay Webhook] ✔ Payout #${payoutId} auto-completed`);
        } else {
          log(`[Sepay Webhook] Payout #${payoutId} already processed or not in APPROVED state`);
        }

        return res.status(200).json({
          success: true,
          type: "payout",
          payoutId,
          updated,
        });
      } catch (error) {
        log.error(`[Sepay Webhook] Error processing payout #${payoutId}:`, error);
        return res.status(200).json({ success: true }); // Return 200 to prevent SePay retries
      }
    }

    // ═══════════════════════════════════════════════════════════
    // BRANCH 2: ORDER PAYMENT (existing logic)
    // Content format: "IELTS PREDICTION {timestamp}{random}"
    // ═══════════════════════════════════════════════════════════

    // ── Parse orderId from content ──
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
    const { updated, currentStatus } = await completeOrder(supabaseAdmin, order.order_id);

    if (!updated) {
      // Handle expired orders: send admin alert instead of auto-completing
      if (currentStatus === "expired") {
        log.warn(
          `[Sepay Webhook] ⚠ Payment received for EXPIRED order: ${order.order_id}`,
        );

        try {
          await sendExpiredOrderPaymentAlert(
            order.order_id,
            amount,
            order.amount,
            payload.transactionDate || new Date().toISOString(),
          );
          log(`[Sepay Webhook] ✔ Expired order alert email sent to admin`);
        } catch (emailErr) {
          log.error(`[Sepay Webhook] ✗ Error sending expired order alert:`, emailErr);
        }

        return res.status(200).json({
          success: true,
          message: "Order expired — admin notified for manual review",
          orderId: order.order_id,
          status: "expired",
        });
      }

      log(
        `[Sepay Webhook] Order already processed (status: ${currentStatus}): ${order.order_id}`,
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
      }
    } else {
      log(
        `[Sepay Webhook] Skipping ProAccount update: invalid userId (${order.user_id})`,
      );
    }

    // ── AUTO-CREATE COMMISSION (if order has affiliate_ref) ──
    if (order.affiliate_ref) {
      try {
        log(`[Sepay Webhook] Processing affiliate commission for ref: ${order.affiliate_ref}`);

        const resolved = await resolveAffiliateRef(supabaseAdmin, order.affiliate_ref);

        if (resolved) {
          // Get affiliate's info
          const { data: affiliateData } = await supabaseAdmin
            .from("affiliates")
            .select("commission_rate, users(email, name)")
            .eq("id", resolved.affiliateId)
            .maybeSingle();

          const result = await createCommissionWithWaiting(supabaseAdmin, {
            affiliateId: resolved.affiliateId,
            orderId: order.order_id,
            amount: order.amount,
            commissionRate: affiliateData?.commission_rate,
            buyerEmail: userEmail || undefined,
            buyerIp: undefined,
          });

          if (result.isNew) {
            log(
              `[Sepay Webhook] ✔ Commission created: ${result.commission.commission_amount}đ` +
              (result.fraudFlag ? ` (flagged: ${result.fraudFlag})` : " (7-day waiting period)"),
            );

            // Mark the most recent unconverted visit as converted
            try {
              const { data: recentVisit } = await supabaseAdmin
                .from("affiliate_visits")
                .select("id")
                .eq("affiliate_id", resolved.affiliateId)
                .eq("converted", false)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              if (recentVisit) {
                await supabaseAdmin
                  .from("affiliate_visits")
                  .update({ converted: true, order_id: order.order_id })
                  .eq("id", recentVisit.id);
                log(`[Sepay Webhook] ✔ Visit ${recentVisit.id} marked as converted`);
              }
            } catch (visitErr) {
              log.error(`[Sepay Webhook] ✗ Failed to mark visit as converted:`, visitErr);
            }

            // Notify affiliate
            try {
              const affUser = (affiliateData as any)?.users;
              if (affUser?.email) {
                sendNewCommissionEmail(
                  affUser.email,
                  affUser.name || "Affiliate",
                  order.order_id,
                  order.amount,
                  result.commission.commission_amount
                );
              }
            } catch (emailErr) {
              log.error(`[Sepay Webhook] ✗ Failed to send commission email:`, emailErr);
            }
          } else {
            log(`[Sepay Webhook] Commission already exists for order ${order.order_id}`);
          }
        } else {
          log.warn(`[Sepay Webhook] Could not resolve affiliate ref: ${order.affiliate_ref}`);
        }
      } catch (commErr) {
        log.error(`[Sepay Webhook] ✗ Error creating commission:`, commErr);
        // Continue — order is already marked completed
      }
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
