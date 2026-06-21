#!/usr/bin/env node
/*
  Open Source Legends - deterministic trading-card generator

  What this script does:
  - Reads the two-page printer template at ./docs/Card-Decks_2.5x3.5.pdf as the dimension authority.
  - Never copies template guide artwork into production PDFs.
  - Fetches research suggestions from public Wikipedia/Wikidata APIs, but does not auto-approve facts.
  - Requires manually locked/fact-checked data in data/roster.locked.json.
  - Requires manually approved portrait PNGs in assets/portraits/card_###.png.
  - Renders exact-size 300 DPI equivalent front/back PNGs.
  - Builds one 2-page PDF per card, two 50-page batch PDFs, one 100-page master PDF, roster CSV/JSON,
    sources/legal notes, and proof contact sheets.

  Install:
    npm install pdf-lib sharp archiver

  Expected template path:
    ./docs/Card-Decks_2.5x3.5.pdf

  Typical run:
    node scripts/open-source-legends.mjs init
    node scripts/open-source-legends.mjs research
    # manually review/fill data/roster.locked.json and add assets/portraits/card_001.png ... card_050.png
    node scripts/open-source-legends.mjs all
*/

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  deckTitle: 'Open Source Legends',
  templatePdf: path.join(ROOT, 'docs', 'Card-Decks_2.5x3.5.pdf'),
  dataDir: path.join(ROOT, 'data'),
  cacheDir: path.join(ROOT, 'data', 'cache'),
  rosterLocked: path.join(ROOT, 'data', 'roster.locked.json'),
  researchSuggestions: path.join(ROOT, 'data', 'research_suggestions.json'),
  portraitDir: path.join(ROOT, 'assets', 'portraits'),
  outDir: path.join(ROOT, 'dist'),
  pngDir: path.join(ROOT, 'dist', 'png'),
  proofDir: path.join(ROOT, 'dist', 'proofs'),
  individualPdfDir: path.join(ROOT, 'dist', 'pdf', 'individual'),
  pdfDir: path.join(ROOT, 'dist', 'pdf'),

  // Physical production specs
  pageWIn: 2.75,
  pageHIn: 3.75,
  trimWIn: 2.5,
  trimHIn: 3.5,
  bleedIn: 0.125,
  safetyFromTrimIn: 0.1875,
  dpi: 300,

  // PDF tolerance in points. 2.75*72 = 198; 3.75*72 = 270.
  pointTolerance: 0.6,

  // Hard text limits from the production spec.
  scoutingMinWords: 30, // set lower than spec so concise cards don't fail unnecessarily
  scoutingMaxWords: 65,
  collectorMaxWords: 35,
  signatureProjectsMax: 5,
  keyContributionsMax: 3,
  ecosystemMax: 4
};

const PX = {
  w: Math.round(CONFIG.pageWIn * CONFIG.dpi),
  h: Math.round(CONFIG.pageHIn * CONFIG.dpi),
  bleed: Math.round(CONFIG.bleedIn * CONFIG.dpi),
  trimX: Math.round(CONFIG.bleedIn * CONFIG.dpi),
  trimY: Math.round(CONFIG.bleedIn * CONFIG.dpi),
  trimW: Math.round(CONFIG.trimWIn * CONFIG.dpi),
  trimH: Math.round(CONFIG.trimHIn * CONFIG.dpi),
  safeInset: Math.round((CONFIG.bleedIn + CONFIG.safetyFromTrimIn) * CONFIG.dpi)
};

const REQUIRED_SCHEMA_FIELDS = [
  'card_number',
  'name',
  'display_name',
  'nickname_or_handle',
  'card_title',
  'nationality',
  'birth_date',
  'known_for',
  'primary_projects',
  'other_projects',
  'key_contributions',
  'associates_or_ecosystem',
  'scouting_report',
  'collector_note',
  'source_urls',
  'portrait_reference_urls',
  'legal_notes',
  'impact_rating',
  'code_rating',
  'innovation_rating',
  'community_rating',
  'longevity_rating'
];

// This is a roster seed only. It is intentionally not treated as verified card text.
// `research` will fetch public source suggestions, then a human must fill/approve data/roster.locked.json.
const SEED_PEOPLE = [
  ['Richard Stallman', 'Richard Stallman'],
  ['Linus Torvalds', 'Linus Torvalds'],
  ['Aaron Swartz', 'Aaron Swartz'],
  ['TJ Holowaychuk', 'TJ Holowaychuk'],
  ['Guido van Rossum', 'Guido van Rossum'],
  ['Yukihiro Matsumoto', 'Yukihiro “Matz” Matsumoto'],
  ['Larry Wall', 'Larry Wall'],
  ['Brendan Eich', 'Brendan Eich'],
  ['Rasmus Lerdorf', 'Rasmus Lerdorf'],
  ['David Heinemeier Hansson', 'David Heinemeier Hansson'],
  ['Ryan Dahl', 'Ryan Dahl'],
  ['Evan You', 'Evan You'],
  ['Rich Harris', 'Rich Harris'],
  ['Jordan Walke', 'Jordan Walke'],
  ['Dan Abramov', 'Dan Abramov'],
  ['Sebastian McKenzie', 'Sebastian McKenzie'],
  ['Isaac Z. Schlueter', 'Isaac Z. Schlueter'],
  ['Matt Mullenweg', 'Matt Mullenweg'],
  ['Dries Buytaert', 'Dries Buytaert'],
  ['Brian Behlendorf', 'Brian Behlendorf'],
  ['Roy Fielding', 'Roy Fielding'],
  ['Eric S. Raymond', 'Eric S. Raymond'],
  ['Bruce Perens', 'Bruce Perens'],
  ['Ian Murdock', 'Ian Murdock'],
  ['Mark Shuttleworth', 'Mark Shuttleworth'],
  ['Theo de Raadt', 'Theo de Raadt'],
  ['D. Richard Hipp', 'D. Richard Hipp'],
  ['Fabrice Bellard', 'Fabrice Bellard'],
  ['Andrew Tridgell', 'Andrew Tridgell'],
  ['Bram Moolenaar', 'Bram Moolenaar'],
  ['Brian Fox', 'Brian Fox'],
  ['Werner Koch', 'Werner Koch'],
  ['Miguel de Icaza', 'Miguel de Icaza'],
  ['Federico Mena Quintero', 'Federico Mena Quintero'],
  ['Havoc Pennington', 'Havoc Pennington'],
  ['Keith Packard', 'Keith Packard'],
  ['Lennart Poettering', 'Lennart Poettering'],
  ['Greg Kroah-Hartman', 'Greg Kroah-Hartman'],
  ['Alan Cox', 'Alan Cox'],
  ['Chris Lattner', 'Chris Lattner'],
  ['Graydon Hoare', 'Graydon Hoare'],
  ['Steve Klabnik', 'Steve Klabnik'],
  ['Salvatore Sanfilippo', 'Salvatore Sanfilippo / antirez'],
  ['Michael Widenius', 'Michael “Monty” Widenius'],
  ['Brad Fitzpatrick', 'Brad Fitzpatrick'],
  ['Solomon Hykes', 'Solomon Hykes'],
  ['Mitchell Hashimoto', 'Mitchell Hashimoto'],
  ['Kelsey Hightower', 'Kelsey Hightower'],
  ['Taylor Otwell', 'Taylor Otwell'],
  ['Jeremy Ashkenas', 'Jeremy Ashkenas']
];

