import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '192.168.40.51',
        port: '8058',
      },
      {
        protocol: 'http',
        hostname: '192.168.40.51',
        port: '8057',
      },
    ],
  },
};

export default nextConfig;
