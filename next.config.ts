import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sirf Android build ke liye static export karega
  output: process.env.IS_ANDROID_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  // API routes ko ignore karne ke liye jab static build ho
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
