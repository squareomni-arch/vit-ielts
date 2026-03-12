import { Container, Empty } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { CategoryData } from "../api";
import { Breadcrumb, Pagination } from "antd";
import Link from "next/link";
import { DefaultView } from "@/shared/ui/post";
import { useRouter } from "next/router";
import { decode } from "html-entities";

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
  const breadcrumbItems = (category.seo?.breadcrumbs || []).map((item, index) => ({
    title:
      index === (category.seo?.breadcrumbs?.length ?? 0) - 1 ? (
        decode(item.text)
      ) : (
        <Link href={item.url}>{decode(item.text)}</Link>
      ),
  }));

  return (
    <>
      <SEOHeader fullHead={category.seo?.fullHead} title={category.seo?.title} />
      <Container>
        <div className="flex -m-4 flex-wrap">
          <div className="p-4 w-full">
            <div className="py-5">
              <Breadcrumb items={breadcrumbItems} />
            </div>
            <div className="pb-5 space-y-4">
              {posts.edges.length > 0 ? (
                <>
                  <div className="flex -m-1.5 flex-wrap items-stretch mb-4">
                    {posts.edges.map((item, index) => (
                      <div className="p-1.5 w-full md:w-1/3" key={index}>
                        <DefaultView post={item.node} />
                      </div>
                    ))}
                  </div>
                  <Pagination
                    className="justify-center"
                    defaultCurrent={paged}
                    defaultPageSize={pageSize}
                    total={posts.pageInfo.offsetPagination.total}
                    onChange={(page) =>
                      router.push(`${category.link}/page/${page}`)
                    }
                  />
                </>
              ) : (
                <Empty
                  title="There is no news!"
                  subtitle="We will update as soon as possible."
                />
              )}
            </div>
          </div>
          {/* <div className="p-4 md:w-4/12 w-full">
            <div className="bg-gray-100 h-full"></div>
          </div> */}
        </div>
      </Container>
    </>
  );
};
