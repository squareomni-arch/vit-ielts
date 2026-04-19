import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "~lib/admin-auth";
import { sendOrderConfirmEmail } from "~services/email";

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
        // Test emails may only be sent to the admin's own registered address,
        // to prevent the endpoint from being used as a generic email sender.
        const email = user.email;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Admin account has no email address on file",
            });
        }

        const success = await sendOrderConfirmEmail(
            email,
            "Học viên test",
            "IELTS PREDICTION 99999999999",
            200000,
            3,
        );

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
