# Artwork and card data v2

The v2 release builder reads all six existing site rosters (277 cards at the time
this workflow was added). It generates a new contribution-based illustration for
each card, refreshes NicheDB metadata when a corroborated person record exists,
and produces versioned card faces, JSON, a proof gallery and a SHA-256 manifest.
Original source rosters and v1 assets remain available. This is an artwork/data
edition, not a bump to the Next application package version.

## Quick start

Use Node **22.18+** or **24+**, with the repository's dependencies installed:

```bash
pnpm install --frozen-lockfile

# No API calls, no writes, no charges: inspect the whole selection.
pnpm release:v2 --dry-run

# Set OPENAI_API_KEY through your environment/secret manager first.
# Build one proof before spending on the full edition.
pnpm release:v2 --series legends --only 2 --out dist/releases/v2-proof

# Open dist/releases/v2-proof/index.html and inspect both sides and sources.
pnpm release:v2 validate --out dist/releases/v2-proof

# Build the whole edition. Re-run this exact command after an interruption.
pnpm release:v2 --png-copies
pnpm release:v2 validate

# After reviewing dist/releases/v2/index.html, activate the completed files locally.
pnpm release:v2 activate
```

Activation copies finished assets into `public/releases/v2/` and updates the exact
`front` and `back` properties in the six TypeScript rosters. The existing card UI
already accepts those paths, including SVG. It preserves hand-curated biography
text, names, rarity, ratings and reference-photo credits. The new metadata and
source records ship in `/releases/v2/cards.json`. Review and commit these changes,
then deploy through the site's normal workflow. The script does not merge, tag,
create a GitHub release, or deploy automatically.

An intentionally small release can be activated using `--allow-partial` with its
`--out` path. A different release cannot silently overwrite an existing activated
v2 directory; archive that directory first. Git can restore the original roster
paths to roll back the displayed edition.

## Native SVG and PNG

The default uses `gpt-6-astra` through the Responses API with
`reasoning.effort: "xhigh"` to author actual SVG geometry. “astra6-extrahigh” is
expressed as the model ID and reasoning setting separately. The output is not a
PNG inside an SVG wrapper, a traced v1 picture, or a renamed raster file.

GPT Image 2 is used for raster artwork. Its Images API produces PNG, JPEG or WebP;
it does not return native SVG. The script sends `gpt-image-2`, quality `high`, and
`output_format: "png"` when PNG is selected:

```bash
# Explicitly choose new Image 2 artwork and real PNG card faces.
pnpm release:v2 --format png --out dist/releases/v2-png

# Prefer native SVG; allow a new Image 2 PNG if SVG fails validation and repair.
pnpm release:v2 --png-fallback

# Keep native SVG masters and export PNG copies of both card faces as well.
pnpm release:v2 --png-copies
```

Fallback is opt-in and recorded per card. A failed SVG gets one repair attempt;
only a remaining SVG-content validation failure can trigger Image 2. Refusals,
moderation blocks, billing, authentication and API failures cannot be routed
around through PNG fallback. An API failure fails the card and leaves the release
incomplete for a later retry. Resuming reuses validated paid artwork, even if a
card face needs to be rendered again. Changing model, format or other generation
settings invalidates the relevant checkpoints. `--force` regenerates deliberately
and may incur charges again.

The collection uses original editorial vector art: architectural forms,
topological sculptures, optical constructions and printmaking-like compositions
derived from each person's work. It excludes fantasy trading-card styling,
Magic: The Gathering styling, ornate fantasy frames and generic cyberpunk heads.
It depicts contributions rather than inventing faces. A hashed card identity
selects a composition starting point; the model interprets it for the individual.
The SVG validator checks safety, XML validity, geometry and visible output;
artistic quality and conceptual originality still require visual review.

Factual names and copy are typeset deterministically. Image generation never
edits the complete card face. Legacy editorial notes/quotes are not placed into
new attributed quotes. The back preserves the existing curated scouting report.

## NicheDB enrichment

The client calls the real public API:

```text
GET https://nichedb.dev/api/v1/search?q=Linus%20Torvalds&limit=30
```

Searches span collections. Only person/profile records with an exact normalized
name (or an existing handle) and a matching known source URL or known project
phrase are accepted. This prevents similarly named people and unrelated search
results from being attached to a card. Some relevant results can remain
unconfirmed under this conservative rule.

Each card records the query URL, lookup timestamp, match basis, original source
URL, NicheDB page, update timestamp, title, summary and tags. Matching records add
source links to the v2 catalog. These are copied source records, not newly asserted
or model-invented biographical facts. The existing factual copy is retained;
NicheDB text is supplied to the art model only as untrusted reference material.

Statuses distinguish `matched`, `not-found`, `unconfirmed`, `offline` and
`unavailable`. No-match searches succeed without inventing data. By default an API
outage fails that card; `--allow-missing-metadata` records the outage and continues.
`--offline` explicitly skips NicheDB, but still uses OpenAI to generate artwork.
The first live integration check for Linus Torvalds returned no records; this
workflow does not claim NicheDB has every person.

## Options and outputs

| Setting | Default |
| --- | --- |
| `OPENAI_TEXT_MODEL` | `gpt-6-astra` |
| `OPENAI_REASONING_EFFORT` | `xhigh` |
| `OPENAI_IMAGE_MODEL` | `gpt-image-2` |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| `OPENAI_MAX_OUTPUT_TOKENS` | `48000` (includes reasoning tokens) |
| `NICHEDB_API_BASE` | `https://nichedb.dev/api/v1` |
| `NICHEDB_API_KEY` | Unset; public reads need no key |

`--series` accepts `all`, `legends`, `hacking`, `security`, `gods`, `women`, `ceos`,
or a comma-separated selection. `--only 1,2` requires exactly one series.
`--limit N` selects a proof subset. Selections cannot be mixed in the same output
directory; use a different `--out` for a different selection.

Staging contains:

- `manifest.json`: selected roster, configuration, completion status, provenance,
  failures, source fingerprints and asset checksums.
- `cards.json`: existing card data plus edition, new asset paths, research and
  collected sources.
- `index.html`: both faces and matched NicheDB records for review.
- `<series>/<number>-<slug>/artwork.svg`, `front.svg`, `back.svg` by default;
  `.png` files for Image 2 output or permitted fallback.
- Per-card `checkpoint.json` and `record.json` for reliable restart. These are
  working files and are not copied to the public site.

Keep the staging directory between runs; paid artwork cannot be reproduced
exactly if deleted. Activation preserves the final masters and provenance in
the repository. A `.build.lock` prevents concurrent builders writing the same
directory. If the process is killed, verify it has stopped before removing its
stale lock file and resuming.

Requests have timeouts and bounded retries for transient failures. Generation is
sequential to make stopping, recovery and rate-limit handling predictable. The
script reports actual API usage when returned, but does not estimate spending or
promise API model access: your account must have access to the configured models.
No paid API generation is necessary for the mocked automated tests.

```bash
pnpm release:v2:test
```

Verified API references:
[GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra),
[GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2),
[image output formats](https://developers.openai.com/api/docs/guides/image-generation#output-format).
