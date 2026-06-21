import { createClient, type Client } from '@libsql/client';

// Turso / libSQL client. Configure via env:
//   TURSO_DATABASE_URL  libsql://opensourcelegendscom-profullstack.aws-us-west-2.turso.io
//   TURSO_AUTH_TOKEN    (Turso database token — keep secret)
let client: Client | null = null;

export function db(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set');
  }

  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return client;
}