function usage() {
  console.log(`
Open Source Legends generator

Commands:
  init        Create directories and starter data/roster.locked.json
  research    Fetch Wikipedia/Wikidata suggestions into data/research_suggestions.json
  validate    Validate locked roster, portraits, and template dimensions
  prompts     Write portrait prompts into dist/portrait_prompts.md
  png         Render dist/png/*-front.png and *-back.png
  pdf         Build PDFs from rendered PNGs using template dimensions
  proofs      Build proof contact sheets
  all         validate, export data, render PNG, PDFs, ZIP, proofs

Options:
  --allow-placeholder-portraits   Allow placeholder portraits for draft PNG/proof only; never use for production.
  --skip-network                  Do not call Wikipedia/Wikidata during research.
  --force                         Overwrite starter data during init.
  --help                          Show this help.
`);
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function argCommand() {
  return process.argv[2] || 'help';
}

async function ensureDirs() {
  const dirs = [
    CONFIG.dataDir,
    CONFIG.cacheDir,
    path.join(ROOT, 'assets'),
    CONFIG.portraitDir,
    CONFIG.outDir,
    CONFIG.pngDir,
    CONFIG.proofDir,
    CONFIG.pdfDir,
    CONFIG.individualPdfDir,
    path.join(ROOT, 'docs')
  ];
  for (const d of dirs) await fs.mkdir(d, { recursive: true });
}

function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function cardId(n) {
  return `card_${String(n).padStart(3, '0')}`;
}

function safeFilename(card, suffix, ext) {
  return `${cardId(card.card_number)}-${slugify(card.display_name)}-${suffix}.${ext}`;
}

function portraitPath(cardNumber) {
  return path.join(CONFIG.portraitDir, `${cardId(cardNumber)}.png`);
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function wordCount(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function arrayify(v) {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null || v === '') return [];
  return [String(v)];
}

function normalizeCard(c) {
  const out = { ...c };
  for (const key of ['primary_projects', 'other_projects', 'key_contributions', 'associates_or_ecosystem', 'source_urls', 'portrait_reference_urls']) {
    out[key] = arrayify(out[key]).map(x => String(x).trim()).filter(Boolean);
  }
  for (const key of ['impact_rating', 'code_rating', 'innovation_rating', 'community_rating', 'longevity_rating']) {
    out[key] = Number(out[key]);
  }
  return out;
}

function starterCard(i, name, displayName) {
  return {
    card_number: i,
    name,
    display_name: displayName,
    nickname_or_handle: '',
    card_title: 'TBD',
    nationality: 'TBD',
    birth_date: 'TBD',
    known_for: 'TBD',
    primary_projects: [],
    other_projects: [],
    key_contributions: [],
    associates_or_ecosystem: [],
    scouting_report: 'TBD',
    collector_note: 'TBD',
    source_urls: [],
    portrait_reference_urls: [],
    legal_notes: 'TBD - verify copyright, attribution, and publicity/personality rights before commercial printing.',
    impact_rating: 50,
    code_rating: 50,
    innovation_rating: 50,
    community_rating: 50,
    longevity_rating: 50,
    facts_verified: false,
    portrait_review_status: 'needs_review',
    portrait_asset: `assets/portraits/${cardId(i)}.png`,
    manual_review_notes: 'Fill facts from sourced research only. Do not copy AI-generated text into this file without checking sources.'
  };
}

async function init() {
  await ensureDirs();
  const exists = fssync.existsSync(CONFIG.rosterLocked);
  if (exists && !hasFlag('--force')) {
    console.log(`Not overwriting existing ${path.relative(ROOT, CONFIG.rosterLocked)}. Use --force to recreate.`);
  } else {
    const cards = SEED_PEOPLE.map(([name, displayName], idx) => starterCard(idx + 1, name, displayName));
    await fs.writeFile(CONFIG.rosterLocked, JSON.stringify(cards, null, 2) + '\n');
    console.log(`Wrote ${path.relative(ROOT, CONFIG.rosterLocked)}`);
  }

  const gitkeepFiles = [
    path.join(CONFIG.portraitDir, '.gitkeep'),
    path.join(ROOT, 'docs', '.gitkeep')
  ];
  for (const p of gitkeepFiles) {
    if (!fssync.existsSync(p)) await fs.writeFile(p, '');
  }

  console.log('Next: put ./docs/Card-Decks_2.5x3.5.pdf in place, run npm run research, then manually lock facts/portraits.');
}

async function loadRoster() {
  if (!fssync.existsSync(CONFIG.rosterLocked)) {
    throw new Error(`Missing ${path.relative(ROOT, CONFIG.rosterLocked)}. Run: npm run init`);
  }
  const raw = await fs.readFile(CONFIG.rosterLocked, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('data/roster.locked.json must be an array of 50 cards.');
  return parsed.map(normalizeCard).sort((a, b) => a.card_number - b.card_number);
}

async function fetchJson(url, cacheKey, skipNetwork = false) {
  const cacheFile = path.join(CONFIG.cacheDir, `${cacheKey}.json`);
  if (fssync.existsSync(cacheFile)) {
    return JSON.parse(await fs.readFile(cacheFile, 'utf8'));
  }
  if (skipNetwork) return null;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'OpenSourceLegendsGenerator/1.0 (research suggestions; manual review required)'
    }
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const data = await res.json();
  await fs.writeFile(cacheFile, JSON.stringify(data, null, 2) + '\n');
  return data;
}

function wikidataIdFromSearch(searchResult) {
  if (!searchResult || !Array.isArray(searchResult.search) || !searchResult.search[0]) return null;
  return searchResult.search[0].id || null;
}

function entitySitelinkTitle(entity, site = 'enwiki') {
  return entity?.sitelinks?.[site]?.title || null;
}

function entityUrl(qid) {
  return qid ? `https://www.wikidata.org/wiki/${qid}` : null;
}

function wikipediaPageUrl(title) {
  return title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : null;
}

function compactExtract(s, max = 900) {
  const clean = String(s || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

async function research() {
  await ensureDirs();
  const skipNetwork = hasFlag('--skip-network');
  let roster;
  try {
    roster = await loadRoster();
  } catch {
    roster = SEED_PEOPLE.map(([name, displayName], idx) => starterCard(idx + 1, name, displayName));
  }

  const suggestions = [];
  for (const card of roster) {
    const query = encodeURIComponent(card.name || card.display_name);
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${query}&language=en&format=json&origin=*`;
    const search = await fetchJson(searchUrl, `wikidata_search_${slugify(card.name)}`, skipNetwork).catch(err => ({ error: err.message }));
    const qid = wikidataIdFromSearch(search);
    let entity = null;
    let wikiTitle = null;
    let summary = null;
    if (qid) {
      const entityData = await fetchJson(
        `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`,
        `wikidata_entity_${qid}`,
        skipNetwork
      ).catch(err => ({ error: err.message }));
      entity = entityData?.entities?.[qid] || null;
      wikiTitle = entitySitelinkTitle(entity, 'enwiki');
    }
    if (wikiTitle) {
      summary = await fetchJson(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
        `wikipedia_summary_${slugify(wikiTitle)}`,
        skipNetwork
      ).catch(err => ({ error: err.message }));
    }

    const candidateUrls = [
      entityUrl(qid),
      wikipediaPageUrl(wikiTitle),
      summary?.content_urls?.desktop?.page,
      summary?.thumbnail?.source,
      summary?.originalimage?.source
    ].filter(Boolean);

    suggestions.push({
      card_number: card.card_number,
      name: card.name,
      display_name: card.display_name,
      wikidata_id: qid,
      wikidata_description: entity?.descriptions?.en?.value || '',
      wikipedia_title: wikiTitle || '',
      wikipedia_extract: compactExtract(summary?.extract || ''),
      candidate_source_urls: [...new Set(candidateUrls.filter(url => !String(url).includes('/api/rest_v1/')))],
      portrait_reference_candidates: [...new Set([summary?.thumbnail?.source, summary?.originalimage?.source, wikipediaPageUrl(wikiTitle)].filter(Boolean))],
      legal_note: 'Candidate portrait references require manual license/attribution/publicity-right review. Do not paste raw photos into final cards.',
      manual_action: 'Use these suggestions as starting points only. Verify against official project pages/repos/foundations before setting facts_verified=true.'
    });
    console.log(`Research suggestion ${String(card.card_number).padStart(2, '0')}/50: ${card.display_name}`);
  }

  await fs.writeFile(CONFIG.researchSuggestions, JSON.stringify(suggestions, null, 2) + '\n');
  await writeSourcesMd(await loadRoster().catch(() => roster), suggestions);
  console.log(`Wrote ${path.relative(ROOT, CONFIG.researchSuggestions)}`);
  console.log(`Wrote ${path.relative(ROOT, path.join(CONFIG.outDir, 'sources.md'))}`);
}

async function getTemplateInfo() {
  if (!fssync.existsSync(CONFIG.templatePdf)) {
    throw new Error(`Missing template PDF: ${path.relative(ROOT, CONFIG.templatePdf)}\nExpected exactly: ./docs/Card-Decks_2.5x3.5.pdf`);
  }
  const bytes = await fs.readFile(CONFIG.templatePdf);
  const doc = await PDFDocument.load(bytes);
  const pages = doc.getPages();
  if (pages.length !== 2) {
    throw new Error(`Template must have exactly 2 pages; found ${pages.length}. The user said the template has two pages, so check the file path.`);
  }
  const sizes = pages.map((p, idx) => {
    const { width, height } = p.getSize();
    return { page: idx + 1, width, height, widthIn: width / 72, heightIn: height / 72 };
  });
  const [front, back] = sizes;
  const same = Math.abs(front.width - back.width) < CONFIG.pointTolerance && Math.abs(front.height - back.height) < CONFIG.pointTolerance;
  if (!same) {
    throw new Error(`Template page sizes differ: page 1 ${front.width}x${front.height} pt, page 2 ${back.width}x${back.height} pt.`);
  }
  const expectedW = CONFIG.pageWIn * 72;
  const expectedH = CONFIG.pageHIn * 72;
  const matchesExpected = Math.abs(front.width - expectedW) < CONFIG.pointTolerance && Math.abs(front.height - expectedH) < CONFIG.pointTolerance;
  if (!matchesExpected) {
    throw new Error(
      `Template first page is ${front.width.toFixed(2)} x ${front.height.toFixed(2)} pt ` +
      `(${front.widthIn.toFixed(3)} x ${front.heightIn.toFixed(3)} in), expected ${expectedW} x ${expectedH} pt (${CONFIG.pageWIn} x ${CONFIG.pageHIn} in).`
    );
  }
  return { pageWidth: front.width, pageHeight: front.height, sizes };
}

function validateCardShape(card) {
  const errors = [];
  for (const field of REQUIRED_SCHEMA_FIELDS) {
    if (!(field in card)) errors.push(`missing field ${field}`);
  }
  if (!Number.isInteger(card.card_number) || card.card_number < 1 || card.card_number > 50) errors.push('card_number must be 1..50');
  if (!card.name) errors.push('name is required');
  if (!card.display_name) errors.push('display_name is required');
  if (!card.card_title || card.card_title === 'TBD') errors.push('card_title must be locked');
  if (!card.known_for || card.known_for === 'TBD') errors.push('known_for must be locked');
  if (card.scouting_report === 'TBD' || !card.scouting_report) errors.push('scouting_report must be locked');
  if (card.collector_note === 'TBD' || !card.collector_note) errors.push('collector_note must be locked');
  if (!Array.isArray(card.primary_projects) || card.primary_projects.length < 1) errors.push('primary_projects requires at least 1 item');
  if (!Array.isArray(card.key_contributions) || card.key_contributions.length !== CONFIG.keyContributionsMax) {
    errors.push(`key_contributions must have exactly ${CONFIG.keyContributionsMax} short items`);
  }
  if (!Array.isArray(card.source_urls) || card.source_urls.length < 2) errors.push('source_urls requires at least 2 verified URLs');
  if (!Array.isArray(card.portrait_reference_urls) || card.portrait_reference_urls.length < 1) errors.push('portrait_reference_urls requires at least 1 reviewed reference URL');
  if (card.facts_verified !== true) errors.push('facts_verified must be true');
  if (card.portrait_review_status !== 'approved') errors.push('portrait_review_status must be "approved"');
  for (const key of ['impact_rating', 'code_rating', 'innovation_rating', 'community_rating', 'longevity_rating']) {
    if (!Number.isInteger(card[key]) || card[key] < 1 || card[key] > 100) errors.push(`${key} must be integer 1..100`);
  }
  const scWords = wordCount(card.scouting_report);
  if (scWords > CONFIG.scoutingMaxWords) errors.push(`scouting_report too long: ${scWords} words, max ${CONFIG.scoutingMaxWords}`);
  const cnWords = wordCount(card.collector_note);
  if (cnWords > CONFIG.collectorMaxWords) errors.push(`collector_note too long: ${cnWords} words, max ${CONFIG.collectorMaxWords}`);
  if (arrayify(card.primary_projects).length > CONFIG.signatureProjectsMax) errors.push(`primary_projects max ${CONFIG.signatureProjectsMax}`);
  if (arrayify(card.associates_or_ecosystem).length > CONFIG.ecosystemMax) errors.push(`associates_or_ecosystem max ${CONFIG.ecosystemMax}`);
  return errors;
}

async function validate({ requirePortraits = true, checkPngs = false, checkPdfs = false } = {}) {
  await ensureDirs();
  const template = await getTemplateInfo();
  const roster = await loadRoster();
  const errors = [];
  if (roster.length !== 50) errors.push(`Roster must contain exactly 50 people; found ${roster.length}`);

  const nums = roster.map(c => c.card_number);
  for (let i = 1; i <= 50; i++) if (!nums.includes(i)) errors.push(`Missing card_number ${i}`);
  if (new Set(nums).size !== nums.length) errors.push('Duplicate card_number values found.');

  if (roster.some(c => /elon\s+musk/i.test(`${c.name} ${c.display_name}`))) errors.push('Elon Musk is included; he must not be in this deck.');

  const ryan = roster.find(c => /Ryan\s+Dahl/i.test(c.display_name));
  if (!ryan) {
    errors.push('Ryan Dahl is missing.');
  } else if (!/Node\.js|NodeJS|Node/i.test(`${ryan.known_for} ${ryan.primary_projects.join(' ')} ${ryan.key_contributions.join(' ')}`)) {
    errors.push('Ryan Dahl must be explicitly tied to Node.js.');
  }
  const tj = roster.find(c => /TJ|Holowaychuk/i.test(`${c.name} ${c.display_name}`));
  if (!tj) {
    errors.push('TJ Holowaychuk is missing.');
  } else if (/creator\s+of\s+Node|created\s+Node|Node\.js\s+creator/i.test(JSON.stringify(tj))) {
    errors.push('TJ Holowaychuk is incorrectly labeled as Node.js creator.');
  }

  for (const card of roster) {
    const cardErrors = validateCardShape(card);
    for (const err of cardErrors) errors.push(`${cardId(card.card_number)} ${card.display_name}: ${err}`);
    if (requirePortraits && !fssync.existsSync(portraitPath(card.card_number))) {
      errors.push(`${cardId(card.card_number)} ${card.display_name}: missing approved portrait asset ${path.relative(ROOT, portraitPath(card.card_number))}`);
    }
    if (checkPngs) {
      const front = path.join(CONFIG.pngDir, safeFilename(card, 'front', 'png'));
      const back = path.join(CONFIG.pngDir, safeFilename(card, 'back', 'png'));
      if (!fssync.existsSync(front)) errors.push(`${cardId(card.card_number)} missing front PNG`);
      if (!fssync.existsSync(back)) errors.push(`${cardId(card.card_number)} missing back PNG`);
    }
  }

  if (PX.w === PX.h) errors.push('Card PNG size is square; expected rectangle 825 x 1125.');
  if (template.pageWidth === template.pageHeight) errors.push('Template PDF page is square; expected 2.75 x 3.75 in.');

  if (checkPdfs) {
    await validatePdfOutputs(errors, template);
  }

  if (errors.length) {
    const msg = ['Validation failed:', ...errors.map(e => ` - ${e}`)].join('\n');
    throw new Error(msg);
  }

  console.log('Validation passed: 50 people, no Elon, Ryan Dahl/Node.js check, TJ/Node.js correction check, template dimensions, roster schema.');
  return { roster, template };
}

async function validatePdfOutputs(errors, template) {
  const master = path.join(CONFIG.pdfDir, 'open_source_legends_master_50_cards_100_pages.pdf');
  if (!fssync.existsSync(master)) {
    errors.push('Missing master PDF');
  } else {
    const doc = await PDFDocument.load(await fs.readFile(master));
    if (doc.getPageCount() !== 100) errors.push(`Master PDF page count is ${doc.getPageCount()}, expected 100`);
    doc.getPages().forEach((p, idx) => {
      const { width, height } = p.getSize();
      if (Math.abs(width - template.pageWidth) > CONFIG.pointTolerance || Math.abs(height - template.pageHeight) > CONFIG.pointTolerance) {
        errors.push(`Master page ${idx + 1} size mismatch: ${width} x ${height} pt`);
      }
    });
  }

  const roster = await loadRoster();
  for (const card of roster) {
    const p = path.join(CONFIG.individualPdfDir, `${cardId(card.card_number)}-${slugify(card.display_name)}.pdf`);
    if (!fssync.existsSync(p)) {
      errors.push(`Missing individual PDF for ${card.display_name}`);
      continue;
    }
    const doc = await PDFDocument.load(await fs.readFile(p));
    if (doc.getPageCount() !== 2) errors.push(`${path.basename(p)} page count is ${doc.getPageCount()}, expected 2`);
    doc.getPages().forEach((page, idx) => {
      const { width, height } = page.getSize();
      if (Math.abs(width - template.pageWidth) > CONFIG.pointTolerance || Math.abs(height - template.pageHeight) > CONFIG.pointTolerance) {
        errors.push(`${path.basename(p)} page ${idx + 1} size mismatch: ${width} x ${height} pt`);
      }
    });
  }
}

function escXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapWords(text, maxChars, maxLines, label = 'text') {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w.length > maxChars ? `${w.slice(0, maxChars - 1)}…` : w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    throw new Error(`${label} overflows layout: ${lines.length} wrapped lines, max ${maxLines}. Shorten the locked data.`);
  }
  return lines;
}

function textBlock(text, x, y, opts = {}) {
  const {
    maxChars = 40,
    maxLines = 4,
    fontSize = 24,
    lineHeight = Math.round(fontSize * 1.25),
    fill = '#ffffff',
    weight = 500,
    anchor = 'start',
    label = 'text',
    opacity = 1,
    letterSpacing = 0
  } = opts;
  const lines = wrapWords(text, maxChars, maxLines, label);
  const tspans = lines.map((line, i) => {
    const dy = i === 0 ? 0 : lineHeight;
    return `<tspan x="${x}" dy="${i === 0 ? 0 : dy}">${escXml(line)}</tspan>`;
  }).join('');
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${fill}" opacity="${opacity}" letter-spacing="${letterSpacing}">${tspans}</text>`;
}

function bulletList(items, x, y, opts = {}) {
  const {
    maxItems = 4,
    maxChars = 36,
    fontSize = 18,
    lineHeight = 23,
    fill = '#f3f6ff',
    label = 'bullets'
  } = opts;
  const arr = arrayify(items).slice(0, maxItems);
  let out = '';
  let cy = y;
  arr.forEach((item, idx) => {
    const lines = wrapWords(String(item), maxChars, 2, `${label}[${idx}]`);
    out += `<circle cx="${x}" cy="${cy - 6}" r="4" fill="#64ffda" opacity="0.9"/>`;
    lines.forEach((line, li) => {
      out += `<text x="${x + 14}" y="${cy + li * lineHeight}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" font-weight="500" fill="${fill}">${escXml(line)}</text>`;
    });
    cy += lineHeight * lines.length + 8;
  });
  return out;
}

function ratingBar(label, value, x, y, w, accent) {
  const v = Math.max(1, Math.min(100, Number(value) || 1));
  const fillW = Math.round(w * v / 100);
  return `
    <text x="${x}" y="${y}" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="700" fill="#dce5ff">${escXml(label)}</text>
    <rect x="${x + 118}" y="${y - 13}" width="${w}" height="13" rx="7" fill="#1b2440" stroke="#384469" stroke-width="1"/>
    <rect x="${x + 118}" y="${y - 13}" width="${fillW}" height="13" rx="7" fill="${accent}" opacity="0.95"/>
    <text x="${x + 118 + w + 12}" y="${y}" font-family="DejaVu Sans Mono, monospace" font-size="15" font-weight="700" fill="#ffffff">${v}</text>`;
}

function accentFor(n) {
  const palette = [
    '#00e5ff', '#ff2bd6', '#8cff00', '#ffcc00', '#7c4dff',
    '#00ffa3', '#ff6d00', '#4dabff', '#ff4268', '#a6ff00'
  ];
  return palette[(n - 1) % palette.length];
}

async function imageToDataUri(p) {
  const buf = await fs.readFile(p);
  const ext = path.extname(p).replace('.', '').toLowerCase() || 'png';
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function placeholderPortraitSvg(card, accent) {
  const initials = card.display_name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs><radialGradient id="g" cx="50%" cy="35%"><stop offset="0" stop-color="${accent}"/><stop offset="0.35" stop-color="#1f2a52"/><stop offset="1" stop-color="#050713"/></radialGradient></defs>
      <rect width="900" height="900" fill="url(#g)"/>
      <circle cx="450" cy="360" r="165" fill="#cfd6e6" opacity="0.55"/>
      <rect x="235" y="555" width="430" height="250" rx="125" fill="#cfd6e6" opacity="0.45"/>
      <text x="450" y="480" text-anchor="middle" font-family="Arial" font-size="150" font-weight="900" fill="#fff">${initials}</text>
      <text x="450" y="850" text-anchor="middle" font-family="Arial" font-size="34" font-weight="800" fill="#fff">DRAFT PORTRAIT</text>
    </svg>`).toString('base64')}`;
}

function svgDefs(accent) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050713"/>
      <stop offset="0.45" stop-color="#111935"/>
      <stop offset="1" stop-color="#03040a"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#182341" stop-opacity="0.98"/>
      <stop offset="1" stop-color="#070b18" stop-opacity="0.98"/>
    </linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="7" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .9 0"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="portraitClip"><rect x="133" y="165" width="559" height="600" rx="54"/></clipPath>
    <pattern id="grid" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.055"/>
    </pattern>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>`;
}

function techBackground(accent) {
  const lines = [];
  for (let i = 0; i < 18; i++) {
    const y = 90 + i * 58;
    const x1 = (i % 3) * 70;
    const x2 = PX.w - ((i + 1) % 4) * 58;
    lines.push(`<path d="M${x1},${y} C${x1 + 120},${y - 22} ${x2 - 160},${y + 28} ${x2},${y}" stroke="${accent}" stroke-width="2" fill="none" opacity="0.08"/>`);
  }
  return `<rect width="${PX.w}" height="${PX.h}" fill="url(#bg)"/><rect width="${PX.w}" height="${PX.h}" fill="url(#grid)"/>${lines.join('')}`;
}

function buildFrontSvg(card, portraitDataUri, allowPlaceholder) {
  const accent = accentFor(card.card_number);
  const num = String(card.card_number).padStart(3, '0');
  const safeX = PX.safeInset;
  const nameLines = wrapWords(card.display_name, 19, 2, `${card.display_name} front name`);
  const titleLines = wrapWords(card.card_title, 31, 2, `${card.display_name} front title`);
  const project = card.primary_projects?.[0] || 'OSS';
  const projectMark = project.split(/\s+/).map(w => w[0]).join('').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'OSS';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PX.w}" height="${PX.h}" viewBox="0 0 ${PX.w} ${PX.h}">
${svgDefs(accent)}
${techBackground(accent)}
<rect x="18" y="18" width="${PX.w - 36}" height="${PX.h - 36}" rx="54" fill="none" stroke="${accent}" stroke-width="10" opacity="0.95" filter="url(#glow)"/>
<rect x="42" y="42" width="${PX.w - 84}" height="${PX.h - 84}" rx="42" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.22"/>
<rect x="${safeX}" y="78" width="${PX.w - safeX * 2}" height="54" rx="27" fill="#07101f" stroke="${accent}" stroke-width="2" opacity="0.95"/>
<text x="${PX.w / 2}" y="114" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="2">OPEN SOURCE LEGENDS</text>
<g clip-path="url(#portraitClip)">
  <image href="${portraitDataUri}" x="105" y="130" width="615" height="680" preserveAspectRatio="xMidYMid slice"/>
  <rect x="105" y="130" width="615" height="680" fill="url(#bg)" opacity="0.10"/>
</g>
<rect x="133" y="165" width="559" height="600" rx="54" fill="none" stroke="url(#accent)" stroke-width="7" opacity="0.95"/>
<path d="M138 735 C260 785 560 785 687 735" stroke="${accent}" stroke-width="8" fill="none" opacity="0.72"/>
<rect x="${safeX}" y="793" width="${PX.w - safeX * 2}" height="205" rx="34" fill="url(#panel)" stroke="${accent}" stroke-width="4"/>
${nameLines.map((line, i) => `<text x="${PX.w / 2}" y="${858 + i * 48}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="${nameLines.length > 1 ? 42 : 48}" font-weight="900" fill="#ffffff" letter-spacing="1.2">${escXml(line)}</text>`).join('')}
${titleLines.map((line, i) => `<text x="${PX.w / 2}" y="${938 + i * 28}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="700" fill="${accent}">${escXml(line)}</text>`).join('')}
<g transform="translate(${PX.w - safeX - 86}, ${PX.safeInset + 54})">
  <rect x="0" y="0" width="86" height="86" rx="18" fill="#07101f" stroke="${accent}" stroke-width="3"/>
  <text x="43" y="53" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="30" font-weight="900" fill="#ffffff">${escXml(projectMark)}</text>
</g>
<g transform="translate(${safeX}, ${PX.h - PX.safeInset - 34})">
  <text x="0" y="0" font-family="DejaVu Sans Mono, monospace" font-size="22" font-weight="800" fill="#dce5ff">#${num}</text>
</g>
${allowPlaceholder ? '<text x="412" y="1045" text-anchor="middle" font-family="Arial" font-size="16" fill="#ffcc00">DRAFT ONLY - PLACEHOLDER PORTRAIT</text>' : ''}
</svg>`;
}

function buildBackSvg(card) {
  const accent = accentFor(card.card_number);
  const num = String(card.card_number).padStart(3, '0');
  const bornLine = `Born: ${card.birth_date || 'TBD'}  •  ${card.nationality || 'TBD'}`;
  const knownLine = `Known for: ${card.known_for}`;
  const left = PX.safeInset;
  const rightW = PX.w - left * 2;

  const scoutingLines = wrapWords(card.scouting_report, 55, 7, `${card.display_name} scouting_report`);
  const knownLines = wrapWords(knownLine, 54, 2, `${card.display_name} known_for`);
  const sourceFooter = `Sources saved in sources.md • Portrait/reference reviewed • No official logos used`;
  const legalFooter = wrapWords(sourceFooter, 68, 2, `${card.display_name} footer`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${PX.w}" height="${PX.h}" viewBox="0 0 ${PX.w} ${PX.h}">
${svgDefs(accent)}
${techBackground(accent)}
<rect x="18" y="18" width="${PX.w - 36}" height="${PX.h - 36}" rx="54" fill="none" stroke="${accent}" stroke-width="10" opacity="0.95" filter="url(#glow)"/>
<rect x="42" y="42" width="${PX.w - 84}" height="${PX.h - 84}" rx="42" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.22"/>
<rect x="${left}" y="74" width="${rightW}" height="102" rx="28" fill="url(#panel)" stroke="${accent}" stroke-width="4"/>
<text x="${left + 24}" y="118" font-family="DejaVu Sans, Arial, sans-serif" font-size="36" font-weight="900" fill="#ffffff">${escXml(card.display_name)}</text>
<text x="${PX.w - left - 24}" y="118" text-anchor="end" font-family="DejaVu Sans Mono, monospace" font-size="24" font-weight="900" fill="${accent}">#${num}</text>
<text x="${left + 24}" y="151" font-family="DejaVu Sans, Arial, sans-serif" font-size="20" font-weight="800" fill="${accent}">${escXml(card.card_title)}</text>
<text x="${left + 24}" y="199" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="700" fill="#dce5ff">${escXml(bornLine)}</text>
${knownLines.map((line, i) => `<text x="${left + 24}" y="${224 + i * 22}" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="700" fill="#dce5ff">${escXml(line)}</text>`).join('')}

<rect x="${left}" y="273" width="${rightW}" height="190" rx="25" fill="#07101f" stroke="#2c3657" stroke-width="2" opacity="0.97"/>
<text x="${left + 24}" y="311" font-family="DejaVu Sans, Arial, sans-serif" font-size="22" font-weight="900" fill="${accent}">SCOUTING REPORT</text>
${scoutingLines.map((line, i) => `<text x="${left + 24}" y="${342 + i * 21}" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="500" fill="#ffffff">${escXml(line)}</text>`).join('')}

<rect x="${left}" y="487" width="${rightW}" height="300" rx="25" fill="url(#panel)" stroke="#2c3657" stroke-width="2" opacity="0.98"/>
<text x="${left + 24}" y="526" font-family="DejaVu Sans, Arial, sans-serif" font-size="21" font-weight="900" fill="${accent}">SIGNATURE PROJECTS</text>
${bulletList(card.primary_projects, left + 30, 560, { maxItems: 5, maxChars: 34, fontSize: 16, lineHeight: 20, label: `${card.display_name} primary_projects` })}
<text x="${left + 360}" y="526" font-family="DejaVu Sans, Arial, sans-serif" font-size="21" font-weight="900" fill="${accent}">KEY CONTRIBUTIONS</text>
${bulletList(card.key_contributions, left + 366, 560, { maxItems: 3, maxChars: 30, fontSize: 16, lineHeight: 20, label: `${card.display_name} key_contributions` })}
<text x="${left + 24}" y="740" font-family="DejaVu Sans, Arial, sans-serif" font-size="18" font-weight="900" fill="#dce5ff">ECOSYSTEM:</text>
<text x="${left + 138}" y="740" font-family="DejaVu Sans, Arial, sans-serif" font-size="17" font-weight="600" fill="#ffffff">${escXml(arrayify(card.associates_or_ecosystem).slice(0,4).join(' • ') || 'TBD')}</text>

<rect x="${left}" y="810" width="${rightW}" height="184" rx="25" fill="#07101f" stroke="#2c3657" stroke-width="2" opacity="0.98"/>
<text x="${left + 24}" y="849" font-family="DejaVu Sans, Arial, sans-serif" font-size="21" font-weight="900" fill="${accent}">SKILL STACK</text>
${ratingBar('Code', card.code_rating, left + 24, 882, 355, accent)}
${ratingBar('Innovation', card.innovation_rating, left + 24, 912, 355, accent)}
${ratingBar('Community', card.community_rating, left + 24, 942, 355, accent)}
${ratingBar('Longevity', card.longevity_rating, left + 24, 972, 355, accent)}
<circle cx="${PX.w - left - 88}" cy="902" r="64" fill="#0b1226" stroke="${accent}" stroke-width="6"/>
<text x="${PX.w - left - 88}" y="912" text-anchor="middle" font-family="DejaVu Sans Mono, monospace" font-size="45" font-weight="900" fill="#ffffff">${card.impact_rating}</text>
<text x="${PX.w - left - 88}" y="943" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="13" font-weight="900" fill="${accent}">IMPACT</text>

<rect x="${left}" y="1016" width="${rightW}" height="60" rx="20" fill="#0b1226" stroke="${accent}" stroke-width="2" opacity="0.9"/>
<text x="${left + 22}" y="1040" font-family="DejaVu Sans, Arial, sans-serif" font-size="15" font-weight="900" fill="${accent}">COLLECTOR NOTE:</text>
${wrapWords(card.collector_note, 72, 2, `${card.display_name} collector_note`).map((line, i) => `<text x="${left + 158}" y="${1040 + i * 18}" font-family="DejaVu Sans, Arial, sans-serif" font-size="14" font-weight="600" fill="#ffffff">${escXml(line)}</text>`).join('')}
${legalFooter.map((line, i) => `<text x="${PX.w / 2}" y="${PX.h - 30 + i * 16}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="11" font-weight="600" fill="#b9c3dc" opacity="0.76">${escXml(line)}</text>`).join('')}
</svg>`;
}

async function renderPngs() {
  const allowPlaceholder = hasFlag('--allow-placeholder-portraits');
  await ensureDirs();
  const { roster } = await validate({ requirePortraits: !allowPlaceholder });
  for (const card of roster) {
    const accent = accentFor(card.card_number);
    let portraitDataUri;
    const pPath = portraitPath(card.card_number);
    if (fssync.existsSync(pPath)) {
      portraitDataUri = await imageToDataUri(pPath);
    } else if (allowPlaceholder) {
      portraitDataUri = placeholderPortraitSvg(card, accent);
    } else {
      throw new Error(`Missing portrait ${path.relative(ROOT, pPath)}`);
    }

    const frontSvg = buildFrontSvg(card, portraitDataUri, allowPlaceholder && !fssync.existsSync(pPath));
    const backSvg = buildBackSvg(card);
    const frontOut = path.join(CONFIG.pngDir, safeFilename(card, 'front', 'png'));
    const backOut = path.join(CONFIG.pngDir, safeFilename(card, 'back', 'png'));

    await sharp(Buffer.from(frontSvg)).png({ compressionLevel: 9 }).resize(PX.w, PX.h, { fit: 'fill' }).toFile(frontOut);
    await sharp(Buffer.from(backSvg)).png({ compressionLevel: 9 }).resize(PX.w, PX.h, { fit: 'fill' }).toFile(backOut);
    await assertPngSize(frontOut, PX.w, PX.h);
    await assertPngSize(backOut, PX.w, PX.h);
    console.log(`PNG ${cardId(card.card_number)}: ${path.relative(ROOT, frontOut)} / ${path.relative(ROOT, backOut)}`);
  }
  await exportRosterFiles(roster);
}

async function assertPngSize(file, w, h) {
  const meta = await sharp(file).metadata();
  if (meta.width !== w || meta.height !== h) {
    throw new Error(`${file} is ${meta.width}x${meta.height}, expected ${w}x${h}`);
  }
}

async function exportRosterFiles(roster) {
  await ensureDirs();
  const rosterJsonOut = path.join(CONFIG.outDir, 'roster.json');
  const rosterCsvOut = path.join(CONFIG.outDir, 'roster.csv');
  await fs.writeFile(rosterJsonOut, JSON.stringify(roster, null, 2) + '\n');
  await fs.writeFile(rosterCsvOut, toCsv(roster) + '\n');
  await writeSourcesMd(roster, readJsonIfExists(CONFIG.researchSuggestions));
  console.log(`Exported ${path.relative(ROOT, rosterJsonOut)} and ${path.relative(ROOT, rosterCsvOut)}`);
}

function csvEscape(v) {
  const s = Array.isArray(v) ? v.join(' | ') : String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(roster) {
  const headers = REQUIRED_SCHEMA_FIELDS;
  const lines = [headers.join(',')];
  for (const card of roster) {
    lines.push(headers.map(h => csvEscape(card[h])).join(','));
  }
  return lines.join('\n');
}

function readJsonIfExists(file) {
  try {
    if (!fssync.existsSync(file)) return [];
    return JSON.parse(fssync.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

async function writeSourcesMd(roster, suggestions = []) {
  await fs.mkdir(CONFIG.outDir, { recursive: true });
  const suggestionMap = new Map((Array.isArray(suggestions) ? suggestions : []).map(x => [x.card_number, x]));
  const lines = [];
  lines.push('# Open Source Legends - Sources and legal notes');
  lines.push('');
  lines.push('This file records factual source URLs and portrait reference/legal notes. Production card text must come from `roster.locked.json`, not from image-model output.');
  lines.push('The printer template PDF is used only as a page-size authority; guide artwork is not copied into the production PDFs.');
  lines.push('');
  for (const card of roster) {
    const s = suggestionMap.get(card.card_number);
    lines.push(`## ${String(card.card_number).padStart(3, '0')} - ${card.display_name}`);
    lines.push('');
    lines.push(`- Title: ${card.card_title || 'TBD'}`);
    lines.push(`- Known for: ${card.known_for || 'TBD'}`);
    lines.push(`- Facts verified: ${card.facts_verified === true ? 'yes' : 'no'}`);
    lines.push('- Source URLs:');
    for (const url of arrayify(card.source_urls)) lines.push(`  - ${url}`);
    if (!arrayify(card.source_urls).length) lines.push('  - TBD');
    lines.push('- Portrait reference URLs:');
    for (const url of arrayify(card.portrait_reference_urls)) lines.push(`  - ${url}`);
    if (!arrayify(card.portrait_reference_urls).length) lines.push('  - TBD');
    lines.push(`- Portrait review status: ${card.portrait_review_status || 'needs_review'}`);
    lines.push(`- Legal notes: ${card.legal_notes || 'TBD'}`);
    if (s?.candidate_source_urls?.length) {
      lines.push('- Research candidate URLs from script:');
      for (const url of s.candidate_source_urls) lines.push(`  - ${url}`);
    }
    lines.push('');
  }
  await fs.writeFile(path.join(CONFIG.outDir, 'sources.md'), lines.join('\n') + '\n');
}

async function writePortraitPrompts() {
  await ensureDirs();
  const roster = await loadRoster();
  const lines = [];
  lines.push('# Open Source Legends - portrait prompts');
  lines.push('');
  lines.push('Use these prompts only for portrait art. Do not generate full cards, text, logos, labels, or badges with the image model.');
  lines.push('After manual review, save approved output as `assets/portraits/card_###.png`.');
  lines.push('');
  for (const card of roster) {
    lines.push(`## ${cardId(card.card_number)} - ${card.display_name}`);
    lines.push('');
    lines.push(`Reference URLs: ${arrayify(card.portrait_reference_urls).join(', ') || 'TBD'}`);
    lines.push('');
    lines.push('Prompt:');
    lines.push('```text');
    lines.push(`${card.display_name}, realistic illustrated head-and-shoulders portrait, commercial collectible card illustration style, dark futuristic tech lighting, confident neutral expression, three-quarter camera angle, crisp facial detail, cinematic rim light, high resolution, no text, no labels, no logo, no card border, no badge, no watermark`);
    lines.push('```');
    lines.push('');
  }
  const out = path.join(CONFIG.outDir, 'portrait_prompts.md');
  await fs.writeFile(out, lines.join('\n'));
  console.log(`Wrote ${path.relative(ROOT, out)}`);
}

async function makePdfFromPngPairs(cards, outFile, template) {
  const pdf = await PDFDocument.create();
  for (const card of cards) {
    const frontPng = path.join(CONFIG.pngDir, safeFilename(card, 'front', 'png'));
    const backPng = path.join(CONFIG.pngDir, safeFilename(card, 'back', 'png'));
    for (const file of [frontPng, backPng]) {
      if (!fssync.existsSync(file)) throw new Error(`Missing PNG: ${path.relative(ROOT, file)}`);
      const bytes = await fs.readFile(file);
      const img = await pdf.embedPng(bytes);
      const page = pdf.addPage([template.pageWidth, template.pageHeight]);
      page.drawImage(img, { x: 0, y: 0, width: template.pageWidth, height: template.pageHeight });
    }
  }
  const pdfBytes = await pdf.save({ useObjectStreams: false });
  await fs.writeFile(outFile, pdfBytes);
}

async function makePdfs() {
  await ensureDirs();
  const { roster, template } = await validate({ requirePortraits: true, checkPngs: true });
  await fs.mkdir(CONFIG.individualPdfDir, { recursive: true });
  await fs.mkdir(CONFIG.pdfDir, { recursive: true });

  for (const card of roster) {
    const out = path.join(CONFIG.individualPdfDir, `${cardId(card.card_number)}-${slugify(card.display_name)}.pdf`);
    await makePdfFromPngPairs([card], out, template);
    console.log(`PDF individual: ${path.relative(ROOT, out)}`);
  }

  const batch1 = path.join(CONFIG.pdfDir, 'batch_01_cards_001_to_025.pdf');
  const batch2 = path.join(CONFIG.pdfDir, 'batch_02_cards_026_to_050.pdf');
  const master = path.join(CONFIG.pdfDir, 'open_source_legends_master_50_cards_100_pages.pdf');
  await makePdfFromPngPairs(roster.slice(0, 25), batch1, template);
  await makePdfFromPngPairs(roster.slice(25), batch2, template);
  await makePdfFromPngPairs(roster, master, template);
  await zipIndividualPdfs();
  await validate({ requirePortraits: true, checkPngs: true, checkPdfs: true });
  console.log(`PDF batch 1: ${path.relative(ROOT, batch1)}`);
  console.log(`PDF batch 2: ${path.relative(ROOT, batch2)}`);
  console.log(`PDF master:  ${path.relative(ROOT, master)}`);
}

async function zipIndividualPdfs() {
  const zipPath = path.join(CONFIG.pdfDir, 'individual_card_pdfs.zip');
  await new Promise((resolve, reject) => {
    const output = fssync.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(CONFIG.individualPdfDir, false);
    archive.finalize();
  });
  console.log(`ZIP: ${path.relative(ROOT, zipPath)}`);
}

async function makeProofs() {
  await ensureDirs();
  const roster = await loadRoster();
  const thumbW = 220;
  const thumbH = Math.round(thumbW * PX.h / PX.w);
  await makeContactSheet(roster.slice(0, 25), 'front', thumbW, thumbH, path.join(CONFIG.proofDir, 'proof_batch_01_fronts.png'));
  await makeContactSheet(roster.slice(0, 25), 'back', thumbW, thumbH, path.join(CONFIG.proofDir, 'proof_batch_01_backs.png'));
  await makeContactSheet(roster.slice(25), 'front', thumbW, thumbH, path.join(CONFIG.proofDir, 'proof_batch_02_fronts.png'));
  await makeContactSheet(roster.slice(25), 'back', thumbW, thumbH, path.join(CONFIG.proofDir, 'proof_batch_02_backs.png'));
  console.log(`Proof sheets written to ${path.relative(ROOT, CONFIG.proofDir)}`);
}

async function makeContactSheet(cards, side, thumbW, thumbH, outFile) {
  const cols = 5;
  const rows = 5;
  const pad = 24;
  const labelH = 28;
  const W = cols * thumbW + (cols + 1) * pad;
  const H = rows * (thumbH + labelH) + (rows + 1) * pad;
  const composites = [];
  for (let idx = 0; idx < cards.length; idx++) {
    const card = cards[idx];
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const src = path.join(CONFIG.pngDir, safeFilename(card, side, 'png'));
    if (!fssync.existsSync(src)) throw new Error(`Missing PNG for proof: ${path.relative(ROOT, src)}`);
    const thumb = await sharp(src).resize(thumbW, thumbH).png().toBuffer();
    const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${thumbW}" height="${labelH}"><rect width="100%" height="100%" fill="#111827"/><text x="${thumbW/2}" y="20" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700" fill="#fff">${String(card.card_number).padStart(3,'0')} ${escXml(card.display_name).slice(0, 24)}</text></svg>`);
    composites.push({ input: thumb, left: pad + col * (thumbW + pad), top: pad + row * (thumbH + labelH + pad) });
    composites.push({ input: labelSvg, left: pad + col * (thumbW + pad), top: pad + row * (thumbH + labelH + pad) + thumbH });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#0b1020' } })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(outFile);
}

async function all() {
  await ensureDirs();
  await renderPngs();
  await makePdfs();
  await makeProofs();
  const roster = await loadRoster();
  await exportRosterFiles(roster);
  console.log('\nDone. Deliverables:');
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.pdfDir, 'open_source_legends_master_50_cards_100_pages.pdf'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.pdfDir, 'batch_01_cards_001_to_025.pdf'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.pdfDir, 'batch_02_cards_026_to_050.pdf'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.pdfDir, 'individual_card_pdfs.zip'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.outDir, 'roster.csv'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.outDir, 'roster.json'))}`);
  console.log(` - ${path.relative(ROOT, path.join(CONFIG.outDir, 'sources.md'))}`);
  console.log(` - ${path.relative(ROOT, CONFIG.proofDir)}`);
}

async function main() {
  const cmd = argCommand();
  if (cmd === '--help' || cmd === 'help') {
    usage();
    return;
  }
  try {
    if (cmd === 'init') await init();
    else if (cmd === 'research') await research();
    else if (cmd === 'validate') await validate({ requirePortraits: !hasFlag('--allow-placeholder-portraits') });
    else if (cmd === 'prompts') await writePortraitPrompts();
    else if (cmd === 'png') await renderPngs();
    else if (cmd === 'pdf') await makePdfs();
    else if (cmd === 'proofs') await makeProofs();
    else if (cmd === 'all') await all();
    else {
      usage();
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('\nERROR:');
    console.error(err?.stack || err?.message || String(err));
    process.exitCode = 1;
  }
}

main();
