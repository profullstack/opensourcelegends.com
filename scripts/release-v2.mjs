#!/usr/bin/env node
// Node >=22.18: imports the site's TypeScript rosters using native type stripping.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import ts from 'typescript';
import { SERIES, PIPELINE_VERSION, atomicWrite, hash, json, loadCards, renderFaces, validateSVG, escapeXML, safeURL } from './v2/core.mjs';
import { researchCard, enrichCard } from './v2/providers.mjs';
import { loadPortrait, loadPortraitEdits } from './v2/portraits.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `Open Source Legends v2 — approved portrait artwork and sourced NicheDB metadata

node scripts/release-v2.mjs [build|validate|activate] [options]

  --dry-run                  Print the exact roster/config; no writes or API calls
  --concurrency N            Cards to build at once (1–64; default 1)
  --series all|legends|hacking|security|gods|women|ceos (comma-separated)
  --only 1,2                 Card numbers, with exactly one series
  --limit N                  Build a proof subset (requires --allow-partial to activate)
  --format svg|png           Card face format; default png. Portrait pixels are preserved.
  --png-copies               Also export raster copies of SVG card faces
  --portrait-edits PATH      Complete, reviewed edits tied to the original portraits
  --offline                  Skip NicheDB; render entirely from local portrait files
  --allow-missing-metadata   Record NicheDB failures instead of failing the card
  --force                    Re-render from the approved portrait files
  --out PATH                 Default dist/releases/v2
  --allow-partial            Permit activation of a completed proof subset
  --help

Environment: NICHEDB_API_BASE=https://nichedb.dev/api/v1; NICHEDB_API_KEY (optional).

