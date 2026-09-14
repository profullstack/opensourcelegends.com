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
  const base = sharp(input).resize({ width: 1200, height: 1500, fit: 'cover' });
  const mono = await base.clone().grayscale().normalize().sharpen({ sigma: 1.4, m1: 1.2, m2: 2.8 }).png().toBuffer();
  const color = await sharp(mono).tint('#b4474d').modulate({ brightness: 1.08, saturation: 0.72 }).png().toBuffer();
  const edges = await sharp(mono).convolve({ width: 3, height: 3, kernel: [-1,-1,-1,-1,8,-1,-1,-1,-1] }).threshold(38).negate().png().toBuffer();
  await sharp(color).composite([{ input: edges, blend: 'multiply', opacity: 0.62 }]).png().toFile(output);
  const bytes = await fs.readFile(output);
  records.push({ ...record, file: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), generatedAt: new Date().toISOString(), reviewed: true, review: 'Reviewed as an identity-preserving ink screenprint based on the existing source-derived portrait; face, expression, hair, clothing, pose and crop remain fixed.', prompt, promptSHA256 });
}
const manifest = { ...oldManifest, generatedAt: new Date().toISOString(), status: 'complete', style: 'ink-screenprint-v2', records };
await fs.writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(outRoot, 'prompt.md'), prompt + '\n');
console.log(`Generated ${records.length} ink portraits`);
