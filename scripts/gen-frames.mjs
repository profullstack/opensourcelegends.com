#!/usr/bin/env node
/*
  Generate accent-coloured card frames by recolouring the base gold frame with
  Gemini (nano-banana). Keeps one consistent design across the palette.
  Env: GEMINI_API_KEY   Run: node scripts/gen-frames.mjs
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.GEMINI_API_KEY;
const DIR = path.join(ROOT, 'assets', 'frames');
const MODEL = 'gemini-2.5-flash-image';

// palette hex -> colour description for the recolour prompt
const COLORS = {
  'e0473a': 'bright crimson red', 'f0822e': 'vivid orange', '3e7bd6': 'royal blue',
  '36b37e': 'emerald green', '9b6bff': 'violet purple', '2bb3c0': 'cyan teal', 'e35d8a': 'magenta pink',
};

const base = fssync.readFileSync(path.join(DIR, 'frame-gold.png')).toString('base64');

for (const [hex, name] of Object.entries(COLORS)) {
  const out = path.join(DIR, `frame-${hex}.png`);
  if (fssync.existsSync(out)) { console.log('skip', hex); continue; }
  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: 'image/png', data: base } },
      { text: `Recolour the metallic gold border and corner ornaments of this trading-card frame to ${name}. Keep the exact same design, layout, ornaments, dark carbon interior, and proportions — only change the metallic accent colour to ${name}. No text.` },
    ] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.candidates) { console.log('✗', hex, JSON.stringify(data).slice(0, 160)); continue; }
  const part = data.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
  if (!part) { console.log('✗', hex, 'no image'); continue; }
  await fs.writeFile(out, Buffer.from((part.inlineData || part.inline_data).data, 'base64'));
  console.log('✓', hex, name);
}
// alias gold by hex too
if (!fssync.existsSync(path.join(DIR, 'frame-f5c451.png'))) fssync.copyFileSync(path.join(DIR, 'frame-gold.png'), path.join(DIR, 'frame-f5c451.png'));
console.log('done');
