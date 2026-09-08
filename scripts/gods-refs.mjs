#!/usr/bin/env node
/*
  Gods of AI (Series Four) — reference photo resolution.

  WHY THIS EXISTS
  ---------------
  The first art pass generated portraits from text prompts alone, so every face
  was an invented stranger rather than the real person. Portraits are now
  conditioned on an actual photograph, and this stage is what finds one.

  IDENTITY IS NOT ASSUMED. A Wikidata search for a name returns humans, not the
  right human: "Michael Howard" resolves to the British Conservative leader,
  "Jeff Williams" to a Canadian rugby player, "Ivan Ristic" to an art historian.
  Shipping those would put a stranger's face on the card, which is worse than the
  generic one it replaces. So a candidate is only accepted when it clears
  `looksRight()` below, and everything else is reported for a human to judge.

  Resolution order, highest authority first:
    1. OVERRIDES        hand-verified, including photos supplied directly
    2. Wikidata P18     free file already wired to a verified item
    3. Commons search   free file that exists but is not wired to the item
    4. nothing          the card gets no face; it does NOT get an invented one

  Provenance for every accepted photo is written to data/ai-references.json
  and is what the card page credits. A CC BY / CC BY-SA photo obliges us to name
  the photographer, and a derivative portrait inherits that obligation.

  Run:
    node scripts/gods-refs.mjs resolve    # find candidates, write the manifest
    node scripts/gods-refs.mjs fetch      # download accepted references
    node scripts/gods-refs.mjs report     # who is still missing a face
*/
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'opensourcelegends.com card pipeline (anthony@profullstack.com)';

const emitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...rest) => {
  const code =
    rest.find((r) => typeof r === 'string' && r.startsWith('MODULE_')) ??
    rest.find((r) => r && typeof r === 'object')?.code;
  if (code === 'MODULE_TYPELESS_PACKAGE_JSON') return;
  return emitWarning(warning, ...rest);
};

const REFS_DIR = path.join(ROOT, 'assets', 'references', 'gods-of-ai');
const MANIFEST = path.join(ROOT, 'data', 'ai-references.json');
const cardId = (n) => `card_${String(n).padStart(3, '0')}`;

/**
 * Hand-verified references. An entry here overrides every lookup.
 *
 * `license` must describe the actual terms. "supplied" means the site owner
 * provided the file directly and is asserting the right to use it: that is not
 * a free licence, so the card credits the source rather than claiming CC terms
 * the deck cannot back.
 */
