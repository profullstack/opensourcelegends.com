#!/usr/bin/env node
/*
  Generate realistic painterly portraits (proof style) for each legend with
  Gemini, cached in assets/portraits-art/card_NNN.png.
  Env: GEMINI_API_KEY   Run: node scripts/gen-portraits.mjs [nums...]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.GEMINI_API_KEY;
const DIR = path.join(ROOT, 'assets', 'portraits-art');
const MODEL = 'gemini-3-pro-image-preview';
const CONCURRENCY = 3;
fs.mkdirSync(DIR, { recursive: true });

const roster = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'roster.locked.json'), 'utf8'));
const only = process.argv.slice(2).map(Number).filter(Boolean);
const cards = only.length ? roster.filter((c) => only.includes(c.card_number)) : roster;

async function gen(card, attempt = 1) {
  const out = path.join(DIR, `card_${String(card.card_number).padStart(3, '0')}.png`);
  if (fs.existsSync(out)) return 'skip';
  const motif = (card.primary_projects || []).slice(0, 2).join(' and ') || 'open source software';
  const prompt = `Realistic semi-painterly digital portrait of ${card.display_name}, ${card.card_title}. Head and shoulders, facing the camera, warm cinematic studio lighting, detailed painted realism in the style of a premium collectible trading-card portrait. Dark background with subtle faint motifs of ${motif}. Recognizable likeness, dignified, professional. No text, no border, no card frame.`;
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!d.candidates) {
    if (attempt <= 2 && /quota|rate|429|500|503|unavailable/i.test(JSON.stringify(d))) {
      await new Promise((r) => setTimeout(r, 4000 * attempt)); return gen(card, attempt + 1);
    }
    throw new Error(JSON.stringify(d.error || d).slice(0, 120));
  }
  const part = d.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
  if (!part) throw new Error('no image part');
  fs.writeFileSync(out, Buffer.from((part.inlineData || part.inline_data).data, 'base64'));
  return 'ok';
}

let i = 0, ok = 0; const fail = [];
async function worker() {
  while (i < cards.length) {
    const c = cards[i++];
    try { const r = await gen(c); if (r === 'ok') { ok++; process.stdout.write(`✓ ${c.card_number} ${c.display_name}\n`); } }
    catch (e) { fail.push(c.card_number); process.stdout.write(`✗ ${c.card_number} ${c.display_name}: ${e.message}\n`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`\nGenerated ${ok}; failed ${fail.length ? fail.join(', ') : 'none'}`);
