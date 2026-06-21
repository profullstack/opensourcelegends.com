// Apply db/schema.sql to the Turso database.
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate.mjs
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error('TURSO_DATABASE_URL is not set');
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const sql of statements) {
  await client.execute(sql);
  console.log('✓', sql.split('\n')[0].slice(0, 60));
}

console.log(`\nApplied ${statements.length} statement(s) to ${url}`);
client.close();
