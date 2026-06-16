import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getMediaImage } from "../src/shared/lib/media-image";

const ORIGIN = "https://api.squarevps.com";
const CDN = "https://cdn.vitielts.com";
const IMG = `${ORIGIN}/storage/v1/object/public/media/images/foo-123.png`;
const PDF = `${ORIGIN}/storage/v1/object/public/media/pdf/ipq3-1.pdf`;
const AUDIO = `${ORIGIN}/storage/v1/object/public/media/audio/part-1.mp3`;

describe("getMediaImage", () => {
  const original = {
    cdn: process.env.NEXT_PUBLIC_MEDIA_CDN_URL,
    origin: process.env.NEXT_PUBLIC_SUPABASE_URL,
    flag: process.env.NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED,
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGIN;
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = "";
    process.env.NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = original.cdn;
    process.env.NEXT_PUBLIC_SUPABASE_URL = original.origin;
    process.env.NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED = original.flag;
  });

  it("rewrites an image object URL to the render endpoint with sizing", () => {
    expect(getMediaImage(IMG, { width: 356, height: 220, resize: "cover" })).toBe(
      `${ORIGIN}/storage/v1/render/image/public/media/images/foo-123.png?width=356&height=220&resize=cover`,
    );
  });

  it("emits width only when only width is given", () => {
    expect(getMediaImage(IMG, { width: 600 })).toBe(
      `${ORIGIN}/storage/v1/render/image/public/media/images/foo-123.png?width=600`,
    );
  });

  it("is a no-op (origin URL) when the transform flag is off", () => {
    process.env.NEXT_PUBLIC_MEDIA_TRANSFORM_ENABLED = "false";
    expect(getMediaImage(IMG, { width: 600 })).toBe(IMG);
  });

  it("never transforms PDFs or audio", () => {
    expect(getMediaImage(PDF, { width: 600 })).toBe(PDF);
    expect(getMediaImage(AUDIO, { width: 600 })).toBe(AUDIO);
  });

  it("leaves relative placeholders unchanged", () => {
    expect(getMediaImage("/assets/thumb-placeholder (1).webp", { width: 600 })).toBe(
      "/assets/thumb-placeholder (1).webp",
    );
  });

  it("composes with the CDN host (resize on the CDN origin)", () => {
    process.env.NEXT_PUBLIC_MEDIA_CDN_URL = CDN;
    expect(getMediaImage(IMG, { width: 400, resize: "cover" })).toBe(
      `${CDN}/storage/v1/render/image/public/media/images/foo-123.png?width=400&resize=cover`,
    );
  });

  it("returns undefined for falsy input", () => {
    expect(getMediaImage(undefined)).toBeUndefined();
    expect(getMediaImage(null)).toBeUndefined();
    expect(getMediaImage("")).toBeUndefined();
  });
});
