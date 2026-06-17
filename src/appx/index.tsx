import type { AppProps } from "next/app";
import { BaseLayout, BlankLayout } from "@/widgets/layouts";
import { ProgressProvider } from "@bprogress/next/pages";
import { ConfigProvider } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { NextComponentType } from "next";
import { AppProvider, AuthProvider } from "./providers";
import { Bounce, ToastContainer } from "react-toastify";
import { StyleProvider } from "@ant-design/cssinjs";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { BProgress } from "@bprogress/core";

// Intercept global fetch in the browser to automatically add ngrok-skip-browser-warning header
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const newInit = init ? { ...init } : {};
    let headers: any = newInit.headers || {};

    if (headers instanceof Headers) {
      if (!headers.has("ngrok-skip-browser-warning")) {
        headers.set("ngrok-skip-browser-warning", "true");
      }
    } else if (Array.isArray(headers)) {
      const hasHeader = headers.some(([key]) => key.toLowerCase() === "ngrok-skip-browser-warning");
      if (!hasHeader) {
        headers.push(["ngrok-skip-browser-warning", "true"]);
      }
    } else {
      headers["ngrok-skip-browser-warning"] = "true";
    }

    newInit.headers = headers;
    return originalFetch(input, newInit);
  };
}


dayjs.locale("vi");
import dynamic from "next/dynamic";

const AffiliateTracker = dynamic(
  () => import("@/widgets/affiliate-tracker").then((mod) => mod.default),
  { ssr: false }
);

import { unstableSetRender } from "antd";
import { createRoot } from "react-dom/client";
import { ProContentModal } from "@/shared/ui/pro-content";
import { VocabCapturePopover } from "@/shared/ui/vocab-capture";
import { AppErrorBoundary } from "@/shared/ui/error-boundary";
import { MaintenancePage } from "./maintenance";

const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

