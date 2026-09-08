// Shared card vocabulary for every series. Series One is auto-generated from the
// roster CSV and keeps its own shape; Series Two and Three are hand-curated and
// both render through <RosterCard>, so the fields that component reads live here.

export type Rarity = 'iconic' | 'legendary' | 'epic' | 'rare';

// locked    = name, stats and copy final
// draft     = copy written, still under review
// candidate = nominated, not yet accepted into the set
export type Status = 'locked' | 'draft' | 'candidate';

export type Source = {
  /** What the reader is clicking through to, not the bare URL. */
  label: string;
  url: string;
};

/**
 * The fields the roster grid renders. Each series extends this with its own
 * stat block — the four bars on a card back differ set to set, because what
 * you measure about a phone phreak is not what you measure about a CISO.
 */
export type RosterEntry = {
  number: number;
  slug: string;
  name: string;
  handle?: string;
  title: string;
  knownFor: string;
  rarity: Rarity;
  impact: number;
  nationality: string;
  era: string;
  domains: string[];
  scouting: string;
  status: Status;
  /**
   * Public references for the claims in `scouting`. Rendered on the card page
   * and in the expanded roster report, so a reader can check the history rather
   * than take our word for it. Every card in every set must carry at least one.
   */
  sources: Source[];
  /** Public paths to the rendered card faces. Written by the publish step. */
  front?: string;
  back?: string;
};

export const rarityLabel: Record<Rarity, string> = {
  iconic: 'Iconic',
  legendary: 'Legendary',
  epic: 'Epic',
  rare: 'Rare',
};

export const statusLabel: Record<Status, string> = {
  locked: 'Locked in',
  draft: 'Copy drafted',
  candidate: 'Nominated',
};