Build is resumable and staged. Activate updates local site assets and face paths;
it does not create a git tag, GitHub release, merge, or deploy the site.
`;

export function optionsFrom(argv, env = process.env, root = ROOT) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    series: { type: 'string', default: 'all' }, only: { type: 'string' }, limit: { type: 'string' }, format: { type: 'string', default: 'png' }, out: { type: 'string' },
    'dry-run': { type: 'boolean' }, concurrency: { type: 'string', default: '1' }, 'png-copies': { type: 'boolean' }, offline: { type: 'boolean' },
    'allow-missing-metadata': { type: 'boolean' }, 'portrait-edits': { type: 'string' }, force: { type: 'boolean' }, 'allow-partial': { type: 'boolean' }, help: { type: 'boolean' },
  } });
  const command = positionals[0] ?? 'build';
  if (positionals.length > 1 || !['build', 'validate', 'activate'].includes(command)) throw new Error('Expected build, validate, or activate');
  const series = values.series === 'all' ? Object.keys(SERIES) : [...new Set(values.series.split(','))];
  if (!series.length || series.some((s) => !SERIES[s])) throw new Error('Invalid --series');
  const only = values.only === undefined ? [] : values.only.split(',').map(Number);
  if (values.only !== undefined && (series.length !== 1 || only.some((n) => !Number.isSafeInteger(n) || n < 1))) throw new Error('--only requires positive card numbers and one series');
  const limit = values.limit === undefined ? null : Number(values.limit);
  if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) throw new Error('--limit must be a positive integer');
  const concurrency = Number(values.concurrency);
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > 64) throw new Error('--concurrency must be an integer from 1 to 64');
  if (!['svg', 'png'].includes(values.format)) throw new Error('--format must be svg or png');
  const nicheBase = (env.NICHEDB_API_BASE ?? 'https://nichedb.dev/api/v1').replace(/\/$/, '');
  for (const base of [nicheBase]) {
    const u = safeURL(base) && new URL(base);
    if (!u || u.search || u.hash || (u.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname))) throw new Error('API bases must be HTTPS URLs (or local test servers), without credentials/query/fragment');
  }
  return { root, command, help: values.help, series, only, limit, format: values.format, out: path.resolve(root, values.out ?? 'dist/releases/v2'),
    dryRun: !!values['dry-run'], concurrency, pngCopies: !!values['png-copies'], offline: !!values.offline,
    allowMissingMetadata: !!values['allow-missing-metadata'], force: !!values.force, allowPartial: !!values['allow-partial'],
    portraitEdits: values['portrait-edits'] ? path.resolve(root, values['portrait-edits']) : null,
    nicheKey: env.NICHEDB_API_KEY, nicheBase };
}
export function publicConfig(options) {
  const { format, pngCopies, offline, allowMissingMetadata, nicheBase } = options;
  return { pipeline: PIPELINE_VERSION, artworkSource: options.portraitEdits ? 'source-portrait-edit' : 'approved-portrait', format, pngCopies, offline, allowMissingMetadata, nicheBase };
}
const exists = async (file) => fs.access(file).then(() => true, () => false);
function inside(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || path.isAbsolute(relative)) throw new Error('Invalid release path');
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('Release path escapes output directory');
  return target;
}
async function checkFiles(out, files) {
  if (!files || !Object.keys(files).length) throw new Error('Record contains no files');
  for (const [relative, digest] of Object.entries(files)) {
    const file = inside(out, relative);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || !/^([a-f0-9]{64})$/.test(digest) || hash(await fs.readFile(file)) !== digest) throw new Error(`Missing or corrupt release asset: ${relative}`);
  }
}
async function buildCard(baseCard, options, deps) {
  const config = publicConfig(options);
  // Activation changes only these paths. Source pixel/credit changes invalidate the checkpoint.
  const { front: oldFront, back: oldBack, ...sourceCard } = baseCard;
  const portrait = deps.art ? null : await loadPortrait(baseCard, options.root, deps.portraitEdits);
  const fingerprint = hash({ sourceCard, portrait: portrait?.source, config });
  const dir = inside(options.out, baseCard.id);
  const recordFile = path.join(dir, 'record.json');
  if (!options.force && await exists(recordFile)) {
    const old = await json(recordFile);
    if (old.fingerprint === fingerprint) {
      try { await checkFiles(options.out, old.files); return { ...old, resumed: true }; } catch { /* rebuild broken outputs from valid checkpoints */ }
    }
  }
  const checkpointFile = path.join(dir, 'checkpoint.json');
  let checkpoint = !options.force && await exists(checkpointFile) ? await json(checkpointFile) : {};
  if (checkpoint.fingerprint !== fingerprint) checkpoint = { fingerprint };
  if (!checkpoint.research || checkpoint.research.status === 'unavailable') {
    checkpoint.research = await (deps.research ?? researchCard)(baseCard, options, deps);
    await atomicWrite(checkpointFile, checkpoint);
  }
  const card = enrichCard(baseCard, checkpoint.research);
  let art;
  if (checkpoint.art) {
    try {
      const bytes = await fs.readFile(path.join(dir, `artwork.${checkpoint.art.format}`));
      if (hash(bytes) === checkpoint.art.sha256) art = { ...checkpoint.art, bytes };
    } catch { /* missing checkpoint asset: regenerate */ }
  }
  if (!art) {
    art = deps.art ? await deps.art(card, checkpoint.research, options, deps) : portrait;
    if (!['svg', 'png'].includes(art.format)) throw new Error('Unknown artwork format');
    if (art.format === 'svg') art.bytes = Buffer.from(await validateSVG(art.bytes.toString()));
    const { bytes, ...provenance } = art;
    checkpoint.art = { ...provenance, sha256: hash(bytes), generatedAt: new Date().toISOString() };
    await atomicWrite(path.join(dir, `artwork.${art.format}`), bytes);
    await atomicWrite(checkpointFile, checkpoint);
  }
  if (art.format === 'svg') await validateSVG(art.bytes.toString());
  else {
    const metadata = await sharp(art.bytes).metadata();
    if (metadata.format !== 'png' || metadata.width > 4096 || metadata.height > 4096) throw new Error('Invalid PNG artwork');
  }
  if (art.source) card.portrait = art.source;
  const faceFormat = options.format;
  const faces = renderFaces(card, art.bytes, art.format);
  const files = { [`${card.id}/artwork.${art.format}`]: hash(art.bytes) };
  for (const [side, svg] of Object.entries(faces)) {
    // The deterministic layout keeps all factual text outside image generation.
    const raster = await sharp(Buffer.from(svg)).resize(1000, 1490).png().toBuffer();
    const content = faceFormat === 'svg' ? svg : raster;
    const relative = `${card.id}/${side}.${faceFormat}`;
    await atomicWrite(inside(options.out, relative), content); files[relative] = hash(content);
    if (options.pngCopies && faceFormat === 'svg') {
      const pngPath = `${card.id}/${side}.png`;
      await atomicWrite(inside(options.out, pngPath), raster); files[pngPath] = hash(raster);
    }
  }
  const prefix = `/releases/v2/${card.id}`;
  const record = { fingerprint, card: { ...card, edition: 2, front: `${prefix}/front.${faceFormat}`, back: `${prefix}/back.${faceFormat}`, faceFormat, artwork: `${prefix}/artwork.${art.format}`, artworkFormat: art.format },
    art: checkpoint.art, files, builtAt: new Date().toISOString() };
  await atomicWrite(recordFile, record);
  return record;
}

function reviewHTML(cards) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open Source Legends — v2 proof</title><style>body{background:#10141c;color:#fff;font:16px system-ui;margin:32px}h1{font-weight:500}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:24px}article{border-top:1px solid #475467;padding-top:16px}img{width:49%;height:auto}a{color:#64efb4}small{color:#abb8ca}</style><h1>Open Source Legends / Edition 2</h1><p>Review the artwork, original card copy and sourced metadata before activating this edition. <a href="cards.json">Card data</a> · <a href="manifest.json">Release manifest</a></p><main>${cards.map((c) => `<article id="${escapeXML(c.id)}"><h2>${escapeXML(c.name)}</h2><img loading="lazy" src="${escapeXML(c.id)}/front.${c.faceFormat ?? c.artworkFormat}" alt="${escapeXML(c.name)} front"><img loading="lazy" src="${escapeXML(c.id)}/back.${c.faceFormat ?? c.artworkFormat}" alt="${escapeXML(c.name)} back"><p><small>${escapeXML(c.series)} · ${(c.faceFormat ?? c.artworkFormat).toUpperCase()} · ${c.portrait?.status === 'pending' ? 'Portrait pending' : c.portrait?.method === 'image-edit' ? 'New painting from the original portrait' : 'Existing portrait artwork'} · NicheDB: ${escapeXML(c.research.status)}</small></p>${c.portrait?.reference ? `<p>Portrait source: ${escapeXML(c.portrait.reference.credit)} · ${escapeXML(c.portrait.reference.license)}${safeURL(c.portrait.reference.sourceUrl) ? ` · <a href="${escapeXML(c.portrait.reference.sourceUrl)}">Source photograph</a>` : ''}</p>` : ''}<ul>${c.research.matches.map((m) => `<li><a href="${escapeXML(m.url)}">${escapeXML(m.title)}</a> — ${escapeXML(m.summary)}</li>`).join('')}</ul></article>`).join('')}</main></html>`;
}
export async function buildRelease(options, deps = {}) {
  const all = await (deps.load ?? loadCards)(options.root, options.series);
  if (options.only.some((n) => !all.some((c) => c.number === n))) throw new Error('Requested card number is not present in the roster');
  let selected = all.filter((c) => !options.only.length || options.only.includes(c.number));
  if (options.limit) selected = selected.slice(0, options.limit);
  if (!selected.length) throw new Error('No cards selected');
  const config = publicConfig(options);
  const plan = { edition: 2, config, expectedIds: selected.map((c) => c.id), scope: { series: options.series, partial: selected.length < all.length, count: selected.length } };
  if (options.dryRun) { console.log(JSON.stringify({ ...plan, out: options.out }, null, 2)); return plan; }
  if (options.portraitEdits) deps = { ...deps, portraitEdits: await loadPortraitEdits(options.portraitEdits) };
  await fs.mkdir(options.out, { recursive: true });
  const lockFile = path.join(options.out, '.build.lock');
  const lock = await fs.open(lockFile, 'wx').catch(() => { throw new Error(`Another build may be running. Inspect ${lockFile}; remove it only if that process has stopped.`); });
  await lock.writeFile(String(process.pid));
  try {
    const manifestFile = path.join(options.out, 'manifest.json');
    if (await exists(manifestFile)) {
      const old = await json(manifestFile);
      if (hash(old.expectedIds) !== hash(plan.expectedIds)) throw new Error('Output contains a different card selection; use a different --out directory');
    }
    const manifest = { ...plan, status: 'incomplete', startedAt: new Date().toISOString(), records: [], failures: [] };
    await atomicWrite(manifestFile, manifest);
    const records = new Array(selected.length);
    let nextIndex = 0;
    let writes = Promise.resolve();
    const worker = async () => {
      while (nextIndex < selected.length) {
        const index = nextIndex++;
        const card = selected[index];
        try {
          const { resumed, ...record } = await buildCard(card, options, deps);
          records[index] = record;
          console.log(`[${index + 1}/${selected.length}] ${resumed ? 'resumed' : 'built'} ${card.id} (${record.art.format}; NicheDB ${record.card.research.status})`);
        } catch (error) { manifest.failures.push({ id: card.id, error: error.message }); console.error(`${card.id}: ${error.message}`); }
        // Serialize manifest writes and preserve roster order despite completion order.
        writes = writes.then(async () => {
          manifest.records = records.filter(Boolean);
          await atomicWrite(manifestFile, manifest);
        });
        await writes;
      }
    };
    const workers = await Promise.allSettled(Array.from({ length: Math.min(options.concurrency ?? 1, selected.length) }, worker));
    const failedWorker = workers.find((result) => result.status === 'rejected');
    if (failedWorker) throw failedWorker.reason;
    const cards = manifest.records.map((r) => r.card);
    await atomicWrite(path.join(options.out, 'cards.json'), { schemaVersion: 2, edition: 2, cards });
    await atomicWrite(path.join(options.out, 'index.html'), reviewHTML(cards));
    manifest.catalogSHA256 = hash(await fs.readFile(path.join(options.out, 'cards.json')));
    manifest.reviewSHA256 = hash(await fs.readFile(path.join(options.out, 'index.html')));
    manifest.status = manifest.failures.length ? 'incomplete' : 'complete';
    manifest.completedAt = manifest.failures.length ? null : new Date().toISOString();
    await atomicWrite(manifestFile, manifest);
    if (manifest.failures.length) throw new Error(`${manifest.failures.length} cards failed; release is incomplete. Re-run the same command to resume.`);
    await validateRelease(options.out);
    return manifest;
  } finally { await lock.close(); await fs.unlink(lockFile); }
}

