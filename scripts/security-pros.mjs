#!/usr/bin/env node
/*
  Security Professionals (Series Three) — end-to-end card pipeline.

  Same shape as scripts/hacking-legends.mjs. Every stage skips work that already
  exists, so re-running is cheap and a failed batch can just be run again.

    portraits  AI portrait art, one per professional -> assets/portraits-art/security-pros/
    render     HTML template -> exact card PNGs      -> dist/security/html/
    enhance    image-to-image premium finish pass    -> dist/security/enhanced/  (OPT-IN, see below)
    publish    pick the best face available          -> public/cards/security/
    validate   roster + asset sanity checks
    all        portraits -> render -> publish

  WHY `all` DOES NOT RUN `enhance`
  --------------------------------
  On Series Two the image-to-image finish pass rewrote text on the card faces
  despite the prompt forbidding it: it fabricated quotes attributed to living
  people, invented stat panels that were not on the card, and misspelled a name.
  Nothing in the pipeline catches that, because there is no OCR step — it was
  found by eye, after the art shipped.

  This set's whole premise is documented, sourced history, so an invented quote
  attributed to a real person is the worst defect it can have. `enhance` is
  therefore opt-in only and never part of `all`. Running it means accepting that
  every affected face must be checked by eye before publish.

  PORTRAITS ARE CONDITIONED ON A REAL PHOTOGRAPH
  ----------------------------------------------
  The first pass generated faces from text prompts alone, so every portrait was an
  invented stranger. Generation now takes a verified reference photo as input (see
  scripts/security-refs.mjs), and a card with no verified photo gets NO FACE — the
  front renders a plate saying so. We do not invent a likeness of a real person.

  The reference photo's photographer is credited: most are CC BY / CC BY-SA, and a
  conditioned portrait is a derivative work. data/security-references.json carries
  the provenance and the card page prints it.

  The roster is src/data/security.ts, imported directly (Node strips the types),
  so there is no second copy of the data to keep in sync.

  Portrait resolution order, highest authority first:
    1. assets/portraits/security-pros/card_NNN.png   (human-approved, committed)
    2. assets/portraits-art/security-pros/card_NNN.png (model output, gitignored)
    3. generate a new one

  Env:
    OPENAI_API_KEY / GEMINI_API_KEY   at least one, picks the provider
    IMAGE_PROVIDER=openai|gemini      override auto-detection
    OPENAI_IMAGE_MODEL                default gpt-image-2
    GEMINI_IMAGE_MODEL                default gemini-3-pro-image-preview
    CHROME_PATH                       override browser discovery

  Run:
    node scripts/security-pros.mjs all              # whole set
    node scripts/security-pros.mjs all 1 5 12       # only these numbers
    node scripts/security-pros.mjs render           # no API calls, no spend
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { buildFront, buildBack, CARD_W, CARD_H } from './security-template.mjs';

// What the site serves. Series One publishes at exactly this size and all three
// decks appear in the same grids, so Series Three has to match.
const WEB_W = 500;
const WEB_H = 745;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Importing src/data/security.ts makes Node warn that package.json has no "type".
// Setting it would change module resolution for the Next app, so mute just this
// one warning rather than 30 lines of noise on every run.
const emitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...rest) => {
  const code = rest.find((r) => typeof r === 'string' && r.startsWith('MODULE_')) ??
    rest.find((r) => r && typeof r === 'object')?.code;
  if (code === 'MODULE_TYPELESS_PACKAGE_JSON') return;
  return emitWarning(warning, ...rest);
};

const REFS_DIR = path.join(ROOT, 'assets', 'references', 'security-pros');
const REF_MANIFEST = path.join(ROOT, 'data', 'security-references.json');

const DIRS = {
  approvedArt: path.join(ROOT, 'assets', 'portraits', 'security-pros'),
  workingArt: path.join(ROOT, 'assets', 'portraits-art', 'security-pros'),
  html: path.join(ROOT, 'dist', 'security', 'html'),
  enhanced: path.join(ROOT, 'dist', 'security', 'enhanced'),
  published: path.join(ROOT, 'public', 'cards', 'security'),
};

const CONCURRENCY = 3;
const cardId = (n) => `card_${String(n).padStart(3, '0')}`;

// ---------------------------------------------------------------- roster ----

async function loadRoster(only = []) {
  const mod = await import(path.join(ROOT, 'src', 'data', 'security.ts'));
  const all = mod.pros;
  if (!only.length) return all;
  const found = all.filter((h) => only.includes(h.number));
  const missing = only.filter((n) => !all.some((h) => h.number === n));
  if (missing.length) throw new Error(`no such card number: ${missing.join(', ')}`);
  return found;
}

// ------------------------------------------------------------- providers ----

function provider() {
  const forced = process.env.IMAGE_PROVIDER;
  if (forced) {
    if (!['openai', 'gemini'].includes(forced)) throw new Error(`unknown IMAGE_PROVIDER: ${forced}`);
    return forced;
  }
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  throw new Error('set OPENAI_API_KEY or GEMINI_API_KEY to generate art');
}

const OPENAI_MODEL = () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const GEMINI_MODEL = () => process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';

const RETRYABLE = /quota|rate|429|500|502|503|timeout|unavailable|internal|overloaded/i;

async function withRetry(label, fn, attempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts || !RETRYABLE.test(String(err.message))) break;
      const wait = 4000 * attempt;
      process.stdout.write(`  … ${label} retry ${attempt}/${attempts - 1} in ${wait / 1000}s\n`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/** Text prompt -> PNG buffer. */
