import { useAuth } from "@/appx/providers";
import { ROUTES } from "@/shared/routes";
import { Container } from "@/shared/ui";
import { Avatar, Breadcrumb, Button, Divider } from "@/shared/ui/ds";
import { TestCardWithScore } from "@/entities/practice-test";
import { useProContentModal } from "@/shared/ui/pro-content";
import { SEOHeader } from "@/widgets";
import { decode } from "html-entities";
import Image from "next/image";
import Link from "next/link";
import { IPracticeSingle } from "../api";
import { PracticeHistoryWidget } from "./practice-history";
import { normalizeSectionBadge } from "@/shared/lib/quiz-part";
import { useState } from "react";

export function PageIELTSPracticeSingle({ post }: { post: IPracticeSingle }) {
  const { currentUser } = useAuth();
  const openProContentModal = useProContentModal((state) => state.open);
  const [copied, setCopied] = useState(false);

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

      <div className="min-h-screen pb-20 bg-white relative px-4 sm:px-6">
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

        <Container className="max-w-[1360px] relative z-10 pt-[160px] md:pt-[220px] mb-13">
          {/* Use same 3-column layout so the header aligns with the middle content column */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left spacer — matches left sidebar width */}
            <div className="hidden lg:block w-[220px] shrink-0" />

            {/* Header Box — aligned with middle column */}
            <div className="w-full lg:flex-1">
              <div className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] px-[20px] md:px-[61px] py-[30px] md:py-[50px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-left">
                <div className="mb-[23px]">
                  <Breadcrumb items={dsBreadcrumbItems} />
                </div>

                <h1 className="text-3xl md:text-[40px] font-extrabold text-[#2D3142] font-noto-sans leading-tight mb-[23px]">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <div
                    className="text-[#6A7282] text-sm md:text-base font-noto-sans max-w-full pb-[23px] border-b border-[rgba(0,0,0,0.06)] line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                  />
                )}

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
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-[#2D3142] cursor-pointer"
                    title="Share"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <span className="material-symbols-rounded text-[24px] align-middle">
                      ios_share
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right spacer — matches right sidebar width */}
            <div className="hidden lg:block w-[280px] shrink-0" />
          </div>
        </Container>

        <Container className="max-w-[1360px] relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Fixed details */}
            <div className="w-full lg:w-[220px] shrink-0 relative z-10">
              <div className="sticky top-35 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[#2D3142] mb-3">
                    IELTS {capitalizedSkill} Practice
                  </h3>
                  <p className="text-sm text-[#6A7282] leading-relaxed">
                    Includes answering questions, reviewing detailed explanations,
                    and building vocabulary through the most popular IELTS{" "}
                    {capitalizedSkill} tests on the market.
                  </p>
                </div>
                
                <div className="space-y-4 pt-4">
                  <button 
                    className={`flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${copied ? 'text-[#27AE60]' : 'text-[#6A7282] hover:text-[#D94A56]'}`}
                    onClick={() => {
                      const url = window.location.href;
                      const onSuccess = () => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      };
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(url).then(onSuccess).catch(() => {
                          const ta = document.createElement('textarea');
                          ta.value = url;
                          ta.style.position = 'fixed';
                          ta.style.opacity = '0';
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          document.body.removeChild(ta);
                          onSuccess();
                        });
                      } else {
                        const ta = document.createElement('textarea');
                        ta.value = url;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        onSuccess();
                      }
                    }}
                  >
                    <span className="material-symbols-rounded text-lg">{copied ? 'check_circle' : 'content_copy'}</span>
                    {copied ? 'Đã copy!' : 'Copy link'}
                  </button>
                  <button 
                    className="flex items-center gap-3 text-sm font-medium text-[#6A7282] hover:text-[#D94A56] transition-colors cursor-pointer"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <span className="material-symbols-rounded text-lg">share</span>
                    Share
                  </button>
                  
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      href={requiresUpgrade ? undefined : actionHref}
                      onClick={requiresUpgrade ? handleStartPractice : undefined}
                      className="w-full !rounded-full py-2.5 h-auto text-sm font-semibold shadow-sm"
                      leftIcon={
                        <span className="material-symbols-rounded text-[20px]">
                          play_circle
                        </span>
                      }
                    >
                      Làm bài
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Main Content */}
            <div className="w-full lg:flex-1 min-w-0 space-y-6 relative z-10">
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
              {post.excerpt && (
                <div id="overview-box" className="bg-white rounded-[24px] border border-[rgba(0,0,0,0.06)] p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-rounded text-[#2D3142]">
                      info
                    </span>
                    <h3 className="font-bold text-lg text-[#2D3142]">
                      Tổng quan
                    </h3>
                  </div>
                  <div
                    className="prose max-w-none text-[#4B5563]"
                    dangerouslySetInnerHTML={{ __html: post.excerpt }}
                  />
                </div>
              )}

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
                <PracticeHistoryWidget post={post} />
              </div>

              {/* Download PDF Box */}
              {false && post.quizFields.pdf?.node?.mediaItemUrl && (
                <div className="bg-white rounded-[12px] border-2 border-primary-500 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-rounded text-primary-500 font-bold text-[28px]">
                      picture_as_pdf
                    </span>
                    <h3 className="font-bold text-xl text-[#2D3142]">
                      Download PDF
                    </h3>
                  </div>
                  <p className="text-[#2D3142] text-sm mb-5 font-medium">
                    You can download a nice copy of the questions and answers for {post.title} here.
                  </p>
                  <a
                    href={post.quizFields.pdf.node.mediaItemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex justify-between items-center bg-[#E5E5E5]/40 hover:bg-[#E5E5E5]/80 transition-colors rounded-lg p-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-1 rounded">PDF</span>
                      <span className="font-semibold text-[#2D3142] text-sm">{post.title}</span>
                    </div>
                    <span className="material-symbols-rounded flex items-center justify-center bg-white shadow-sm p-1 rounded text-[#6A7282] group-hover:text-primary-500 transition-colors">
                      download
                    </span>
                  </a>
                </div>
              )}

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
                  Làm bài
                </Button>
              </div>
            </div>

            {/* Right Column: Related items */}
            <div className="w-full lg:w-[280px] shrink-0 relative z-10">
              <div className="sticky top-35 space-y-8">
                {post.relatedPracticeQuizzes &&
                post.relatedPracticeQuizzes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-[#2D3142]">
                      Có thể bạn quan tâm
                    </h3>

                    <div className="space-y-4">
                      {post.relatedPracticeQuizzes.slice(0, 6).map((rel, idx) => (
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
          </div>
        </Container>

        {/* Bottom Related Section — carousel */}
        {post.relatedPracticeQuizzes?.length > 0 && (
          <Container className="max-w-[1360px] mt-20 relative z-10">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#2D3142]">
                Bài thi tương tự
              </h2>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => splideRef.current?.splide?.go("<")}
                aria-label="Previous"
                className="hidden sm:flex absolute left-0 -translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
              >
                <img src="/assets/figma/icons/Arrow1.svg" alt="" className="w-3 h-3 [filter:brightness(0)_invert(1)]" style={{ transform: "rotate(180deg)" }} />
              </button>

              <Splide
                ref={splideRef as any}
                hasTrack={false}
                options={{
                  type: "slide",
                  perPage: 4,
                  perMove: 1,
                  gap: "24px",
                  pagination: false,
                  arrows: false,
                  breakpoints: {
                    1280: { perPage: 3 },
                    1024: { perPage: 2, gap: "20px" },
                    768: { perPage: 2, gap: "16px" },
                    480: { perPage: 1, gap: "16px" },
                  },
                }}
              >
                <SplideTrack>
                  {post.relatedPracticeQuizzes.slice(0, 8).map((quiz, i) => (
                    <SplideSlide key={quiz.id} className="pb-8 pt-[14px] px-1">
                      <TestCardWithScore
                        quizId={quiz.id}
                        title={quiz.title}
                        image={quiz.featuredImage || undefined}
                        skill={skill}
                        part={normalizeSectionBadge(skill, i + 1).label}
                        isPro={post.quizFields.proUserOnly}
                        href={ROUTES.PRACTICE.SINGLE(quiz.slug)}
                      />
                    </SplideSlide>
                  ))}
                </SplideTrack>
              </Splide>

              <button
                type="button"
                onClick={() => splideRef.current?.splide?.go(">")}
                aria-label="Next"
                className="hidden sm:flex absolute right-0 translate-x-1/2 top-[35%] -translate-y-1/2 z-10 shrink-0 items-center justify-center w-9 h-9 rounded-full bg-[#d94a56] hover:bg-[#ea8d95] shadow-lg transition-colors"
              >
                <img src="/assets/figma/icons/Arrow1.svg" alt="" className="w-3 h-3 [filter:brightness(0)_invert(1)]" />
              </button>
            </div>
          </Container>
        )}
      </div>
    </>
  );
}