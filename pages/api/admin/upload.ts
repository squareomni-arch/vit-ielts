import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { requireAdmin } from "~lib/admin-auth";
import { supabaseAdmin } from "~lib/supabase/admin";
import { dbg } from "~lib/debug";

const log = dbg.upload;

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for audio files
const BUCKET_NAME = "quiz-assets";

function getFileCategory(mimeType: string): string | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  return null;
}

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

    // Parse multipart form
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const uploadedFiles = Array.isArray(files.file) ? files.file : [files.file];
    if (!uploadedFiles[0]) {
      return res.status(400).json({ success: false, error: "Không có file được upload" });
    }

    const file = uploadedFiles[0];
    const mimeType = file.mimetype || "";

    const category = getFileCategory(mimeType);

    // Validate mime type
    if (!category) {
      return res.status(400).json({
        success: false,
        error: `File type "${mimeType}" không được hỗ trợ. Chỉ chấp nhận: images, audio, PDF`,
      });
    }

    const timestamp = Date.now();
    const originalName = file.originalFilename || "file";
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, "-");
    const storagePath = `${category}/${baseName}-${timestamp}${ext}`;

    log("Processing upload:", {
      filename: originalName,
      mimetype: mimeType,
      size: file.size,
      category,
      storagePath,
    });

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch {
      // ignore cleanup errors
    }

    if (uploadError) {
      log.error("Supabase upload error:", uploadError);
      return res.status(500).json({
        success: false,
        error: `Lỗi upload: ${uploadError.message}`,
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    log("Upload successful:", urlData.publicUrl);

    return res.status(200).json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: data.path,
        filename: originalName,
        size: file.size,
        mimeType,
        category,
      },
    });
  } catch (error) {
    log.error("Upload handler error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return res.status(500).json({
      success: false,
      error: `Lỗi khi upload file: ${errorMessage}`,
    });
  }
}