export async function validateRelease(out) {
  const manifest = await json(path.join(out, 'manifest.json'));
  if (manifest.edition !== 2 || manifest.status !== 'complete' || manifest.failures.length || !manifest.expectedIds?.length) throw new Error('Release is incomplete');
  if (hash(manifest.records.map((r) => r.card.id)) !== hash(manifest.expectedIds) || new Set(manifest.expectedIds).size !== manifest.expectedIds.length) throw new Error('Release roster is incomplete or duplicated');
  const catalog = await json(path.join(out, 'cards.json'));
  if (hash(await fs.readFile(path.join(out, 'cards.json'))) !== manifest.catalogSHA256 || hash(catalog.cards) !== hash(manifest.records.map((r) => r.card))) throw new Error('Card catalog does not match manifest');
  if (hash(await fs.readFile(path.join(out, 'index.html'))) !== manifest.reviewSHA256) throw new Error('Review page does not match manifest');
  for (const record of manifest.records) {
    const c = record.card;
    if (!SERIES[c.series] || !/^[a-z0-9-]+$/.test(c.slug) || c.id !== `${c.series}/${String(c.number).padStart(3, '0')}-${c.slug}`) throw new Error('Invalid card identity');
    await checkFiles(out, record.files);
    for (const field of ['front', 'back', 'artwork']) {
      const relative = `${c.id}/${field === 'artwork' ? 'artwork' : field}.${field === 'artwork' ? c.artworkFormat : (c.faceFormat ?? c.artworkFormat)}`;
      if (c[field] !== `/releases/v2/${relative}` || !record.files[relative]) throw new Error('Card face/artwork path is missing from manifest');
    }
    if (c.artworkFormat === 'svg') await validateSVG(await fs.readFile(inside(out, `${c.id}/artwork.svg`), 'utf8'));
    else if (c.artworkFormat !== 'png') throw new Error('Unsupported artwork format');
    if (c.portrait) {
      if (!['approved', 'pending'].includes(c.portrait.status) || hash(c.portrait) !== hash(record.art.source)) throw new Error('Portrait provenance does not match');
      if (c.portrait.status === 'approved' && c.portrait.sha256 !== record.files[`${c.id}/artwork.png`]) throw new Error('Artwork differs from approved portrait pixels');
    }
  }
  return manifest;
}

