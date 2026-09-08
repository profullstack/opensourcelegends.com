#!/usr/bin/env node
/*
  Tech CEOs (Series Six) — reference photo resolution.

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

  Provenance for every accepted photo is written to data/ceo-references.json
  and is what the card page credits. A CC BY / CC BY-SA photo obliges us to name
  the photographer, and a derivative portrait inherits that obligation.

  Run:
    node scripts/ceo-refs.mjs resolve    # find candidates, write the manifest
    node scripts/ceo-refs.mjs fetch      # download accepted references
    node scripts/ceo-refs.mjs report     # who is still missing a face
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

const REFS_DIR = path.join(ROOT, 'assets', 'references', 'tech-ceos');
const MANIFEST = path.join(ROOT, 'data', 'ceo-references.json');
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
  // Empty at the start of the set. Entries get added here only after a human has
  // looked at the file and confirmed it is the right person — never to make the
  // report come out clean.
};

/** Wikidata items confirmed to be the wrong human — never accept these. */
const REJECT_QIDS = new Set([]);

/**
 * Auto-resolution found something, a human looked at it, and it did not hold up.
 * These get no face. Recorded with the reason so nobody re-adds them by rerunning
 * the resolver and trusting the output.
 */
const REJECTED = {
  // Filled in by the by-eye review pass. Reasons recorded so a rerun cannot undo the call.
  'sid-sijbrandij':
    'No freely licensed photograph on Commons, and no Wikidata P18. The obvious fallback, the github.com/sytses avatar, is served by an account whose API record has a null name and a very recent numeric id, so it cannot be verified as him the way the Series Five avatar overrides were. Card ships with no face rather than a guess.',
};

const j = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} for ${url}`);
  return r.json();
};

async function loadRoster() {
  // src/data/ceos.ts statically imports the manifest, so it has to exist
  // before the roster can be loaded — including on the very first resolve, and
  // after someone deletes it to force a clean run.
  if (!fssync.existsSync(MANIFEST)) {
    await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
    await fs.writeFile(MANIFEST, '[]\n');
  }
  const mod = await import(path.join(ROOT, 'src', 'data', 'ceos.ts'));
  return mod.executives;
}

/**
 * Does this Wikidata item plausibly describe the person on the card?
 * Deliberately conservative: a miss costs a manual lookup, a false accept ships
 * a stranger's face.
 */
// Wider than the other sets on the business side, because that is what Wikidata
// actually says about these people: "American business magnate", "chief executive
// officer", "industrialist". Narrower descriptions like "engineer" still pass,
// since several of them are also that.
const FIELD =
  /comput|software|engineer|scientist|research|professor|technolog|inform|program|mathematic|physicist|invent|designer|entrepreneur|business|executive|chairman|chairwoman|founder|magnate|industrialist|investor|manager|billionaire|philanthropist|academic|writer|analyst/i;

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

  // No birth-year floor. The oldest person in this set was born in 1912, so a floor
  // would only ever fire on a namesake — but the surname test above already catches
  // those far more precisely, and a floor here would silently drop the early cards.

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
  // NO DATE GUARD IN THIS SET, deliberately. Series Three rejected pre-1950
  // photographs on the theory that an old plate means the search found a historical
  // namesake. The earliest person here was born in 1912, so a 1940s or 1950s
  // photograph of Packard, Watson or Morita is exactly right and a guard tuned for
  // Series Three would delete the opening cards. Namesakes are caught by the
  // surname and description tests in looksRight() instead, which are specific
  // rather than chronological.

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
