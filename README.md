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

Two decks, one per series. Approved portrait art lives under
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

## Project layout

```
src/
  app/
    page.tsx            # landing page
    cards/              # the full set gallery
    collect/            # physical packs · NFT mint · print-your-own
    contribute/         # how to nominate / add a legend
    globals.css         # design tokens + utilities
    layout.tsx          # header/footer shell + metadata
  components/
    LegendCard.tsx      # the trading-card component (matches the print design)
    Header / Footer / WaitlistForm
  data/
    legends.ts          # the card data — one typed record per legend
    site.ts             # site config (name, links, license)
public/
  crest.svg             # the Open Source Legends crest
  cards/                # optional portrait art: /cards/<slug>.jpg
docs/                   # print proofs / design references
```

## Add a legend

Append a typed record to `src/data/legends.ts` (see the spec on the
`/contribute` page) and, optionally, drop portrait art at
`public/cards/<slug>.jpg`. Cards with no portrait render a monogram fallback.
Then open a pull request.

## License

Card art and data are **CC BY-SA 4.0**. Code is MIT.

A [Profullstack](https://profullstack.com) project.
