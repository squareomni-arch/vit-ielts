import { StarRating } from "@/entities";
import { IPost } from "@/shared/types";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import { ProLink } from "@/shared/ui/pro-link";

export const DefaultView = ({ post }: { post: IPost }) => {
  return (
    <article className="p-4 rounded-2xl shadow-primary bg-white h-full">
      <ProLink
        href={post.link ? post.link.replace('//cms.', '//') : '#'}
        title={post.title}
        className="rounded-lg overflow-hidden block w-full h-auto"
        isPro={post.postMeta.proUserOnly}
      >
        <div className="relative aspect-video">
          {post.postMeta.proUserOnly && (
            <div className="absolute top-3 right-3 z-10">
              <div
                className={
                  "rounded py-0.5 px-1.5 font-semibold text-white shadow bg-primary"
                }
              >
                PRO
              </div>
            </div>
          )}
          <Image
            src={
              post.featuredImage?.node.sourceUrl ||
              "https://placehold.co/600x400"
            }
            alt={post.featuredImage?.node.altText || post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </ProLink>
      <div className="mt-5 space-y-1.5">
        <ProLink
          isPro={post.postMeta.proUserOnly}
          href={post.link ? post.link.replace('//cms.', '//') : '#'}
          className="block w-fit"
          title={post.title}
        >
          <h3 className="text-lg font-semibold text-red-800 hover:text-red-800/80">
            {post.title}
          </h3>
        </ProLink>
        <div className="flex justify-between">
          <StarRating post={post} />
          <p className="text-xs text-gray-600 flex items-center space-x-1">
            <span className="material-symbols-rounded text-lg! leading-none!">
              calendar_month
            </span>
            <span>{dayjs(post.date).format("DD/MM/YYYY")}</span>
          </p>
        </div>
        {post.categories?.edges?.length > 0 && (
          <div className="flex items-center text-xs font-nunito flex-wrap gap-x-2 gap-y-1">
            <span className="material-symbols-rounded filled text-red-800 text-3xl!">
              shoppingmode
            </span>
            {post.categories?.edges?.map(({ node }, index) => (
              <Link
                href={node.link}
                key={index}
                className="block bg-gray-200 rounded-full font-extrabold text-gray-500 hover:text-red-800 duration-150"
              >
                <span className="px-3 py-1 block">{node.name}</span>
              </Link>
            ))}
          </div>
        )}
        <p
          className="line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        ></p>
      </div>
    </article>
  );
};
