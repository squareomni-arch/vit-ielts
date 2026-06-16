/**
 * CDN URL rewriting for Supabase Storage media.
 *
 * Stored media URLs are full Supabase origin URLs, e.g.
 *   https://api.squarevps.com/storage/v1/object/public/media/images/foo.png
 *
 * We keep the ORIGIN URL in the database (so the CDN host stays swappable via
 * env with no data migration) and rewrite to the CDN host only at render time.
 *
 * `toCdnUrl` is a pure, isomorphic no-op until `NEXT_PUBLIC_MEDIA_CDN_URL` is
 * set, so it is safe to wire into every call site before the CDN exists.
 *
 * Reused by `media-image.ts` (image-resize), which builds a `/render/image/...`
 * URL and then passes it through here.
 */

// Only rewrite PUBLIC storage paths. Authenticated/object paths are fetched via
// the Supabase client with auth headers and must NOT be routed through the CDN.
const PUBLIC_PREFIXES = [
  "/storage/v1/object/public/",
  "/storage/v1/render/image/public/",
] as const;

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Rewrite a Supabase Storage origin URL to the configured CDN host.
 * Returns the input unchanged when:
 *  - it is falsy / not a string,
 *  - `NEXT_PUBLIC_MEDIA_CDN_URL` or `NEXT_PUBLIC_SUPABASE_URL` is unset,
 *  - it is not a PUBLIC storage URL on the Supabase origin (relative paths,
 *    `data:` URIs, foreign hosts, and non-public storage paths pass through).
 *
 * The input type is preserved so a falsy `src`/`href` stays falsy at the call site.
 */
export function toCdnUrl<T extends string | null | undefined>(url: T): T {
  if (!url || typeof url !== "string") return url;

  const cdn = (process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? "").trim();
  const origin = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!cdn || !origin) return url;

  const originBase = trimTrailingSlash(origin);
  if (!url.startsWith(originBase)) return url;

  const path = url.slice(originBase.length);
  const isPublic = PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isPublic) return url;

  return (trimTrailingSlash(cdn) + path) as T;
}
