import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfigValidated } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { CMS_SECTION_SCHEMAS } from "~services/cms-schemas";
import { ZodError } from "zod";
import { logActivity, getClientIP } from "~services/activity-log";

/**
 * Unified CMS Config API Route
 *
 * GET  /api/admin/cms/[section] → readConfig(section)
 * POST /api/admin/cms/[section] → writeConfigValidated(section, body)
 *
 * Replaces 16+ individual API route files with a single dynamic route.
 * The [section] parameter maps to cms_configs.section_name.
 *
 * Examples:
 *   /api/admin/cms/hero-banner
 *   /api/admin/cms/footer/cta-banner    → section = "footer/cta-banner"
 *   /api/admin/cms/subscription/faq     → section = "subscription/faq"
 *
 * Note: The catch-all route handles nested paths like "subscription/faq"
 * by joining the slug array with "/".
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    // Parse section name from catch-all slug
    const { section } = req.query;
    if (!section || (Array.isArray(section) && section.length === 0)) {
        return res
            .status(400)
            .json({ success: false, error: "Missing section name" });
    }

    const sectionName = Array.isArray(section) ? section.join("/") : section;

    // ── GET: Read config ──────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const config = await readConfig(supabaseAdmin, sectionName);

            if (config === null) {
                return res
                    .status(404)
                    .json({ success: false, error: `Config not found: ${sectionName}` });
            }

            return res.status(200).json(config);
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to read config",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ── POST: Write config (admin only) ───────────────────────────────────
    if (req.method === "POST") {
        try {
            const user = await requireAdmin(req, res);
            if (!user) return; // response already sent by requireAdmin

            const body = req.body;
            if (!body || typeof body !== "object") {
                return res
                    .status(400)
                    .json({ success: false, error: "Invalid request body" });
            }

            // Validate + write
            await writeConfigValidated(supabaseAdmin, sectionName, body);

            // Log activity
            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "update",
                entityType: "cms_config",
                entityId: sectionName,
                entityTitle: `CMS: ${sectionName}`,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({
                success: true,
                message: `Config "${sectionName}" saved successfully`,
            });
        } catch (error) {
            // Zod validation error → 400
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: error.issues,
                });
            }

            return res.status(500).json({
                success: false,
                error: "Failed to write config",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ── Unsupported method ────────────────────────────────────────────────
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
