// The waitlist SQL is written in SQLite's dialect and translated per statement
// by @profullstack/libsql-pg. Lint every statement in the app through the same
// rewriter, and check the Postgres URL guard, with no database.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { positional, rewriteSql, unsupportedIdioms } from '@profullstack/libsql-pg';

const ROOT = join(import.meta.dirname, '..', '..');
const ROUTE = readFileSync(join(ROOT, 'src/app/api/waitlist/route.ts'), 'utf8');
const PG_SCHEMA = readFileSync(join(ROOT, 'db/migrations-pg/0001_schema.sql'), 'utf8');

function extractSql(source) {
  const out = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`([^`]*)`/g;
  for (let m = re.exec(source); m; m = re.exec(source)) {
    const text = (m[1] ?? m[2] ?? m[3]).trim();
    if (/^(select|insert|update|delete|replace|create|alter)\b/i.test(text)) out.push(text);
  }
  return out;
}

const statements = extractSql(ROUTE);

test('the waitlist route carries the statement this test expects to lint', () => {
  assert.equal(statements.length, 1);
  assert.match(statements[0], /^INSERT INTO waitlist \(email, source\) VALUES \(\?, \?\) ON CONFLICT\(email\) DO NOTHING$/);
});

test('every statement rewrites to Postgres without an unsupported idiom', () => {
  for (const sql of statements) {
    const { sql: pg, warnings } = rewriteSql(sql);
    assert.deepEqual(warnings, [], `${sql}\n  -> ${warnings.join('; ')}`);
    assert.deepEqual(unsupportedIdioms(pg), []);
    assert.equal((positional(pg).match(/\$\d+/g) ?? []).length, (sql.match(/\?/g) ?? []).length);
  }
});

test('the Postgres schema is idempotent, has the waitlist table and no TODOs', () => {
  assert.match(PG_SCHEMA, /create table if not exists waitlist \(/);
  assert.match(PG_SCHEMA, /created_at timestamptz NOT NULL DEFAULT now\(\)/);
  assert.equal((PG_SCHEMA.match(/create (table|index)\b/gi) ?? []).length, (PG_SCHEMA.match(/if not exists/gi) ?? []).length);
  assert.deepEqual(PG_SCHEMA.split('\n').filter((l) => /^\s*--\s*TODO\b/.test(l)), []);
});

test('databaseUrl refuses anything but postgres://', async () => {
  // src/lib/db.ts is TypeScript; Node strips the types on import.
  const { databaseUrl } = await import(join(ROOT, 'src/lib/db.ts'));
  assert.equal(databaseUrl({ DATABASE_URL: 'postgres://u:p@h/osl' }), 'postgres://u:p@h/osl');
  assert.equal(databaseUrl({ DATABASE_URL: 'postgresql://h/osl' }), 'postgresql://h/osl');
  assert.throws(() => databaseUrl({ DATABASE_URL: 'libsql://x.turso.io' }), /got libsql:\.\.\./);
  assert.throws(() => databaseUrl({ DATABASE_URL: 'file:local.db' }), /must be a postgres:\/\/ URL/);
  assert.throws(() => databaseUrl({ TURSO_DATABASE_URL: 'libsql://x.turso.io' }), /got nothing/);
  assert.throws(() => databaseUrl({}), /libsql-pg copy/);
});
