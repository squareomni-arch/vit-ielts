import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { requireAdmin } from "~lib/admin-auth";
import { uploadToVPS } from "~lib/vps-upload";
import { dbg } from "~lib/debug";

const log = dbg.upload;

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB for images

const ALLOWED_IMAGE_MIMES: Record<string, true> = {
  "image/jpeg": true,
  "image/png":  true,
  "image/webp": true,
  "image/gif":  true,
};

/**
 * POST /api/admin/upload-image
 *
 * Image-only upload endpoint (used by Media Library and ImageUpload component).
 * Forwards to VPS and returns { path: <public_url> } for backward compatibility
 * with existing callers that read `data.path`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const form = formidable({ maxFileSize: MAX_FILE_SIZE, keepExtensions: true });
    const [, files] = await form.parse(req);

    const uploaded = Array.isArray(files.file) ? files.file : [files.file];
    const file = uploaded[0];

    if (!file) {
      return res.status(400).json({ message: "Không có file được upload" });
    }

    const mimeType = file.mimetype ?? "";
    if (!ALLOWED_IMAGE_MIMES[mimeType]) {
      return res.status(400).json({
        message: "File type not allowed",
        error: `Chỉ chấp nhận: ${Object.keys(ALLOWED_IMAGE_MIMES).join(", ")}. Nhận được: ${mimeType || "unknown"}`,
      });
    }

    const originalName = file.originalFilename ?? "image";
    log("Uploading image to VPS:", { filename: originalName, mimetype: mimeType, size: file.size });

    const fileBuffer = fs.readFileSync(file.filepath);
    try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

    const result = await uploadToVPS(fileBuffer, originalName, mimeType);

    log("VPS image upload success:", result.url);

    // Return { path } for backward compatibility with ImageUpload component
    return res.status(200).json({ path: result.url });
  } catch (error) {
    log.error("Image upload error:", error);
    return res.status(500).json({
      message: "Lỗi khi upload hình ảnh",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
