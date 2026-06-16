/**
 * Supabase Storage Upload Utility
 *
 * Replaces the VPS PHP upload endpoint. Files are stored in the `media` bucket
 * under sub-folders that match the old VPS category structure (images / audio / pdf).
 *
 * Required: a PUBLIC bucket named "media" must exist in the Supabase project.
 * Create it once via the Supabase Dashboard → Storage → New bucket → "media" → Public.
 *
 * Uses the service-role key (supabaseAdmin) so it bypasses RLS on storage.
 */

import { supabaseAdmin } from "~supabase/admin";
import type { VpsUploadResult } from "./vps-upload";

const BUCKET = "media";

const MIME_TO_CATEGORY: Record<string, "images" | "audio" | "pdf"> = {
  "image/jpeg": "images",
  "image/png":  "images",
  "image/webp": "images",
  "image/gif":  "images",
  "audio/mpeg": "audio",
  "audio/mp4":  "audio",
  "audio/ogg":  "audio",
  "audio/wav":  "audio",
  "audio/webm": "audio",
  "audio/aac":  "audio",
  "application/pdf": "pdf",
};

const MIME_TO_EXT: Record<string, string> = {
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

function buildStoragePath(
  originalFilename: string,
  mimeType: string,
  folderOverride?: string,
): { path: string; category: "images" | "audio" | "pdf" } {
  const category = MIME_TO_CATEGORY[mimeType] ?? "images";
  const ext = MIME_TO_EXT[mimeType] ?? "bin";
  const base = originalFilename
    .replace(/\.[^./\\]*$/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 60) || "file";
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const folder = folderOverride ?? category;
  return { path: `${folder}/${base}-${unique}.${ext}`, category };
}

/**
 * Upload a file buffer to Supabase Storage.
 * Returns a VpsUploadResult-compatible object so existing callers need no changes.
 *
 * @param folder - Optional override for the sub-folder (default: MIME-derived category).
 *                 Use e.g. "avatars" for user profile pictures.
 */
export async function uploadToSupabase(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  folder?: string,
): Promise<VpsUploadResult> {
  const { path, category } = buildStoragePath(originalFilename, mimeType, folder);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, fileBuffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new Error(`Supabase Storage upload thất bại: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return {
    url: publicUrl,
    filename: path.split("/").pop() ?? path,
    mimeType,
    category,
    size: fileBuffer.length,
  };
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Silently ignores URLs that don't belong to this bucket.
 */
export async function deleteFromSupabase(url: string): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const prefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
    if (!url.startsWith(prefix)) return;
    const path = url.slice(prefix.length);
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (error) console.error(`Supabase Storage delete thất bại: ${error.message}`);
  } catch (err) {
    console.error(`Lỗi khi xóa từ Supabase Storage: ${(err as Error).message}`);
  }
}
