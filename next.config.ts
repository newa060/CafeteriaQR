import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is run separately in CI — don't block the production build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
