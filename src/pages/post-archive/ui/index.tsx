import { Container, Empty } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { CategoryData } from "../api";
import { Pagination } from "antd";
import { HeroBanner } from "@/shared/ui/ds";
import { useRouter } from "next/router";
import { decode } from "html-entities";
import Image from "next/image";
import { resolveContentImage, useContentImageFallback } from "@/shared/lib/content-image";
import { ProLink } from "@/shared/ui/pro-link";
import { IPost } from "@/shared/types";
import { ProBadge } from "@/shared/ui/pro-badge";

const HorizontalPostItem = ({ post }: { post: IPost }) => {
  const fallbackImage = useContentImageFallback();
  const imageSrc = resolveContentImage(post.featuredImage?.node.sourceUrl, fallbackImage);
  const href = post.link ? post.link.replace("//cms.", "//") : "#";
  const isPro = post.postMeta?.proUserOnly;
  const category = post.categories?.edges?.[0]?.node;

  return (
    <ProLink
      href={href}
      title={post.title}
      isPro={isPro}
      className="group flex flex-col sm:flex-row sm:items-center bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative w-full h-[200px] sm:w-[390px] sm:h-[240px] shrink-0 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none overflow-hidden bg-gray-100">
        {isPro && (
          <ProBadge className="absolute top-2 right-2 z-10 shadow-sm" />
        )}
        <Image
          src={imageSrc}
          alt={post.featuredImage?.node.altText || post.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:p-0 sm:px-4 sm:pr-4">
        {category && (
          <p className="text-sm text-gray-700 mb-1 truncate">{category.name}</p>
        )}
        <h3 className="font-bold text-[#202020] text-[20px] leading-snug line-clamp-2 mb-3 group-hover:text-primary-500 transition-colors">
          {post.title}
        </h3>
        <p
          className="text-sm text-gray-400 line-clamp-1"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />
      </div>
    </ProLink>
  );
};

export const PageArchive = ({
  category,
  posts,
  paged,
  pageSize,
}: {
  category: CategoryData["category"];
  posts: CategoryData["posts"];
  paged: number;
  pageSize: number;
}) => {
  const router = useRouter();
  const dsBreadcrumbs = (category.seo?.breadcrumbs || []).map((item) => ({
    label: decode(item.text),
    href: item.url,
  }));

  return (
    <>
      <SEOHeader fullHead={category.seo?.fullHead} title={category.seo?.title} />
      <HeroBanner
        title={category.name || "Blog"}
        breadcrumbs={dsBreadcrumbs}
      />
      <section className="px-4 sm:px-6 py-10">
      <Container>
        {posts.edges.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {posts.edges.map((item, index) => (
                <HorizontalPostItem post={item.node} key={index} />
              ))}
            </div>
            <Pagination
              className="justify-center"
              defaultCurrent={paged}
              defaultPageSize={pageSize}
              total={posts.pageInfo.offsetPagination.total}
              onChange={(page) => {
                router.push(`${category.link}/page/${page}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        ) : (
          <Empty
            title="There is no news!"
            subtitle="We will update as soon as possible."
          />
        )}
      </Container>
      </section>
    </>
  );
};
