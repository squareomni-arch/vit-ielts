import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import { createApiSupabase } from "~supabase/server";
import { uploadToSupabase } from "~lib/supabase-upload";

export const config = {
  api: { bodyParser: false },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIMES: Record<string, true> = {
  "image/jpeg": true,
  "image/png":  true,
  "image/webp": true,
  "image/gif":  true,
};

/**
 * POST /api/account/upload-avatar
 *
 * Authenticated (any signed-in user) avatar upload.
 * Uploads to Supabase Storage under the "avatars" folder.
 * Returns { path: <public_url> } compatible with the ImageUpload component.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const supabase = createApiSupabase(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const form = formidable({ maxFileSize: MAX_FILE_SIZE, keepExtensions: true });
    const [, files] = await form.parse(req);

    const uploaded = Array.isArray(files.file) ? files.file : [files.file];
    const file = uploaded[0];
    if (!file) return res.status(400).json({ message: "Không có file được upload" });

    const mimeType = file.mimetype ?? "";
    if (!ALLOWED_MIMES[mimeType]) {
      return res.status(400).json({
        message: `Chỉ chấp nhận: ${Object.keys(ALLOWED_MIMES).join(", ")}. Nhận được: ${mimeType || "unknown"}`,
      });
    }

    const originalName = file.originalFilename ?? "avatar";
    const fileBuffer = fs.readFileSync(file.filepath);
    try { fs.unlinkSync(file.filepath); } catch { /* ignore */ }

    const result = await uploadToSupabase(fileBuffer, originalName, mimeType, "avatars");

    return res.status(200).json({ path: result.url });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi upload avatar",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