async function generateImage(prompt, { size = '1024x1024' } = {}) {
  if (provider() === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );
    const d = await res.json();
    if (!d.candidates) throw new Error(JSON.stringify(d.error || d).slice(0, 200));
    const part = d.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
    if (!part) throw new Error('response contained no image');
    return Buffer.from((part.inlineData || part.inline_data).data, 'base64');
  }

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENAI_MODEL(), prompt, size, n: 1 }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message?.slice(0, 200) || 'openai error');
  if (!d.data?.[0]?.b64_json) throw new Error('response contained no image');
  return Buffer.from(d.data[0].b64_json, 'base64');
}

/** Source PNG + instruction -> revised PNG buffer. */
async function editImage(pngBuffer, prompt, { size = '1024x1536' } = {}) {
  if (provider() === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL()}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: 'image/png', data: pngBuffer.toString('base64') } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );
    const d = await res.json();
    if (!d.candidates) throw new Error(JSON.stringify(d.error || d).slice(0, 200));
    const part = d.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
    if (!part) throw new Error('response contained no image');
    return Buffer.from((part.inlineData || part.inline_data).data, 'base64');
  }

  const form = new FormData();
  form.append('model', OPENAI_MODEL());
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'card.png');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message?.slice(0, 200) || 'openai error');
  if (!d.data?.[0]?.b64_json) throw new Error('response contained no image');
  return Buffer.from(d.data[0].b64_json, 'base64');
}

// -------------------------------------------------------------- prompts ----

function referenceFor(h) {
  const p = path.join(REFS_DIR, `${cardId(h.number)}.jpg`);
  return fssync.existsSync(p) ? p : null;
}

let refManifest = null;
function refInfo(slug) {
  if (!refManifest) {
    refManifest = fssync.existsSync(REF_MANIFEST)
      ? JSON.parse(fssync.readFileSync(REF_MANIFEST, 'utf8'))
      : [];
  }
  return refManifest.find((r) => r.slug === slug)?.ref || null;
}

/**
 * Image-to-image instruction. The reference photograph is the subject; the model's
 * job is to restyle it, not to reimagine who it is. Says so several ways, because
 * the failure we are guarding against is precisely a plausible different face.
 */
function likenessPrompt(h) {
  const motif = (h.domains || []).slice(0, 2).join(' and ') || 'computer security';
  return [
    'Repaint this photograph as a realistic semi-painterly portrait for a premium collectible trading card.',
    'CRITICAL: keep the SAME PERSON. Preserve the exact facial structure, likeness, age, hairstyle, facial hair,',
    'glasses, skin tone and expression of the person in the photograph. Do not beautify, do not de-age,',
    'do not substitute a different face. The result must be recognisable as the same individual.',
    'Head and shoulders, facing the viewer, warm cinematic studio lighting with a cool rim light,',
    'detailed painted realism, dignified and serious.',
    `Replace the background with a dark background carrying subtle faint motifs of ${motif}.`,
    'No text, no letters, no logos, no border, no card frame, no watermark.',
  ].join(' ');
}

