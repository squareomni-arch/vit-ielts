import type { NextApiRequest, NextApiResponse } from "next";

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

  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "All fields are required: name, email, subject, message",
      });
    }

    // For now, log the contact form data.
    // TODO: Hook up to a real email service (SendGrid, Resend, etc.)
    console.log("[Contact Form Submission]", {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[API /api/contact/send-email]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
