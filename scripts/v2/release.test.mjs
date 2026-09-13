import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
import { hash, loadCards, matchRecords, renderFaces, validateSVG } from './core.mjs';
import { requestJSON, researchCard } from './providers.mjs';
import { loadPortrait } from './portraits.mjs';
import { optionsFrom, publicConfig, buildRelease, validateRelease, activateRelease, updateFacePaths } from '../release-v2.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const VECTOR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect width="1000" height="1000" fill="#10141c"/><circle cx="500" cy="500" r="350" fill="#64efb4"/><path d="M300 700L500 220L700 700Z" fill="#ad9cff"/></svg>';
const CARD = { id: 'legends/002-linus-torvalds', series: 'legends', number: 2, slug: 'linus-torvalds', name: 'Linus Torvalds', title: 'Creator of Linux', knownFor: 'Linux and Git', scouting: 'Created Linux and Git.', projects: ['Linux Kernel', 'Git'], rarity: 'iconic', impact: 99, sources: [{ label: 'Reference', url: 'https://en.wikipedia.org/wiki/Linus_Torvalds' }] };
const RESEARCH = { status: 'not-found', searchedAt: '2026-09-13T00:00:00Z', matches: [], rejectedCount: 0 };
const reply = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
async function temp(t) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'legends-v2-')); t.after(() => fs.rm(dir, { recursive: true, force: true })); return dir; }
function options(out, args = [], env = {}) { return optionsFrom(['--out', out, '--series', 'legends', '--format', 'svg', ...args], { OPENAI_API_KEY: 'test-not-a-real-key', ...env }, ROOT); }
const art = async () => ({ bytes: Buffer.from(VECTOR), format: 'svg', model: 'test-fixture', source: { status: 'pending' } });
const dependencies = { load: async () => [CARD], research: async () => RESEARCH, art };

test('portrait release preserves source PNG bytes, uses no image service, and refreshes when the source changes', async (t) => {
  const root = await temp(t);
  const file = path.join(root, 'assets/portraits/legends/card_002.png');
  await fs.mkdir(path.dirname(file), { recursive: true });
  const original = await sharp(Buffer.from(VECTOR)).png().toBuffer();
  await fs.writeFile(file, original);
  const out = path.join(root, 'release');
  const o = { ...options(out, ['--format', 'png', '--offline']), root };
  const deps = { load: async () => [CARD], fetcher: async () => { throw new Error('Unexpected remote call'); } };
  let result = await buildRelease(o, deps);
  const artwork = path.join(out, CARD.id, 'artwork.png');
  assert.deepEqual(await fs.readFile(artwork), original);
  assert.equal(result.records[0].card.portrait.sha256, hash(original));
  assert.equal(result.records[0].card.portrait.status, 'approved');
  const face = await sharp(path.join(out, CARD.id, 'front.png')).metadata();
  assert.equal(face.width, 1000); assert.equal(face.height, 1490);
  const changed = await sharp(original).flip().png().toBuffer();
  await fs.writeFile(file, changed);
  result = await buildRelease(o, deps);
  assert.deepEqual(await fs.readFile(artwork), changed);
  assert.equal(result.records[0].card.portrait.sha256, hash(changed));
});

test('missing portraits get an explicit pending plate; source credit must match the same person', async (t) => {
  const root = await temp(t);
  const pending = await loadPortrait(CARD, root);
  assert.equal(pending.source.status, 'pending');
  assert.equal((await sharp(pending.bytes).metadata()).format, 'png');
  const c = { ...CARD, series: 'security' };
  const portrait = path.join(root, 'assets/portraits/security-pros/card_002.png');
  await fs.mkdir(path.dirname(portrait), { recursive: true });
  await fs.writeFile(portrait, await sharp(Buffer.from(VECTOR)).png().toBuffer());
  await fs.mkdir(path.join(root, 'data'));
  const file = path.join(root, 'data/security-references.json');
  const ref = { credit: 'Photographer', sourceUrl: 'https://example.com/portrait', license: 'CC BY-SA 4.0' };
  await fs.writeFile(file, JSON.stringify([{ number: 2, slug: 'wrong-person', ref }]));
  await assert.rejects(loadPortrait(c, root), /matching source credit/);
  await fs.writeFile(file, JSON.stringify([{ number: 2, slug: c.slug, ref }]));
  assert.deepEqual((await loadPortrait(c, root)).source.reference, ref);
});

