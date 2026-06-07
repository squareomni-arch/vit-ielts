import React from "react";
import { useRouter } from "next/router";
import { Container } from "@/shared/ui";
import { Footer, Header } from "../base/ui";
import { Navigation } from "../my-profile/ui";
import { HeroBanner } from "@/shared/ui/ds";
import { ROUTES } from "@/shared/routes";
import { ACCOUNT_NAVIGATION } from "../account-nav";

type Banner = { title: string; breadcrumbs: Array<{ label: string; href?: string }> };

const TRANG_CHU = { label: "Trang chủ", href: ROUTES.HOME };

// Title = the page's own name; breadcrumb is 2 levels: Trang chủ / {title}.
const make = (title: string): Banner => ({
  title,
  breadcrumbs: [TRANG_CHU, { label: title }],
});

/** Banner title + breadcrumb per classroom route (keyed by router.pathname). */
const BANNERS: Record<string, Banner> = {
  "/classroom": make("Quản lý Lớp học"),
  "/classroom/[id]": make("Chi tiết lớp"),
  "/classroom/[id]/assignments": make("Bài giao"),
  "/classroom/[id]/assignments/[aid]": make("Kết quả bài giao"),
  "/classroom/[id]/tracking": make("Báo cáo lớp"),
  "/classroom/[id]/tracking/[studentId]": make("Lịch sử làm bài"),
  "/classroom/my-assignments": make("Bài tập của tôi"),
  "/classroom/my-assignments/[id]": make("Chi tiết bài tập"),
};

export const ClassroomLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const banner = BANNERS[router.pathname] ?? {
    title: "Lớp học",
    breadcrumbs: [TRANG_CHU, { label: "Lớp học" }],
  };

  return (
    <>
      <Header />
      <HeroBanner title={banner.title} breadcrumbs={banner.breadcrumbs} />

      <section
        data-section="classroom-content"
        className="bg-[#f8f9fb] lg:mb-13 overflow-x-hidden px-4 sm:px-6"
      >
        <Container>
          <div className="py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
              <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-5">
                <Navigation navigation={ACCOUNT_NAVIGATION} />
              </aside>
              <main className="flex-1 min-w-0 w-full space-y-6">{children}</main>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
};
