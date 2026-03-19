import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
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
    // ESLint errors will now fail the build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript errors will now fail the build
    ignoreBuildErrors: false,
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
