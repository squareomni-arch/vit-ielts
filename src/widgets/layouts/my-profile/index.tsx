import React from "react";
import { Container } from "@/shared/ui";
import { Footer, Header } from "../base/ui";
import { Navigation } from "./ui";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";

import { HeroBanner } from "@/shared/ui/ds";
import { ACCOUNT_NAVIGATION } from "../account-nav";

export const MyProfileLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  const getBannerConfig = () => {
    const pathname = router.pathname;
    const configs: Record<
      string,
      { title: string; breadcrumbs: Array<{ label: string; href?: string }> }
    > = {
      [ROUTES.ACCOUNT.DASHBOARD]: {
        title: "My Dashboard",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Dashboard" },
        ],
      },
      [ROUTES.ACCOUNT.MY_PROFILE]: {
        title: "My Profile",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Account", href: ROUTES.ACCOUNT.DASHBOARD },
          { label: "My Profile" },
        ],
      },
      [ROUTES.ACCOUNT.ORDER_HISTORY]: {
        title: "Order History",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Account", href: ROUTES.ACCOUNT.DASHBOARD },
          { label: "Order History" },
        ],
      },
      [ROUTES.ACCOUNT.AFFILIATE]: {
        title: "Affiliate",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Account", href: ROUTES.ACCOUNT.DASHBOARD },
          { label: "Affiliate" },
        ],
      },
      [ROUTES.CHECKOUT]: {
        title: "Checkout",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Account", href: ROUTES.ACCOUNT.DASHBOARD },
          { label: "Checkout" },
        ],
      },
      [ROUTES.ORDER_RECEIVED]: {
        title: "Order Received",
        breadcrumbs: [
          { label: "Trang chủ", href: ROUTES.HOME },
          { label: "My Account", href: ROUTES.ACCOUNT.DASHBOARD },
          { label: "Order Received" },
        ],
      },
    };
    return configs[pathname];
  };

  const bannerConfig = getBannerConfig();
  const shouldShowBanner = !!bannerConfig;

  return (
    <>
      <Header />

      {/* === SECTION: Page Banner === */}
      {shouldShowBanner && bannerConfig && (
        <HeroBanner
          title={bannerConfig.title}
          breadcrumbs={bannerConfig.breadcrumbs}
        />
      )}

      {/* === SECTION: Main Content === */}
      <section data-section="dashboard-content" className="bg-[#f8f9fb] lg:mb-13 overflow-x-hidden px-4 sm:px-6">
        <Container>
          <div className="py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
              {/* === Left Sidebar === */}
              <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-5">
                <Navigation navigation={ACCOUNT_NAVIGATION} />
              </aside>

              {/* === Main Panel === */}
              <main className="flex-1 min-w-0 w-full space-y-6">
                {children}
              </main>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
};
