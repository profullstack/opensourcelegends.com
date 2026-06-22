#!/usr/bin/env node
/*
  Recolour the proof-derived base frames (assets/frames/base-front.png and
  base-back.png — generated from docs/proof1.png via Gemini) into the 8 palette
  accent colours, using Gemini nano-banana (consistent design).
  Env: GEMINI_API_KEY   Run: node scripts/gen-frames.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = process.env.GEMINI_API_KEY;
const DIR = path.join(ROOT, 'assets', 'frames');
const MODEL = 'gemini-2.5-flash-image';

// base frames are violet (#9b6bff); recolour to each palette colour
const COLORS = {
  f5c451: 'metallic gold and amber', e0473a: 'bright crimson red', f0822e: 'vivid orange',
  '3e7bd6': 'royal blue', '36b37e': 'emerald green', '9b6bff': 'violet purple (keep as-is)',
  '2bb3c0': 'cyan teal', e35d8a: 'magenta pink',
};

async function recolour(baseB64, name) {
  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: 'image/png', data: baseB64 } },
      { text: `Recolour the glowing violet/purple accent of this trading-card frame (the border glow and circuit motifs) to ${name}. Keep the EXACT same design, layout, motifs, proportions and dark interior — only change the accent colour. No text.` },
    ] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await res.json();
  if (!d.candidates) return null;
  const part = d.candidates[0].content.parts.find((p) => p.inlineData || p.inline_data);
  return part ? Buffer.from((part.inlineData || part.inline_data).data, 'base64') : null;
}

for (const side of ['front', 'back']) {
  const base = fs.readFileSync(path.join(DIR, `base-${side}.png`)).toString('base64');
  for (const [hex, name] of Object.entries(COLORS)) {
    const out = path.join(DIR, `frame-${side}-${hex}.png`);
    if (fs.existsSync(out)) { console.log('skip', side, hex); continue; }
    if (hex === '9b6bff') { fs.copyFileSync(path.join(DIR, `base-${side}.png`), out); console.log('✓', side, hex, '(base)'); continue; }
    const buf = await recolour(base, name);
    if (!buf) { console.log('✗', side, hex); continue; }
    fs.writeFileSync(out, buf);
    console.log('✓', side, hex, name);
  }
}
console.log('done');
