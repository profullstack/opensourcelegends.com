import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The image runs the standalone server under Bun (`bun server.js`): it bundles
  // the server and only the dependencies it actually imports. public/ is copied
  // in by the Dockerfile, which is what src/lib/og.tsx reads at request time.
  output: "standalone",
  // Trace from this directory, never a lockfile further up the disk, so
  // server.js always lands at the top of .next/standalone.
  outputFileTracingRoot: new URL(".", import.meta.url).pathname,
  // og.tsx joins process.cwd() + "public", so the tracer copies all of public/
  // (2.5 GB of card art) into .next/standalone. The Dockerfile copies public/
  // next to server.js itself; tracing it too would ship it twice.
  outputFileTracingExcludes: { "*": ["public/**"] },
  // sharp 0.35 loads libvips-cpp.so through the native addon's rpath, which the
  // tracer cannot follow: without this the standalone image ships sharp's .node
  // file but not the shared library, and every OG image 500s with
  // ERR_DLOPEN_FAILED (libvips-cpp.so.8.x: cannot open shared object file).
  outputFileTracingIncludes: { "*": ["node_modules/@img/sharp-libvips-linux*/lib/**"] },
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
