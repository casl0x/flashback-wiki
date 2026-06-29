import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  cacheLife: {
    wiki: {
      stale: 0,
      revalidate: 300,
      expire: 3600,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/__clerk/:path*",
        destination: "https://clerk.flashback-wiki.vercel.app/__clerk/:path*",
      },
    ];
  },
};

export default nextConfig;