// Edit only exact object properties in the existing exported array. The site's
// curated descriptions, ratings, aliases, reference photo credits and helpers stay intact.
export function updateFacePaths(source, exportName, records) {
  const ast = ts.createSourceFile('roster.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let array;
  for (const statement of ast.statements) if (ts.isVariableStatement(statement)) for (const decl of statement.declarationList.declarations) {
    if (decl.name.getText(ast) === exportName && decl.initializer && ts.isArrayLiteralExpression(decl.initializer)) array = decl.initializer;
  }
  if (!array) throw new Error(`Cannot locate ${exportName} array; no source files changed`);
  const edits = [];
  const matched = new Set();
  for (const element of array.elements) {
    if (!ts.isObjectLiteralExpression(element)) continue;
    const props = new Map(element.properties.filter(ts.isPropertyAssignment).map((p) => [p.name.getText(ast).replace(/^['"]|['"]$/g, ''), p]));
    const slug = props.get('slug')?.initializer;
    if (!slug || !ts.isStringLiteral(slug)) continue;
    const record = records.find((r) => r.card.slug === slug.text);
    if (!record) continue;
    if (Number(props.get('number')?.initializer.getText(ast)) !== record.card.number) throw new Error(`Roster identity changed: ${slug.text}`);
    matched.add(slug.text);
    const additions = [];
    for (const field of ['front', 'back']) {
      const prop = props.get(field);
      if (prop) edits.push({ start: prop.initializer.getStart(ast), end: prop.initializer.end, text: JSON.stringify(record.card[field]) });
      else additions.push(`${field}: ${JSON.stringify(record.card[field])}`);
    }
    if (additions.length) {
      const last = element.properties.at(-1);
      const tail = source.slice(last.end, element.end - 1);
      edits.push({ start: last.end, end: last.end, text: `,\n    ${additions.join(',\n    ')}${tail.trim().startsWith(',') ? '' : ','}` });
    }
  }
  if (matched.size !== records.length) throw new Error(`Not all release cards exist in ${exportName}`);
  for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
  return source;
}
export async function activateRelease(options) {
  const manifest = await validateRelease(options.out);
  if (!['approved-portrait', 'source-portrait-edit'].includes(manifest.config.artworkSource) || manifest.records.some((r) => !r.card.portrait)) throw new Error('Only a release built from approved portrait sources can be activated');
  if (manifest.config.artworkSource === 'source-portrait-edit' && manifest.records.some((r) => r.card.portrait.status !== 'pending' &&
      (r.card.portrait.method !== 'image-edit' || !r.card.portrait.basis || r.card.portrait.edit?.reviewed !== true))) throw new Error('Every available portrait needs a reviewed source-based edit');
  if (manifest.scope.partial && !options.allowPartial) throw new Error('This is a proof subset; use --allow-partial to activate it intentionally');
  const updates = [];
  for (const series of manifest.scope.series) {
    const records = manifest.records.filter((r) => r.card.series === series);
    if (!records.length) continue;
    const file = path.join(options.root, 'src/data', SERIES[series].file);
    const original = await fs.readFile(file, 'utf8');
    updates.push({ file, original, next: updateFacePaths(original, SERIES[series].export, records) });
  }
  if (options.dryRun) { console.log(`Validated ${manifest.records.length} cards; would update ${updates.length} roster files and public/releases/v2`); return; }
  const destination = path.join(options.root, 'public/releases/v2');
  const publishedManifest = path.join(destination, 'manifest.json');
  if (await exists(destination)) {
    if (!await exists(publishedManifest)) throw new Error('public/releases/v2 already exists without a manifest');
    const published = await validateRelease(destination);
    if (hash(published.records) !== hash(manifest.records) || hash(published.config) !== hash(manifest.config)) throw new Error('public/releases/v2 already contains a different release; archive it before activating a replacement');
  } else {
    const temp = `${destination}.staging-${process.pid}`;
    await fs.mkdir(temp, { recursive: true });
    try {
      const files = new Set(['manifest.json', 'cards.json', 'index.html', ...manifest.records.flatMap((r) => Object.keys(r.files))]);
      for (const relative of files) await atomicWrite(inside(temp, relative), await fs.readFile(inside(options.out, relative)));
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(temp, destination);
    } finally { await fs.rm(temp, { recursive: true, force: true }); }
  }
  // Prepare every source update first; restore originals if a write fails.
  try { for (const update of updates) await atomicWrite(update.file, update.next); }
  catch (error) { for (const update of updates) await atomicWrite(update.file, update.original); throw error; }
  console.log(`Activated ${manifest.records.length} cards locally. Review the diff, then use the site's normal deployment process.`);
}
export async function main(argv = process.argv.slice(2)) {
  const options = optionsFrom(argv);
  if (options.help) { console.log(HELP); return; }
  if (options.command === 'build') await buildRelease(options);
  else if (options.command === 'validate') { const result = await validateRelease(options.out); console.log(`Valid v2 release: ${result.records.length} cards`); }
  else await activateRelease(options);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
