import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_BUILD_VERSION: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
  },
  cacheLife: {
    wiki: {
      stale: 0,
      revalidate: 300,
      expire: 3600,
    },
  },
  images: {
    qualities: [70, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    // Anciennes pages générales : la liste est maintenant la vue « Groupes » de l'Explorer.
    return [
      {
        source: "/entreprises",
        destination: "/personnages?vue=groupes&type=ENTREPRISE",
        permanent: false,
      },
      {
        source: "/services-publics",
        destination: "/personnages?vue=groupes&type=SERVICE_PUBLIC",
        permanent: false,
      },
    ];
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
