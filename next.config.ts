import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://chess-elo-api-kalel1130.pythonanywhere.com//api/:path*', // Proxy to Django backend
      },
    ];
  },
};

export default nextConfig;
