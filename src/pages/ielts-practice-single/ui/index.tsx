// Thêm các import cần thiết cho React Hook Form
import { useForm, FormProvider } from "react-hook-form";
import { AnswerFormValues } from "@/pages/take-the-test/context"; // Tái sử dụng type này nếu có

// Các import cũ của bạn
import { Container } from "@/shared/ui";
import { SEOHeader } from "@/widgets";
import { Breadcrumb, ConfigProvider, Button } from "antd"; // Thêm Button
import Link from "next/link";
import { IPracticeSingle } from "../api";
import Author from "./author";
import QuickAction from "./quick-action";
import Image from "next/image";
import { DotSeparator } from "@/shared/ui/dot-separator";
import { Answer, DownloadPDF, Passage, Question } from "./section";
import LeftInteractionSidebar from "./left-interaction-sidebar";
import RightInteractionSidebar from "./right-interaction-sidebar";
import { useMemo } from "react";
import _ from "lodash";
import { decode } from "html-entities";
import RelatedPosts from "./related-posts";

export function PageIELTSPracticeSingle({ post }: { post: IPracticeSingle }) {
  // Khởi tạo form để các component câu hỏi con có thể kết nối vào
  const methods = useForm<AnswerFormValues>();
  const onSubmit = (data: AnswerFormValues) => {
    console.log("PRACTICE SUBMITTED:", data);
    alert("Bài làm đã được nộp! Xem kết quả trong Console.");
  };

  const breadcrumbs = post.seo?.breadcrumbs || [];
  const breadcrumbItems = breadcrumbs.map((item, index) => ({
    title:
      index === breadcrumbs.length - 1 ? (
        decode(item.text)
      ) : (
        <Link href={item.url}>{decode(item.text)}</Link>
      ),
  }));

  const passages = useMemo(() => {
    let currentIndex = 0;
    const newPassages = JSON.parse(JSON.stringify(post.quizFields.passages)); // Deep clone

    newPassages.forEach((passage: any, passageIndex: number) => {
      passage.questions.forEach((question: any, questionIndex: number) => {
        _.set(
          newPassages,
          `${passageIndex}.questions.${questionIndex}.startIndex`,
          currentIndex
        );

        // Cập nhật logic tính số thứ tự câu hỏi
        if (question.type[0] === "checkbox") {
          currentIndex +=
            question.list_of_options?.reduce(
              (acc: any, option: any) => (option.correct ? acc + 1 : acc),
              0
            ) || 1;
        } else if (question.type[0] === "matching") {
          // Logic mới cho matching question
          currentIndex += question.matchingQuestion?.matchingItems?.length || 1;
        } else {
          // Logic mặc định cho các loại câu hỏi khác
          currentIndex += question.explanations?.length || 1;
        }
      });
    });

    return newPassages;
  }, [post.quizFields.passages]);

  return (
    <>
      <SEOHeader fullHead={post.seo?.fullHead} title={post.seo?.title} />
      <Container className="pb-5 max-w-screen-2xl space-y-16 md:space-y-24">
        {/* Phần tiêu đề, ảnh, tác giả... giữ nguyên */}
        <div className="w-full md:w-7/12 space-y-6 mx-auto">
          <div className="space-y-2">
            <div className="pt-5 pb-3">
              <Breadcrumb items={breadcrumbItems.slice(0, -1)} />
            </div>
            <h1 className="pb-4 text-3xl md:text-5xl font-noto-serif leading-snug">
              {post.title}
            </h1>
            <p
              className="font-noto-serif text-base md:text-lg text-gray-500"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            ></p>
            <Author author={post.author} postDate={post.date} />
            <QuickAction post={post} />
          </div>
          <div className="aspect-[3/2] relative rounded-lg overflow-hidden">
            <Image
              src={
                post.featuredImage?.node.sourceUrl ||
                "https://placehold.co/600x400"
              }
              alt={`${post.title} thumbnail`}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <DotSeparator />
        </div>

        {/* Bọc toàn bộ phần nội dung bài test bằng FormProvider */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="flex flex-wrap justify-center -m-4 md:-m-8">
              <div className="w-full md:w-2/12 p-4 hidden md:block">
                <LeftInteractionSidebar post={post} />
              </div>
              <ConfigProvider theme={{ token: { fontSize: 14 } }}>
                <div className="w-full md:w-6/12 p-4 md:px-8 order-2 md:order-none">
                  {(passages || []).map((passage: any, index: number) => (
                    <div key={index} id={`part-${index + 1}`}>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">
                        Part {index + 1}
                      </h2>
                      <div id={`passage-${index + 1}`} className="py-4  mb-[15px]">
                        <Passage
                          passage={passage}
                          quizSkill={post.quizFields.skill[0]}
                        />
                      </div>
                      <div id={`question-${index + 1}`} className="py-4">
                        <Question passage={passage} />
                      </div>
                      <div id={`answer-${index + 1}`} className="py-4">
                        <Answer passage={passage} />
                      </div>
                      <DotSeparator />
                    </div>
                  ))}
                  <div id={`download-pdf`} className="py-4">
                    <DownloadPDF quiz={post} />
                  </div>
                  <DotSeparator />
                  <div className="text-center mt-8">
                    <Button type="primary" htmlType="submit" size="large">Nộp bài</Button>
                  </div>
                </div>
              </ConfigProvider>
              <div className="w-full md:w-2/12 p-4 order-1 md:order-none">
                <RightInteractionSidebar post={post} />
              </div>
            </div>
          </form>
        </FormProvider>
      </Container>

      {/* Phần Related Posts giữ nguyên */}
      <RelatedPosts
        posts={post.relatedPracticeQuizzes}
        skill={post.quizFields.skill[0]}
        quiz_slug={post.slug}
        isPro={post.quizFields.proUserOnly}
      />
    </>
  );
}