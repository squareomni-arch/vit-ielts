import Head from "next/head";
import { useRouter } from "next/router";
import parse from "html-react-parser";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ieltsprediction.com";

/** Strip HTML tags to get plain text for meta descriptions */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

type SEOHeaderProps = {
  fullHead?: string;
  title?: string;
  /** Plain text or HTML description — HTML tags will be stripped for meta */
  description?: string;
  /** Absolute URL for og:image */
  image?: string;
};

export const SEOHeader = ({
  fullHead: fullHeadString,
  title,
  description,
  image,
}: SEOHeaderProps) => {
  const router = useRouter();
  const fullHead = fullHeadString ? parse(fullHeadString) : null;
  const hasFullHead = !!fullHeadString?.trim();

  // Construct canonical URL from router (works during SSR for crawlers)
  const canonicalUrl = `${SITE_URL}${router.asPath.split("?")[0]}`;

  // Clean description: strip HTML tags, truncate to 160 chars
  const metaDescription = description
    ? stripHtml(description).slice(0, 160)
    : title
      ? `${title} - Vit IELTS`
      : undefined;

  const ogTitle = title || "Vit IELTS";
  const siteName = "Vit IELTS";
  const ogImage = image || `${SITE_URL}/assets/logos/logo-on-bright.svg`;

  return (
    <Head>
      {title && <title>{title}</title>}

      {/* If fullHead contains Yoast SEO HTML, render it directly */}
      {hasFullHead && fullHead}

      {/* Otherwise, generate OG + Twitter meta tags from props */}
      {!hasFullHead && (
        <>
          {metaDescription && (
            <meta name="description" content={metaDescription} />
          )}

          {/* Open Graph */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={ogTitle} />
          {metaDescription && (
            <meta property="og:description" content={metaDescription} />
          )}
          <meta property="og:image" content={ogImage} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:site_name" content={siteName} />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ogTitle} />
          {metaDescription && (
            <meta name="twitter:description" content={metaDescription} />
          )}
          <meta name="twitter:image" content={ogImage} />
        </>
      )}
    </Head>
  );
};
