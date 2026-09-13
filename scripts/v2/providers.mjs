import { matchRecords, safeURL } from './core.mjs';

export async function requestJSON(url, init = {}, { fetcher = fetch, retries = 3, timeout = 240_000, pause = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  for (let attempt = 0; ; attempt++) {
    let response;
    try {
      response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeout) });
    } catch (error) {
      if (attempt >= retries) throw new Error(`Request failed (${new URL(url).hostname}): ${error.name}`);
      await pause(Math.min(1000 * 2 ** attempt, 30_000));
      continue;
    }
    const body = await response.json().catch(() => null);
    if (response.ok && body && !body.error) return body;
    const code = body?.error?.code;
    // Never use fallback to evade moderation, exhausted billing, auth or bad requests.
    const terminal = ['insufficient_quota', 'billing_hard_limit_reached', 'moderation_blocked'].includes(code);
    if (!terminal && [408, 429, 500, 502, 503, 504].includes(response.status) && attempt < retries) {
      const header = response.headers.get('retry-after');
      const seconds = Number(header);
      const delay = header && Number.isFinite(seconds) ? seconds * 1000 : 1000 * 2 ** attempt;
      await pause(Math.min(30_000, Math.max(1000, delay)));
      continue;
    }
    const err = new Error(`HTTP ${response.status} from ${new URL(url).hostname}${code ? ` (${code})` : ''}; request ${response.headers.get('x-request-id') ?? 'unknown'}`);
    err.status = response.status;
    throw err;
  }
}

export async function researchCard(card, options, deps = {}) {
  if (options.offline) return { status: 'offline', searchedAt: null, matches: [], rejectedCount: 0 };
  const url = new URL(`${options.nicheBase}/search`);
  url.searchParams.set('q', card.name); url.searchParams.set('limit', '30');
  const headers = { Accept: 'application/json' };
  if (options.nicheKey) headers.Authorization = `Bearer ${options.nicheKey}`;
  try {
    const response = await requestJSON(url.href, { headers }, { ...deps, timeout: 30_000 });
    if (!Array.isArray(response.items)) throw new Error('NicheDB response has no items array');
    const matches = matchRecords(card, response.items);
    return { status: matches.length ? 'matched' : response.items.length ? 'unconfirmed' : 'not-found', searchedAt: new Date().toISOString(), queryURL: url.href, matches, rejectedCount: response.items.length - matches.length };
  } catch (error) {
    if (!options.allowMissingMetadata) throw error;
    return { status: 'unavailable', searchedAt: new Date().toISOString(), queryURL: url.href, matches: [], rejectedCount: 0, error: error.message };
  }
}

export function enrichCard(card, research) {
  const sources = [...card.sources];
  for (const match of research.matches) if (!sources.some((s) => s.url === match.url) && safeURL(match.url)) sources.push({ label: `${match.title} — via NicheDB`, url: match.url });
  return { ...card, sources, research };
}
