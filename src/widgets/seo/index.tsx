import Head from "next/head";
import { useRouter } from "next/router";

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
  fullHead,
  title,
  description,
  image,
}: SEOHeaderProps) => {
  const router = useRouter();

  // Construct canonical URL from router (works during SSR for crawlers)
  const canonicalUrl = `${SITE_URL}${router.asPath.split("?")[0]}`;

  // Default SEO fallbacks
  const defaultTitle = "Vit IELTS | Luyện thi IELTS Online hàng đầu";
  const defaultDescription = "Học và luyện thi IELTS trực tuyến hiệu quả với Vit IELTS. Thư viện đề thi phong phú, bài viết mẫu IELTS chuẩn mực.";
  const defaultImage = `${SITE_URL}/assets/logos/Logo.png`;

  // Resolved values
  const resolvedTitle = title ? `${title} - Vit IELTS` : defaultTitle;
  const metaDescription = description
    ? stripHtml(description).slice(0, 160)
    : defaultDescription;
  const ogImage = image || defaultImage;

  return (
    <Head>
      <title>{resolvedTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Vit IELTS" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
};
