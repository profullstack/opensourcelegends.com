// Hacking Legends — Series Two. IN PROGRESS: copy is being written, art is not started.
// Hand-curated (not auto-generated). Every entry is a real, publicly documented figure;
// keep scouting reports factual and neutral — this set documents history, it does not
// endorse crimes. No invented quotes: the `note` field is editorial voice, not attribution.

export type Rarity = 'iconic' | 'legendary' | 'epic' | 'rare';

// locked    = name, stats and copy final
// draft     = copy written, still under review
// candidate = nominated, not yet accepted into the set
export type Status = 'locked' | 'draft' | 'candidate';

export type Hacker = {
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
  note: string;
  status: Status;
  /** Art is not rendered yet for this series. Populated once cards are illustrated. */
  front?: string;
  back?: string;
};

export const hackers: Hacker[] = [
  {
    number: 1,
    slug: 'kevin-mitnick',
    name: 'Kevin Mitnick',
    handle: 'Condor',
    title: 'The World’s Most Wanted Hacker',
    knownFor: 'Social engineering, and the manhunt that followed it',
    rarity: 'iconic',
    impact: 98,
    nationality: 'USA',
    era: '1979–2023',
    domains: ['Social engineering', 'Phone phreaking', 'Telecom'],
    scouting:
      'Talked his way into more networks than he ever broke into. A teenage phone phreak who became the FBI’s most-wanted hacker, was captured in 1995, served five years, and came out the other side as a security consultant and author of The Art of Deception. He made the industry admit the obvious: the person on the phone is the vulnerability.',
    note: 'The card that defines the set. Nobody argues about this one.',
    status: 'locked',
  },
  {
    number: 2,
    slug: 'john-draper',
    name: 'John Draper',
    handle: 'Captain Crunch',
    title: 'The Original Phone Phreak',
    knownFor: 'The 2600 Hz whistle that opened the phone network',
    rarity: 'iconic',
    impact: 94,
    nationality: 'USA',
    era: '1970s–1980s',
    domains: ['Phone phreaking', 'Blue boxes'],
    scouting:
      'Discovered that a toy whistle packed in a cereal box produced the exact 2600 Hz tone AT&T used to signal a free trunk line. The blue-box scene that grew from it pulled in two young Californians named Wozniak and Jobs, and drew the blueprint for every generation of hacker that followed.',
    note: 'Patient zero for hacker culture. The whistle is the artifact of the century.',
    status: 'locked',
  },
  {
    number: 3,
    slug: 'robert-tappan-morris',
    name: 'Robert Tappan Morris',
    title: 'Author of the Morris Worm',
    knownFor: 'The 1988 worm that took down the early internet',
    rarity: 'iconic',
    impact: 96,
    nationality: 'USA',
    era: '1988–present',
    domains: ['Worms', 'Unix internals'],
    scouting:
      'Released a self-replicating program from MIT in November 1988 that reinfected hosts far faster than intended and knocked out a large share of the machines on the internet. First person convicted under the Computer Fraud and Abuse Act. Went on to become an MIT professor and a co-founder of Y Combinator.',
    note: 'The accident that created the entire incident-response industry — CERT exists because of this.',
    status: 'locked',
  },
  {
    number: 4,
    slug: 'peiter-zatko',
    name: 'Peiter Zatko',
    handle: 'Mudge',
    title: 'L0pht Elder, Government Insider',
    knownFor: 'Telling the Senate he could take down the internet in 30 minutes',
    rarity: 'iconic',
    impact: 95,
    nationality: 'USA',
    era: '1990s–present',
    domains: ['Vulnerability research', 'Policy', 'Password cracking'],
    scouting:
      'Front man of L0pht Heavy Industries and co-author of L0phtCrack. In 1998 the crew testified before the US Senate under their handles and warned that the internet could be taken down in half an hour. Later ran cyber programs at DARPA, worked security at Google and Stripe, and blew the whistle on Twitter’s security posture in 2022.',
    note: 'The rare legend who went from underground to the Senate floor without changing his story.',
    status: 'locked',
  },
  {
    number: 5,
    slug: 'kevin-poulsen',
    name: 'Kevin Poulsen',
    handle: 'Dark Dante',
    title: 'The Phreak Who Won a Porsche',
    knownFor: 'Taking over LA phone lines to win a radio contest',
    rarity: 'legendary',
    impact: 88,
    nationality: 'USA',
    era: '1980s–present',
    domains: ['Phone phreaking', 'Journalism'],
    scouting:
      'Seized control of every telephone line into KIIS-FM to guarantee he was caller 102 and won a Porsche. Ran from the FBI, was profiled on Unsolved Mysteries, and served time. Reinvented himself as an investigative journalist at Wired and helped build SecureDrop, the whistleblower system used by newsrooms worldwide.',
    note: 'Rigged a radio contest, then spent his second act protecting sources.',
    status: 'locked',
  },
  {
    number: 6,
    slug: 'eric-corley',
    name: 'Eric Corley',
    handle: 'Emmanuel Goldstein',
    title: 'Publisher of 2600',
    knownFor: '2600: The Hacker Quarterly and Off The Hook',
    rarity: 'legendary',
    impact: 90,
    nationality: 'USA',
    era: '1984–present',
    domains: ['Publishing', 'Radio', 'Activism'],
    scouting:
      'Founded 2600: The Hacker Quarterly in 1984 and has been broadcasting Off The Hook on WBAI since 1988. Organizer of the HOPE conferences and a defendant in the DeCSS case, where the courts first wrestled with whether publishing code is speech.',
    note: 'The set needs a printing press, and this is it.',
    status: 'locked',
  },
  {
    number: 7,
    slug: 'loyd-blankenship',
    name: 'Loyd Blankenship',
    handle: 'The Mentor',
    title: 'Author of the Hacker Manifesto',
    knownFor: '“The Conscience of a Hacker,” written after his arrest',
    rarity: 'legendary',
    impact: 87,
    nationality: 'USA',
    era: '1980s–1990s',
    domains: ['Writing', 'Legion of Doom', 'Game design'],
    scouting:
      'Member of the Legion of Doom who, hours after being arrested in 1986, wrote the essay that Phrack published as The Conscience of a Hacker. Later wrote GURPS Cyberpunk for Steve Jackson Games — the manuscript the Secret Service seized in a raid that helped spark the founding of the EFF.',
    note: 'One page of text that every hacker under thirty could still quote a decade later.',
    status: 'locked',
  },
  {
    number: 8,
    slug: 'jeff-moss',
    name: 'Jeff Moss',
    handle: 'Dark Tangent',
    title: 'Founder of DEF CON',
    knownFor: 'Building the conferences where the scene meets',
    rarity: 'legendary',
    impact: 89,
    nationality: 'USA',
    era: '1993–present',
    domains: ['Community', 'Conferences', 'Policy'],
    scouting:
      'Threw a going-away party for a friend in Las Vegas in 1993 and accidentally founded DEF CON, now the largest hacker gathering on earth. Also founded Black Hat, served on the US Homeland Security Advisory Council, and spent years translating between the underground and the institutions that fear it.',
    note: 'Every other legend in this set has stood on a stage he built.',
    status: 'locked',
  },
  {
    number: 9,
    slug: 'dan-kaminsky',
    name: 'Dan Kaminsky',
    title: 'The Man Who Patched DNS',
    knownFor: 'The 2008 DNS cache-poisoning flaw',
    rarity: 'iconic',
    impact: 95,
    nationality: 'USA',
    era: '2000s–2021',
    domains: ['DNS', 'Protocol research', 'Coordinated disclosure'],
    scouting:
      'Found a flaw that let an attacker poison DNS caches and quietly redirect any name on the internet. Instead of publishing, he organized a secret multi-vendor patch effort and got the whole internet fixed on one coordinated day in July 2008. Died in 2021 at 42, and the industry has not stopped talking about him since.',
    note: 'Proof that the biggest bug of your career is a responsibility, not a trophy.',
    status: 'locked',
  },
  {
    number: 10,
    slug: 'cliff-stoll',
    name: 'Clifford Stoll',
    title: 'The Astronomer Who Caught a Spy',
    knownFor: 'The Cuckoo’s Egg',
    rarity: 'legendary',
    impact: 88,
    nationality: 'USA',
    era: '1986–1989',
    domains: ['Incident response', 'Forensics', 'Writing'],
    scouting:
      'Chased a 75-cent accounting error at Lawrence Berkeley Lab all the way to Markus Hess, a West German hacker selling US military data to the KGB. His logbooks and homemade tripwires invented network intrusion detection by hand, and The Cuckoo’s Egg is still the best on-ramp anyone ever wrote.',
    note: 'The first documented cyber-espionage case, solved by an astronomer with a printer.',
    status: 'locked',
  },
  {
    number: 11,
    slug: 'tsutomu-shimomura',
    name: 'Tsutomu Shimomura',
    title: 'The Man Who Tracked Mitnick',
    knownFor: 'The 1995 pursuit and TCP sequence-prediction analysis',
    rarity: 'epic',
    impact: 82,
    nationality: 'Japan / USA',
    era: '1990s',
    domains: ['Network forensics', 'TCP/IP'],
    scouting:
      'Computational physicist at San Diego Supercomputer Center whose own machines were broken into on Christmas Day 1994. His analysis of the IP-spoofing and TCP sequence-prediction attack, and the cell-tracking work that followed, led federal agents to Kevin Mitnick in Raleigh in February 1995.',
    note: 'Card 1’s opposite number. They belong in the same pack.',
    status: 'draft',
  },
  {
    number: 12,
    slug: 'mark-abene',
    name: 'Mark Abene',
    handle: 'Phiber Optik',
    title: 'Masters of Deception',
    knownFor: 'The MOD-versus-LOD hacker war',
    rarity: 'legendary',
    impact: 84,
    nationality: 'USA',
    era: '1980s–1990s',
    domains: ['Telecom switching', 'Crews'],
    scouting:
      'Teenage authority on telephone switching systems and the public face of Masters of Deception. His 1994 prison sentence was widely read as a message being sent to a whole generation; New York magazine had already named him one of the city’s smartest people.',
    note: 'The last of the pure telephone hackers before the internet took over.',
    status: 'draft',
  },
  {
    number: 13,
    slug: 'susan-headley',
    name: 'Susan Headley',
    handle: 'Susan Thunder',
    title: 'Early Social Engineer',
    knownFor: 'Talking her way into military and telco systems',
    rarity: 'epic',
    impact: 78,
    nationality: 'USA',
    era: '1970s–1980s',
    domains: ['Social engineering', 'Phone phreaking'],
    scouting:
      'Ran in the same Los Angeles phreaking circles as Mitnick and Lewis De Payne and specialized in the human layer — pretext calls, trashed printouts, borrowed credentials. One of the very few women documented in the earliest scene, and she walked away from it entirely.',
    note: 'Written out of most retellings. This set puts her back in.',
    status: 'draft',
  },
  {
    number: 14,
    slug: 'adrian-lamo',
    name: 'Adrian Lamo',
    handle: 'The Homeless Hacker',
    title: 'Intruder, Then Informant',
    knownFor: 'The New York Times intrusion, and reporting Chelsea Manning',
    rarity: 'epic',
    impact: 80,
    nationality: 'USA',
    era: '2000s–2018',
    domains: ['Web intrusion', 'Misconfiguration hunting'],
    scouting:
      'Broke into Microsoft, Yahoo and The New York Times from library terminals and coffee shops, usually telling the victim afterwards. In 2010 he reported Chelsea Manning to the authorities after she confided in him — a decision that split the community permanently. Died in 2018.',
    note: 'The most divisive card in the set, and it stays in. The history is the history.',
    status: 'draft',
  },
  {
    number: 15,
    slug: 'gary-mckinnon',
    name: 'Gary McKinnon',
    handle: 'Solo',
    title: 'The UFO Hunter',
    knownFor: 'Searching US military networks for evidence of UFOs',
    rarity: 'epic',
    impact: 76,
    nationality: 'UK',
    era: '2001–2002',
    domains: ['Default credentials', 'Extradition law'],
    scouting:
      'Scanned US military and NASA networks for machines with blank administrator passwords and found plenty. US prosecutors called it the biggest military computer hack of all time; a decade-long extradition fight ended in 2012 when the UK Home Secretary blocked it on human-rights grounds.',
    note: 'Two words: no password. That is the whole exploit.',
    status: 'draft',
  },
  {
    number: 16,
    slug: 'jonathan-james',
    name: 'Jonathan James',
    handle: 'c0mrade',
    title: 'The Teenager Who Got NASA’s Source',
    knownFor: 'First juvenile jailed in the US for computer crime',
    rarity: 'epic',
    impact: 77,
    nationality: 'USA',
    era: '1999–2008',
    domains: ['Government networks', 'Backdoors'],
    scouting:
      'At fifteen, installed a backdoor on a Defense Threat Reduction Agency server and downloaded NASA software supporting the International Space Station. Sentenced in 2000 as the first juvenile incarcerated for cybercrime in the US. Died by suicide in 2008 while under investigation in an unrelated case he denied any part in.',
    note: 'A cautionary card. The set tells it straight or not at all.',
    status: 'draft',
  },
  {
    number: 17,
    slug: 'chris-wysopal',
    name: 'Chris Wysopal',
    handle: 'Weld Pond',
    title: 'Architect of Responsible Disclosure',
    knownFor: 'L0pht, the Senate testimony, and disclosure norms',
    rarity: 'legendary',
    impact: 86,
    nationality: 'USA',
    era: '1990s–present',
    domains: ['Vulnerability research', 'AppSec', 'Disclosure policy'],
    scouting:
      'One of the seven L0pht members who testified to the Senate in 1998. Spent the following decades turning ad-hoc bug reporting into a process the industry could live with, then co-founded Veracode to make application security something you can actually buy.',
    note: 'Half the reason a vendor takes your bug report seriously today.',
    status: 'draft',
  },
  {
    number: 18,
    slug: 'katie-moussouris',
    name: 'Katie Moussouris',
    title: 'The Bug Bounty Builder',
    knownFor: 'Microsoft’s first bounty program and Hack the Pentagon',
    rarity: 'legendary',
    impact: 87,
    nationality: 'USA',
    era: '2000s–present',
    domains: ['Bug bounties', 'Policy', 'Export controls'],
    scouting:
      'Created Microsoft’s first bug bounty program, then ran Hack the Pentagon, the first bounty program in the history of the US federal government. Fought to keep defensive research from being criminalized under the Wassenaar Arrangement, and founded Luta Security.',
    note: 'Turned “we do not pay for bugs” into an industry standard line item.',
    status: 'draft',
  },
  {
    number: 19,
    slug: 'joanna-rutkowska',
    name: 'Joanna Rutkowska',
    title: 'Blue Pill',
    knownFor: 'Hypervisor rootkits and Qubes OS',
    rarity: 'legendary',
    impact: 88,
    nationality: 'Poland',
    era: '2006–present',
    domains: ['Rootkits', 'Virtualization', 'Secure OS design'],
    scouting:
      'Presented Blue Pill at Black Hat 2006, a rootkit that moved a running OS into a hypervisor beneath it, and coined the Evil Maid attack for machines left unattended. Then built the answer: Qubes OS, a desktop that assumes compromise and isolates by compartment.',
    note: 'Broke the platform, then shipped a better one. Very few do both.',
    status: 'draft',
  },
  {
    number: 20,
    slug: 'michal-zalewski',
    name: 'Michał Zalewski',
    handle: 'lcamtuf',
    title: 'The Fuzzer',
    knownFor: 'american fuzzy lop and Silence on the Wire',
    rarity: 'legendary',
    impact: 89,
    nationality: 'Poland',
    era: '2000s–present',
    domains: ['Fuzzing', 'Browser security', 'Passive recon'],
    scouting:
      'Wrote afl, the coverage-guided fuzzer that found thousands of bugs across the software everyone depends on and reset the state of the art for everyone else. Author of Silence on the Wire and The Tangled Web, and a long-time browser security lead at Google.',
    note: 'The bug-finding tool with the highest body count in open source history.',
    status: 'draft',
  },
  {
    number: 21,
    slug: 'solar-designer',
    name: 'Alexander Peslyak',
    handle: 'Solar Designer',
    title: 'John the Ripper',
    knownFor: 'Password cracking and Linux hardening',
    rarity: 'legendary',
    impact: 85,
    nationality: 'Russia',
    era: '1990s–present',
    domains: ['Password cracking', 'Kernel hardening', 'Disclosure'],
    scouting:
      'Wrote John the Ripper, still the reference password cracker three decades on. Founded Openwall, pioneered non-executable stack patches for Linux, published early return-into-libc work, and runs the oss-security list where the industry argues about disclosure in public.',
    note: 'Runs the mailing list where your favorite CVE was first announced.',
    status: 'draft',
  },
  {
    number: 22,
    slug: 'hd-moore',
    name: 'HD Moore',
    title: 'Creator of Metasploit',
    knownFor: 'Making exploitation a framework, not a one-off',
    rarity: 'legendary',
    impact: 90,
    nationality: 'USA',
    era: '2003–present',
    domains: ['Exploit development', 'Internet-wide scanning'],
    scouting:
      'Released Metasploit in 2003 and turned exploit development from scattered one-off code into a shared, modular framework every penetration tester now learns first. Later ran internet-wide scanning projects that mapped just how much of the internet is quietly exposed.',
    note: 'Changed what a working exploit is worth by making them all free.',
    status: 'draft',
  },
  {
    number: 23,
    slug: 'barnaby-jack',
    name: 'Barnaby Jack',
    title: 'ATM Jackpotting',
    knownFor: 'Making cash machines spit money on stage',
    rarity: 'legendary',
    impact: 84,
    nationality: 'New Zealand',
    era: '2000s–2013',
    domains: ['Embedded systems', 'Medical devices', 'ATMs'],
    scouting:
      'Walked onto the Black Hat 2010 stage, ran his Jackpotting demo, and made two ATMs pour out cash in front of the room. Then turned to insulin pumps and pacemakers, showing that implanted medical devices could be attacked wirelessly. Died in 2013, days before he was due to present that research.',
    note: 'The most theatrical demo in the history of the conference circuit.',
    status: 'draft',
  },
  {
    number: 24,
    slug: 'charlie-miller',
    name: 'Charlie Miller',
    title: 'The Car Hacker',
    knownFor: 'Remotely killing a Jeep on the highway',
    rarity: 'epic',
    impact: 83,
    nationality: 'USA',
    era: '2007–present',
    domains: ['Automotive', 'iOS', 'Pwn2Own'],
    scouting:
      'Won Pwn2Own repeatedly, was the first to publicly exploit the iPhone, and then, with Chris Valasek, cut the transmission of a Jeep Cherokee on a live highway from a couch miles away. Chrysler recalled 1.4 million vehicles. Automotive security became a real discipline overnight.',
    note: 'One demo, 1.4 million recalled vehicles. Hard to argue with the receipts.',
    status: 'draft',
  },
  {
    number: 25,
    slug: 'chris-valasek',
    name: 'Chris Valasek',
    title: 'CAN Bus Whisperer',
    knownFor: 'The Jeep hack, with Charlie Miller',
    rarity: 'rare',
    impact: 76,
    nationality: 'USA',
    era: '2010s–present',
    domains: ['Automotive', 'CAN bus', 'Vehicle networks'],
    scouting:
      'Reverse-engineered the internal networks of production vehicles and, with Miller, demonstrated full remote control of a Jeep Cherokee in 2015. Both went on to build security teams inside the autonomous-vehicle industry they had just put on notice.',
    note: 'Ships as a pair card with 24. Collectors will want both.',
    status: 'candidate',
  },
  {
    number: 26,
    slug: 'samy-kamkar',
    name: 'Samy Kamkar',
    title: 'The Worm That Ate MySpace',
    knownFor: 'The Samy worm, and a decade of hardware hacks',
    rarity: 'epic',
    impact: 81,
    nationality: 'USA',
    era: '2005–present',
    domains: ['XSS', 'Hardware', 'Radio'],
    scouting:
      'Released a self-propagating cross-site scripting worm in 2005 that added over a million MySpace friends in under a day and took the site down. After his sentence he kept publishing: SkyJack, OwnStar, KeySweeper, and a long line of garage-door and car-key radio attacks explained on video for anyone.',
    note: 'The best explainer in the game. Half the set learned from his videos.',
    status: 'draft',
  },
  {
    number: 27,
    slug: 'george-hotz',
    name: 'George Hotz',
    handle: 'geohot',
    title: 'Jailbreaker',
    knownFor: 'Unlocking the first iPhone and cracking the PS3',
    rarity: 'epic',
    impact: 82,
    nationality: 'USA',
    era: '2007–present',
    domains: ['Jailbreaking', 'Console security', 'Reverse engineering'],
    scouting:
      'At seventeen, unlocked the original iPhone from its carrier. Then published PlayStation 3 root keys and was sued by Sony, in a case that became a rallying point for the right to modify hardware you own. Later founded comma.ai and worked on open self-driving.',
    note: 'The card about who actually owns the device in your pocket.',
    status: 'draft',
  },
  {
    number: 28,
    slug: 'marcus-hutchins',
    name: 'Marcus Hutchins',
    handle: 'MalwareTech',
    title: 'The WannaCry Killswitch',
    knownFor: 'Stopping a global ransomware outbreak for $10.69',
    rarity: 'epic',
    impact: 85,
    nationality: 'UK',
    era: '2017–present',
    domains: ['Malware analysis', 'Reverse engineering', 'Botnets'],
    scouting:
      'Reversing WannaCry as it tore through hospitals in May 2017, he spotted an unregistered domain in the code and bought it, unintentionally triggering the killswitch that halted the outbreak. Arrested months later over earlier banking-malware code he had written as a teenager; he pled guilty, was sentenced to time served, and now works in threat research.',
    note: 'Saved the NHS on a Friday and was arrested by August. Both halves are the card.',
    status: 'draft',
  },
  {
    number: 29,
    slug: 'karsten-nohl',
    name: 'Karsten Nohl',
    title: 'Breaker of Radios',
    knownFor: 'GSM, SIM card and BadUSB research',
    rarity: 'epic',
    impact: 83,
    nationality: 'Germany',
    era: '2008–present',
    domains: ['Mobile networks', 'Smartcards', 'Firmware'],
    scouting:
      'Cracked GSM’s A5/1 encryption with rainbow tables, showed millions of SIM cards could be hijacked over the air with a text message, broke Mifare smartcards, and with Jakob Lell released BadUSB — proof that any USB device’s firmware can be reprogrammed to lie about what it is.',
    note: 'If it has a radio and a chip, he has probably already read the datasheet.',
    status: 'draft',
  },
  {
    number: 30,
    slug: 'moxie-marlinspike',
    name: 'Moxie Marlinspike',
    title: 'Crypto for Everyone Else',
    knownFor: 'SSLstrip and the Signal Protocol',
    rarity: 'legendary',
    impact: 91,
    nationality: 'USA',
    era: '2009–present',
    domains: ['TLS attacks', 'Applied cryptography', 'Secure messaging'],
    scouting:
      'Demonstrated SSLstrip and a run of attacks that exposed how fragile the certificate authority system really was. Then built Signal and the double-ratchet protocol behind it, which WhatsApp and others adopted — quietly putting end-to-end encryption in front of billions of people.',
    note: 'Attacked the transport layer, then rewrote it. The set’s highest-leverage card.',
    status: 'draft',
  },
];

export const totalPlanned = 30;

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

export const lockedCount = hackers.filter((h) => h.status === 'locked').length;
export const draftedCount = hackers.filter((h) => h.status !== 'candidate').length;
export const illustratedCount = hackers.filter((h) => Boolean(h.front)).length;

export const featuredHackers = hackers.filter((h) => h.status === 'locked').slice(0, 6);

export function getHacker(slug: string) {
  return hackers.find((h) => h.slug === slug);
}
