import { Container, LinkButton } from "@/shared/ui";
import { IPracticeSingle } from "../../api";
import _ from "lodash";
import { Button, Divider } from "antd";
import { ROUTES } from "@/shared/routes";
import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";
import { useAuth } from "@/appx/providers";
import { useProContentModal } from "@/shared/ui/pro-content";

function RelatedPosts({
  posts,
  skill,
  quiz_slug,
  isPro,
}: {
  posts: IPracticeSingle["relatedPracticeQuizzes"];
  skill: IPracticeSingle["quizFields"]["skill"][0];
  quiz_slug: IPracticeSingle["slug"];
  isPro: boolean;
}) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const getPostTitle = useCallback(
    (title: string) => {
      return `${title} IELTS ${_.capitalize(skill)} Answers with Explanation`;
    },
    [skill]
  );

  return (
    <section className="py-10 bg-slate-100">
      <Container className="max-w-screen-2xl space-y-16 md:space-y-24">
        <div className="flex flex-wrap justify-center -mx-4 md:-mx-8">
          <div className="w-full md:w-6/12 px-4 md:px-8">
            <div className="space-y-2">
              <h3 className="font-bold text-xl block">
                IELTS {_.capitalize(skill)} Practice
              </h3>
              <p className="text-gray-500 text-base">
                Includes practicing tests, reviewing detailed explanations, and
                learning vocabulary from the most popular IELTS
                {_.capitalize(skill)} tests on the market.
              </p>
              {!currentUser ? (
                <Link
                  href={ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(quiz_slug))}
                  passHref
                  legacyBehavior
                >
                  <LinkButton target="_blank" type="primary" size="large">
                    <span className="material-symbols-rounded">
                      play_circle
                    </span>
                    <span>Start Practice</span>
                  </LinkButton>
                </Link>
              ) : isPro && currentUser.userData.isPro ? (
                <Link
                  href={ROUTES.TAKE_THE_TEST(quiz_slug)}
                  passHref
                  legacyBehavior
                >
                  <LinkButton target="_blank" type="primary" size="large">
                    <span className="material-symbols-rounded">
                      play_circle
                    </span>
                    <span>Start Practice</span>
                  </LinkButton>
                </Link>
              ) : isPro ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={openProContentModal}
                >
                  <span className="material-symbols-rounded">play_circle</span>
                  <span>Start Practice</span>
                </Button>
              ) : (
                <Link
                  href={ROUTES.TAKE_THE_TEST(quiz_slug)}
                  passHref
                  legacyBehavior
                >
                  <LinkButton target="_blank" type="primary" size="large">
                    <span className="material-symbols-rounded">
                      play_circle
                    </span>
                    <span>Start Practice</span>
                  </LinkButton>
                </Link>
              )}
            </div>

            {posts.length > 0 && (
              <>
                <Divider />
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-[32px] flex items-center space-x-1 font-bold">
                    <span className="material-symbols-rounded text-4xl!">
                      news
                    </span>
                    <span>Related Posts</span>
                  </h2>
                  <div className="divide-y divide-gray-300 -my-6">
                    {posts.map((post) => (
                      <div key={post.slug} className="py-6">
                        <div className="flex items-start flex-wrap -m-2">
                          <div className="w-full sm:w-2/3 p-2 order-2 md:order-1">
                            <Link
                              href={ROUTES.PRACTICE.SINGLE(post.slug)}
                              title={getPostTitle(post.title)}
                              className="hover:underline font-semibold text-lg sm:text-xl block"
                            >
                              {getPostTitle(post.title)}
                            </Link>
                            <p className="text-gray-500 text-base line-clamp-3">
                              {post.excerpt}
                            </p>
                          </div>
                          <div className="w-full sm:w-1/3 p-2 order-1 sm:order-2">
                            <Link
                              href={ROUTES.PRACTICE.SINGLE(post.slug)}
                              title={getPostTitle(post.title)}
                            >
                              <div className="relative aspect-video rounded overflow-hidden">
                                <Image
                                  src={
                                    post.featuredImage ||
                                    "https://placehold.co/600x400"
                                  }
                                  alt={getPostTitle(post.title)}
                                  className="object-cover"
                                  unoptimized
                                  fill
                                />
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="py-6 text-center">
                      <Link
                        href={
                          skill === "reading"
                            ? ROUTES.PRACTICE.ARCHIVE_READING
                            : ROUTES.PRACTICE.ARCHIVE_LISTENING
                        }
                        passHref
                        legacyBehavior
                      >
                        <LinkButton type="primary">More</LinkButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default RelatedPosts;
