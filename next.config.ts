import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // FIX-3: touched to trigger dev server reload after .next cache clear.
};

export default nextConfig;
