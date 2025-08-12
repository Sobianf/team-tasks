import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 eslint: {
    // Warning: do not use this in real prod; fix lint errors instead.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: do not use this in real prod; fix type errors instead.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
