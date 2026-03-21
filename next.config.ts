import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static files export karne ke liye zaroori hai
  images: {
    unoptimized: true, // Static export mein image optimization off rakhni padti hai
  },
  /* Baaki options yahan dalo agar hain toh */
};

export default nextConfig;
