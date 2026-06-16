import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { requireAdmin } from "~lib/admin-auth";
import { uploadToSupabase } from "~lib/supabase-upload";
import { dbg } from "~lib/debug";

const log = dbg.upload;

// Disable Next.js body parser — formidable handles the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
  "audio/mpeg": "mp3",
  "audio/mp4":  "m4a",
  "audio/ogg":  "ogg",
  "audio/wav":  "wav",
  "audio/webm": "webm",
  "audio/aac":  "aac",
  "application/pdf": "pdf",
};

/** Build a safe filename using a sanitized base + an extension derived from MIME. */
function buildSafeFilename(originalName: string, mimeType: string): string {
  const ext = MIME_EXTENSION[mimeType];
  const base = originalName
    .replace(/\.[^./\\]*$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80) || "file";
  return ext ? `${base}.${ext}` : base;
}

/**
 * POST /api/admin/upload
 *
 * Accepts image / audio / PDF, uploads to Supabase Storage,
 * and returns the public URL.
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

    const form = formidable({ maxFileSize: MAX_FILE_SIZE, keepExtensions: false });
    const [, files] = await form.parse(req);

    const uploaded = Array.isArray(files.file) ? files.file : [files.file];
    const file = uploaded[0];

    if (!file) {
      return res.status(400).json({ success: false, error: "Không có file được upload" });
    }

    const mimeType = file.mimetype ?? "";
    if (!MIME_EXTENSION[mimeType]) {
      return res.status(415).json({
        success: false,
        error: `Loại file "${mimeType}" không được hỗ trợ. Chỉ chấp nhận: ảnh, audio, PDF`,
      });
    }

    const safeName = buildSafeFilename(file.originalFilename ?? "file", mimeType);
    log("Uploading to Supabase Storage:", { filename: safeName, mimetype: mimeType, size: file.size });

    const fileBuffer = fs.readFileSync(file.filepath);
    try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

    const result = await uploadToSupabase(fileBuffer, safeName, mimeType);

    log("Supabase Storage upload success:", result.url);

    return res.status(200).json({
      success: true,
      data: {
        url:      result.url,
        filename: safeName,
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
