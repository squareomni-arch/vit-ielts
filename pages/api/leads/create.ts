import type { NextApiRequest, NextApiResponse } from "next";
import { dbg } from "~lib/debug";
import { rateLimit } from "~lib/rate-limit";
import { CreateLeadSchema } from "~services/lib/validation";
import { createLead } from "~services/lead";
import { sendLeadEmail } from "~services/email";
import { supabaseAdmin } from "~supabase/admin";

const log = dbg.email;

// Same VN-mobile rule as the client form — re-checked server-side.
const VN_PHONE = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;

type ResponseData = { success: boolean; error?: string };

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    // Anti-spam: max 5 submissions per minute per IP.
    if (await rateLimit(req, res, { windowMs: 60_000, max: 5, keyPrefix: "lead" })) return;

    try {
        // Anti-spam: honeypot. Bots fill the hidden "website" field — pretend
        // success so they don't retry, but store/send nothing.
        if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
            return res.status(200).json({ success: true });
        }

        const parsed = CreateLeadSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: parsed.error.issues.map((i) => i.message).join(", "),
            });
        }

        const phone = parsed.data.phone.replace(/[\s.()-]/g, "");
        if (!VN_PHONE.test(phone)) {
            return res.status(400).json({ success: false, error: "Số điện thoại không hợp lệ" });
        }

        const lead = await createLead(supabaseAdmin, {
            name: parsed.data.name,
            phone,
            target: parsed.data.target ?? null,
            source: "landing",
        });

        // Notify admin over SMTP — but a mail hiccup must not fail the capture.
        try {
            await sendLeadEmail({
                name: lead.name,
                phone: lead.phone,
                target: lead.target_band ?? undefined,
                source: lead.source,
            });
        } catch (mailErr) {
            log.error("[API /api/leads/create] email failed", mailErr);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        log.error("[API /api/leads/create]", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
}
