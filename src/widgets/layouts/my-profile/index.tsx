import React from "react";
import { Container } from "@/shared/ui";
import { Footer, Header } from "../base/ui";
import { Navigation } from "./ui";
import { ROUTES } from "@/shared/routes";
import { useRouter } from "next/router";
import { ComparePlans } from "@/widgets";
import Link from "next/link";

export const MyProfileLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();

  const ACCOUNT_NAVIGATION = [
    {
      label: "Tài Khoản Của Tôi",
      icon: "person",
      link: ROUTES.ACCOUNT.MY_PROFILE,
    },
    {
      label: "Bảng điều khiển",
      icon: "home",
      link: ROUTES.ACCOUNT.DASHBOARD,
    },
    {
      label: "Lịch sử đơn hàng",
      icon: "shopping_cart",
      link: ROUTES.ACCOUNT.ORDER_HISTORY,
    },
    {
      label: "Cộng tác viên",
      icon: "link",
      link: ROUTES.ACCOUNT.AFFILIATE,
    },
    {
      label: "Thanh toán",
      icon: "payment",
      link: ROUTES.CHECKOUT,
    },
    {
      type: "divider",
    },
    {
      label: "Đăng xuất",
      icon: "logout",
      link: "#",
      danger: true,
    },
  ];

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
        <section
          data-section="dashboard-banner"
          className="w-full py-10 lg:py-12 relative overflow-hidden"
          style={{
            background: "#F4F6FA",
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        >
          {/* Red accent line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-500" />

          <Container>
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D3142] mb-3">
                {bannerConfig.title}
              </h1>
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  {bannerConfig.breadcrumbs.map((crumb, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-gray-400">/</span>}
                      {crumb.href ? (
                        <li>
                          <Link
                            href={crumb.href}
                            className="hover:text-primary-500 transition-colors"
                          >
                            {crumb.label}
                          </Link>
                        </li>
                      ) : (
                        <li className="text-gray-700 font-medium">
                          {crumb.label}
                        </li>
                      )}
                    </React.Fragment>
                  ))}
                </ol>
              </nav>
            </div>
          </Container>
        </section>
      )}

      {/* === SECTION: Main Content === */}
      <section data-section="dashboard-content" className="bg-[#f8f9fb] min-h-screen">
        <Container>
          <div className="py-8 lg:py-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              {/* === Left Sidebar === */}
              <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-5">
                <Navigation navigation={ACCOUNT_NAVIGATION} />
                <ComparePlans />
              </aside>

              {/* === Main Panel === */}
              <main className="flex-1 min-w-0 space-y-6">
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