function portraitPrompt(h) {
  const motif = (h.domains || []).slice(0, 2).join(' and ') || 'computer security';
  const era = h.era ? ` Period-accurate to ${h.era}.` : '';
  return [
    `Realistic semi-painterly digital portrait of ${h.name}, ${h.title}.`,
    'Head and shoulders, facing the camera, warm cinematic studio lighting with a cool rim light,',
    'detailed painted realism in the style of a premium collectible trading-card portrait.',
    `Dark background with subtle faint motifs of ${motif}.${era}`,
    'Recognizable likeness, dignified and serious, treated as a documented historical figure.',
    'No text, no letters, no logos, no border, no card frame, no watermark.',
  ].join(' ');
}

const ENHANCE_PROMPT =
  'Enhance this collectible trading card into a premium, professionally-printed card with real depth and polish: ' +
  'cinematic lighting and painterly refinement on the portrait, refined dark metal and matte material textures, ' +
  'a tasteful metallic foil accent border, embossed elements, soft inner shadows and subtle gloss — like a high-end ' +
  'collectible trading card. ABSOLUTELY CRITICAL: keep ALL text, numbers, names, aliases, titles, labels, stat values, ' +
  'bar lengths, the quote and the entire layout EXACTLY the same, fully legible and in identical positions — do not ' +
  'change, add, remove, reflow or misspell any text. Only improve the visual finish, depth, materials and lighting.';

// -------------------------------------------------------------- browser ----

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    ...playwrightChromiums(),
  ];
  const found = candidates.find((p) => p && fssync.existsSync(p));
  if (!found) {
    throw new Error(
      'no Chrome/Chromium found. Set CHROME_PATH, or install one with `npx playwright install chromium`.'
    );
  }
  return found;
}

/**
 * A Playwright Chromium unpacked without root has no system GTK/ATK libraries.
 * If a staged copy is present, put it on the loader path so the browser starts.
 * Absent that directory this is a no-op and the system libraries are used.
 */
function browserEnv() {
  const staged = path.join(
    process.env.HOME || '',
    '.local',
    'share',
    'chrome-deps',
    'usr',
    'lib',
    'x86_64-linux-gnu'
  );
  if (!fssync.existsSync(staged)) return undefined;
  const existing = process.env.LD_LIBRARY_PATH;
  return { ...process.env, LD_LIBRARY_PATH: existing ? `${staged}:${existing}` : staged };
}

function playwrightChromiums() {
  const base = path.join(process.env.HOME || '', '.cache', 'ms-playwright');
  if (!fssync.existsSync(base)) return [];
  return fssync
    .readdirSync(base)
    .filter((d) => d.startsWith('chromium'))
    .sort()
    .reverse()
    .map((d) => path.join(base, d, 'chrome-linux', 'chrome'));
}

// --------------------------------------------------------------- stages ----

async function ensureDirs() {
  for (const d of Object.values(DIRS)) await fs.mkdir(d, { recursive: true });
}

function approvedPortrait(h) {
  const p = path.join(DIRS.approvedArt, `${cardId(h.number)}.png`);
  return fssync.existsSync(p) ? p : null;
}
function workingPortrait(h) {
  const p = path.join(DIRS.workingArt, `${cardId(h.number)}.png`);
  return fssync.existsSync(p) ? p : null;
}
function portraitFor(h) {
  return approvedPortrait(h) || workingPortrait(h);
}

