import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "ngrok-skip-browser-warning",
            value: "true",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: 'localhost',
      },
      {
        hostname: 'cms.vitielts.com',
      },
      {
        hostname: 'cms.vitielts.com',
      },
      {
        hostname: 'vitielts.com',
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
      // Supabase Storage (self-hosted VPS)
      {
        hostname: 'api.squarevps.com',
      },
      // Media CDN fronting the storage origin (NEXT_PUBLIC_MEDIA_CDN_URL)
      {
        protocol: 'https',
        hostname: 'cdn.vitielts.com',
      },
      // Supabase cloud (supabase.co projects)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
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
