import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin, requireFullAdmin } from "~lib/admin-auth";
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
    // Source of truth is the Supabase Storage `media` bucket itself, so the
    // library always reflects what is actually stored. The media_library table
    // is used only to enrich items with metadata (e.g. uploaded_by) when present.
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

            const { listSupabaseMedia } = await import("~lib/supabase-upload");
            const bucketItems = await listSupabaseMedia();

            // Enrich with DB metadata (uploaded_by) keyed by URL, when available.
            const { data: dbRows } = await supabaseAdmin
                .from("media_library")
                .select("url, uploaded_by")
                .limit(10000);
            const dbByUrl = new Map<string, string | null>(
                (dbRows ?? []).map((r: { url: string; uploaded_by: string | null }) => [r.url, r.uploaded_by]),
            );

            let items = bucketItems.map((it) => ({
                id: it.path,
                url: it.url,
                filename: it.filename,
                mimetype: it.mimetype,
                size: it.size,
                uploaded_by: dbByUrl.get(it.url) ?? null,
                created_at: it.created_at,
            }));

            // Stats computed across the full bucket (before filtering).
            const totalSize = items.reduce((sum, i) => sum + (i.size || 0), 0);
            const countByType = {
                image: items.filter((i) => i.mimetype?.startsWith("image/")).length,
                audio: items.filter((i) => i.mimetype?.startsWith("audio/")).length,
                pdf:   items.filter((i) => i.mimetype === "application/pdf").length,
            };
            const stats = { total: items.length, totalSize, countByType };

            // Apply filters in memory.
            if (search && typeof search === "string") {
                const q = search.toLowerCase();
                items = items.filter((i) => i.filename.toLowerCase().includes(q));
            }
            if (type === "image") items = items.filter((i) => i.mimetype.startsWith("image/"));
            else if (type === "audio") items = items.filter((i) => i.mimetype.startsWith("audio/"));
            else if (type === "pdf") items = items.filter((i) => i.mimetype === "application/pdf");

            const count = items.length;
            const from = (pageNum - 1) * size;
            const pageItems = items.slice(from, from + size);

            return res.status(200).json({
                success: true,
                data: pageItems,
                count,
                stats,
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
        if (!await requireFullAdmin(req, res)) return;
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") {
                return res
                    .status(400)
                    .json({ success: false, error: "Missing id" });
            }

            // `id` is the storage path within the bucket, e.g. "images/foo-123.jpg".
            const path = id;
            const filename = path.split("/").pop() ?? path;

            // 1. Physically delete from Supabase Storage
            const { deleteFromSupabasePath } = await import("~lib/supabase-upload");
            await deleteFromSupabasePath(path);

            // 2. Remove any matching catalog row (best-effort; bucket is the truth).
            await supabaseAdmin
                .from("media_library")
                .delete()
                .ilike("url", `%/${path}`);

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "media",
                entityId: id,
                entityTitle: filename,
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
