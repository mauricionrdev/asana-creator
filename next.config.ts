import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercel ? {} : { distDir: ".next-build" }),
  devIndicators: false
};

export default nextConfig;
