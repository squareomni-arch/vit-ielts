import { useMemo } from "react";
import { ExamCollection } from "@/pages/ielts-exam-library/ui/exam-collection";
import { Container } from "@/shared/ui";
import { ScrollFadeIn } from "@/shared/lib/use-scroll-fade-in";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import type { ExamCollectionResponse } from "~services/types/database";

type MockCollectionSectionProps = {
  collections: ExamCollectionResponse["data"];
};

const HOME_SLIDER_OPTIONS = {
  perPage: 4,
  breakpoints: {
    1280: { perPage: 3 },
    1024: { perPage: 2, gap: "20px" },
    768: { perPage: 2, gap: "16px" },
    480: { perPage: 1, gap: "16px" },
  },
};

/**
 * Homepage section hiển thị Mock Test Collections bên dưới "IELTS Online Test".
 * Tái sử dụng ExamCollection + ExamItem từ ielts-exam-library để đảm bảo
 * behavior (modal, login gate, PRO badge, score) đồng nhất.
 *
 * Mỗi row tự hiển thị tên bộ đề (data.title) — không có heading section cố định.
 * Reading + Listening được merge theo collection ID.
 */
export const MockCollectionSection = ({ collections }: MockCollectionSectionProps) => {
  // Merge reading + listening theo collection ID (giống Exam Library page)
  const mergedCollections = useMemo(() => {
    const map = new Map<string, any>();

    (collections.reading || []).forEach((col) => {
      map.set(col.id, {
        ...col,
        exams: col.exams.map((e) => ({ ...e, skill: "reading" })),
      });
    });

    (collections.listening || []).forEach((col) => {
      const mappedExams = col.exams.map((e) => ({ ...e, skill: "listening" }));
      if (map.has(col.id)) {
        map.get(col.id).exams.push(...mappedExams);
      } else {
        map.set(col.id, { ...col, exams: mappedExams });
      }
    });

    return Array.from(map.values());
  }, [collections]);

  if (mergedCollections.length === 0) return null;

  return (
    <div data-section="mock-collections" className="w-full">
      <Container>
        {/* === SECTION: Mock Collections List === */}
        {/* Mỗi ExamCollection tự render tên bộ đề (data.title) */}
        <div className="space-y-12">
          {mergedCollections.map((col) => (
            <ExamCollection
              key={col.id}
              data={col}
              optionsOverride={HOME_SLIDER_OPTIONS}
              titleClassName="text-[32px] sm:text-[38px] font-extrabold font-noto-sans text-ink-700 leading-tight"
            />
          ))}
        </div>

        {/* Link xem thêm */}
        <div className="mt-10 flex justify-start">
          <Link
            href={ROUTES.EXAM.ARCHIVE}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#f6f7f4] border-[1.5px] border-[rgba(25,29,36,0.1)] text-[#191d24] font-inter font-bold text-[14px] leading-[1.2] px-[26px] py-[13px] rounded-full transition-colors duration-200 whitespace-nowrap"
          >
            View all mock tests
          </Link>
        </div>
      </Container>
    </div>
  );
};
