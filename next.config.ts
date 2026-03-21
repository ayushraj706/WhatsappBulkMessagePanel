import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Ye 'out' folder banayega jo Capacitor ko chahiye
  images: {
    unoptimized: true, // Static export mein image optimization off karni padti hai
  },
};

export default nextConfig;
