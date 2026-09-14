# Artwork and card data v2

V2 features new painted portraits edited directly from the collection's existing
approved portrait PNGs. Every new image retains the same person's likeness, pose,
clothing and photo basis. Original inputs stay in `assets/portraits/`; the new
paintings and their source records are in `assets/portraits-v2/`. Names, biographies,
ratings and factual copy remain curated and are typeset separately.

## Build and review

Use Node 22.18+ or 24+ with the repository dependencies installed:

```bash
pnpm install --frozen-lockfile
pnpm release:v2 --dry-run

# One portrait proof, entirely local and without API credentials.
pnpm release:v2 --series legends --only 2 --offline --portrait-edits assets/portraits-v2/manifest.json --out dist/releases/v2-proof
pnpm release:v2 validate --out dist/releases/v2-proof

# Complete edition; offline skips NicheDB as well as all generation services.
pnpm release:v2 --offline --concurrency 8 --portrait-edits assets/portraits-v2/manifest.json --out dist/releases/v2-portraits
pnpm release:v2 validate --out dist/releases/v2-portraits

# Inspect index.html before activating the complete edition.
pnpm release:v2 activate --out dist/releases/v2-portraits
```

Activation copies the release into `public/releases/v2/` and updates only the
`front` and `back` paths in the six TypeScript rosters. It does not commit, merge
or deploy. An existing different release must be archived before replacement.
Legacy abstract releases cannot be activated by the corrected builder.

## Portrait sources

| Series | Approved portrait directory | Source credit manifest | Portraits / cards |
| --- | --- | --- | --- |
| Open Source Legends | `assets/portraits/legends` | Existing approved collection | 47 / 47 |
| Hacking Legends | `assets/portraits/hacking-legends` | Existing approved collection | 30 / 30 |
| Security Professionals | `assets/portraits/security-pros` | `data/security-references.json` | 40 / 50 |
| Gods of AI | `assets/portraits/gods-of-ai` | `data/ai-references.json` | 37 / 50 |
| Women in Tech | `assets/portraits/women-in-tech` | `data/women-references.json` | 43 / 50 |
| Tech CEOs | `assets/portraits/tech-ceos` | `data/ceo-references.json` | 49 / 50 |

The original file is `card_NNN.png`, numbered within its series. Source credits must match
both the card number and slug. The catalog records the file path, SHA-256 and
photographer/license/source information. The website and review gallery display
the source credit. A missing portrait gets an explicit **Portrait pending** plate;
it never triggers text-only generation, a guessed likeness or an abstract image.

If a new portrait is commissioned, use the existing series workflow with an
identified source photograph and review it before adding it to the approved
directory. The v2 release renderer will pick up that file on the next build.

## Creating the new paintings

The built-in `image_gen` tool edits each original PNG separately. The prompts in
`assets/portraits-v2/prompt.md` and `proof-prompt.md` constrain face, age, hair,
expression, pose, clothing and scene content, and request refined painted detail.
Generation never receives the complete card face or modifies its factual text.

Each output is compared visually with its input before its record is marked
reviewed. `assets/portraits-v2/manifest.json` records both image hashes, the exact
source path, prompt file/hash and review result. The release builder requires a
complete, unique, reviewed manifest, verifies the original input still matches,
and rejects missing edits, changed inputs, corrupt output or an unchanged image
being presented as new artwork. Cards without an approved portrait retain their
pending plate. Photo credits follow each portrait into the new edition.

The release renderer itself does not call an image service; it consumes the
reviewed edits using `--portrait-edits assets/portraits-v2/manifest.json`.

## Formats and checkpoints

The default outputs real PNG card faces at 1000 × 1490 plus the selected
`artwork.png`. With `--portrait-edits`, this is the new painting; without that
option, the renderer can still reproduce the original portrait edition. `--format svg` emits SVG card layouts embedding the source
PNG; these are intentionally raster portraits inside vector layouts, not native
vector redraws of the person. `--png-copies` also emits PNG copies of SVG faces.
Portrait aspect ratios are preserved without cropping off heads.

Per-card checkpoints include the source image hash and credits. Changing a source
invalidates that card's checkpoint; activation paths do not. Re-running a build
reuses completed assets. `--force` re-renders locally. A `.build.lock` prevents two
builders from writing the same staging directory. Remove a stale lock only after
verifying that its process has stopped.

The staging output includes `manifest.json`, `cards.json`, `index.html`, each
card's artwork and faces, and working `checkpoint.json` / `record.json` files.
Activation copies only the public deliverables. SHA-256 validation catches
missing or changed assets, incomplete catalogs and changed source portrait bytes.

## Metadata

Without `--offline`, the builder queries the existing NicheDB search endpoint:
`GET https://nichedb.dev/api/v1/search?q=Linus%20Torvalds&limit=30`.
It accepts person records only when the name and a known URL or project match.
Source records accompany the card; biographies are not replaced by search text.
`--allow-missing-metadata` records an unavailable lookup and continues.
`NICHEDB_API_BASE` and optional `NICHEDB_API_KEY` configure that service.
No OpenAI or other image-generation key is used by the release builder.

The published edition retains the metadata already collected for the previous
release while updating the portrait paintings.

## Selection and validation

`--series` accepts `all`, `legends`, `hacking`, `security`, `gods`, `women`, `ceos`,
or a comma-separated list. `--only 1,2` requires one series. `--limit N` builds a
proof subset, which requires `--allow-partial` for activation. Different selections
need different output directories. `--concurrency N` supports 1–64 cards.

```bash
pnpm release:v2:test
pnpm release:v2 validate --out public/releases/v2
pnpm build
```
