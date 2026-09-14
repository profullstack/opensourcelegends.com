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

export async function loadPortraitEdits(file) {
  const manifest = JSON.parse(await fs.readFile(file, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.status !== 'complete' || !manifest.expectedIds?.length ||
      manifest.records?.length !== manifest.expectedIds.length ||
      new Set(manifest.expectedIds).size !== manifest.expectedIds.length ||
      new Set(manifest.records.map((r) => r.id)).size !== manifest.records.length ||
      manifest.records.some((r) => !manifest.expectedIds.includes(r.id) || r.reviewed !== true)) {
    throw new Error('Portrait edits must be complete, unique and visually reviewed');
  }
  return new Map(manifest.records.map((r) => [r.id, r]));
}

// A new painting must remain tied to the original source and its photo credit.
// The renderer never commissions a face from a name or other text-only input.
export async function loadPortrait(card, root, edits = null) {
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
  const original = { status: 'approved', file: relative, sha256: hash(bytes), reference };
  if (!edits) return { bytes, format: 'png', source: original };
  const edit = edits.get(card.id);
  if (!edit || edit.source !== relative || edit.sourceSHA256 !== original.sha256 || edit.reviewed !== true) {
    throw new Error(`Missing, unreviewed or mismatched source portrait edit: ${card.id}`);
  }
  const expectedFile = `assets/portraits-v2/${card.id}.png`;
  if (edit.file !== expectedFile) throw new Error(`Unexpected edited portrait path: ${card.id}`);
  const edited = await fs.readFile(path.join(root, expectedFile));
  const info = await sharp(edited).metadata();
  if (info.format !== 'png' || info.width > 4096 || info.height > 4096 || hash(edited) !== edit.sha256 || edit.sha256 === original.sha256) {
    throw new Error(`Invalid or unchanged portrait edit: ${card.id}`);
  }
  return { bytes: edited, format: 'png', source: {
    status: 'approved', file: expectedFile, sha256: edit.sha256, reference,
    method: 'image-edit', basis: { file: relative, sha256: original.sha256 },
    edit: { tool: 'image_gen', prompt: edit.prompt, promptSHA256: edit.promptSHA256, generatedAt: edit.generatedAt, reviewed: true },
  } };
}