test('CLI defaults and identifiers; rejects typos, unsafe bases and invalid scope', () => {
  const o = options('/tmp/example');
  assert.equal(optionsFrom([], {}).format, 'png'); assert.equal(publicConfig(o).artworkSource, 'approved-portrait');
  assert.ok(!JSON.stringify(publicConfig(o)).includes('test-not-a-real-key'));
  for (const args of [['--concurrency', '0'], ['--concurrency', '65'], ['--concurrency', '1.5'], ['--limit', '0'], ['--format', 'pdf'], ['--seriez', 'legends'], ['--only', 'no'], ['--series', 'all', '--only', '2']]) assert.throws(() => options('/tmp/example', args));
  assert.throws(() => options('/tmp/example', [], { NICHEDB_API_BASE: 'http://example.com/v1' }));
});
test('NicheDB requires person identity plus corroboration, excluding mixed search results', () => {
  const base = { id: 7, title: 'Linus Torvalds', kind: 'person', url: CARD.sources[0].url, summary: 'A profile', tags: [] };
  const matches = matchRecords(CARD, [base, { ...base, id: 8, kind: 'scanner-stream' }, { ...base, id: 9, title: 'Other Person' }, { ...base, id: 10, url: 'https://example.com/impostor' }]);
  assert.deepEqual(matches.map((m) => m.id), [7]);
  const project = matchRecords(CARD, [{ ...base, id: 11, url: 'https://example.com/linus', summary: 'Creator of the Linux Kernel.' }]);
  assert.equal(project[0].matchedBy, 'name-and-project:linux kernel');
});
test('metadata query uses the actual NicheDB API contract and distinguishes absent/unavailable', async () => {
  const o = options('/tmp/example');
  const r = await researchCard(CARD, o, { fetcher: async (url) => { assert.equal(new URL(url).pathname, '/api/v1/search'); assert.equal(new URL(url).searchParams.get('q'), CARD.name); return reply({ items: [] }); } });
  assert.equal(r.status, 'not-found');
  await assert.rejects(researchCard(CARD, o, { fetcher: async () => reply({ html: 'bad schema' }) }), /no items/);
  const soft = await researchCard(CARD, { ...o, allowMissingMetadata: true }, { fetcher: async () => reply({}, 403) });
  assert.equal(soft.status, 'unavailable');
});
test('HTTP retries transient errors but not quota, credentials, moderation or broken JSON', async () => {
  let count = 0;
  const output = await requestJSON('https://api.example.com/v1', {}, { fetcher: async () => ++count === 1 ? reply({}, 429, { 'retry-after': '0' }) : reply({ ok: true }), pause: async () => {} });
  assert.equal(count, 2); assert.equal(output.ok, true);
  for (const [status, code] of [[429, 'insufficient_quota'], [401, 'invalid_api_key'], [400, 'moderation_blocked']]) {
    let attempts = 0;
    await assert.rejects(requestJSON('https://api.example.com/v1', {}, { fetcher: async () => { attempts++; return reply({ error: { code } }, status); }, pause: async () => {} }));
    assert.equal(attempts, 1);
  }
});
test('SVG validation parses XML, rejects active content and raster wrappers, renders actual geometry', async () => {
  assert.match(await validateSVG(VECTOR), /viewBox="0 0 1000 1000"/);
  const insert = (tag) => VECTOR.replace('</svg>', `${tag}</svg>`);
  for (const unsafe of [insert('<image href="data:image/png;base64,AAAA"/>'), insert('<script>alert(1)</script>'), insert('<foreignObject/>'), VECTOR.replace('fill="#ad9cff"', 'fill="url(&#104;ttps://evil.test/x)"'), VECTOR.replace('fill="#ad9cff"', 'onload="x()"'), '<!DOCTYPE svg>' + VECTOR, VECTOR.replace('</svg>', ''), VECTOR.replace('1000 1000', '999999 999999'), insert('<path style="fill:red"/>'), insert('<text>Fake quote</text>')]) await assert.rejects(validateSVG(unsafe));
});
test('concurrent builds preserve roster order and resume only failed cards', async (t) => {
  const out = await temp(t); let active = 0; let peak = 0; let fail = true;
  const roster = Array.from({ length: 6 }, (_, i) => ({ ...CARD, id: `legends/00${i + 1}-person-${i + 1}`, number: i + 1, slug: `person-${i + 1}` }));
  const calls = [];
  const deps = { ...dependencies, load: async () => roster, art: async (c) => {
    calls.push(c.id); active++; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, (7 - c.number) * 5));
    active--;
    if (c.number === 2 && fail) throw new Error('temporary card failure');
    return art();
  } };
  const o = options(out, ['--concurrency', '3']);
  await assert.rejects(buildRelease(o, deps), /incomplete/);
  assert.equal(peak, 3);
  fail = false;
  const release = await buildRelease(o, deps);
  assert.deepEqual(release.records.map((r) => r.card.id), roster.map((c) => c.id));
  assert.equal(calls.length, 7);
  await validateRelease(out);
});
test('dry-run makes no writes or remote calls', async (t) => {
  const dir = await temp(t); const out = path.join(dir, 'does-not-exist');
  const plan = await buildRelease(options(out, ['--dry-run']), { load: dependencies.load, research: () => assert.fail('network called'), art: () => assert.fail('generation called') });
  assert.equal(plan.expectedIds.length, 1); await assert.rejects(fs.stat(out), { code: 'ENOENT' });
});
test('build, validate, resume, asset recovery, missing credentials on resume and complete catalog', async (t) => {
  const out = await temp(t); let generations = 0; let lookups = 0;
  const deps = { ...dependencies, art: async () => { generations++; return art(); }, research: async () => { lookups++; return RESEARCH; } };
  const opts = options(out, ['--png-copies']);
  const result = await buildRelease(opts, deps);
  assert.equal(result.status, 'complete'); assert.equal(result.records[0].card.artworkFormat, 'svg');
  assert.ok(result.records[0].files[`${CARD.id}/front.png`]);
  await buildRelease({ ...opts, apiKey: undefined }, deps);
  assert.equal(generations, 1); assert.equal(lookups, 1);
  await fs.writeFile(path.join(out, CARD.id, 'front.svg'), 'corrupt');
  await assert.rejects(validateRelease(out), /corrupt/);
  await buildRelease(opts, deps); // recover the face from the paid art checkpoint
  assert.equal(generations, 1); await validateRelease(out);
});
test('failed card leaves an incomplete release; successful cards are not rendered again on resume', async (t) => {
  const out = await temp(t); let fail = true; const calls = [];
  const other = { ...CARD, id: 'legends/003-other-person', number: 3, slug: 'other-person', name: 'Other Person' };
  const deps = { ...dependencies, load: async () => [CARD, other], art: async (c) => { calls.push(c.id); if (c.number === 3 && fail) throw new Error('simulated failure'); return art(); } };
  await assert.rejects(buildRelease(options(out), deps), /incomplete/);
  await assert.rejects(validateRelease(out), /incomplete/);
  fail = false; await buildRelease(options(out), deps);
  assert.equal(calls.filter((id) => id === CARD.id).length, 1);
  assert.equal((await validateRelease(out)).records.length, 2);
});
test('PNG mode emits genuine PNG faces with .png paths, not SVG image wrappers', async (t) => {
  const out = await temp(t);
  const png = await sharp(Buffer.from(VECTOR)).png().toBuffer();
  const result = await buildRelease(options(out, ['--format', 'png']), { ...dependencies, art: async () => ({ format: 'png', bytes: png, model: 'test-image' }) });
  const c = result.records[0].card; assert.match(c.front, /\.png$/);
  const meta = await sharp(await fs.readFile(path.join(out, CARD.id, 'front.png'))).metadata(); assert.equal(meta.format, 'png'); assert.equal(meta.height, 1490);
});
test('every real roster card fits v2 text layout; generated card text is XML escaped', async () => {
  const cards = await loadCards(ROOT);
  assert.ok(cards.length > 250);
  for (const c of cards) renderFaces({ ...c, research: RESEARCH }, Buffer.from(VECTOR), 'svg');
  const faces = renderFaces({ ...CARD, name: 'A < B & C', research: RESEARCH }, Buffer.from(VECTOR), 'svg');
  assert.match(faces.front, /A &lt; B &amp; C/);
  assert.ok(!faces.front.includes('<image'));
});
test('activation edits exact AST properties, preserving copy, helper code and names with quotes', () => {
  const source = `export const cards: Card[] = [{ number: 2, slug: 'linus-torvalds', name: 'Linus', scouting: 'front: should not change', front: '/old.png', back: '/back.png' }];\nexport const selected = cards.filter(c => c.front);`;
  const rec = { card: { ...CARD, front: '/releases/v2/a.svg', back: '/releases/v2/b.svg' } };
  const updated = updateFacePaths(source, 'cards', [rec]);
  assert.ok(updated.includes("scouting: 'front: should not change'")); assert.ok(updated.includes('cards.filter(c => c.front)')); assert.ok(updated.includes('"/releases/v2/a.svg"'));
  for (const suffix of ['', ',']) {
    const missing = `export const cards = [{ number: 2, slug: 'linus-torvalds'${suffix} }];`;
    const edited = updateFacePaths(missing, 'cards', [rec]);
    const ast = ts.createSourceFile('test.ts', edited, ts.ScriptTarget.Latest, true);
    assert.equal(ast.parseDiagnostics.length, 0, edited);
  }
});
test('activation checks completeness and proof scope, copies public artifacts only, and is repeatable', async (t) => {
  const root = await temp(t); const out = path.join(root, 'dist/proof');
  const o = { ...options(out, ['--limit', '1']), root };
  const sourceDir = path.join(root, 'src/data'); await fs.mkdir(sourceDir, { recursive: true });
  await fs.writeFile(path.join(sourceDir, 'cards.ts'), `export const cards = [{ number: 2, slug: 'linus-torvalds', front: '/old.png', back: '/old-back.png' }];`);
  const deps = { ...dependencies, load: async () => [CARD, { ...CARD, id: 'legends/003-next', number: 3, slug: 'next' }] };
  await buildRelease(o, deps);
  await assert.rejects(activateRelease(o), /proof subset/);
  await activateRelease({ ...o, allowPartial: true });
  await activateRelease({ ...o, allowPartial: true });
  const published = path.join(root, 'public/releases/v2');
  await validateRelease(published);
  await assert.rejects(fs.stat(path.join(published, CARD.id, 'checkpoint.json')), { code: 'ENOENT' });
  const src = await fs.readFile(path.join(sourceDir, 'cards.ts'), 'utf8'); assert.match(src, /front\.svg/);
  assert.ok(!src.includes('/old.png'));
});
