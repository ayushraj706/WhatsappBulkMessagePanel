import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sirf Android build (GitHub) par export karega, Vercel par nahi
  output: process.env.IS_ANDROID_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
