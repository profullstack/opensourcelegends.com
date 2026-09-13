import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import sharp from 'sharp';

export const SERIES = {
  legends: { file: 'cards.ts', export: 'cards', label: 'Open Source Legends', color: '#64efb4' },
  hacking: { file: 'hacking.ts', export: 'hackers', label: 'Hacking Legends', color: '#ff9369' },
  security: { file: 'security.ts', export: 'pros', label: 'Security Professionals', color: '#69caff' },
  gods: { file: 'ai.ts', export: 'architects', label: 'Gods of AI', color: '#ad9cff' },
  women: { file: 'women.ts', export: 'builders', label: 'Women in Tech', color: '#ffc66c' },
  ceos: { file: 'ceos.ts', export: 'executives', label: 'Tech CEOs', color: '#fa9ad5' },
};
export const PIPELINE_VERSION = '2.1.0-portraits';
export const hash = (value) => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
export const escapeXML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
export const normalize = (s) => String(s ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const json = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
export async function atomicWrite(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data, null, 2) + '\n');
  await fs.rename(tmp, file);
}
export function safeURL(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
function canonical(value) {
  const valid = safeURL(value);
  if (!valid) return '';
  const u = new URL(valid);
  return (u.hostname.replace(/^www\./, '') + decodeURIComponent(u.pathname).replace(/\/$/, '')).toLowerCase();
}
export async function loadCards(root, selected = Object.keys(SERIES)) {
  const roster = await json(path.join(root, 'data/roster.locked.json'));
  const output = [];
  for (const series of selected) {
    if (!SERIES[series]) throw new Error(`Unknown series: ${series}`);
    const mod = await import(pathToFileURL(path.join(root, 'src/data', SERIES[series].file)).href);
    for (const original of mod[SERIES[series].export]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(original.slug) || !Number.isInteger(original.number) || original.number < 1) throw new Error(`Unsafe card identity in ${series}`);
      const legacy = series === 'legends' ? roster.find((c) => c.card_number === original.number) : null;
      const sources = (original.sources ?? (legacy?.source_urls ?? []).map((url) => ({ label: 'Original roster reference', url })))
        .filter((s) => safeURL(s.url) && !/google\.com\/search/.test(s.url));
      output.push({ ...original, series, sources, id: `${series}/${String(original.number).padStart(3, '0')}-${original.slug}` });
    }
  }
  if (new Set(output.map((c) => c.id)).size !== output.length) throw new Error('Duplicate card identifiers');
  return output;
}

// NicheDB's search returns mixed collections. A name alone is insufficient:
// require an actual person/profile and a known URL or a contribution phrase.
export function matchRecords(card, items) {
  const names = new Set([card.name, card.handle].filter(Boolean).map(normalize));
  const sourceURLs = new Set(card.sources.map((s) => canonical(s.url)).filter(Boolean));
  const projects = (card.projects ?? []).map(normalize).filter((p) => p.length >= 4);
  const matches = [];
  for (const item of items) {
    if (!['person', 'profile'].includes(item.kind) && item.collection !== 'profiles') continue;
    const data = item.data && typeof item.data === 'object' ? item.data : {};
    if (![item.title, data.name, data.display_name].some((n) => names.has(normalize(n)))) continue;
    const links = [item.url, data.url, data.website, data.wikipedia, data.wikipedia_url, ...(Array.isArray(data.urls) ? data.urls : [])];
    const sameURL = links.some((u) => sourceURLs.has(canonical(u)));
    const context = ` ${normalize([item.summary, ...(item.tags ?? []), JSON.stringify(data)].join(' '))} `;
    const project = projects.find((p) => context.includes(` ${p} `));
    if (!sameURL && !project) continue;
    if (!safeURL(item.url) || !Number.isSafeInteger(item.id)) continue;
    matches.push({
      id: item.id, title: String(item.title ?? '').slice(0, 250), summary: String(item.summary ?? '').slice(0, 6000),
      url: safeURL(item.url), page: safeURL(item.page), collection: item.collection, kind: item.kind,
      source: item.source ?? null, updatedAt: item.updated_at ?? null,
      tags: (Array.isArray(item.tags) ? item.tags : []).filter((t) => typeof t === 'string').slice(0, 30),
      matchedBy: sameURL ? 'name-and-known-url' : `name-and-project:${project}`,
    });
  }
  return [...new Map(matches.map((m) => [m.id, m])).values()];
}

