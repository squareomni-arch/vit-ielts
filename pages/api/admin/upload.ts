import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { requireAdmin } from "~lib/admin-auth";
import { uploadToVPS } from "~lib/vps-upload";
import { dbg } from "~lib/debug";

const log = dbg.upload;

// Disable Next.js body parser — formidable handles the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const ACCEPTED_MIME: Record<string, true> = {
  "image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true,
  "audio/mpeg": true, "audio/mp4": true, "audio/ogg": true,
  "audio/wav":  true, "audio/webm": true, "audio/aac": true,
  "application/pdf": true,
};

/**
 * POST /api/admin/upload
 *
 * Accepts image / audio / PDF, forwards to VPS CMS via PHP endpoint,
 * and returns the public URL. Supabase stores the URL only.
 *
 * Response: { success: true, data: { url, filename, size, mimeType, category } }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const form = formidable({ maxFileSize: MAX_FILE_SIZE, keepExtensions: true });
    const [, files] = await form.parse(req);

    const uploaded = Array.isArray(files.file) ? files.file : [files.file];
    const file = uploaded[0];

    if (!file) {
      return res.status(400).json({ success: false, error: "Không có file được upload" });
    }

    const mimeType = file.mimetype ?? "";
    if (!ACCEPTED_MIME[mimeType]) {
      return res.status(415).json({
        success: false,
        error: `Loại file "${mimeType}" không được hỗ trợ. Chỉ chấp nhận: ảnh, audio, PDF`,
      });
    }

    const originalName = file.originalFilename ?? "file";
    log("Uploading to VPS:", { filename: originalName, mimetype: mimeType, size: file.size });

    // Read buffer then clean up temp file immediately
    const fileBuffer = fs.readFileSync(file.filepath);
    try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

    // Forward to VPS — database receives only the URL
    const result = await uploadToVPS(fileBuffer, originalName, mimeType);

    log("VPS upload success:", result.url);

    return res.status(200).json({
      success: true,
      data: {
        url:      result.url,
        filename: originalName,
        size:     file.size,
        mimeType,
        category: result.category,
      },
    });
  } catch (error) {
    log.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: `Lỗi khi upload file: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
