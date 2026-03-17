import type { NextApiRequest, NextApiResponse } from "next";
import { dbg } from "../../../lib/debug";
import { SendEmailSchema } from "../../../services/lib/validation";
import { rateLimit } from "~lib/rate-limit";

const log = dbg.email;

type ResponseData = {
  success: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Rate limit: 5 contact emails per minute per IP
  if (rateLimit(req, res, { windowMs: 60_000, max: 5, keyPrefix: "contact" })) return;

  try {
    const parsed = SendEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { name, email, subject, message } = parsed.data;

    // For now, log the contact form data.
    // TODO: Hook up to a real email service (SendGrid, Resend, etc.)
    log("[Contact Form Submission]", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    log.error("[API /api/contact/send-email]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
