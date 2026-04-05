import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { Container } from "@/shared/ui";
import { Avatar, Breadcrumb, Button, Divider, TestCard } from "@/shared/ui/ds";
import { useProContentModal } from "@/shared/ui/pro-content";
import { SEOHeader } from "@/widgets";
import { decode } from "html-entities";
import Image from "next/image";
import Link from "next/link";
import { IPracticeSingle } from "../api";

export function PageIELTSPracticeSingle({ post }: { post: IPracticeSingle }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);

  const actionHref = currentUser
    ? ROUTES.TAKE_THE_TEST(post.slug)
    : ROUTES.LOGIN(ROUTES.TAKE_THE_TEST(post.slug));

  const requiresUpgrade =
    post.quizFields.proUserOnly && !currentUser?.userData.isPro;

  const handleStartPractice = (e: React.MouseEvent) => {
    if (requiresUpgrade) {
      e.preventDefault();
      if (!currentUser) {
        window.location.href = ROUTES.LOGIN(ROUTES.PRACTICE.SINGLE(post.slug));
        return;
      }
      openProContentModal();
    }
  };

  const breadcrumbs = post.seo?.breadcrumbs || [];
  const dsBreadcrumbItems = breadcrumbs.map((b) => ({
    label: decode(b.text),
    href: b.url,
  }));

  const skill = post.quizFields.skill[0];
  const capitalizedSkill = skill === "listening" ? "Listening" : "Reading";

  return (
    <>
      <SEOHeader fullHead={post.seo?.fullHead} title={post.seo?.title} />

      <div className="min-h-screen pb-20 bg-white relative">
        {/* Background Grid - Only in Hero Area */}
        <div
          className="absolute inset-x-0 top-0 h-[380px] md:h-[420px] pointer-events-none z-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(217,74,86,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(217,74,86,0.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: "center top",
          }}
        />

        {/* The Red Stripe (Behind the card) */}
        <div className="absolute top-[380px] md:top-[420px] left-0 w-full h-[10px] bg-[#D94A56] z-0" />

        <Container className="relative z-10 pt-[160px] md:pt-[220px] mb-8">
          {/* Header Box */}
          <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] px-[20px] md:px-[61px] py-[30px] md:py-[50px] max-w-[900px] mx-auto shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-left">
            <div className="mb-[23px]">
              <Breadcrumb items={dsBreadcrumbItems} />
            </div>

            <h1 className="text-3xl md:text-[40px] font-extrabold text-[#2D3142] font-noto-sans leading-tight mb-[23px]">
              {post.title}
            </h1>

            <div
              className="text-[#6A7282] text-sm md:text-base font-noto-sans max-w-full pb-[23px] border-b border-[rgba(0,0,0,0.06)] line-clamp-2"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />

            {/* Author info */}
            <div className="flex items-center justify-between pt-[23px]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={post.author.node.userData.avatar?.node.sourceUrl}
                    fallback={post.author.node.name?.charAt(0) || "A"}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-[#2D3142]">
                    {post.author.node.name || "Administrator"}
                  </span>
                </div>
                <div className="text-sm font-medium text-[#6A7282]">
                  {post.date
                    ? new Date(post.date).toLocaleDateString("vi-VN")
                    : "14/12/2025"}
                </div>
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded transition-colors text-[#2D3142]"
                title="Share"
              >
                <span className="material-symbols-rounded text-[24px] align-middle">
                  ios_share
                </span>
              </button>
            </div>
          </div>
        </Container>

        <Container className="max-w-[1600px] relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Fixed details */}
            <div className="w-full lg:w-[220px] shrink-0 relative z-10">
              <h3 className="font-bold text-lg text-[#2D3142] mb-3">
                IELTS {capitalizedSkill} Practice
              </h3>
              <p className="text-sm text-[#6A7282] leading-relaxed">
                Includes answering questions, reviewing detailed explanations,
                and building vocabulary through the most popular IELTS{" "}
                {capitalizedSkill} tests on the market.
              </p>
            </div>

            {/* Middle Column: Main Content */}
            <div className="w-full lg:flex-1 space-y-6 relative z-10">
              {/* Featured Image */}
              <div className="aspect-[21/10] relative rounded-[24px] overflow-hidden border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
                {post.featuredImage?.node.sourceUrl && (
                  <Image
                    src={post.featuredImage.node.sourceUrl}
                    alt={post.featuredImage.node.altText || post.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              {/* Overview Box */}
              <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-rounded text-[#2D3142]">
                    article
                  </span>
                  <h3 className="font-bold text-lg text-[#2D3142]">
                    Tổng quan
                  </h3>
                </div>
                <div
                  className="text-sm md:text-base text-[#2D3142] leading-relaxed prose prose-sm md:prose-base max-w-none prose-p:!mb-2"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
              </div>

              {/* Mockup History Box */}
              <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-rounded text-[#2D3142]">
                    history
                  </span>
                  <h3 className="font-bold text-lg text-[#2D3142]">
                    Lịch sử làm bài
                  </h3>
                </div>
                <div className="space-y-3 bg-[#E5E5E5]/40 rounded-[12px] p-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm border border-[rgba(0,0,0,0.02)]"
                    >
                      <span className="text-sm text-[#6A7282]">
                        09/12/2025 - 08:55
                      </span>
                      <span className="text-sm font-bold text-[#27AE60]">
                        5/10
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button
                  variant="primary"
                  href={requiresUpgrade ? undefined : actionHref}
                  onClick={requiresUpgrade ? handleStartPractice : undefined}
                  className="min-w-[160px] !rounded-full px-8 py-3 h-auto text-base font-semibold"
                  leftIcon={
                    <span className="material-symbols-rounded text-[20px]">
                      play_circle
                    </span>
                  }
                >
                  Start Practice
                </Button>

                <Button
                  className="min-w-[160px] !rounded-full !bg-[#27AE60] !border-[#27AE60] hover:!bg-[#219653] hover:!border-[#219653] hover:!shadow-[0_0_10px_#27AE60] !text-white px-8 py-3 h-auto text-base font-semibold"
                  leftIcon={
                    <span className="material-symbols-rounded text-[20px]">
                      grid_view
                    </span>
                  }
                >
                  View Solution
                </Button>
              </div>
            </div>

            {/* Right Column: Related items */}
            <div className="w-full lg:w-[280px] shrink-0 space-y-8 relative z-10">
              {post.relatedPracticeQuizzes &&
                post.relatedPracticeQuizzes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-[#2D3142]">
                      Bài test nổi bật
                    </h3>
                    <TestCard
                      title={post.relatedPracticeQuizzes[0].title}
                      image={
                        post.relatedPracticeQuizzes[0].featuredImage || undefined
                      }
                      skill={skill}
                      part="Part 1"
                      attempts={1195}
                      isPro={post.quizFields.proUserOnly}
                      href={ROUTES.PRACTICE.SINGLE(
                        post.relatedPracticeQuizzes[0].slug
                      )}
                    />
                  </div>
                )}

                {post.relatedPracticeQuizzes &&
                post.relatedPracticeQuizzes.length > 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-[#2D3142]">
                        Có thể bạn quan tâm
                      </h3>
                      <Link
                        href={skill === "listening" ? ROUTES.PRACTICE.ARCHIVE_LISTENING : ROUTES.PRACTICE.ARCHIVE_READING}
                        className="text-xs text-[#2F80ED] hover:underline"
                      >
                        Tất cả bài viết &gt;
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {post.relatedPracticeQuizzes.slice(1, 4).map((rel, idx) => (
                        <Link
                          key={idx}
                          href={ROUTES.PRACTICE.SINGLE(rel.slug)}
                          className="flex gap-3 group items-center"
                        >
                          <div className="w-[100px] h-[65px] relative rounded-lg overflow-hidden shrink-0 border border-[rgba(0,0,0,0.06)] bg-[#FAF7EB]">
                            {rel.featuredImage && (
                              <Image
                                src={rel.featuredImage}
                                alt={rel.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                unoptimized
                              />
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-[#2D3142] group-hover:text-primary-500 line-clamp-3 transition-colors">
                            {rel.title}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </Container>

        {/* Bottom Related Section */}
        <Container className="max-w-[1600px] mt-20 relative z-10">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#2D3142]">
              Bài viết tương tự
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {post.relatedPracticeQuizzes?.slice(0, 4).map((quiz, i) => (
              <TestCard
                key={i}
                title={quiz.title}
                image={quiz.featuredImage || undefined}
                skill={skill}
                part={`Part ${i + 1}`}
                attempts={1195}
                isPro={post.quizFields.proUserOnly}
                score="9.0"
                href={ROUTES.PRACTICE.SINGLE(quiz.slug)}
              />
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}