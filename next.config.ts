import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // The store is transactional and session-heavy; dynamic rendering plus targeted
  // data caching is safer than partial-prerender validation for every route.
  cacheComponents: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Vercel Blob public assets (admin uploads in production).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "motion"],
    serverActions: {
      bodySizeLimit: "8mb",
    },
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
