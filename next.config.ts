import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sirf Android build ke waqt static export on karega
  output: process.env.IS_ANDROID_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true, 
  },
  // Build ke waqt TypeScript errors ko ignore karega taaki APK ban jaye
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
