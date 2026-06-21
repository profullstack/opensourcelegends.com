#!/usr/bin/env node
/*
  AI card renderer — generates full proof-style card faces with OpenAI gpt-image-1,
  using the printer proof (docs/proof1.png) as the visual style reference.

  Front + back per card, modeled on docs/proof1.png. Resumable (skips existing).

  Env:  OPENAI_API_KEY
  Run:  node scripts/ai-cards.mjs            # all 50, both sides
        node scripts/ai-cards.mjs 2 5 9      # only these card numbers
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.OPENAI_API_KEY;
const OUT = path.join(ROOT, 'dist', 'ai');
const PROOF = path.join(ROOT, 'docs', 'proof1.png');
const CONCURRENCY = 4;
const SIZE = '1024x1536';

if (!KEY) { console.error('OPENAI_API_KEY not set'); process.exit(1); }
await fs.mkdir(OUT, { recursive: true });

// Build ISOLATED single-card references from the proof sheet (top row = front,
// bottom row = back). Each card is extracted tightly and padded onto a clean dark
// background so the model never sees a neighbouring card — this prevents the
// "sliver of the next card at the bottom" cropping artifact.
const refFront = path.join(OUT, '_ref_front.png');
const refBack = path.join(OUT, '_ref_back.png');
async function isolatedRef(extractOpts, outPath) {
  const card = await sharp(PROOF).extract(extractOpts).png().toBuffer();
  await sharp({ create: { width: 358, height: 558, channels: 3, background: '#0b0d14' } })
    .composite([{ input: card, left: 40, top: 40 }])
    .png()
    .toFile(outPath);
}
await isolatedRef({ left: 14, top: 10, width: 278, height: 478 }, refFront);
await isolatedRef({ left: 14, top: 528, width: 278, height: 478 }, refBack);

const roster = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'roster.locked.json'), 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);
const cards = only.length ? roster.filter((c) => only.includes(c.card_number)) : roster;

const rarity = (n) => (n >= 95 ? 'ICONIC' : n >= 90 ? 'LEGENDARY' : n >= 85 ? 'EPIC' : 'RARE');
const pad = (n) => String(n).padStart(2, '0');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function traits(c) {
  const map = [
    ['ARCHITECT', c.code_rating], ['PIONEER', c.innovation_rating],
    ['BUILDER', c.community_rating], ['RELENTLESS', c.longevity_rating],
  ].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  return [...map, rarity(c.impact_rating)].join('  ·  ');
}

function frontPrompt(c) {
  const kws = traits(c);
  const motif = (c.primary_projects || []).slice(0, 2).join(' and ');
  return `Recreate the SINGLE trading card in the reference image as a collectible card FRONT for "Open Source Legends", fully visible and centered, filling the frame.
IMPORTANT: render exactly ONE card. Do NOT show a second card or any partial card at the top or bottom edge.
Match the reference layout exactly: dark foil border, "OPEN SOURCE LEGENDS" crest emblem in the top-right, large card-number chip in the top-left, a framed portrait over a subtle dark themed background, a lower name plate, a title sub-line, and a row of three short skill keywords with a small themed icon and a </> mark.
The PORTRAIT must be a STYLIZED DIGITAL ILLUSTRATION — smooth cel-shaded semi-caricature comic-art style (like a polished illustrated sports/collectible card), warm and characterful, slightly exaggerated features. NOT a photograph, NOT photorealistic.
This card:
- number: ${pad(c.card_number)}
- portrait: illustrated likeness of ${c.display_name} (${c.nationality}), facing forward
- background motif: faint silhouettes/logos of ${motif || 'open source software'}
- name (large): ${c.display_name.toUpperCase()}
- title: ${c.card_title.toUpperCase()}
- three skill keywords: ${kws}
Spell all text exactly as given, crisp and perfectly legible (the crest reads "OPEN SOURCE LEGENDS"). Premium foil collectible card. Match the reference layout precisely.`;
}

function backPrompt(c) {
  const bars = [
    ['CODE ARCHITECTURE', c.code_rating],
    ['INNOVATION', c.innovation_rating],
    ['COMMUNITY IMPACT', c.community_rating],
    ['LONGEVITY', c.longevity_rating],
    ['OPEN SOURCE IMPACT', c.impact_rating],
  ].map(([l, v]) => `${l} ${v}`).join('; ');
  return `Recreate the SINGLE trading card in the reference image as a collectible card BACK for "Open Source Legends", fully visible and centered, filling the frame.
IMPORTANT: render exactly ONE card. Do NOT show a second card or any partial card at the top or bottom edge.
Match the reference layout exactly: dark foil border. Top: small card number "${pad(c.card_number)}", name "${c.display_name.toUpperCase()}", title "${c.card_title.toUpperCase()}". A "SCOUTING REPORT" text block, a "SIGNATURE PROJECTS" bulleted list, a "SKILL STACK" section with horizontal rating bars and numbers, a large "IMPACT" score box with a rarity label and stars, a quote near the bottom, and a footer row with BORN / NATIONALITY / KNOWN FOR and a </> mark.
Spell every word and number EXACTLY as given below — do not invent or misspell text. This card's data:
- SCOUTING REPORT: ${c.scouting_report}
- SIGNATURE PROJECTS: ${(c.primary_projects || []).slice(0, 4).join(', ')}
- SKILL STACK bars (label then 0-100): ${bars}
- IMPACT: ${c.impact_rating} ${rarity(c.impact_rating)} (5 stars)
- QUOTE: "${c.collector_note}"
- BORN: ${c.birth_date}; NATIONALITY: ${c.nationality}; KNOWN FOR: ${c.known_for}
Crisp, perfectly legible text. Match the reference layout precisely.`;
}

async function gen(side, c, ref, prompt, attempt = 1) {
  const out = path.join(OUT, `card_${String(c.card_number).padStart(3, '0')}-${slug(c.display_name)}-${side}.png`);
  if (fssync.existsSync(out)) return 'skip';
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('size', SIZE);
  form.append('quality', 'medium');
  form.append('prompt', prompt);
  form.append('image[]', new Blob([await fs.readFile(ref)], { type: 'image/png' }), 'ref.png');
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: form,
  });
  const data = await res.json();
  if (data.error) {
    if (attempt <= 2 && /rate|429|timeout|server|503/i.test(JSON.stringify(data.error))) {
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      return gen(side, c, ref, prompt, attempt + 1);
    }
    throw new Error(`${side} ${c.display_name}: ${data.error.message?.slice(0, 100)}`);
  }
  await sharp(Buffer.from(data.data[0].b64_json, 'base64')).png().toFile(out);
  return 'ok';
}

// Fronts are AI-generated (little text -> renders cleanly). Backs are intentionally
// NOT AI-generated to avoid garbled stats; the main generator renders accurate backs.
// Pass --backs to also generate AI backs (text may be imperfect).
const withBacks = process.argv.includes('--backs');
const jobs = [];
for (const c of cards) {
  jobs.push({ side: 'front', c, ref: refFront, prompt: frontPrompt(c) });
  if (withBacks) jobs.push({ side: 'back', c, ref: refBack, prompt: backPrompt(c) });
}

let i = 0, ok = 0, skip = 0; const fail = [];
async function worker() {
  while (i < jobs.length) {
    const j = jobs[i++];
    try {
      const r = await gen(j.side, j.c, j.ref, j.prompt);
      if (r === 'ok') { ok++; process.stdout.write(`✓ ${j.c.card_number} ${j.side} ${j.c.display_name}\n`); }
      else skip++;
    } catch (e) {
      fail.push(`${j.c.card_number}-${j.side}`);
      process.stdout.write(`✗ ${e.message}\n`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nDone. generated=${ok} skipped=${skip} failed=${fail.length} ${fail.length ? '(' + fail.join(', ') + ')' : ''}`);
