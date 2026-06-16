/**
 * On-the-fly image resizing via the Supabase Storage image-transform endpoint.
 *
 * Self-hosted Supabase serves resized images from imgproxy at
 *   /storage/v1/render/image/public/media/<path>?width=&height=&resize=&quality=
 * (the same object path as /storage/v1/object/public/..., with the segment swapped).
 *
 * `getMediaImage` is flag-gated on `NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED`:
 *  - flag off (or non-image/non-media URL): returns `toCdnUrl(url)` unchanged, so
 *    it is safe to wire into call sites BEFORE imgproxy is enabled on the VPS.
 *  - flag on + public image-folder object: rewrites to the render endpoint.
 *
 * It matches the public object path on EITHER host (origin or the CDN host), so it
 * composes with `toCdnUrl` regardless of order. PDFs and audio are never transformed.
 */

import { toCdnUrl } from "@/shared/lib/media-url";

const OBJECT_SEGMENT = "/storage/v1/object/public/media/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/media/";

// Only image folders can be transformed — never pdf/ or audio/.
const TRANSFORMABLE_FOLDERS = ["images/", "avatars/", "classroom/"] as const;

export interface MediaImageOptions {
  width?: number;
  height?: number;
  /** imgproxy fit mode. Default behaviour (omit) preserves aspect ratio. */
  resize?: "cover" | "contain" | "fill";
  /** 20–100. Omit for the backend default. */
  quality?: number;
}

/**
 * Resolve a media image URL to a resized variant when transforms are enabled,
 * otherwise to the CDN/origin URL unchanged. Returns `undefined` for falsy input.
 *
 * Overloaded so a non-null `string` input yields a `string` (usable directly as a
 * required `src`), while a nullable input yields `string | undefined`.
 */
export function getMediaImage(url: string, opts?: MediaImageOptions): string;
export function getMediaImage(url: string | null | undefined, opts?: MediaImageOptions): string | undefined;
export function getMediaImage(
  url?: string | null,
  opts: MediaImageOptions = {},
): string | undefined {
  // Always apply the CDN host rewrite first (no-op until the CDN env is set).
  const base = toCdnUrl(url ?? undefined);
  if (!base) return undefined;

  const enabled =
    (process.env.NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED ?? "").trim() === "true";
  if (!enabled) return base;

  const idx = base.indexOf(OBJECT_SEGMENT);
  if (idx === -1) return base; // relative path, foreign host, or already a render URL

  const folderPart = base.slice(idx + OBJECT_SEGMENT.length);
  const transformable = TRANSFORMABLE_FOLDERS.some((f) => folderPart.startsWith(f));
  if (!transformable) return base; // pdf/ , audio/ → never transformed

  const rendered = base.slice(0, idx) + RENDER_SEGMENT + folderPart;

  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.resize) params.set("resize", opts.resize);
  if (opts.quality) params.set("quality", String(opts.quality));

  const qs = params.toString();
  return qs ? `${rendered}?${qs}` : rendered;
}
