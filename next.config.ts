import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The image runs the standalone server under Bun (`bun server.js`): it bundles
  // the server and only the dependencies it actually imports.
  output: "standalone",
  // Trace from this directory, never a lockfile further up the disk, so
  // server.js always lands at the top of .next/standalone.
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  // The Postgres client (pg) does a runtime require of its optional native
  // binding; keep it and the adapter out of the server bundle.
  serverExternalPackages: ['@profullstack/libsql-pg', 'pg'],
  async redirects() {
    return [
      { source: '/v1', destination: '/v1/', permanent: false },
      { source: '/v2', destination: '/cards', permanent: false },
      { source: '/v2/', destination: '/cards', permanent: false },
    ];
  },
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
