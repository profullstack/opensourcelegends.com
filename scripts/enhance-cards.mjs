#!/usr/bin/env node
/*
  Enhance the HTML-rendered cards (dist/html/*.png — accurate text/layout) into
  premium proof-quality cards with Gemini, preserving all text. -> dist/enhanced/
  Env: GEMINI_API_KEY   Run: node scripts/enhance-cards.mjs [nums...]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.GEMINI_API_KEY;
const SRC = path.join(ROOT, 'dist', 'html');
const OUT = path.join(ROOT, 'dist', 'enhanced');
const MODEL = 'gemini-3-pro-image-preview';
const CONCURRENCY = 3;
fs.mkdirSync(OUT, { recursive: true });

const PROMPT = "Enhance this collectible trading card into a premium, professionally-designed printed card with real depth and polish: cinematic lighting and painterly refinement on the portrait, refined dark leather/metal material textures, a tasteful metallic foil accent border, embossed elements, soft inner shadows and subtle gloss — like a high-end collectible gaming/sports trading card. ABSOLUTELY CRITICAL: keep ALL text, numbers, names, titles, labels, stat values, the quote, and the entire layout EXACTLY the same, fully legible and in identical positions — do not change, add, remove, or misspell any text. Only improve the visual finish, depth, materials and lighting.";

const roster = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'roster.locked.json'), 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);
const ids = roster.filter((c) => !only.length || only.includes(c.card_number))
  .map((c) => `card_${String(c.card_number).padStart(3, '0')}`);
const jobs = [];
for (const id of ids) for (const side of ['front', 'back']) {
  if (fs.existsSync(path.join(SRC, `${id}-${side}.png`))) jobs.push(`${id}-${side}`);
}

async function enhance(name, attempt = 1) {
  const out = path.join(OUT, `${name}.png`);
  if (fs.existsSync(out)) return 'skip';
  const img = fs.readFileSync(path.join(SRC, `${name}.png`)).toString('base64');
  const body = { contents: [{ parts: [{ inline_data: { mime_type: 'image/png', data: img } }, { text: PROMPT }] }], generationConfig: { responseModalities: ['IMAGE'] } };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!d.candidates) {
    if (attempt <= 2 && /quota|rate|429|500|503|unavailable|internal/i.test(JSON.stringify(d))) {
      await new Promise((r) => setTimeout(r, 5000 * attempt)); return enhance(name, attempt + 1);
    }
    throw new Error(JSON.stringify(d.error || d).slice(0, 120));
  }
  const part = d.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
  if (!part) throw new Error('no image');
  fs.writeFileSync(out, Buffer.from((part.inlineData || part.inline_data).data, 'base64'));
  return 'ok';
}

let i = 0, ok = 0, skip = 0; const fail = [];
async function worker() {
  while (i < jobs.length) {
    const n = jobs[i++];
    try { const r = await enhance(n); if (r === 'ok') { ok++; process.stdout.write(`✓ ${n}\n`); } else skip++; }
    catch (e) { fail.push(n); process.stdout.write(`✗ ${n}: ${e.message}\n`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nenhanced ${ok}, skipped ${skip}, failed ${fail.length}${fail.length ? ' (' + fail.join(', ') + ')' : ''}`);
