export const site = {
  name: "Open Source Legends",
  tagline: "Trading cards for the people who built the software the world runs on.",
  description:
    "A collectible card series celebrating the legends of open source. Open-licensed artwork, limited physical packs, and on-chain collectibles.",
  url: "https://opensourcelegends.com",
  github: "https://github.com/profullstack/opensourcelegends.com",
  twitter: "https://x.com/profullstackinc",
  email: "hello@opensourcelegends.com",
  license: "CC BY-SA 4.0",
} as const;

export const nav = [
  { label: "The Set", href: "/cards" },
  { label: "Collect", href: "/collect" },
  { label: "Contribute", href: "/contribute" },
] as const;
