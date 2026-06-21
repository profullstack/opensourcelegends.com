export type Rarity = "iconic" | "legendary" | "epic" | "rare";

export type Skill = {
  label: string;
  value: number; // 0 - 99
};

export type Legend = {
  number: number;
  slug: string;
  name: string;
  title: string; // "Creator of the Linux Kernel"
  rarity: Rarity;
  impact: number; // headline IMPACT score, 0 - 99
  portrait?: string; // /cards/<slug>.jpg — falls back to a monogram
  era: string; // birth year / decade footer
  nationality: string;
  signatureProjects: string[];
  skills: Skill[];
  scouting: string;
  quote: string;
};

export const rarityLabel: Record<Rarity, string> = {
  iconic: "Iconic",
  legendary: "Legendary",
  epic: "Epic",
  rare: "Rare",
};

export const legends: Legend[] = [
  {
    number: 1,
    slug: "richard-stallman",
    name: "Richard Stallman",
    title: "Founder of the GNU Project",
    rarity: "iconic",
    impact: 98,
    era: "b. 1953",
    nationality: "USA",
    signatureProjects: ["GNU", "Emacs", "GCC", "GPL"],
    skills: [
      { label: "Free Software Ideals", value: 99 },
      { label: "Systems Programming", value: 95 },
      { label: "Movement Building", value: 97 },
      { label: "Open Source Impact", value: 96 },
    ],
    scouting:
      "Launched the free software movement and authored the GNU General Public License — the legal backbone of copyleft. Wrote GCC and Emacs, the tools a generation learned on.",
    quote: "Free software is a matter of liberty, not price.",
  },
  {
    number: 2,
    slug: "linus-torvalds",
    name: "Linus Torvalds",
    title: "Creator of Linux & Git",
    rarity: "iconic",
    impact: 99,
    era: "b. 1969",
    nationality: "Finland",
    signatureProjects: ["Linux Kernel", "Git", "Subsurface"],
    skills: [
      { label: "Kernel Architecture", value: 99 },
      { label: "Pragmatism", value: 98 },
      { label: "Distributed Systems", value: 97 },
      { label: "Open Source Impact", value: 99 },
    ],
    scouting:
      "Wrote the kernel that runs the cloud, the phone in your pocket, and the world's supercomputers. Then built Git when the tools for managing it weren't good enough.",
    quote: "Talk is cheap. Show me the code.",
  },
  {
    number: 3,
    slug: "guido-van-rossum",
    name: "Guido van Rossum",
    title: "Creator of Python",
    rarity: "legendary",
    impact: 96,
    era: "b. 1956",
    nationality: "Netherlands",
    signatureProjects: ["Python", "PEP Process", "mypy"],
    skills: [
      { label: "Language Design", value: 98 },
      { label: "Readability", value: 99 },
      { label: "Community Stewardship", value: 95 },
      { label: "Open Source Impact", value: 97 },
    ],
    scouting:
      "Python's 'Benevolent Dictator For Life' shaped the most-taught language on earth. Made code read like prose and powered the data and AI revolutions.",
    quote: "Code is read much more often than it is written.",
  },
  {
    number: 4,
    slug: "yukihiro-matsumoto",
    name: "Yukihiro Matsumoto",
    title: "Creator of Ruby",
    rarity: "legendary",
    impact: 94,
    era: "b. 1965",
    nationality: "Japan",
    signatureProjects: ["Ruby", "mruby"],
    skills: [
      { label: "Language Design", value: 96 },
      { label: "Developer Joy", value: 99 },
      { label: "Elegance", value: 97 },
      { label: "Open Source Impact", value: 92 },
    ],
    scouting:
      "Designed Ruby for programmer happiness — a language optimized for humans, not machines. The foundation Rails was built on.",
    quote: "Ruby is designed to make programmers happy.",
  },
  {
    number: 5,
    slug: "brendan-eich",
    name: "Brendan Eich",
    title: "Creator of JavaScript",
    rarity: "legendary",
    impact: 95,
    era: "b. 1961",
    nationality: "USA",
    signatureProjects: ["JavaScript", "Mozilla", "SpiderMonkey"],
    skills: [
      { label: "Language Design", value: 94 },
      { label: "Shipping Under Pressure", value: 99 },
      { label: "Browser Engineering", value: 95 },
      { label: "Open Source Impact", value: 97 },
    ],
    scouting:
      "Built the first JavaScript engine in ten days. That ten-day sprint became the language of the entire web — every browser, everywhere.",
    quote: "Always bet on JavaScript.",
  },
  {
    number: 6,
    slug: "rasmus-lerdorf",
    name: "Rasmus Lerdorf",
    title: "Creator of PHP",
    rarity: "epic",
    impact: 90,
    era: "b. 1968",
    nationality: "Denmark / Canada",
    signatureProjects: ["PHP", "Personal Home Page Tools"],
    skills: [
      { label: "Pragmatism", value: 97 },
      { label: "Web Tooling", value: 94 },
      { label: "Accessibility", value: 92 },
      { label: "Open Source Impact", value: 93 },
    ],
    scouting:
      "Built the scripting language that put the dynamic web in reach of millions of beginners. Powered a generation of the internet, from forums to Facebook.",
    quote: "I really don't like programming. I built this tool to program less.",
  },
  {
    number: 7,
    slug: "larry-wall",
    name: "Larry Wall",
    title: "Creator of Perl",
    rarity: "epic",
    impact: 89,
    era: "b. 1954",
    nationality: "USA",
    signatureProjects: ["Perl", "patch", "rn"],
    skills: [
      { label: "Text Processing", value: 99 },
      { label: "Linguistics", value: 97 },
      { label: "Pragmatism", value: 94 },
      { label: "Open Source Impact", value: 88 },
    ],
    scouting:
      "The duct tape of the internet. Perl glued the early web together, and Wall's three virtues — laziness, impatience, and hubris — defined a culture.",
    quote: "There's more than one way to do it.",
  },
  {
    number: 8,
    slug: "james-gosling",
    name: "James Gosling",
    title: "Creator of Java",
    rarity: "legendary",
    impact: 95,
    era: "b. 1955",
    nationality: "Canada",
    signatureProjects: ["Java", "NeWS", "Emacs (Gosling)"],
    skills: [
      { label: "Language Design", value: 96 },
      { label: "Portability", value: 99 },
      { label: "VM Engineering", value: 95 },
      { label: "Open Source Impact", value: 93 },
    ],
    scouting:
      "Write once, run anywhere. Java's virtual machine made portable software real and still runs the backbone of enterprise and Android.",
    quote: "Java is C++ without the guns, knives, and clubs.",
  },
  {
    number: 9,
    slug: "ken-thompson",
    name: "Ken Thompson",
    title: "Co-creator of Unix & Go",
    rarity: "iconic",
    impact: 97,
    era: "b. 1943",
    nationality: "USA",
    signatureProjects: ["Unix", "B", "UTF-8", "Go"],
    skills: [
      { label: "Systems Programming", value: 99 },
      { label: "Minimalism", value: 98 },
      { label: "Language Design", value: 96 },
      { label: "Open Source Impact", value: 97 },
    ],
    scouting:
      "Co-invented Unix, co-designed UTF-8 on a diner placemat, and decades later co-created Go. Every operating system carries his fingerprints.",
    quote: "When in doubt, use brute force.",
  },
  {
    number: 10,
    slug: "dennis-ritchie",
    name: "Dennis Ritchie",
    title: "Creator of C & Co-creator of Unix",
    rarity: "iconic",
    impact: 98,
    era: "1941 – 2011",
    nationality: "USA",
    signatureProjects: ["C", "Unix"],
    skills: [
      { label: "Language Design", value: 99 },
      { label: "Systems Programming", value: 99 },
      { label: "Foundational Impact", value: 99 },
      { label: "Open Source Impact", value: 96 },
    ],
    scouting:
      "Created C, the language nearly every other language is written in, and co-built Unix. The most influential programmer most people have never heard of.",
    quote: "UNIX is basic. It's simple — and that's its strength.",
  },
  {
    number: 11,
    slug: "brian-kernighan",
    name: "Brian Kernighan",
    title: "Co-author of 'The C Programming Language'",
    rarity: "epic",
    impact: 91,
    era: "b. 1942",
    nationality: "Canada",
    signatureProjects: ["AWK", "K&R", "Unix tools"],
    skills: [
      { label: "Technical Writing", value: 99 },
      { label: "Tooling", value: 95 },
      { label: "Teaching", value: 98 },
      { label: "Open Source Impact", value: 90 },
    ],
    scouting:
      "Co-wrote the book that taught the world C and coined 'Hello, world.' Built AWK and shaped the Unix philosophy of small, sharp tools.",
    quote: "Controlling complexity is the essence of computer programming.",
  },
  {
    number: 12,
    slug: "david-heinemeier-hansson",
    name: "David Heinemeier Hansson",
    title: "Creator of Ruby on Rails",
    rarity: "epic",
    impact: 92,
    era: "b. 1979",
    nationality: "Denmark",
    signatureProjects: ["Ruby on Rails", "Basecamp", "Hotwire"],
    skills: [
      { label: "Framework Design", value: 96 },
      { label: "Convention Over Config", value: 99 },
      { label: "Developer Productivity", value: 95 },
      { label: "Open Source Impact", value: 90 },
    ],
    scouting:
      "Extracted Rails from Basecamp and redefined web development with convention over configuration. Launched a thousand startups.",
    quote: "Convention over configuration.",
  },
  {
    number: 13,
    slug: "chris-lattner",
    name: "Chris Lattner",
    title: "Creator of LLVM & Swift",
    rarity: "legendary",
    impact: 94,
    era: "b. 1978",
    nationality: "USA",
    signatureProjects: ["LLVM", "Clang", "Swift", "MLIR"],
    skills: [
      { label: "Compiler Engineering", value: 99 },
      { label: "Language Design", value: 95 },
      { label: "Performance", value: 97 },
      { label: "Open Source Impact", value: 92 },
    ],
    scouting:
      "Built LLVM, the compiler infrastructure behind Swift, Rust, and more. Then designed Swift itself. Simplicity as reliability.",
    quote: "Simplicity is scalable.",
  },
  {
    number: 14,
    slug: "grace-hopper",
    name: "Grace Hopper",
    title: "Pioneer of the Compiler",
    rarity: "iconic",
    impact: 97,
    era: "1906 – 1992",
    nationality: "USA",
    signatureProjects: ["A-0 Compiler", "COBOL", "FLOW-MATIC"],
    skills: [
      { label: "Compiler Theory", value: 99 },
      { label: "Accessibility", value: 98 },
      { label: "Vision", value: 99 },
      { label: "Foundational Impact", value: 97 },
    ],
    scouting:
      "Invented the first compiler and championed machine-independent languages, making programming human-readable. Found the first literal computer bug.",
    quote: "The most dangerous phrase is 'we've always done it this way.'",
  },
  {
    number: 15,
    slug: "chris-wanstrath",
    name: "Chris Wanstrath",
    title: "Co-founder of GitHub",
    rarity: "rare",
    impact: 88,
    era: "b. 1985",
    nationality: "USA",
    signatureProjects: ["GitHub", "Resque", "Mustache"],
    skills: [
      { label: "Product Vision", value: 95 },
      { label: "Community", value: 96 },
      { label: "Open Collaboration", value: 97 },
      { label: "Open Source Impact", value: 90 },
    ],
    scouting:
      "Co-founded GitHub and turned source control into a social network. Made open source collaboration the default for a generation of developers.",
    quote: "How people build software.",
  },
  {
    number: 16,
    slug: "eric-s-raymond",
    name: "Eric S. Raymond",
    title: "Author of 'The Cathedral & the Bazaar'",
    rarity: "rare",
    impact: 86,
    era: "b. 1957",
    nationality: "USA",
    signatureProjects: ["fetchmail", "The Cathedral & the Bazaar", "Jargon File"],
    skills: [
      { label: "Open Source Advocacy", value: 97 },
      { label: "Technical Writing", value: 95 },
      { label: "Community", value: 90 },
      { label: "Open Source Impact", value: 88 },
    ],
    scouting:
      "Coined 'open source' as a movement and articulated the bazaar model of development. Gave the movement its founding manifesto.",
    quote: "Given enough eyeballs, all bugs are shallow.",
  },
];

export const featured = legends.slice(0, 8);

export function getLegend(slug: string): Legend | undefined {
  return legends.find((l) => l.slug === slug);
}
