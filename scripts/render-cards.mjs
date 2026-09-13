#!/usr/bin/env node
/*
  Render Series One (Open Source Legends) faces from the HTML template — text
  accurate, no API calls — and publish the web-size copies the site loads.

  Portraits are the approved art committed under assets/portraits/legends/
  (card_###.png). Nothing is generated here; a card with no approved portrait
  is skipped and reported.

  Stages:
    render   assets/portraits/legends/card_###.png + data/roster.locked.json
             -> dist/html/card_###-{front,back}.{html,png}   (full-res masters)
    publish  dist/html/*.png -> public/cards/###-<slug>-{front,back}.png (500x745)

  Run:  node scripts/render-cards.mjs            # every published card
        node scripts/render-cards.mjs 2 14 47    # just those numbers
        node scripts/render-cards.mjs --no-publish

  Only cards listed in src/data/cards.ts are published, so the roster can hold
  more entries than the site shows. Set CHROME_PATH if no Chromium is found.

  The `enhance` image-to-image pass that used to follow this step is gone on
  purpose: it rewrote text and filled empty regions with invented content (see
  scripts/hacking-legends.mjs for the history). The template now leaves no empty
  region to fill, and the HTML render is the shipped face.
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { buildFront, buildBack, CARD_W, CARD_H, rarityOf } from './card-template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = {
  approvedArt: path.join(ROOT, 'assets', 'portraits', 'legends'),
  workingArt: path.join(ROOT, 'assets', 'portraits-art'),
  html: path.join(ROOT, 'dist', 'html'),
  published: path.join(ROOT, 'public', 'cards'),
};
const WEB_W = 500;
const WEB_H = 745;

const args = process.argv.slice(2);
const noPublish = args.includes('--no-publish');
const only = args.map(Number).filter((n) => Number.isFinite(n) && n > 0);

const cardId = (n) => `card_${String(n).padStart(3, '0')}`;

// ------------------------------------------------------------ browser -----
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
// A Playwright Chromium unpacked without root has no system GTK/ATK libraries;
// a staged copy, if present, goes on the loader path. Otherwise a no-op.
function browserEnv() {
  const staged = path.join(process.env.HOME || '', '.local', 'share', 'chrome-deps', 'usr', 'lib', 'x86_64-linux-gnu');
  if (!fssync.existsSync(staged)) return undefined;
  const existing = process.env.LD_LIBRARY_PATH;
  return { ...process.env, LD_LIBRARY_PATH: existing ? `${staged}:${existing}` : staged };
}

// --------------------------------------------------------------- data -----
/** number -> slug for every card the site publishes, read off src/data/cards.ts. */
function publishedSlugs() {
  const src = fssync.readFileSync(path.join(ROOT, 'src', 'data', 'cards.ts'), 'utf8');
  const map = new Map();
  const re = /"number":\s*(\d+)\s*,\s*"slug":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) map.set(Number(m[1]), m[2]);
  if (!map.size) throw new Error('could not read any number/slug pairs from src/data/cards.ts');
  return map;
}
function portraitFor(card) {
  for (const dir of [DIRS.approvedArt, DIRS.workingArt]) {
    const p = path.join(dir, `${cardId(card.card_number)}.png`);
    if (fssync.existsSync(p)) return p;
  }
  return null;
}

// ------------------------------------------------------------- stages -----
async function render(cards) {
  const executablePath = findChrome();
  console.log(`render: ${executablePath}`);
  const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'], env: browserEnv() });
  const page = await browser.newPage({ viewport: { width: CARD_W, height: CARD_H }, deviceScaleFactor: 2 });

  const shoot = async (html, id, side) => {
    // Keep the self-contained HTML next to the PNG so a face can be re-rendered
    // or hand-corrected later without touching the portrait.
    await fs.writeFile(path.join(DIRS.html, `${id}-${side}.html`), html);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.card').screenshot({ path: path.join(DIRS.html, `${id}-${side}.png`) });
  };

  let ok = 0;
  const failed = [];
  for (const c of cards) {
    const id = cardId(c.card_number);
    try {
      const art = portraitFor(c);
      if (!art) throw new Error('no approved portrait in assets/portraits/legends/');
      const uri = `data:image/png;base64,${(await fs.readFile(art)).toString('base64')}`;
      await shoot(buildFront(c, uri), id, 'front');
      await shoot(buildBack(c), id, 'back');
      ok++;
      console.log(`✓ ${String(c.card_number).padStart(2, '0')} ${c.display_name} (${rarityOf(c.impact_rating)})`);
    } catch (err) {
      failed.push(c.card_number);
      console.log(`✗ ${String(c.card_number).padStart(2, '0')} ${c.display_name}: ${err.message}`);
    }
  }
  await browser.close();
  console.log(`render: ${ok} done, ${failed.length} failed${failed.length ? ` (${failed.join(', ')})` : ''}`);
  return { ok, failed };
}

async function publish(cards, slugs) {
  let ok = 0;
  const missing = [];
  for (const c of cards) {
    const id = cardId(c.card_number);
    const slug = slugs.get(c.card_number);
    for (const side of ['front', 'back']) {
      const src = path.join(DIRS.html, `${id}-${side}.png`);
      if (!fssync.existsSync(src)) {
        missing.push(`${id}-${side}`);
        continue;
      }
      const dest = path.join(DIRS.published, `${String(c.card_number).padStart(3, '0')}-${slug}-${side}.png`);
      // The full-resolution face stays in dist/ as the print master; the copy the
      // site loads is resized and recompressed, or the deck costs ~180MB to load.
      await sharp(src).resize(WEB_W, WEB_H, { fit: 'fill' }).png({ compressionLevel: 9, palette: true }).toFile(dest);
      ok++;
    }
  }
  console.log(`publish: ${ok} faces -> ${path.relative(ROOT, DIRS.published)}`);
  if (missing.length) console.log(`publish: ${missing.length} missing (${missing.join(', ')})`);
  return { ok, missing };
}

// --------------------------------------------------------------- main -----
await fs.mkdir(DIRS.html, { recursive: true });
await fs.mkdir(DIRS.published, { recursive: true });

const roster = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'roster.locked.json'), 'utf8'));
const slugs = publishedSlugs();
const cards = roster
  .filter((c) => slugs.has(c.card_number))
  .filter((c) => !only.length || only.includes(c.card_number))
  .sort((a, b) => a.card_number - b.card_number);
if (!cards.length) {
  console.error('no cards selected');
  process.exit(1);
}
console.log(`Series One: ${cards.length} card(s)`);

const r = await render(cards);
if (!noPublish) await publish(cards.filter((c) => !r.failed.includes(c.card_number)), slugs);
if (r.failed.length) process.exit(1);
