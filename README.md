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

Five decks, one per series. Approved portrait art lives under
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

Portraits are painted **from a real photograph of the person**:

```bash
node scripts/security-refs.mjs resolve   # find + verify a reference photo per card
node scripts/security-refs.mjs fetch     # download them (gitignored)
node scripts/security-refs.mjs report    # who still has no face
```

The first art pass generated faces from text prompts alone and produced an
invented stranger for every name. That art was withdrawn. Generation is now
image-to-image off `assets/references/security-pros/`, and **a card with no
verified reference photo gets no face** — the front renders a plate saying so.
40 of 50 currently have one; `data/security-references.json` records the source,
photographer and licence for each, and the card page prints the credit.

Identity is verified, not assumed. A name search returns humans, not the right
human: "Michael Howard" resolves to the British politician, "Robert M. Lee" to a
Confederate general, "Mark Dowd" to a Liverpool councillor. The resolver requires
a surname match, rejects pre-1950 photographs, requires a Commons filename to
*open* with the person's full name, and carries an explicit reject list with
reasons. Everything it accepts was still checked by eye.

The same stages and resumability as Series Two, with one deliberate difference:
**`all` does not run `enhance`.** On Series Two that image-to-image
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

**Series Four — Gods of AI** (`src/data/ai.ts`, 50 cards):

```bash
pnpm gods:refs                 # find + verify a reference photo per card
pnpm gods validate             # roster checks
pnpm gods all                  # portraits -> render -> publish
pnpm gods:render               # re-render faces from the template, no API calls
```

The architects of machine learning, scored explicitly on how much they gave away —
`research`, `systems`, `openness`, `influence`. Same likeness rule as Series Three:
portraits are painted from an identified photograph and a card with no verified
photo gets no face. 37 of 50 have one.

For this set GitHub profile photographs are a strong source: the account is the
person's own and the API reports their real name to check against. That is not a
free licence, so those are recorded as `supplied`.

Two traps worth knowing, both caught by eye rather than by code. Commons filename
matching accepted a blue wolf statue outside a brewery for "Thomas Wolf" and a
Bulgarian basketball player for "Georgi Gerganov". And a reference whose subject's
head is cropped out of frame, or whose avatar is a felt sculpture, makes the model
invent a face — which is why François Chollet has no portrait.

**Series Five — Women in Tech** (`src/data/women.ts`, 50 cards):

```bash
pnpm women:refs                # find + verify a reference photo per card
pnpm women all                 # portraits -> render -> publish
```

180 years, from Lovelace to the people auditing models now. Rated on `technical`,
`pioneering`, `openness`, `influence`. 43 of 50 have a verified photograph.

**The date guard had to come out for this set.** Series Three rejects any reference
photograph dated before 1950, because an old plate meant the search had found a
historical namesake. Here the historical figures ARE the subject, so that guard
would have silently deleted Lovelace, Hopper and every ENIAC and Bletchley entry.
`women-refs.mjs` has no date or birth-year floor. Read the comment before copying
the resolver to a sixth set.

What the review caught this time: a photograph of the **house** carrying Joan
Clarke's blue plaque, a **screenshot of a Wikidata item** for Anita Borg, a
**different Julia Evans**, a **French astronaut** named Camille Fournier, and two
ENIAC room shots where no face is legible. Léonie Watson's avatar is her logo and
Julia Evans' is a cartoon star, which is the Chollet failure again: give the model
a reference with no face and it will invent one rather than fail.

Nobody appears in more than one series, so the fifteen women already carded in
Series Two to Four are linked from the roster page instead of repeated.

**Series Six — Tech CEOs** (`src/data/ceos.ts`, 50 cards):

```bash
pnpm ceos:refs                 # find + verify a reference photo per card
pnpm ceos all                  # portraits -> render -> publish
pnpm ceos:render               # re-render faces from the template, no API calls
```

The people who ran the companies, ordered roughly by when they took charge. The
axes the other sets use do not travel — rating a chief executive on technical depth
mostly measures how long ago they stopped writing code — so this set rates
`product`, `operating`, `openness` and `influence`.

`openness` is the reason a CEO set belongs on this site at all: Gerstner's billion
dollars behind Linux, Java under the GPL, Nvidia's GPU kernel modules, the GitHub
acquisition. It is also why the set prints the bad decisions. Gates is carded with
the Open Letter to Hobbyists and the Sherman Act ruling on the same card.

The date guard stays out, for a different reason than Series Five. The earliest
person here was born in 1912, so a 1950s photograph of Packard or Watson is exactly
right; namesakes are caught by the surname and description tests in `looksRight()`,
which are specific rather than chronological. The `FIELD` regex is wider on the
business side than the other sets, because Wikidata describes these people as
"business magnate" and "chief executive officer" rather than "computer scientist".

49 of 50 resolved to a verified photograph on the first pass, the highest rate of
any set — public-company CEOs are photographed at conferences by people who upload
to Commons. The exception is Sid Sijbrandij: no Commons file, no Wikidata P18, and
the obvious fallback avatar is served by an account whose API record has a null name
and a recent numeric id, so it cannot be tied to him the way the Series Four and
Five avatar overrides were. That card ships with no face.

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

## Artwork and card data v2

Build a new edition with native SVG artwork by default, Astra 6 at `xhigh`,
NicheDB metadata and optional GPT Image 2 PNG output:

```bash
pnpm release:v2 --dry-run
pnpm release:v2 --series legends --only 2 --out dist/releases/v2-proof
```

See [the v2 workflow](docs/artwork-v2.md) for full-edition builds, PNG fallback,
resume behavior, visual review, validation and local activation.
