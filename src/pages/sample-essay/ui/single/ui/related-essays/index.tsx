import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "~supabase/client";
import { ROUTES } from "@/shared/routes";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";

type RelatedEssay = {
  id: string;
  slug: string;
  title: string;
  featured_image: string | null;
};

function RelatedEssays({ currentId, skill }: { currentId: string; skill?: string | null }) {
  const fallbackImage = useContentImageFallback();
  const [essays, setEssays] = useState<RelatedEssay[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const supabase = createClient();
        let query = supabase
          .from("sample_essays")
          .select("id, slug, title, featured_image")
          .eq("status", "published")
          .neq("id", currentId)
          .limit(6)
          .order("created_at", { ascending: false });

        if (skill) query = query.eq("skill", skill);

        const { data } = await query;
        setEssays((data ?? []) as RelatedEssay[]);
      } catch {
        // silently ignore
      }
    };
    fetch();
  }, [currentId, skill]);

  if (!essays.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-[#2D3142]">Có thể bạn quan tâm</h3>
      <div className="space-y-4">
        {essays.map((essay) => (
          <Link
            key={essay.id}
            href={ROUTES.SAMPLE_ESSAY.SINGLE(essay.slug)}
            className="flex gap-3 group items-center"
          >
            <div className="w-[100px] h-[65px] relative rounded-lg overflow-hidden shrink-0 border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
              <Image
                src={resolveContentImage(essay.featured_image ?? undefined, fallbackImage)}
                alt={essay.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                unoptimized
              />
            </div>
            <h4 className="text-sm font-semibold text-[#2D3142] group-hover:text-primary-500 line-clamp-3 transition-colors">
              {essay.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RelatedEssays;
