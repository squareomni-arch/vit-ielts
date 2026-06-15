import React from "react";
import { useRouter } from "next/router";
import { Container } from "@/shared/ui";
import { Header } from "../base/ui";
import { Footer } from "@/shared/ui/ds/organisms/footer";
import { FOOTER_COLUMNS } from "../footer-columns";
import { Navigation } from "../my-profile/ui";
import { HeroBanner } from "@/shared/ui/ds";
import { ROUTES } from "@/shared/routes";
import { ACCOUNT_NAVIGATION } from "../account-nav";

type Banner = { title: string; breadcrumbs: Array<{ label: string; href?: string }> };

const TRANG_CHU = { label: "Home", href: ROUTES.HOME };

// Title = the page's own name; breadcrumb is 2 levels: Home / {title}.
const make = (title: string): Banner => ({
  title,
  breadcrumbs: [TRANG_CHU, { label: title }],
});

/** Banner title + breadcrumb per classroom route (keyed by router.pathname). */
const BANNERS: Record<string, Banner> = {
  "/classroom": make("Classroom Management"),
  "/classroom/[id]": make("Class Details"),
  "/classroom/[id]/assignments": make("Assignments"),
  "/classroom/[id]/assignments/[aid]": make("Assignment Results"),
  "/classroom/[id]/tracking": make("Class Report"),
  "/classroom/[id]/tracking/[studentId]": make("Practice History"),
  "/classroom/my-assignments": make("My Assignments"),
  "/classroom/my-assignments/[id]": make("Assignment Details"),
};

export const ClassroomLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const banner = BANNERS[router.pathname] ?? {
    title: "Classroom",
    breadcrumbs: [TRANG_CHU, { label: "Classroom" }],
  };

  return (
    <>
      <Header />
      <HeroBanner title={banner.title} breadcrumbs={banner.breadcrumbs} />

      <section
        data-section="classroom-content"
        className="bg-[#f8f9fb] lg:mb-13 overflow-x-hidden"
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

      <Footer columns={FOOTER_COLUMNS} showCopyright />
    </>
  );
};
