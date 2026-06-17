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

/** Folders in the `media` bucket that hold CMS media (mirrors the old VPS categories). */
const MEDIA_FOLDERS = ["images", "audio", "pdf"] as const;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif",
  mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg",
  wav: "audio/wav", webm: "audio/webm", aac: "audio/aac",
  pdf: "application/pdf",
};

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

export type BucketMediaItem = {
  /** Storage path within the bucket, e.g. "images/foo-123.jpg". Used as the item id. */
  path: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  created_at: string;
};

/**
 * List every CMS media file actually present in the Supabase `media` bucket.
 * This is the source of truth for the admin Media Library — it reflects the
 * bucket directly rather than a metadata table that can drift out of sync.
 */
export async function listSupabaseMedia(): Promise<BucketMediaItem[]> {
  const items: BucketMediaItem[] = [];

  for (const folder of MEDIA_FOLDERS) {
    let offset = 0;
    const limit = 100;
    // Paginate through the folder until exhausted.
    for (;;) {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        throw new Error(`Liệt kê bucket "${folder}" thất bại: ${error.message}`);
      }
      if (!data || data.length === 0) break;

      for (const obj of data) {
        // Skip nested sub-folders (Supabase returns them with a null id).
        if (!obj.id) continue;
        const path = `${folder}/${obj.name}`;
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(path);
        const meta = (obj.metadata ?? {}) as { size?: number; mimetype?: string };
        items.push({
          path,
          url: publicUrl,
          filename: obj.name,
          mimetype: meta.mimetype || mimeFromName(obj.name),
          size: meta.size ?? 0,
          created_at: obj.created_at ?? obj.updated_at ?? new Date(0).toISOString(),
        });
      }

      if (data.length < limit) break;
      offset += limit;
    }
  }

  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return items;
}

/** Delete a file from Supabase Storage by its bucket path, e.g. "images/foo.jpg". */
export async function deleteFromSupabasePath(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Xóa file khỏi bucket thất bại: ${error.message}`);
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
