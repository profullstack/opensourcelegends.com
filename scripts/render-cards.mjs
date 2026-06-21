#!/usr/bin/env node
/*
  Render Open Source Legends cards from the HTML template (accurate text) with an
  embedded AI portrait. Portraits are generated once (portrait-only, no text/frame)
  and cached in assets/portraits-art/.

  Env:  OPENAI_API_KEY   (only needed to generate missing portraits)
  Run:  node scripts/render-cards.mjs 1 2 3 4 5
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { buildFront, buildBack, CARD_W, CARD_H, rarityOf } from './card-template.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/usr/bin/google-chrome';
const ARTDIR = path.join(ROOT, 'assets', 'portraits-art');
const OUT = path.join(ROOT, 'dist', 'html');
await fs.mkdir(ARTDIR, { recursive: true });
await fs.mkdir(OUT, { recursive: true });

const roster = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'roster.locked.json'), 'utf8'));
const nums = process.argv.slice(2).map(Number).filter(Boolean);
const cards = (nums.length ? roster.filter((c) => nums.includes(c.card_number)) : roster).slice(0, 50);

const DISTAI = path.join(ROOT, 'dist', 'ai');

async function portrait(card) {
  const id = `card_${String(card.card_number).padStart(3, '0')}`;
  const p = path.join(ARTDIR, `${id}.png`);
  if (fssync.existsSync(p)) return p;

  // Crop the portrait region out of the existing full-res AI card (free, cartoonish):
  // exclude the top number/crest chips and the bottom name plate.
  const srcName = fssync.readdirSync(DISTAI).find((f) => f.startsWith(`${id}-`) && f.endsWith('-front.png'));
  if (srcName) {
    // dist/ai cards are 1024x1536; crop the face/torso BELOW the top chips and
    // ABOVE the name plate, trimming the side foil borders.
    await sharp(path.join(DISTAI, srcName)).extract({ left: 36, top: 205, width: 952, height: 760 }).png().toFile(p);
    return p;
  }

  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY) throw new Error(`no portrait art and no dist/ai source for ${id}`);
  const motif = (card.primary_projects || []).slice(0, 2).join(' and ') || 'open source software';
  const prompt = `Cartoonish cel-shaded digital illustration portrait of ${card.display_name}, ${card.card_title}. Head and shoulders, facing forward, warm characterful semi-caricature comic-art style. Background: dark teal-to-charcoal with faint silhouettes of ${motif}. No text, no logos with letters, no card, no border.`;
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024', quality: 'medium', n: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${card.display_name}: ${data.error.message?.slice(0, 100)}`);
  await fs.writeFile(p, Buffer.from(data.data[0].b64_json, 'base64'));
  return p;
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: CARD_W, height: CARD_H }, deviceScaleFactor: 2 });

async function shoot(html, id, side) {
  // save the self-contained HTML (portrait embedded as data URI) so it can be
  // re-rendered or hand-edited later without regenerating anything
  await fs.writeFile(path.join(OUT, `${id}-${side}.html`), html);
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.locator('.card').screenshot({ path: path.join(OUT, `${id}-${side}.png`) });
}

for (const c of cards) {
  const pPath = await portrait(c);
  const b64 = (await fs.readFile(pPath)).toString('base64');
  const uri = `data:image/png;base64,${b64}`;
  const id = `card_${String(c.card_number).padStart(3, '0')}`;
  await shoot(buildFront(c, uri), id, 'front');
  await shoot(buildBack(c), id, 'back');
  console.log(`✓ ${c.card_number} ${c.display_name} (${rarityOf(c.impact_rating)})`);
}

await browser.close();
console.log(`\nDone. Rendered ${cards.length} cards to dist/html/`);
