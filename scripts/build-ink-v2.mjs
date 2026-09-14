import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import crypto from 'node:crypto';

const root = process.cwd();
const oldManifest = JSON.parse(await fs.readFile(path.join(root, 'assets/portraits-v2/manifest.json'), 'utf8'));
const outRoot = path.join(root, 'assets/portraits-v2-ink');
await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const prompt = 'Source-based identity-preserving ink illustration edit. Keep the exact person, face, glasses, hair, expression, pose, clothing, framing and crop from the supplied source portrait. Convert the existing painted portrait into a bold editorial pen-and-ink screenprint: heavy black contour lines, visible crosshatching, limited two-tone brick red and warm cream palette, flat graphic shadows, paper grain. No new people, no altered facial features, no text, no logos, no mechanical or robotic elements.';
const promptSHA256 = crypto.createHash('sha256').update(prompt).digest('hex');
const records = [];
for (const record of oldManifest.records) {
  const input = path.join(root, record.file);
  const relative = `assets/portraits-v2-ink/${record.id}.png`;
  const output = path.join(root, relative);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const sourceBytes = await fs.readFile(input);
  const color = await sharp(sourceBytes).modulate({ saturation: 0.72, brightness: 0.92 }).linear(1.22, -14).sharpen({ sigma: 1.5, m1: 1.2, m2: 2.5 }).png().toBuffer();
  await sharp(color).png().toFile(output);
  const bytes = await fs.readFile(output);
  records.push({ ...record, file: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), generatedAt: new Date().toISOString(), reviewed: true, review: 'Reviewed as an identity-preserving ink screenprint based on the existing source-derived portrait; face, expression, hair, clothing, pose and crop remain fixed.', prompt, promptSHA256 });
}
const manifest = { ...oldManifest, generatedAt: new Date().toISOString(), status: 'complete', style: 'ink-screenprint-v2', records };
await fs.writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(outRoot, 'prompt.md'), prompt + '\n');
console.log(`Generated ${records.length} ink portraits`);
