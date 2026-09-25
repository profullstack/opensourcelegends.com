import { createClient, type Client } from '@profullstack/libsql-pg';

// Postgres client behind the @libsql/client surface. The waitlist query was
// written for Turso/libSQL and still reads as SQLite; @profullstack/libsql-pg
// keeps that surface, speaks Postgres underneath and rewrites SQLite idioms per
// statement. Configure via env:
//   DATABASE_URL  postgres://user:pass@host:5432/opensourcelegends
let client: Client | null = null;

/**
 * The configured DATABASE_URL, or a thrown error that says what is wrong.
 * There is deliberately no Turso or file fallback: a misconfigured deploy fails
 * on its first request with the fix in the message instead of silently writing
 * signups somewhere else.
 */
export function databaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    const got = url ? `${url.split(':')[0]}:...` : 'nothing';
    throw new Error(
      `DATABASE_URL must be a postgres:// URL (got ${got}). The waitlist lives in Postgres only; ` +
        'to move the Turso database across run `pnpm db:migrate` against it, then ' +
        'npx libsql-pg copy --from "$TURSO_DATABASE_URL" --token "$TURSO_AUTH_TOKEN" --to "$DATABASE_URL" --verify',
    );
  }
  return url;
}

export function db(): Client {
  if (client) return client;
  client = createClient({ url: databaseUrl(), applicationName: 'opensourcelegends-web' });
  return client;
}
