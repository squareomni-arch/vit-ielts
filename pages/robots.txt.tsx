import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getSeoConfig } from "~services/seo";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const supabase = createServerSupabase(context);
  
  let robotsTxt = "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://vitielts.com/sitemap.xml";
  
  try {
    const config = await getSeoConfig(supabase);
    if (config?.robotsTxt) {
      robotsTxt = config.robotsTxt;
    }
  } catch (e) {
    console.error("Error fetching SEO config for robots.txt:", e);
  }

  res.setHeader("Content-Type", "text/plain");
  res.write(robotsTxt);
  res.end();

  return { props: {} };
};

export default function Robots() {
  return null;
}
