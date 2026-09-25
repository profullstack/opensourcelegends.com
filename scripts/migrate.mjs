// Apply db/migrations-pg/0001_schema.sql to the Postgres database.
//   DATABASE_URL=postgres://... node scripts/migrate.mjs
//
// db/schema.sql is the original Turso/libSQL schema, kept until the cutover is
// proven; db/migrations-pg/ holds its Postgres conversion. Every statement is
// IF NOT EXISTS, so this is safe to re-run. The file is already Postgres, so it
// runs on the raw pool rather than through the SQLite rewriter the app uses.
import { createClient } from '@profullstack/libsql-pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
  console.error(
    `DATABASE_URL must be a postgres:// URL (got ${url ? url.split(':')[0] + ':...' : 'nothing'}). ` +
      'TURSO_DATABASE_URL is no longer read; the waitlist lives in Postgres.',
  );
  process.exit(1);
}

const schema = readFileSync(join(__dirname, '..', 'db', 'migrations-pg', '0001_schema.sql'), 'utf8');
const client = createClient({ url });
await client.pool.query(schema);
const count = schema.split(';').filter((s) => s.replace(/--[^\n]*/g, '').trim()).length;
console.log(`Applied ${count} statement(s) from db/migrations-pg/0001_schema.sql to ${new URL(url).host}`);
await client.close();
