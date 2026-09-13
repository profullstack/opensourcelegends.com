import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { hash } from './core.mjs';

export const PORTRAIT_SETS = {
  legends: ['legends', null],
  hacking: ['hacking-legends', null],
  security: ['security-pros', 'security-references.json'],
  gods: ['gods-of-ai', 'ai-references.json'],
  women: ['women-in-tech', 'women-references.json'],
  ceos: ['tech-ceos', 'ceo-references.json'],
};

// Reuse the approved pixels. Rendering a new card must never replace its person
// with an invented face or a text-prompt interpretation of their contributions.
export async function loadPortrait(card, root) {
  const set = PORTRAIT_SETS[card.series];
  if (!set || !Number.isSafeInteger(card.number) || card.number < 1) throw new Error('Invalid portrait identity');
  const relative = `assets/portraits/${set[0]}/card_${String(card.number).padStart(3, '0')}.png`;
  let bytes;
  try { bytes = await fs.readFile(path.join(root, relative)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!bytes) {
    const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000"><rect width="1000" height="1000" fill="#171e29"/><text x="500" y="470" text-anchor="middle" fill="#d8dde5" font-family="DejaVu Sans,Arial,sans-serif" font-size="48">Portrait pending</text><text x="500" y="535" text-anchor="middle" fill="#96a2b5" font-family="DejaVu Sans,Arial,sans-serif" font-size="25">No approved source portrait is available.</text></svg>';
    return { bytes: await sharp(Buffer.from(placeholder)).png().toBuffer(), format: 'png', source: { status: 'pending' } };
  }
  const metadata = await sharp(bytes).metadata();
  if (metadata.format !== 'png' || metadata.width > 4096 || metadata.height > 4096) throw new Error(`Invalid approved portrait: ${relative}`);
  let reference = null;
  if (set[1]) {
    const references = JSON.parse(await fs.readFile(path.join(root, 'data', set[1]), 'utf8'));
    const entry = references.find((r) => r.number === card.number && r.slug === card.slug);
    if (!entry?.ref) throw new Error(`Approved portrait has no matching source credit: ${card.id}`);
    reference = entry.ref;
  }
  return { bytes, format: 'png', source: { status: 'approved', file: relative, sha256: hash(bytes), reference } };
}
