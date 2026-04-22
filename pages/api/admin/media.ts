import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

/**
 * Media Library API
 *
 * GET    /api/admin/media              → List media with search + pagination
 * POST   /api/admin/media              → Register uploaded media (after upload-image returns URL)
 * DELETE  /api/admin/media?id=xxx      → Remove media record
 *
 * Note: Actual file upload is handled by /api/admin/upload-image.
 * This API manages the media catalog (metadata tracking).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    // ── GET: List media ───────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const {
                search,
                type,
                page = "1",
                pageSize = "24",
            } = req.query;

            const pageNum = parseInt(page as string, 10) || 1;
            const size = parseInt(pageSize as string, 10) || 24;
            const from = (pageNum - 1) * size;
            const to = from + size - 1;

            let query = supabaseAdmin
                .from("media_library")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false });

            if (search && typeof search === "string") {
                query = query.ilike("filename", `%${search}%`);
            }

            if (type === "image") query = query.ilike("mimetype", "image/%");
            else if (type === "audio") query = query.ilike("mimetype", "audio/%");
            else if (type === "pdf") query = query.eq("mimetype", "application/pdf");

            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            // Stats: total count, size, and per-category counts
            const { data: statsData } = await supabaseAdmin
                .from("media_library")
                .select("size, mimetype")
                .limit(10000);

            const allItems = statsData ?? [];
            const totalSize = allItems.reduce(
                (sum: number, item: { size: number }) => sum + (item.size || 0),
                0,
            );
            const countByType = {
                image: allItems.filter((i: { mimetype: string }) => i.mimetype?.startsWith("image/")).length,
                audio: allItems.filter((i: { mimetype: string }) => i.mimetype?.startsWith("audio/")).length,
                pdf:   allItems.filter((i: { mimetype: string }) => i.mimetype === "application/pdf").length,
            };

            return res.status(200).json({
                success: true,
                data: data ?? [],
                count: count ?? 0,
                stats: {
                    total: allItems.length,
                    totalSize,
                    countByType,
                },
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ── POST: Register new media entry ────────────────────────────────────
    if (req.method === "POST") {
        try {
            const { url, filename, mimetype, size } = req.body;

            if (!url || !filename) {
                return res.status(400).json({
                    success: false,
                    error: "url and filename are required",
                });
            }

            const { data, error } = await supabaseAdmin
                .from("media_library")
                .insert({
                    url,
                    filename,
                    mimetype: mimetype || "image/jpeg",
                    size: size || 0,
                    uploaded_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "create",
                entityType: "media",
                entityId: data?.id,
                entityTitle: filename,
                ipAddress: getClientIP(req),
            });

            return res.status(201).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ── DELETE: Remove media entry ────────────────────────────────────────
    if (req.method === "DELETE") {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") {
                return res
                    .status(400)
                    .json({ success: false, error: "Missing id" });
            }

            const { data: mediaItem } = await supabaseAdmin
                .from("media_library")
                .select("filename, url")
                .eq("id", id)
                .single();

            // 1. Physically delete from VPS
            if (mediaItem?.url) {
                const { deleteFromVPS } = await import("~lib/vps-upload");
                await deleteFromVPS(mediaItem.url);
            }

            // 2. Delete from database
            const { error } = await supabaseAdmin
                .from("media_library")
                .delete()
                .eq("id", id);

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "media",
                entityId: id,
                entityTitle: mediaItem?.filename,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