/** Run `task` over `items` with a small worker pool, reporting as it goes. */
async function pool(items, label, task) {
  let i = 0;
  let ok = 0;
  let skipped = 0;
  const failed = [];
  async function worker() {
    while (i < items.length) {
      const item = items[i++];
      const name = `${String(item.number).padStart(2, '0')} ${item.name}`;
      try {
        const r = await task(item);
        if (r === 'skip') {
          skipped++;
        } else {
          ok++;
          process.stdout.write(`✓ ${name}\n`);
        }
      } catch (err) {
        failed.push(item.number);
        process.stdout.write(`✗ ${name}: ${err.message}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  console.log(
    `${label}: ${ok} done, ${skipped} already present, ${failed.length} failed` +
      (failed.length ? ` (${failed.join(', ')})` : '')
  );
  return { ok, skipped, failed };
}

async function portraits(roster) {
  await ensureDirs();
  console.log(`portraits: ${provider()} / ${provider() === 'openai' ? OPENAI_MODEL() : GEMINI_MODEL()}`);
  const withRef = roster.filter((h) => referenceFor(h));
  const without = roster.filter((h) => !referenceFor(h));
  if (without.length) {
    console.log(
      `portraits: ${without.length} have no verified reference photo and will get no face ` +
        `(${without.map((h) => h.number).join(', ')}). Run scripts/security-refs.mjs to look again.`
    );
  }
  return pool(withRef, 'portraits', async (h) => {
    if (portraitFor(h)) return 'skip';
    // Image-to-image off the real photograph. Never generateImage() — a text-only
    // prompt is what produced the invented faces this pipeline exists to prevent.
    const ref = await fs.readFile(referenceFor(h));
    const buf = await withRetry(cardId(h.number), () => editImage(ref, likenessPrompt(h), { size: '1024x1024' }));
    await fs.writeFile(path.join(DIRS.workingArt, `${cardId(h.number)}.png`), buf);
  });
}

async function render(roster) {
  await ensureDirs();
  const executablePath = findChrome();
  console.log(`render: ${executablePath}`);
  const browser = await chromium.launch({
    executablePath,
    args: ['--no-sandbox'],
    env: browserEnv(),
  });
  const page = await browser.newPage({
    viewport: { width: CARD_W, height: CARD_H },
    deviceScaleFactor: 2,
  });

  const shoot = async (html, id, side) => {
    // Keep the self-contained HTML next to the PNG so a card can be re-rendered
    // or hand-corrected later without regenerating the portrait.
    await fs.writeFile(path.join(DIRS.html, `${id}-${side}.html`), html);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.card').screenshot({ path: path.join(DIRS.html, `${id}-${side}.png`) });
  };

  let ok = 0;
  const failed = [];
  for (const h of roster) {
    const id = cardId(h.number);
    try {
      const art = portraitFor(h);
      // No art is a legitimate outcome: nobody with no verified reference photo
      // gets an invented face. buildFront renders a "no likeness" plate instead.
      const uri = art ? `data:image/png;base64,${(await fs.readFile(art)).toString('base64')}` : null;
      await shoot(buildFront(h, uri, refInfo(h.slug)), id, 'front');
      await shoot(buildBack(h, refInfo(h.slug)), id, 'back');
      ok++;
      console.log(`✓ ${String(h.number).padStart(2, '0')} ${h.name} (${h.rarity})`);
    } catch (err) {
      failed.push(h.number);
      console.log(`✗ ${String(h.number).padStart(2, '0')} ${h.name}: ${err.message}`);
    }
  }
  await browser.close();
  console.log(`render: ${ok} done, ${failed.length} failed${failed.length ? ` (${failed.join(', ')})` : ''}`);
  return { ok, failed };
}

async function enhance(roster) {
  // See the header comment. This pass rewrote text on shipped Series Two faces.
  if (!process.env.ENHANCE_I_WILL_CHECK_EVERY_FACE) {
    console.error(
      'enhance: refusing to run.\n' +
        '  On Series Two this pass fabricated quotes attributed to living people,\n' +
        '  invented stat panels and misspelled a name, despite the prompt forbidding it.\n' +
        '  There is no OCR check in this pipeline, so nothing catches it but your eyes.\n' +
        '  Set ENHANCE_I_WILL_CHECK_EVERY_FACE=1 to run it anyway, then inspect every\n' +
        '  face in dist/security/enhanced/ before publish.'
    );
    process.exit(1);
  }
  await ensureDirs();
  console.log(`enhance: ${provider()} / ${provider() === 'openai' ? OPENAI_MODEL() : GEMINI_MODEL()}`);
  console.log('enhance: WARNING — this pass rewrites text. Check every face before publish.');
  const jobs = [];
  for (const h of roster) {
    for (const side of ['front', 'back']) {
      const src = path.join(DIRS.html, `${cardId(h.number)}-${side}.png`);
      if (fssync.existsSync(src)) jobs.push({ ...h, side, src, name: `${h.name} ${side}` });
    }
  }
  if (!jobs.length) {
    console.log('enhance: nothing rendered yet — run `render` first');
    return { ok: 0, failed: [] };
  }
  return pool(jobs, 'enhance', async (job) => {
    const out = path.join(DIRS.enhanced, `${cardId(job.number)}-${job.side}.png`);
    if (fssync.existsSync(out)) return 'skip';
    const buf = await withRetry(
      `${cardId(job.number)}-${job.side}`,
      async () => editImage(await fs.readFile(job.src), ENHANCE_PROMPT)
    );
    await fs.writeFile(out, buf);
  });
}

async function publish(roster) {
  await ensureDirs();
  let ok = 0;
  const missing = [];
  const linked = [];
  let fromHtml = 0;
  for (const h of roster) {
    let faces = 0;
    for (const side of ['front', 'back']) {
      const id = cardId(h.number);
      const enhanced = path.join(DIRS.enhanced, `${id}-${side}.png`);
      const plain = path.join(DIRS.html, `${id}-${side}.png`);
      const src = fssync.existsSync(enhanced) ? enhanced : fssync.existsSync(plain) ? plain : null;
      if (!src) {
        missing.push(`${id}-${side}`);
        continue;
      }
      if (src === plain) fromHtml++;
      const dest = path.join(
        DIRS.published,
        `${String(h.number).padStart(3, '0')}-${h.slug}-${side}.png`
      );
      // The full-resolution face stays in dist/ as the print master; the copy the
      // site loads is resized and recompressed, or a deck costs ~180MB to load.
      await sharp(src)
        .resize(WEB_W, WEB_H, { fit: 'fill' })
        .png({ compressionLevel: 9, palette: true })
        .toFile(dest);
      ok++;
      faces++;
    }
    // Only advertise a card on the site once both of its faces exist.
    if (faces === 2) linked.push(h);
  }
  await writeArtPaths(linked);
  console.log(`publish: ${ok} faces -> ${path.relative(ROOT, DIRS.published)}`);
  if (fromHtml) console.log(`publish: ${fromHtml} used the text-accurate HTML render (the expected path for this set)`);
  if (missing.length) console.log(`publish: ${missing.length} missing (${missing.join(', ')})`);
  return { ok, missing };
}

/**
 * Point the roster's `front`/`back` fields at the faces we just published, so the
 * site and its "artwork rendered" counter pick them up. Rewrites only those two
 * lines per card and leaves the hand-written copy untouched.
 */
async function writeArtPaths(published) {
  if (!published.length) return;
  const file = path.join(ROOT, 'src', 'data', 'security.ts');
  const lines = (await fs.readFile(file, 'utf8')).split('\n');
  const wanted = new Map(published.map((h) => [h.number, h]));
  const out = [];
  const inserted = new Set();
  let current = null;
  let changed = 0;

  for (const line of lines) {
    const num = line.match(/^ {4}number: (\d+),$/);
    if (num) current = Number(num[1]);
    const rewriting = current !== null && wanted.has(current);
    // Drop any previous art lines for a card we are about to rewrite. `current`
    // has to stay set past the insert below, or existing lines sitting *after*
    // `status:` slip through and the card ends up with duplicate keys.
    if (rewriting && /^ {4}(front|back): '.*',$/.test(line)) continue;
    out.push(line);
    if (rewriting && !inserted.has(current) && /^ {4}status: '.*',$/.test(line)) {
      const h = wanted.get(current);
      const stem = `/cards/security/${String(h.number).padStart(3, '0')}-${h.slug}`;
      out.push(`    front: '${stem}-front.png',`);
      out.push(`    back: '${stem}-back.png',`);
      changed++;
      inserted.add(current);
    }
  }

  await fs.writeFile(file, out.join('\n'));
  console.log(`publish: linked art paths for ${changed} card(s) in src/data/security.ts`);
}

async function validate(roster) {
  const all = await loadRoster();
  const errors = [];
  const warnings = [];

  const numbers = new Set();
  const slugs = new Set();
  for (const h of all) {
    if (numbers.has(h.number)) errors.push(`duplicate card number ${h.number}`);
    if (slugs.has(h.slug)) errors.push(`duplicate slug ${h.slug}`);
    numbers.add(h.number);
    slugs.add(h.slug);
  }

  for (const h of roster) {
    const id = `${cardId(h.number)} ${h.name}`;
    for (const field of ['slug', 'name', 'title', 'knownFor', 'rarity', 'nationality', 'era', 'scouting', 'note', 'status']) {
      if (!h[field]) errors.push(`${id}: missing ${field}`);
    }
    if (!h.domains?.length) errors.push(`${id}: needs at least one domain`);
    // The set claims to be documented history, so an unsourced card is a defect,
    // not a warning. Series Two holds the same bar by hand; here it is enforced.
    if (!h.sources?.length) errors.push(`${id}: needs at least one source`);
    for (const s of h.sources || []) {
      if (!s.label || !/^https?:\/\//.test(String(s.url))) {
        errors.push(`${id}: source needs a label and an http(s) url, got ${JSON.stringify(s)}`);
      }
    }
    if (h.domains?.length > 5) errors.push(`${id}: ${h.domains.length} domains, the back panel fits 5`);
    for (const stat of ['impact', 'technical', 'defense', 'research', 'influence']) {
      const v = h[stat];
      if (typeof v !== 'number' || v < 0 || v > 100) errors.push(`${id}: ${stat} must be 0-100, got ${v}`);
    }
    const scoutWords = String(h.scouting).trim().split(/\s+/).length;
    const noteWords = String(h.note).trim().split(/\s+/).length;
    if (scoutWords > 70) warnings.push(`${id}: scouting report is ${scoutWords} words, panel is sized for ~65`);
    if (noteWords > 35) warnings.push(`${id}: note is ${noteWords} words, sized for ~35`);
    if (h.status !== 'locked') warnings.push(`${id}: status is "${h.status}", copy is not final`);
    if (!portraitFor(h)) warnings.push(`${id}: no portrait art yet`);
  }

  for (const w of warnings) console.log(`warn  ${w}`);
  if (errors.length) {
    console.error('\nValidation failed:');
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log(
    `\nValidation passed: ${all.length} on the roster, ${roster.length} selected, ` +
      `${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
  );
  return { warnings };
}

// ------------------------------------------------------------------ cli ----

const HELP = `Security Professionals (Series Three) card pipeline

  node scripts/security-pros.mjs <command> [card numbers...]

Commands
  validate   Check the roster and report what art is still missing
  portraits  Generate missing portrait art
  render     Render card fronts and backs from the HTML template (no API calls)
  enhance    Premium finish pass. OPT-IN ONLY — it rewrites text. See the header.
  publish    Copy the best available faces into public/cards/security/
  all        portraits -> render -> publish

With no card numbers every card on the roster is processed. Every stage skips
work that already exists, so re-running only fills gaps.`;

async function main() {
  const cmd = process.argv[2] || 'help';
  const only = process.argv.slice(3).map(Number).filter((n) => Number.isFinite(n) && n > 0);

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(HELP);
    return;
  }

  const roster = await loadRoster(only);
  if (only.length) console.log(`Selected ${roster.length} card(s): ${roster.map((h) => h.number).join(', ')}\n`);

  if (cmd === 'validate') await validate(roster);
  else if (cmd === 'portraits') await portraits(roster);
  else if (cmd === 'render') await render(roster);
  else if (cmd === 'enhance') await enhance(roster);
  else if (cmd === 'publish') await publish(roster);
  else if (cmd === 'all') {
    // No enhance. See the header comment — it is opt-in for this set.
    await portraits(roster);
    await render(roster);
    await publish(roster);
  } else {
    console.error(`Unknown command: ${cmd}\n`);
    console.log(HELP);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
