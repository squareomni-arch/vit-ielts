import { StarRating } from "@/entities";
import { IPost } from "@/shared/types";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import { Fragment } from "react";

export const VerticalView = ({ post }: { post: IPost }) => {
  return (
    <article className="flex items-start gap-x-2 h-full">
      <Link
        href={post.link}
        title={post.title}
        className="rounded-lg overflow-hidden block w-1/3 md:w-1/5 self-stretch"
      >
        <div className="relative aspect-[4/3] max-w-full min-h-full">
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
      </Link>
      <div className="space-y-1 md:space-y-1.5 flex-auto w-2/3 md:w-4/5">
        <Link href={post.link} className="block w-fit" title={post.title}>
          <h3 className="text-sm md:text-base font-semibold text-red-800 hover:text-red-800/80 line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <div className="flex justify-between flex-wrap gap-y-1 gap-x-1">
          <StarRating post={post} />
          <p className="text-xs text-gray-600 flex items-center space-x-1">
            <span className="material-symbols-rounded text-lg! leading-none!">
              calendar_month
            </span>
            <span>{dayjs(post.date).format("DD/MM/YYYY")}</span>
          </p>
        </div>
        {post.categories?.edges?.length > 0 && (
          <div className="items-center text-xs font-nunito flex-wrap gap-x-1 gap-y-1 hidden md:flex mt-3">
            <span className="material-symbols-rounded filled text-neutral-300 text-base! leading-none!">
              shoppingmode
            </span>
            {post.categories?.edges?.map(({ node }, index) => (
              <Fragment key={index}>
                <Link
                  href={node.link}
                  className="block rounded-full font-extrabold text-gray-500 hover:text-red-800 duration-150"
                >
                  <span className="block">{node.name}</span>
                </Link>
                {index < (post.categories?.edges?.length ?? 0) - 1 && ","}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