// Deliberately limited static SVG dialect. All attributes are inspected after
// XML decoding, so entity-escaped URLs and event handlers cannot bypass checks.
const TAGS = new Set('svg g defs path rect circle ellipse line polyline polygon linearGradient radialGradient stop clipPath mask title desc'.split(' '));
const ATTRS = new Set('xmlns viewBox width height x y x1 y1 x2 y2 cx cy r rx ry d points fill fill-opacity fill-rule stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity transform id gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity clip-path clip-rule mask maskUnits maskContentUnits preserveAspectRatio color vector-effect'.split(' '));
export async function validateSVG(raw) {
  const svg = String(raw).trim();
  if (Buffer.byteLength(svg) > 1_500_000 || /<!|<\?/.test(svg)) throw new Error('SVG must be at most 1.5 MB, without declarations, entities, comments or processing instructions');
  const doc = new DOMParser({ onError: (level, message) => { throw new Error(`Invalid XML: ${message}`); } }).parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.tagName !== 'svg' || root.getAttribute('xmlns') !== 'http://www.w3.org/2000/svg') throw new Error('Expected SVG root and namespace');
  if (Array.from(doc.childNodes).some((n) => n !== root && (n.nodeType !== 3 || n.nodeValue.trim()))) throw new Error('Only one SVG root is allowed');
  const box = root.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
  if (box.length !== 4 || box.some((n) => !Number.isFinite(n)) || box[0] !== 0 || box[1] !== 0 || box[2] !== 1000 || box[3] !== 1000) throw new Error('Artwork must use viewBox="0 0 1000 1000"');
  let shapes = 0;
  const ids = new Set();
  const refs = [];
  const walk = (node) => {
    if (node.nodeType === 3) {
      if (node.nodeValue.trim() && !['title', 'desc'].includes(node.parentNode.tagName)) throw new Error('Artwork cannot contain rendered text');
      return;
    }
    if (node.nodeType !== 1) throw new Error('Unsupported XML node');
    if (!TAGS.has(node.tagName) || node.namespaceURI !== 'http://www.w3.org/2000/svg') throw new Error(`Unsupported SVG element: ${node.tagName}`);
    if (['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line'].includes(node.tagName)) shapes++;
    for (const attr of Array.from(node.attributes)) {
      const value = attr.value;
      if (!ATTRS.has(attr.name) || /[\\<>]|javascript:|data:|https?:|@import/i.test(value) && attr.name !== 'xmlns') throw new Error(`Unsafe SVG attribute: ${attr.name}`);
      if (attr.name === 'xmlns' && (node !== root || value !== 'http://www.w3.org/2000/svg')) throw new Error('Nested namespace not allowed');
      if (attr.name === 'id') { if (!/^[A-Za-z][\w-]*$/.test(value) || ids.has(value)) throw new Error('Invalid/duplicate SVG id'); ids.add(value); }
      if (/url\s*\(/i.test(value)) {
        const local = /^url\(#([A-Za-z][\w-]*)\)$/.exec(value);
        if (!local) throw new Error('Only local SVG paint references are allowed');
        refs.push(local[1]);
      }
    }
    for (const child of Array.from(node.childNodes)) walk(child);
  };
  walk(root);
  if (!shapes || refs.some((id) => !ids.has(id))) throw new Error('SVG has no geometry or has broken local references');
  root.setAttribute('width', '1000'); root.setAttribute('height', '1000');
  const clean = new XMLSerializer().serializeToString(doc);
  // Fully render to catch invalid paths/paint and invisible/blank output.
  const rendered = await sharp(Buffer.from(clean), { limitInputPixels: 2_000_000 }).resize(128, 128).ensureAlpha().raw().toBuffer();
  let visible = 0;
  const colors = new Set();
  for (let i = 0; i < rendered.length; i += 4) if (rendered[i + 3] > 16) {
    visible++; colors.add(`${rendered[i] >> 4},${rendered[i + 1] >> 4},${rendered[i + 2] >> 4}`);
  }
  if (visible < 512 || colors.size < 3) throw new Error('Artwork is blank or lacks visible detail');
  return clean;
}

function textBlock(text, { x = 48, y, size = 22, width = 904, lineHeight = size * 1.4, maxLines = 6, fill = '#d8dde5' }) {
  // Conservative metrics for the system sans font; fail instead of truncating facts.
  const max = Math.floor(width / (size * 0.63));
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  for (let word of words) {
    if (word.length > max) throw new Error('Unbreakable card text exceeds the layout width');
    if (!lines.length || `${lines.at(-1)} ${word}`.trim().length > max) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  if (lines.length > maxLines) throw new Error(`Card text exceeds ${maxLines} lines; adjust the v2 typesetting`);
  return `<text fill="${fill}" font-size="${size}" font-family="DejaVu Sans,Arial,sans-serif">${lines.map((l, i) => `<tspan x="${x}" y="${y + i * lineHeight}">${escapeXML(l)}</tspan>`).join('')}</text>`;
}
export function renderFaces(card, artwork, format) {
  const color = SERIES[card.series].color;
  const shell = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1490" width="1000" height="1490"><title>${escapeXML(card.name)} — Open Source Legends v2</title><rect width="1000" height="1490" rx="26" fill="#10141c"/>${body}</svg>`;
  const small = (text, y) => textBlock(text, { y, size: 18, fill: color, maxLines: 1 });
  const art = format === 'svg'
    ? `<svg x="40" y="160" width="920" height="920" viewBox="0 0 1000 1000">${artwork.toString().replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg>`
    : `<image x="40" y="160" width="920" height="920" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${artwork.toString('base64')}"/>`;
  const front = shell(`${small(`${SERIES[card.series].label.toUpperCase()} / V2`, 64)}${textBlock(card.name, { y: 122, size: card.name.length > 28 ? 32 : 40, fill: '#ffffff', maxLines: 1 })}${art}${textBlock(card.title, { y: 1140, size: 30, fill: '#ffffff', maxLines: 3 })}${textBlock(card.knownFor, { y: 1290, size: 22, maxLines: 3 })}${small(`${String(card.number).padStart(3, '0')} / ${card.rarity.toUpperCase()} / ${card.portrait?.status === 'pending' ? 'PORTRAIT PENDING' : 'PORTRAIT EDITION'}`, 1442)}`);
  const back = shell(`${small(`${SERIES[card.series].label.toUpperCase()} / V2`, 64)}${textBlock(card.name, { y: 145, size: 38, fill: '#ffffff', maxLines: 2 })}<rect x="48" y="228" width="904" height="5" fill="${color}"/>${small('THE CONTRIBUTION', 292)}${textBlock(card.scouting, { y: 344, size: 24, maxLines: 18 })}${small('PROJECTS / DOMAINS', 1005)}${textBlock((card.projects ?? card.domains ?? []).join(' · '), { y: 1050, size: 21, maxLines: 5 })}${small('PROVENANCE', 1270)}${textBlock(`${card.sources.length} references. NicheDB: ${card.research.status}. Sources and metadata accompany this card in cards.json.`, { y: 1310, size: 19, maxLines: 3 })}${small(`${String(card.number).padStart(3, '0')} / EDITION 2 / PORTRAIT SOURCES IN CATALOG`, 1442)}`);
  return { front, back };
}
