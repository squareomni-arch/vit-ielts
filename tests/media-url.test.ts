import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { toCdnUrl } from "../src/shared/lib/media-url";

const ORIGIN = "https://api.squarevps.com";
const CDN = "https://cdn.vitielts.com";
const OBJECT = `${ORIGIN}/storage/v1/object/public/media/images/foo-123.png`;
const RENDER = `${ORIGIN}/storage/v1/render/image/public/media/images/foo-123.png?width=400`;

describe("toCdnUrl", () => {
  const original = {
    cdn: process.env.NEXT_PUBLIC_MEDIA_CDN_URL,
    origin: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGIN;
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = CDN;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = original.cdn;
    process.env.NEXT_PUBLIC_SUPABASE_URL = original.origin;
  });

  it("rewrites a public object URL to the CDN host", () => {
    expect(toCdnUrl(OBJECT)).toBe(`${CDN}/storage/v1/object/public/media/images/foo-123.png`);
  });

  it("rewrites a render/image URL (used by image-resize)", () => {
    expect(toCdnUrl(RENDER)).toBe(`${CDN}/storage/v1/render/image/public/media/images/foo-123.png?width=400`);
  });

  it("tolerates a trailing slash on the CDN host", () => {
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = `${CDN}/`;
    expect(toCdnUrl(OBJECT)).toBe(`${CDN}/storage/v1/object/public/media/images/foo-123.png`);
  });

  it("is a no-op when the CDN host is unset", () => {
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = "";
    expect(toCdnUrl(OBJECT)).toBe(OBJECT);
  });

  it("leaves foreign hosts unchanged", () => {
    const foreign = "https://cms.vitieltstest.com/wp-content/uploads/x.png";
    expect(toCdnUrl(foreign)).toBe(foreign);
  });

  it("leaves relative paths and data URIs unchanged", () => {
    expect(toCdnUrl("/assets/thumb-placeholder (1).webp")).toBe("/assets/thumb-placeholder (1).webp");
    expect(toCdnUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });

  it("does NOT rewrite non-public storage paths (auth'd objects)", () => {
    const authed = `${ORIGIN}/storage/v1/object/authenticated/media/images/foo.png`;
    expect(toCdnUrl(authed)).toBe(authed);
  });

  it("preserves falsy input types", () => {
    expect(toCdnUrl(undefined)).toBeUndefined();
    expect(toCdnUrl(null)).toBeNull();
    expect(toCdnUrl("")).toBe("");
  });
});
