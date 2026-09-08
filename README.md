# Open Source Legends

Trading cards for the people who built the software the world runs on.

A collectible card series celebrating the legends of open source — open-licensed
artwork and stats, limited physical foil packs, and on-chain collectibles. The
marketing site is **Next.js 16 (App Router) + React 19 + TypeScript**, using CSS
Modules (no Tailwind).

## Develop

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm build       # production build
pnpm start       # serve the production build
```

## Database (Turso / libSQL)

The waitlist is stored in [Turso](https://turso.tech) (SQLite). Configure two env
vars — copy `.env.local.sample` to `.env.local` and fill in the token:

```bash
TURSO_DATABASE_URL=libsql://opensourcelegendscom-profullstack.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=...        # turso db tokens create opensourcelegendscom
```

Create the schema once (and after schema changes):

```bash
npm run db:migrate         # applies db/schema.sql
```

Set the same two vars in the Railway service. `POST /api/waitlist` inserts email
signups into the `waitlist` table.

## Card production

Three decks, one per series. Approved portrait art lives under
`assets/portraits/<set>/` — see [assets/portraits/README.md](assets/portraits/README.md).

**Series One — Open Source Legends** (`data/roster.locked.json`, complete):

```bash
node scripts/open-source-legends.mjs validate   # roster + portraits + template dims
node scripts/open-source-legends.mjs all        # PNGs, per-card PDFs, batches, proofs
```

**Series Two — Hacking Legends** (`src/data/hacking.ts`, in progress):

```bash
pnpm hacking validate          # roster checks, reports what art is missing
pnpm hacking all               # portraits -> render -> enhance -> publish
pnpm hacking all 1 5 12        # ...only these card numbers
pnpm hacking render            # re-render faces from the template, no API calls
```

The Series Two stages are:

| Stage | Output | Cost |
| --- | --- | --- |
| `portraits` | `assets/portraits-art/hacking-legends/` | one image call per card |
| `render` | `dist/hacking/html/` (700x1043 @2x + the source HTML) | free |
| `enhance` | `dist/hacking/enhanced/` — premium finish, text preserved | two image calls per card |
| `publish` | `public/cards/hacking/` at 500x745, and writes `front`/`back` into `src/data/hacking.ts` | free |

Every stage skips work that already exists, so a failed batch is just re-run.
Move a portrait from `assets/portraits-art/hacking-legends/` to
`assets/portraits/hacking-legends/` to approve it — the approved copy wins and is
never regenerated.

Set `OPENAI_API_KEY` (uses `gpt-image-2`) or `GEMINI_API_KEY` (uses
`gemini-3-pro-image-preview`); override with `IMAGE_PROVIDER`,
`OPENAI_IMAGE_MODEL` or `GEMINI_IMAGE_MODEL`. Rendering needs Chrome or
Chromium — set `CHROME_PATH` if it is not on the usual paths.

`dist/hacking/` is gitignored, so the full-resolution faces are local only.
Archive them before wiping the directory if you want print masters.

**Series Three — Security Professionals** (`src/data/security.ts`, 50 cards):

```bash
pnpm security validate         # roster checks, reports what art is missing
pnpm security all              # portraits -> render -> publish
pnpm security all 1 5 12       # ...only these card numbers
pnpm security render           # re-render faces from the template, no API calls
```

Same stages and the same resumability as Series Two, with one deliberate
difference: **`all` does not run `enhance`.** On Series Two that image-to-image
finish pass rewrote text on the card faces despite the prompt forbidding it — it
fabricated quotes attributed to living people, invented stat panels that were not
on the card, and misspelled a name. Nothing in the pipeline catches that, because
there is no OCR step. Since this set's whole premise is documented, sourced
history, an invented quote is the worst defect it can carry, so the pass is
opt-in: it refuses to run unless `ENHANCE_I_WILL_CHECK_EVERY_FACE=1` is set, and
running it means checking every face by eye before publish.

Two template changes follow from the same finding. The curator's note renders as a
labelled panel rather than wrapped in quote marks, because on Series Two backs the
quoted note reads as something the subject said — the field is editorial voice.
And the front's portrait window is taller, so the caption band is sized to what it
holds instead of leaving a third of the card empty.

Nobody appears in more than one series; `src/data/roster.ts` holds the shared card
vocabulary that Series Two and Three both render through.

## Project layout

```
src/
  app/
    page.tsx                  # landing page
    cards/                    # Series One gallery + card pages
    hacking-legends/          # Series Two roster + card pages
    security-professionals/   # Series Three roster
    collect/                  # physical packs · NFT mint · print-your-own
    contribute/               # how to nominate / add a legend
    globals.css               # design tokens + utilities
    layout.tsx                # header/footer shell + metadata
  components/
    CardFlip.tsx              # Series One flip card
    RosterCard.tsx            # shared roster tile for Series Two and Three
    CardDetail.tsx            # the card page body
    Header / Footer / WaitlistForm / AdUnit
  data/
    roster.ts                 # shared card vocabulary (rarity, status, sources)
    cards.ts                  # Series One — generated from the locked roster
    hacking.ts                # Series Two — hand-curated
    security.ts               # Series Three — hand-curated
    site.ts                   # site config (name, links, license)
public/
  crest.svg                   # the Open Source Legends crest
  cards/                      # rendered card faces, one directory per series
docs/                         # print proofs / design references
```

## Add a legend

Append a typed record to the data module for the series — `src/data/hacking.ts`
for Series Two, `src/data/security.ts` for Series Three (see the spec on the
`/contribute` page). Every entry needs at least one public source for the claims
in its scouting report, and no name may appear in more than one series. Art is
generated later by the publish step, so leave `front`/`back` off. Then open a
pull request.

## License

Card art and data are **CC BY-SA 4.0**. Code is MIT.

A [Profullstack](https://profullstack.com) project.
