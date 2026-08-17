# Portraits

Approved, human-reviewed portrait art. One directory per card set.

| Directory          | Set                              | Roster source          | Status                       |
| ------------------ | -------------------------------- | ---------------------- | ---------------------------- |
| `legends/`         | Open Source Legends (Series One) | `data/roster.locked.json` | Complete, 50 portraits    |
| `hacking-legends/` | Hacking Legends (Series Two)     | `src/data/hacking.ts`  | In progress, 30 on roster     |

## Naming

`card_###.png`, zero-padded to three digits, numbered within the set. The number
is the card's position in its own roster, so `legends/card_001.png` (Richard
Stallman) and `hacking-legends/card_001.png` (Kevin Mitnick) are both valid and
unrelated.

## Rules

- Only manually reviewed and approved art belongs here. Raw model output is
  cached in `assets/portraits-art/`, which is gitignored.
- Portrait art only. No text, labels, logos, badges, borders, or watermarks —
  the generator draws all of that.
- `node scripts/open-source-legends.mjs validate` fails if any Series One card
  has no portrait in `legends/`.

## Prompts and generation

Series One: `node scripts/open-source-legends.mjs prompts` writes per-card
portrait prompts to `dist/portrait_prompts.md`.

Series Two: `pnpm hacking portraits` generates art into
`assets/portraits-art/hacking-legends/` (gitignored). Copy one into
`hacking-legends/` here to approve it — approved art always wins and is never
regenerated. See the card production section in the root README.
