import React from "react";
import { createCache, extractStyle, StyleProvider } from "@ant-design/cssinjs";
import Document, { Head, Html, Main, NextScript } from "next/document";
import type { DocumentContext } from "next/document";

const MyDocument = () => (
  <Html lang="en">
    <Head>
      {/* Google Tag Manager */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-K667XHRR');`,
        }}
      />
      {/* End Google Tag Manager */}
      {/* Meta Pixel Code */}
      <script
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1030302756631926');
fbq('track', 'PageView');`,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1030302756631926&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
      {/* End Meta Pixel Code */}
      <meta charSet="UTF-8" />
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="facebook-domain-verification" content="djlabdky9dlglh7wa6lusy5ggkmyvt" />
      <meta name="google-site-verification" content="" />
      <meta name="revisit-after" content="1 days" />
      <meta name="RATING" content="GENERAL" />
      <meta name="robots" content="index,follow" />
      <meta name="Googlebot" content="index,follow,archive" />
      <style dangerouslySetInnerHTML={{ __html: "@layer theme, base, antd, components, utilities;" }} />
      {/* Google Fonts — loaded via <link> for reliability (CSS @import can be dropped by PostCSS) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #global-skeleton-loader {
              position: fixed;
              inset: 0;
              z-index: 999999;
              background-color: #ffffff;
              display: flex;
              flex-direction: column;
              padding: 24px;
              gap: 24px;
              font-family: system-ui, -apple-system, sans-serif;
              opacity: 1;
              transition: opacity 0.4s ease-out;
            }
            #global-skeleton-loader.fade-out {
              opacity: 0;
              pointer-events: none;
            }
            .sk-pulse {
              animation: sk-pulse 1.5s infinite ease-in-out;
            }
            @keyframes sk-pulse {
              0% { background-color: #e5e7eb; }
              50% { background-color: #f3f4f6; }
              100% { background-color: #e5e7eb; }
            }
            .sk-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 16px;
            }
            .sk-logo {
              width: 120px;
              height: 32px;
              border-radius: 6px;
            }
            .sk-nav {
              display: flex;
              gap: 16px;
            }
            .sk-nav-item {
              width: 64px;
              height: 16px;
              border-radius: 4px;
            }
            .sk-banner {
              width: 100%;
              height: 200px;
              border-radius: 16px;
            }
            .sk-body {
              display: flex;
              gap: 24px;
              flex: 1;
            }
            .sk-main {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .sk-title {
              width: 75%;
              height: 28px;
              border-radius: 6px;
            }
            .sk-line {
              width: 100%;
              height: 16px;
              border-radius: 4px;
            }
            .sk-line.short {
              width: 80%;
            }
            .sk-sidebar {
              width: 280px;
              height: 300px;
              border-radius: 16px;
            }
            @media (max-width: 768px) {
              .sk-sidebar {
                display: none;
              }
            }
          `,
        }}
      />
    </Head>
    <body>
      {/* Google Tag Manager (noscript) */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-K667XHRR"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      {/* End Google Tag Manager (noscript) */}
      <div id="global-skeleton-loader">
        <div className="sk-header">
          <div className="sk-logo sk-pulse"></div>
          <div className="sk-nav">
            <div className="sk-nav-item sk-pulse"></div>
            <div className="sk-nav-item sk-pulse"></div>
            <div className="sk-nav-item sk-pulse"></div>
          </div>
        </div>
        <div className="sk-banner sk-pulse"></div>
        <div className="sk-body">
          <div className="sk-main">
            <div className="sk-title sk-pulse"></div>
            <div className="sk-line sk-pulse"></div>
            <div className="sk-line sk-pulse"></div>
            <div className="sk-line short sk-pulse"></div>
          </div>
          <div className="sk-sidebar sk-pulse"></div>
        </div>
      </div>
      <Main />
      <NextScript />
    </body>
  </Html>
);

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) =>
      (
        <StyleProvider cache={cache} layer>
          <App {...props} />
        </StyleProvider>
      ),
    });

  const initialProps = await Document.getInitialProps(ctx);
  const style = extractStyle(cache, true);
  return {
    ...initialProps,
    styles: (
      <>
        {initialProps.styles}
        <style dangerouslySetInnerHTML={{ __html: style }} />
      </>
    ),
  };
};

export default MyDocument;