export default function App({
  Component,
  pageProps,
}: AppProps & {
  Component: NextComponentType & { Layout?: NextComponentType };
}) {
  if (isMaintenanceMode) {
    return (
      <ProgressProvider
        color="oklch(60.987% 0.17833 19.421)"
        options={{ showSpinner: false }}
        shallowRouting
      >
        <StyleProvider layer>
          <ConfigProvider
            card={{ className: "shadow-primary border-none" }}
            theme={{
              token: {
                colorPrimary: "#d94a56",
                fontFamily: "inherit, sans-serif",
                colorLink: "#d94a56",
              },
              components: {
                Input: {
                  fontSizeLG: 14,
                },
              },
            }}
          >
            <BlankLayout>
              <MaintenancePage />
            </BlankLayout>
          </ConfigProvider>
        </StyleProvider>
      </ProgressProvider>
    );
  }

  const Layout = pageProps.masterData
    ? Component.Layout || BaseLayout
    : BlankLayout;

  const router = useRouter();

  useEffect(() => {
    const loader = document.getElementById("global-skeleton-loader");
    if (!loader) return;

    let removeTimer: ReturnType<typeof setTimeout> | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    // Gỡ skeleton bám theo trạng thái THẬT (CSS/layout/fonts đã sẵn sàng), không
    // dùng timer cứng. Timer cứng 600ms trước đây gỡ skeleton ngay cả khi
    // hydrate/CSS chưa apply kịp → lâu lâu lộ ra layout "trần" (mất AppShell).
    const dismiss = () => {
      if (!loader.isConnected || loader.classList.contains("fade-out")) return;
      // Đợi 1 frame để chắc chắn style đã được áp dụng trước khi fade.
      requestAnimationFrame(() => {
        loader.classList.add("fade-out");
        removeTimer = setTimeout(() => loader.remove(), 400);
      });
    };

    const onReady = () => {
      // Đợi cả fonts (nếu trình duyệt hỗ trợ) để tránh nhảy layout do FOIT/FOUT.
      const fontsReady =
        (document as Document & { fonts?: FontFaceSet }).fonts?.ready ??
        Promise.resolve();
      fontsReady.then(dismiss).catch(dismiss);
    };

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }

    // Lưới an toàn: dù có sự cố gì cũng không để skeleton kẹt vĩnh viễn.
    safetyTimer = setTimeout(dismiss, 4000);

    return () => {
      window.removeEventListener("load", onReady);
      if (removeTimer) clearTimeout(removeTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    const start = () => BProgress.start();
    const stop = () => BProgress.done();

    // Turbopack dev mode sometimes leaves Next's anti-FOUC style
    // (`<style data-next-hide-fouc>body{display:none}</style>`) attached after
    // hydration/navigation. While the body stays hidden, width-measuring
    // components (antd Table, recharts) mount at 0px and render collapsed —
    // which is why tables look squeezed until you interact with them and a
    // reflow finally fires. Removing the stale style and forcing a resize makes
    // them measure correctly. No-op in production (the style is never present).
    const unstickFouc = () => {
      document
        .querySelectorAll("style[data-next-hide-fouc]")
        .forEach((el) => el.remove());
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    const onComplete = () => {
      stop();
      unstickFouc();
    };

    unstickFouc();

    // Listen to route change events
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", onComplete);
    router.events.on("routeChangeError", stop);

    // Clean up event listeners
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", onComplete);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  useEffect(() => {
    unstableSetRender((node, container) => {
      const root = createRoot(container);
      root.render(node);
      return async () => {
        root.unmount();
      };
    });
  }, []);

  // Move the `frontend-site` class onto <html> so that Ant Design portals
  // (Modal, Drawer, Dropdown…) rendered in document.body still inherit all
  // scoped Tailwind styles. A wrapper <div> can't cover portals that escape
  // the React tree, but the root <html> element covers the entire document.
  useEffect(() => {
    const isAdmin = router.pathname.startsWith("/admin");
    if (isAdmin) {
      document.documentElement.classList.remove("frontend-site");
    } else {
      document.documentElement.classList.add("frontend-site");
    }
  }, [router.pathname]);

  const ChildrenComponent = useMemo(
    () => (
      <StyleProvider layer>
        <ConfigProvider
          card={{ className: "shadow-primary border-none" }}
          theme={{
            token: {
              colorPrimary: "#d94a56",
              fontFamily: "inherit, sans-serif",
              // fontSizeLG: 14,
              colorLink: "#d94a56",
            },
            components: {
              Input: {
                fontSizeLG: 14,
              },
            },
          }}
          select={{
            className: "min-w-32",
          }}
        >
          <Layout>
            <Head>
              <title>
                {pageProps.masterData?.allSettings.generalSettingsTitle === "Vit IELTS" || pageProps.masterData?.allSettings.generalSettingsTitle === "Vịt IELTS" || !pageProps.masterData?.allSettings.generalSettingsTitle
                  ? "Vịt IELTS - Thực chiến mọi đề - Bứt tốc band 8.0"
                  : pageProps.masterData.allSettings.generalSettingsTitle}
              </title>
              <meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, width=device-width" />
              <meta name="keywords" content="ielts, vit ielts, thuc chien ielts, ielt smock test, chuan bi thi ielts, band 8.0, khoa hoc ielts, ielts online, hoc ielts, luyen thi ielts, ielts listening, ielts reading" />
              <meta name="author" content="Vịt IELTS" />
              <meta name="description" content="Thực chiến mọi đề - Bứt tốc band 8.0" />
              <meta name="generator" content="Vịt IELTS" />

              {/* meta facebook */}
              <meta property="article:author" content="https://www.facebook.com/vitielts/" />
              <meta property="og:site_name" content="Vịt IELTS" />
              <meta property="og:type" content="article" />
              <meta property="og:title" content="Thực chiến mọi đề - Bứt tốc band 8.0" />
              <meta property="og:url" content="" />
              <meta property="og:description" content="Thực chiến mọi đề - Bứt tốc band 8.0" />
              <meta property="og:image" content="" />
              <meta property="fb:app_id" content="ID APP" />

              {/* meta google */}
              <meta itemProp="name" content="Thực chiến mọi đề - Bứt tốc band 8.0" />
              <meta itemProp="description" content="Thực chiến mọi đề - Bứt tốc band 8.0" />
              <meta itemProp="image" content="..." />

              <link rel="icon" href="/favicon.ico" />
              <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="/apple-touch-icon.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="/favicon-32x32.png"
              />
              <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href="/favicon-16x16.png"
              />
              <link rel="manifest" href="/site.webmanifest" />
            </Head>
            <AffiliateTracker />
            <Component {...pageProps} />
            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick={false}
              rtl={false}
              pauseOnFocusLoss
              draggable={false}
              pauseOnHover={false}
              theme="light"
              transition={Bounce}
            />
            <ProContentModal />
            <VocabCapturePopover />
          </Layout>
        </ConfigProvider>
      </StyleProvider>
    ),
    [Component, Layout, pageProps]
  );

  return (
    <AppErrorBoundary>
      <ProgressProvider
        color="oklch(60.987% 0.17833 19.421)"
        options={{ showSpinner: false }}
        shallowRouting
      >
        {pageProps.masterData ? (
          <AppProvider masterData={pageProps.masterData}>
            <AuthProvider>{ChildrenComponent}</AuthProvider>
          </AppProvider>
        ) : (
          <>{ChildrenComponent}</>
        )}
      </ProgressProvider>
    </AppErrorBoundary>
  );
}
