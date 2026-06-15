import { useAppContext } from "@/appx/providers";

export const DEFAULT_CONTENT_IMAGE = "/assets/figma/icons/logo.png";

const QUIZ_PLACEHOLDERS = [
  "/assets/thumb-placeholder (1).webp",
  "/assets/thumb-placeholder (2).webp",
  "/assets/thumb-placeholder (3).webp",
  "/assets/thumb-placeholder (4).webp",
] as const;

/** Deterministically picks a placeholder thumbnail from the quiz UUID. */
export function getQuizThumbnail(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return QUIZ_PLACEHOLDERS[hash % QUIZ_PLACEHOLDERS.length];
}

export function resolveContentImage(
  image?: string | null | false,
  fallbackImage?: string | null | false,
): string {
  const primaryImage = typeof image === "string" ? image.trim() : "";
  if (primaryImage) return primaryImage;

  const configuredFallback = typeof fallbackImage === "string" ? fallbackImage.trim() : "";
  if (configuredFallback) return configuredFallback;

  return DEFAULT_CONTENT_IMAGE;
}

export function useContentImageFallback(): string {
  const { masterData } = useAppContext();

  return resolveContentImage(
    undefined,
    masterData?.websiteOptions?.websiteOptionsFields?.generalSettings?.defaultContentImage?.node?.sourceUrl,
  );
}
