import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";
import {
    getSeoConfig,
    saveSeoConfig,
    getRedirects,
    createRedirect,
    updateRedirect,
    deleteRedirect,
} from "~services/seo";
import type { SeoGlobalConfig } from "~services/seo";

/**
 * SEO Manager API
 *
 * GET  /api/admin/seo                       → Get SEO config + redirects
 * POST /api/admin/seo?action=saveConfig     → Save SEO global config
 * POST /api/admin/seo?action=createRedirect → Create redirect rule
 * PUT  /api/admin/seo?action=updateRedirect&id=xxx → Update redirect
 * DELETE /api/admin/seo?id=xxx              → Delete redirect
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { action, id, search, page, pageSize } = req.query;

    try {
        // ── GET: Fetch SEO config + redirects ──
        if (req.method === "GET") {
            const [seoConfig, redirectsResult] = await Promise.all([
                getSeoConfig(supabaseAdmin),
                getRedirects(supabaseAdmin, {
                    search: search as string | undefined,
                    page: page ? parseInt(page as string, 10) : 1,
                    pageSize: pageSize ? parseInt(pageSize as string, 10) : 50,
                }),
            ]);

            return res.status(200).json({
                success: true,
                seoConfig,
                redirects: redirectsResult.data,
                redirectsCount: redirectsResult.count,
            });
        }

        // ── POST: Create/save ──
        if (req.method === "POST") {
            if (action === "saveConfig") {
                const body = req.body as SeoGlobalConfig;
                await saveSeoConfig(supabaseAdmin, body);

                await logActivity(supabaseAdmin, {
                    userId: user.id,
                    userEmail: user.email ?? undefined,
                    action: "update",
                    entityType: "setting",
                    entityTitle: "SEO Global Config",
                    ipAddress: getClientIP(req),
                });

                return res.status(200).json({ success: true, message: "SEO config saved" });
            }

            if (action === "createRedirect") {
                const { source_path, target_path, status_code } = req.body;

                if (!source_path || !target_path) {
                    return res.status(400).json({ success: false, error: "source_path and target_path are required" });
                }

                const redirect = await createRedirect(supabaseAdmin, {
                    source_path,
                    target_path,
                    status_code: status_code || 301,
                });

                await logActivity(supabaseAdmin, {
                    userId: user.id,
                    userEmail: user.email ?? undefined,
                    action: "create",
                    entityType: "redirect",
                    entityId: redirect.id,
                    entityTitle: `${source_path} → ${target_path}`,
                    ipAddress: getClientIP(req),
                });

                return res.status(201).json({ success: true, data: redirect });
            }

            return res.status(400).json({ success: false, error: "Unknown action" });
        }

        // ── PUT: Update redirect ──
        if (req.method === "PUT") {
            if (!id) {
                return res.status(400).json({ success: false, error: "Missing redirect id" });
            }

            await updateRedirect(supabaseAdmin, id as string, req.body);

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "update",
                entityType: "redirect",
                entityId: id as string,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true });
        }

        // ── DELETE: Remove redirect ──
        if (req.method === "DELETE") {
            if (!id) {
                return res.status(400).json({ success: false, error: "Missing redirect id" });
            }

            await deleteRedirect(supabaseAdmin, id as string);

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "redirect",
                entityId: id as string,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ success: false, error: "Method not allowed" });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Server error",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
