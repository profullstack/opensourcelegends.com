import { NextResponse, type NextRequest } from 'next/server';
import { canonicalRedirect } from './lib/redirects';

// www -> apex, /v1 -> /v1/, and trailing-slash stripping, all built from the
// public host so the server's own port never reaches a Location header. Next's
// own trailing-slash redirect is off (skipTrailingSlashRedirect in
// next.config.ts). Next 16 "proxy" convention (formerly middleware.ts).
export function proxy(request: NextRequest) {
  const target = canonicalRedirect(request.headers, request.nextUrl.pathname, request.nextUrl.search);
  if (target) return NextResponse.redirect(target.location, target.status);
  return NextResponse.next();
}

export const config = {
  // Run on every request except Next internals and static assets.
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
