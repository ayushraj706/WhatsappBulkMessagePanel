import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sirf Android build ke liye static export karega
  output: process.env.IS_ANDROID_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // TypeScript errors ko build ke waqt ignore karega
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
