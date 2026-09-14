import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/v2', destination: '/releases/v2/index.html' },
      { source: '/v2/:path*', destination: '/releases/v2/:path*' },
      { source: '/v1', destination: '/releases/v1/index.html' },
      { source: '/v1/:path*', destination: '/releases/v1/:path*' },
    ];
  },
};

export default nextConfig;
