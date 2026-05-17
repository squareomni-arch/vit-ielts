import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  // Recharts 3.x ships @reduxjs/toolkit + react-redux as runtime deps with an
  // ESM-only export (redux-toolkit.modern.mjs). Next.js' file-tracing on the
  // Vercel serverless build was silently dropping that bundle, so SSR for
  // /admin (which renders Recharts charts) crashed with "Cannot find module
  // '@reduxjs/toolkit/dist/redux-toolkit.modern.mjs'" and cascaded a 500 to
  // /admin/login (which 302s to /admin for already-signed-in admins).
  // Listing the packages here tells Next to leave them as runtime `require`s
  // and include their full node_modules tree in the function bundle.
  // Recharts itself is left to Next's normal bundling — it conflicts with
  // transpilePackages (Next refuses to have a package in both lists) and we
  // don't need it external. Only the redux runtime deps need this escape
  // hatch since they're the ones the tracer drops.
  serverExternalPackages: ["@reduxjs/toolkit", "react-redux"],
  outputFileTracingIncludes: {
    "/admin": [
      "./node_modules/@reduxjs/toolkit/**/*",
      "./node_modules/react-redux/**/*",
      "./node_modules/recharts/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: 'cms.ieltspredictiontest.com',
      },
      {
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: '**.ibb.co',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // Thêm alias cho ~server
    config.resolve.alias = {
      ...config.resolve.alias,
      "~server": require("path").resolve(__dirname, "lib/server"),
    };
    
    // Đảm bảo các file trong lib/server chỉ được bundle ở server-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      
      // Exclude lib/server khỏi client bundle
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^~server/,
        })
      );
    }
    return config;
  },
  eslint: {
    // Bỏ qua lỗi ESLint khi build (quá nhiều lỗi legacy)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi TypeScript khi build (quá nhiều lỗi legacy)
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "@ant-design",
    "@rc-component",
    "antd",
    "rc-cascader",
    "rc-checkbox",
    "rc-collapse",
    "rc-dialog",
    "rc-drawer",
    "rc-dropdown",
    "rc-field-form",
    "rc-image",
    "rc-input",
    "rc-input-number",
    "rc-mentions",
    "rc-menu",
    "rc-motion",
    "rc-notification",
    "rc-pagination",
    "rc-picker",
    "rc-progress",
    "rc-rate",
    "rc-resize-observer",
    "rc-segmented",
    "rc-select",
    "rc-slider",
    "rc-steps",
    "rc-switch",
    "rc-table",
    "rc-tabs",
    "rc-textarea",
    "rc-tooltip",
    "rc-tree",
    "rc-tree-select",
    "rc-upload",
    "rc-util",
  ],
};

export default nextConfig;
