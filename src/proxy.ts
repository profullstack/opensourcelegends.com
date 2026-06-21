import { NextResponse, type NextRequest } from 'next/server';

// Redirect www.opensourcelegends.com -> opensourcelegends.com (apex), preserving
// path + query. Next 16 "proxy" convention (formerly middleware.ts).
export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4); // drop the leading "www."
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Run on every request except Next internals and static assets.
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
