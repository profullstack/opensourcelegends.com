/**
 * The canonical URL for a request, or null when it is already canonical.
 *
 * - www. goes to the apex.
 * - /v1 gains a slash: the static v1 release uses relative asset paths.
 * - Any other trailing slash is dropped (Next's default, which next.config turns
 *   off with skipTrailingSlashRedirect because it stripped /v1/ back to /v1 and
 *   looped with the /v1 -> /v1/ redirect).
 *
 * The URL is built from the public host (x-forwarded-host first, then Host)
 * with any port dropped. Cloning request.nextUrl and setting .host keeps the
 * port the standalone server listens on, which is how www.opensourcelegends.com
 * used to redirect to https://opensourcelegends.com:3000/.
 */
export function canonicalRedirect(
  headers: Headers,
  pathname: string,
  search: string,
): { location: string; status: 307 | 308 } | null {
  const raw = headers.get('x-forwarded-host') || headers.get('host') || '';
  const host = (raw.split(',')[0] ?? '').trim().toLowerCase().replace(/:\d+$/, '');
  const apex = host.startsWith('www.') && host.length > 4 ? host.slice(4) : host;

  let path = pathname;
  let status: 307 | 308 = 308;
  if (path === '/v1') {
    path = '/v1/';
    status = 307;
  } else if (path !== '/' && path.endsWith('/') && !path.startsWith('/v1/')) {
    path = path.replace(/\/+$/, '') || '/';
  }

  if (apex === host && path === pathname) return null;
  return { location: `https://${apex}${path}${search}`, status };
}