const OVERRIDES = {
  // GitHub profile photographs. Identity is unusually strong here: the account is
  // the person's own and the API reports their real name, which is checked against
  // the roster before anything is accepted. Not freely licensed, so recorded as
  // 'supplied' with the profile as the source rather than claiming CC terms.
  // Commons search matched a namesake for both of these — a blue wolf statue
  // outside a brewery for "Thomas Wolf", and a Bulgarian basketball player for
  // "Georgi Gerganov". Their own GitHub accounts are unambiguous.
  'thomas-wolf': {
    url: 'https://avatars.githubusercontent.com/u/7353373?v=4&s=460',
    credit: 'Thomas Wolf',
    license: 'supplied',
    sourceUrl: 'https://github.com/thomwolf',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'georgi-gerganov': {
    url: 'https://avatars.githubusercontent.com/u/1991296?v=4&s=460',
    credit: 'Georgi Gerganov',
    license: 'supplied',
    sourceUrl: 'https://github.com/ggerganov',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'soumith-chintala': {
    url: 'https://avatars.githubusercontent.com/u/1310570?v=4&s=460',
    credit: 'Soumith Chintala',
    license: 'supplied',
    sourceUrl: 'https://github.com/soumith',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'tianqi-chen': {
    url: 'https://avatars.githubusercontent.com/u/2577440?v=4&s=460',
    credit: 'Tianqi Chen',
    license: 'supplied',
    sourceUrl: 'https://github.com/tqchen',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'tim-dettmers': {
    url: 'https://avatars.githubusercontent.com/u/5260050?v=4&s=460',
    credit: 'Tim Dettmers',
    license: 'supplied',
    sourceUrl: 'https://github.com/TimDettmers',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'adam-paszke': {
    url: 'https://avatars.githubusercontent.com/u/4583066?v=4&s=460',
    credit: 'Adam Paszke',
    license: 'supplied',
    sourceUrl: 'https://github.com/apaszke',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'yangqing-jia': {
    url: 'https://avatars.githubusercontent.com/u/551151?v=4&s=460',
    credit: 'Yangqing Jia',
    license: 'supplied',
    sourceUrl: 'https://github.com/Yangqing',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'stella-biderman': {
    url: 'https://avatars.githubusercontent.com/u/15899312?v=4&s=460',
    credit: 'Stella Biderman',
    license: 'supplied',
    sourceUrl: 'https://github.com/StellaAthena',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'tri-dao': {
    url: 'https://avatars.githubusercontent.com/u/5616128?v=4&s=460',
    credit: 'Tri Dao',
    license: 'supplied',
    sourceUrl: 'https://github.com/tridao',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'alec-radford': {
    url: 'https://avatars.githubusercontent.com/u/2515289?v=4&s=460',
    credit: 'Alec Radford',
    license: 'supplied',
    sourceUrl: 'https://github.com/Newmu',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'patrick-esser': {
    url: 'https://avatars.githubusercontent.com/u/2175508?v=4&s=460',
    credit: 'Patrick Esser',
    license: 'supplied',
    sourceUrl: 'https://github.com/pesser',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'lukasz-kaiser': {
    url: 'https://avatars.githubusercontent.com/u/684901?v=4&s=460',
    credit: 'Lukasz Kaiser',
    license: 'supplied',
    sourceUrl: 'https://github.com/lukaszkaiser',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'christoph-schuhmann': {
    url: 'https://avatars.githubusercontent.com/u/22318853?v=4&s=460',
    credit: 'Christoph Schuhmann',
    license: 'supplied',
    sourceUrl: 'https://github.com/christophschuhmann',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
  'jan-leike': {
    url: 'https://avatars.githubusercontent.com/u/7199668?v=4&s=460',
    credit: 'Jan Leike',
    license: 'supplied',
    sourceUrl: 'https://github.com/janleike',
    note: 'GitHub profile photograph; account verified against their real name.',
  },
};

/** Wikidata items confirmed to be the wrong human — never accept these. */
const REJECT_QIDS = new Set([]);

/**
 * Auto-resolution found something, a human looked at it, and it did not hold up.
 * These get no face. Recorded with the reason so nobody re-adds them by rerunning
 * the resolver and trusting the output.
 */
const REJECTED = {
  // Looked at, did not hold up. Reasons recorded so nobody re-adds them by
  // rerunning the resolver and trusting its output.
  'francois-chollet':
    'Wikidata P18 is a body shot with his head cropped out of frame, and his GitHub avatar is a felt sculpture. Conditioning on either produced an invented face.',
  'albert-gu':
    'GitHub avatar is a default identicon, not a photograph.',
  'guillaume-lample':
    'GitHub avatar is a default identicon, not a photograph.',
  'robin-rombach':
    'GitHub avatar is a distant landscape shot with no discernible face.',
  'chris-olah':
    'GitHub avatar is a fractal, not a photograph.',
  'paul-christiano':
    'GitHub avatar is a line drawing, not a photograph.',
  'oriol-vinyals':
    'GitHub avatar is a default identicon, not a photograph.',
};

const j = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.json();
};

async function loadRoster() {
  // src/data/ai.ts statically imports the manifest, so it has to exist
  // before the roster can be loaded — including on the very first resolve, and
  // after someone deletes it to force a clean run.
  if (!fssync.existsSync(MANIFEST)) {
    await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
    await fs.writeFile(MANIFEST, '[]\n');
  }
  const mod = await import(path.join(ROOT, 'src', 'data', 'ai.ts'));
  return mod.architects;
}

/**
 * Does this Wikidata item plausibly describe the person on the card?
 * Deliberately conservative: a miss costs a manual lookup, a false accept ships
 * a stranger's face.
 */
const FIELD =
  /artificial intelligence|machine learning|comput|software|engineer|scientist|research|professor|technolog|inform|program|mathematic|neuroscien|robotic|entrepreneur|business|academic/i;

function looksRight(entity, pro) {
  if (!entity) return false;
  const claims = entity.claims || {};
  if (!(claims.P31 || []).some((c) => c.mainsnak?.datavalue?.value?.id === 'Q5')) return false;

  const label = entity.labels?.en?.value || '';
  const desc = entity.descriptions?.en?.value || '';
  const aliases = (entity.aliases?.en || []).map((a) => a.value);

  // Surname must actually appear — "Mark Dowd" matching "Mark Dowdall" is a miss.
  const surname = pro.name.split(/\s+/).pop().toLowerCase();
  const names = [label, ...aliases].map((s) => s.toLowerCase());
  if (!names.some((n) => n.split(/\s+/).includes(surname))) return false;

  // A dead-before-the-internet birth date rules the person out.
  const born = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  if (born) {
    const year = Number(String(born).slice(1, 5));
    if (year && year < 1920) return false;
  }

  return FIELD.test(desc) || FIELD.test(label);
}


const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * True only when the filename *begins* with the person's full name, so
 * "Alex Sotirov.jpg" and "J. Alex Halderman - 2018.jpg" pass while
 * "Martin Wagenleiter (Roesch) 861x1200.jpg" and "HT-Jeffrey-Williams.jpg" do not.
 */
function filenameOpensWithName(filename, name) {
  const f = norm(filename.replace(/\.[a-z0-9]+$/i, ''));
  return f.startsWith(norm(name));
}

/** Commons file -> direct URL plus the licence and author we are obliged to credit. */
async function commonsMeta(filename) {
  const d = await j(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1024&titles=${encodeURIComponent('File:' + filename)}`
  );
  const page = Object.values(d.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  const strip = (v) => String(v?.value ?? '').replace(/<[^>]*>/g, '').trim();
  // A 19th-century photographer credit means the search found a historical
  // namesake, not the person on the card.
  const dateRaw = strip(meta.DateTimeOriginal) || strip(meta.DateTime);
  const year = Number((dateRaw.match(/\b(1[6-9]\d{2}|20\d{2})\b/) || [])[1]);
  if (year && year < 1950) return null;

  return {
    url: info.thumburl || info.url,
    credit: strip(meta.Artist) || 'Unknown',
    license: strip(meta.LicenseShortName) || 'unknown',
    licenseUrl: strip(meta.LicenseUrl) || '',
    sourceUrl: info.descriptionurl,
    file: filename,
  };
}

async function resolve() {
  const roster = await loadRoster();
  const manifest = [];

  for (const pro of roster) {
    const row = { number: pro.number, slug: pro.slug, name: pro.name, ref: null, candidates: [] };

    if (REJECTED[pro.slug]) {
      row.rejected = REJECTED[pro.slug];
      manifest.push(row);
      console.log(`${String(pro.number).padStart(2)} ${pro.name.padEnd(22)} REJECTED   ${row.rejected.slice(0, 58)}`);
      continue;
    }

    if (OVERRIDES[pro.slug]) {
      const o = OVERRIDES[pro.slug];
      row.ref = o.commonsFile
        ? { ...(await commonsMeta(o.commonsFile)), ...o, via: 'override' }
        : { ...o, via: 'override' };
      manifest.push(row);
      console.log(`${String(pro.number).padStart(2)} ${pro.name.padEnd(22)} OVERRIDE   ${row.ref.license}`);
      continue;
    }

    let entity = null;
    let qid = null;
    try {
      const s = await j(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(pro.name)}&language=en&format=json&limit=6&type=item`
      );
      for (const hit of s.search || []) {
        if (REJECT_QIDS.has(hit.id)) continue;
        const e = await j(`https://www.wikidata.org/wiki/Special:EntityData/${hit.id}.json`);
        const ent = e.entities?.[hit.id];
        if (looksRight(ent, pro)) {
          entity = ent;
          qid = hit.id;
          break;
        }
      }
    } catch (err) {
      row.error = String(err.message).slice(0, 80);
    }

    const p18 = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (p18) {
      const meta = await commonsMeta(p18);
      if (meta) {
        row.ref = { ...meta, qid, via: 'wikidata-p18' };
        row.desc = entity.descriptions?.en?.value || '';
      }
    }

    // No P18: a free file may still exist on Commons, unlinked. Containing the
    // name somewhere is far too weak a test — "Martin Wagenleiter (Roesch)" and
    // "Merseyside PTE 40th anniversary" both matched that way, and a search for
    // "Robert M. Lee" happily returns a daguerreotype of the Confederate general.
    // So the filename must OPEN with the person's full name.
    if (!row.ref) {
      try {
        const s = await j(
          `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=${encodeURIComponent(pro.name)}`
        );
        for (const p of Object.values(s.query?.pages || {})) {
          const f = p.title.replace(/^File:/, '');
          if (!/\.(jpe?g|png)$/i.test(f)) continue;
          if (!filenameOpensWithName(f, pro.name)) continue;
          row.candidates.push(f);
        }
        if (row.candidates.length) {
          const meta = await commonsMeta(row.candidates[0]);
          if (meta) row.ref = { ...meta, qid, via: 'commons-search' };
        }
      } catch {}
    }

    manifest.push(row);
    const tag = row.ref ? row.ref.via.toUpperCase().padEnd(10) : 'NONE      ';
    console.log(
      `${String(pro.number).padStart(2)} ${pro.name.padEnd(22)} ${tag} ${row.ref ? `${row.ref.license} | ${row.ref.credit.slice(0, 34)}` : (row.desc || '')}`
    );
  }

  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  const got = manifest.filter((m) => m.ref).length;
  console.log(`\nresolve: ${got}/${manifest.length} have a reference photo -> ${path.relative(ROOT, MANIFEST)}`);
  const none = manifest.filter((m) => !m.ref);
  console.log(`no photo (${none.length}) — these get no face, never an invented one:`);
  for (const m of none) console.log(`  ${String(m.number).padStart(2)} ${m.name}${m.rejected ? ' — ' + m.rejected.slice(0, 70) : ''}`);
}

async function fetchRefs() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  await fs.mkdir(REFS_DIR, { recursive: true });
  let ok = 0;
  const failed = [];
  for (const row of manifest.filter((m) => m.ref)) {
    const dest = path.join(REFS_DIR, `${cardId(row.number)}.jpg`);
    if (fssync.existsSync(dest)) {
      ok++;
      continue;
    }
    try {
      const r = await fetch(row.ref.url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(String(r.status));
      await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
      ok++;
      console.log(`✓ ${String(row.number).padStart(2)} ${row.name}`);
    } catch (err) {
      failed.push(`${row.number} ${row.name}: ${err.message}`);
    }
  }
  console.log(`fetch: ${ok} references in ${path.relative(ROOT, REFS_DIR)}, ${failed.length} failed`);
  for (const f of failed) console.log('  ✗ ' + f);
}

async function report() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  const byLicense = {};
  for (const m of manifest.filter((x) => x.ref)) {
    byLicense[m.ref.license] = (byLicense[m.ref.license] || 0) + 1;
  }
  console.log('references by licence:', byLicense);
  const missing = manifest.filter((m) => !m.ref);
  console.log(`\n${missing.length} with no reference photo — these get no face, not an invented one:`);
  for (const m of missing) console.log(`  ${String(m.number).padStart(2)} ${m.name}`);
}

const cmd = process.argv[2] || 'resolve';
const fns = { resolve, fetch: fetchRefs, report };
if (!fns[cmd]) {
  console.error(`unknown command: ${cmd}\n\n  resolve | fetch | report`);
  process.exit(1);
}
fns[cmd]().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
