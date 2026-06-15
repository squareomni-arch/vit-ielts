import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "~lib/admin-auth";

/**
 * Send Test Email API
 *
 * POST /api/admin/email-template/send-test
 * Body: { email: string }
 *
 * Sends a test order confirmation email to the specified address
 * using the current CMS config (or defaults).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const user = await requireAdmin(req, res);
    if (!user) return;

    try {
        const { type } = req.body;
        
        // Test emails may only be sent to the admin's own registered address
        const email = user.email;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Admin account has no email address on file",
            });
        }

        const {
            sendOrderConfirmEmail,
            sendAdminNotificationEmail,
            sendAffiliateRegisteredEmail,
            sendAffiliateStatusEmail,
            sendNewCommissionEmail,
            sendPayoutRequestEmail,
            sendPayoutStatusEmail
        } = await import("~services/email");

        let success = false;

        switch (type) {
            case "adminNotification":
                success = await sendAdminNotificationEmail(
                    "Vit IELTS TEST 123",
                    "Học viên Test",
                    "test@example.com",
                    200000,
                    3
                );
                break;
            case "affiliateRegistered":
                success = await sendAffiliateRegisteredEmail("Đối tác Test", "affiliate@test.com");
                break;
            case "affiliateApproved":
                success = await sendAffiliateStatusEmail(email, "Đối tác Test", "approved");
                break;
            case "affiliateRejected":
                success = await sendAffiliateStatusEmail(email, "Đối tác Test", "rejected");
                break;
            case "newCommission":
                success = await sendNewCommissionEmail(email, "Đối tác Test", "ORDER-TEST-123", 200000, 40000);
                break;
            case "payoutRequest":
                success = await sendPayoutRequestEmail("Đối tác Test", "affiliate@test.com", 500000);
                break;
            case "payoutRejected":
                success = await sendPayoutStatusEmail(email, "Đối tác Test", 500000, "rejected", "Thông tin thanh toán không hợp lệ.");
                break;
            case "payoutCompleted":
                success = await sendPayoutStatusEmail(email, "Đối tác Test", 500000, "completed");
                break;
            case "orderConfirmation":
            default:
                success = await sendOrderConfirmEmail(
                    email,
                    "Học viên test",
                    "Vit IELTS 99999999999",
                    200000,
                    3,
                );
        }

        if (success) {
            return res.status(200).json({
                success: true,
                message: `Test email sent to ${email}`,
            });
        } else {
            return res.status(500).json({
                success: false,
                error: "Failed to send test email. Check SMTP configuration.",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to send test email",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
