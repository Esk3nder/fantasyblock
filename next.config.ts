import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
};

export default nextConfig;
