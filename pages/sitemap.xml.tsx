import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vitielts.com";

function generateSiteMap(
  posts: { slug: string }[],
  quizzes: { slug: string; type: string }[],
  essays: { slug: string }[]
) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <!-- Trang tĩnh chính -->
     <url>
       <loc>${SITE_URL}</loc>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${SITE_URL}/ielts-exam-library</loc>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${SITE_URL}/blog</loc>
       <changefreq>daily</changefreq>
       <priority>0.9</priority>
     </url>
     <url>
       <loc>${SITE_URL}/contact</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>

     <!-- Blog Posts -->
     ${posts
       .map(({ slug }) => {
         return `
       <url>
           <loc>${SITE_URL}/${slug}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
       })
       .join("")}

     <!-- Quizzes (Mock tests & Practices & Predictions) -->
     ${quizzes
       .map((quiz) => {
         let path = `/${quiz.slug}`;
         if (quiz.type === "academic" || quiz.type === "general") {
           path = `/ielts-exam-library/${quiz.slug}`;
         } else if (quiz.type === "practice") {
           path = `/ielts-practice-library/${quiz.slug}`;
         } else if (quiz.type === "prediction") {
           path = `/vit-ielts/${quiz.slug}`;
         }
         return `
       <url>
           <loc>${SITE_URL}${path}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.8</priority>
       </url>
     `;
       })
       .join("")}

     <!-- Sample Essays -->
     ${essays
       .map((essay) => {
         return `
       <url>
           <loc>${SITE_URL}/${essay.slug}</loc>
           <changefreq>weekly</changefreq>
           <priority>0.7</priority>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const supabase = createServerSupabase(context);

  // Lấy dữ liệu song song từ các table liên quan
  const [postsRes, quizzesRes, essaysRes] = await Promise.all([
    supabase.from("posts").select("slug").eq("status", "published"),
    supabase.from("quizzes").select("slug, type").eq("status", "published"),
    supabase.from("sample_essays").select("slug").eq("status", "published"),
  ]);

  const posts = postsRes.data || [];
  const quizzes = quizzesRes.data || [];
  const essays = essaysRes.data || [];

  const sitemap = generateSiteMap(posts, quizzes, essays);

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap.trim());
  res.end();

  return { props: {} };
};

export default function SiteMap() {
  return null;
}
