// HTML/CSS card template for "Security Professionals" (Series Three).
// Same bones as card-template.mjs (Series One) and hacking-template.mjs (Series
// Two) so all three decks read as one product line: thin accent border,
// portrait-top front, cream panels and a dark skill stack on the back. What
// differs is the axes — this set rates defensive craft and research where Series
// Two rates social engineering and notoriety.
// Only raster image = the AI portrait. Everything else is HTML/CSS/SVG.
//
// Two deliberate departures from the Series Two template, both from defects found
// on shipped Series Two art:
//   1. The curator's note is rendered as a labelled panel, NOT wrapped in quote
//      marks. On Series Two backs the quoted note reads as a quotation from the
//      subject, which it is not — the field is editorial voice.
//   2. Nothing on either face is left as undecorated empty space, because the
//      image-to-image finish pass treats blank regions as an invitation to invent
//      text. (Series Three does not run that pass at all — see security-pros.mjs.)

export const CARD_W = 700;
export const CARD_H = 1043;

// Steadier than the Series Two palette: steel, cipher blue and signal amber
// rather than phosphor and alarm. These are the people holding the line.
const PALETTE = ['4f8ef7', '2bb3c0', '5ad1a5', 'c9a227', '8e9bb8', '7b6bd6', '3f9f7f', 'd07a3c'];
export function accentHexOf(pro) {
  let h = 0;
  for (const ch of String(pro.name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
const accentOf = (pro) => '#' + accentHexOf(pro);

// Like Series Two, every entry carries an explicit `rarity`, so unlike Series One
// it is never derived from the impact score.
export const rarityOf = (pro) => pro.rarity;
const STARS = { iconic: '★★★★★', legendary: '★★★★☆', epic: '★★★☆☆', rare: '★★☆☆☆' };

const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function traits(h) {
  const m = [
    ['DEEP TECH', h.technical],
    ['DEFENDER', h.defense],
    ['RESEARCHER', h.research],
    ['INFLUENTIAL', h.influence],
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map((x) => x[0]);
  return [...m, String(h.rarity).toUpperCase()];
}

function bars(h, accent) {
  const rows = [
    ['TECHNICAL DEPTH', h.technical],
    ['DEFENSIVE CRAFT', h.defense],
    ['RESEARCH', h.research],
    ['INFLUENCE', h.influence],
  ];
  // No IMPACT row: unlike Series One's "OPEN SOURCE IMPACT", it would repeat the
  // score already shown in the box beside the stack.
  return rows
    .map(
      ([label, v]) =>
        `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar"><span class="barFill" style="width:${v}%"></span></span><span class="barVal">${v}</span></div>`
    )
    .join('');
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');`;

// Series Three mark: the same shield as Series One and Two, holding a keyhole —
// the defensive counterpart to Series Two's terminal prompt.
const emblem = (a, s = 24) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 48 48" fill="none"><path d="M24 3l16 5v13c0 12-7.4 20-16 24C15.4 41 8 33 8 21V8l16-5z" fill="#0a0810" stroke="${a}" stroke-width="2.6"/><circle cx="24" cy="21" r="4.6" stroke="${a}" stroke-width="2.8"/><path d="M24 25.6V33" stroke="${a}" stroke-width="2.8" stroke-linecap="round"/></svg>`;
const lockGlyph = (a, s = 22) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none"><rect x="7" y="14" width="18" height="12" rx="2.5" stroke="${a}" stroke-width="2.6"/><path d="M11 14v-3a5 5 0 0 1 10 0v3" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="20" r="1.8" fill="${a}"/></svg>`;

const shell = (accent) => `${FONTS}
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter',Arial,sans-serif; background:#05060a; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; border-radius:26px;
    background: radial-gradient(120% 80% at 50% 0%, #141a18 0%, #0b0f11 60%, #08090c 100%);
    box-shadow: inset 0 0 0 2px ${accent}, inset 0 0 0 5px #07070d; }
  .crest { display:flex; align-items:center; gap:7px; }
  .crest .t { font-family:'Oswald'; color:#fff; font-weight:700; font-size:11px; letter-spacing:.6px; line-height:1.05; }`;

export function buildFront(pro, portraitDataUri, ref) {
  const accent = accentOf(pro);
  const kw = traits(pro).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  const alias = pro.handle
    ? `<div class="alias">&ldquo;${esc(pro.handle)}&rdquo;</div>`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${shell(accent)}
  /* Taller than the Series Two portrait window. At 58% the name block left a
     dead third of black between the caption and the footer bar — visible on the
     first render, and exactly the kind of empty region the finish pass fills with
     invented text. The caption band is now sized to what it actually holds. */
  .portrait { position:absolute; left:14px; right:14px; top:14px; height:72%; border-radius:16px; overflow:hidden; box-shadow:inset 0 0 0 2px ${accent}55; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 18%; }
  /* A card with no verified reference photo says so, rather than carrying an
     invented face. This is a deliberate, visible gap. */
  .nolikeness { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;
    background:radial-gradient(90% 70% at 50% 35%, #171d26 0%, #0c1016 70%); }
  .nolikeness .wm { opacity:.12; position:absolute; }
  .nolikeness .initials { font-family:'Oswald'; font-weight:700; font-size:96px; letter-spacing:6px; color:${accent}; opacity:.85; z-index:1; }
  .nolikeness .nlnote { font-family:'JetBrains Mono',monospace; font-size:15px; line-height:1.5; color:#8b93a5; text-align:center; letter-spacing:.6px; z-index:1; }
  .portrait::after { content:''; position:absolute; left:0; right:0; bottom:0; height:34%; background:linear-gradient(180deg,transparent,rgba(11,15,17,.94)); }
  .num { position:absolute; top:18px; left:20px; z-index:4; font-family:'Oswald'; font-weight:700; font-size:40px; line-height:1; padding:2px 14px 4px; background:${accent}; color:#0a0810; border-radius:0 0 12px 0; clip-path:polygon(0 0,100% 0,84% 100%,0 100%); }
  .crestbox { position:absolute; top:20px; right:20px; z-index:4; }
  .info { position:absolute; left:24px; right:24px; top:73%; bottom:78px; z-index:3; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:42px; letter-spacing:1px; text-transform:uppercase; text-align:center; line-height:1; }
  .alias { font-family:'JetBrains Mono',monospace; color:${accent}; font-weight:700; font-size:19px; letter-spacing:1px; margin-top:9px; text-align:center; }
  .title { color:#cfd2dc; font-weight:700; font-size:16px; letter-spacing:2px; margin-top:9px; text-transform:uppercase; font-family:'Oswald'; text-align:center; }
  .kwbar { position:absolute; left:24px; right:24px; bottom:22px; z-index:4; display:flex; align-items:center; gap:12px; border-top:1px solid ${accent}55; padding-top:14px; }
  .badge { width:38px; height:38px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; }
  .kw { font-family:'Oswald'; flex:1; text-align:center; color:#cfd2dc; font-weight:600; font-size:15px; letter-spacing:1.2px; }
  </style></head><body>
  <div class="card">
    <div class="portrait">${
      portraitDataUri
        ? `<img src="${portraitDataUri}">`
        : `<span class="nolikeness"><span class="wm">${emblem(accent, 150)}</span><span class="initials">${esc(
            pro.name.split(/\s+/).map((w) => w[0]).join('')
          )}</span><span class="nlnote">no freely-licensed photograph<br>of this person was found</span></span>`
    }</div>
    <div class="num">${pad2(pro.number)}</div>
    <div class="crestbox"><span class="crest">${emblem(accent, 24)}<span class="t">SECURITY<br>PROFESSIONALS</span></span></div>
    <div class="info"><div class="name">${esc(pro.name)}</div>${alias}<div class="title">${esc(pro.title)}</div></div>
    <div class="kwbar"><span class="badge">${emblem(accent, 30)}</span><span class="kw">${kw}</span><span class="badge">${lockGlyph(accent, 28)}</span></div>
  </div></body></html>`;
}

export function buildBack(pro, ref) {
  const accent = accentOf(pro);
  const rarity = String(pro.rarity).toUpperCase();
  const domains = (pro.domains || []).slice(0, 5).map((d) => `<li>${esc(d)}</li>`).join('');
  const alias = pro.handle ? `<span class="alias">&ldquo;${esc(pro.handle)}&rdquo;</span>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${shell(accent)}
  .card { display:flex; flex-direction:column; padding:26px 26px 22px; }
  h4 { font-family:'Oswald'; }
  .head .row { display:flex; align-items:baseline; gap:12px; }
  .head .num { font-family:'Oswald'; font-weight:700; color:${accent}; font-size:38px; line-height:.9; }
  .head .name { font-family:'Oswald'; color:#fff; font-weight:700; font-size:32px; text-transform:uppercase; line-height:.95; }
  .head .alias { font-family:'JetBrains Mono',monospace; color:${accent}; font-weight:700; font-size:15px; }
  .head .title { color:#cfd2dc; font-weight:700; font-size:14px; letter-spacing:2px; margin-top:6px; text-transform:uppercase; font-family:'Oswald'; }
  .rule { height:2px; background:linear-gradient(90deg,${accent},transparent); margin:13px 0; }
  .panels { display:flex; gap:14px; }
  .panel { background:#ece7db; border-radius:10px; padding:13px 15px; }
  .panel h4 { color:#15131c; font-size:12px; letter-spacing:1.4px; margin-bottom:8px; font-weight:700; }
  .scout { flex:1.5; } .scout p { color:#2c2935; font-size:14px; line-height:1.45; }
  .sig { flex:1; } .sig ul { list-style:none; }
  .sig li { color:#2c2935; font-size:14px; line-height:1.62; padding-left:14px; position:relative; }
  .sig li::before { content:'>'; position:absolute; left:0; color:${accent}; font-weight:800; font-family:'JetBrains Mono',monospace; }
  .stack { display:flex; gap:16px; align-items:stretch; margin-top:18px; }
  .skill { flex:1.65; }
  .skill h4 { color:${accent}; font-size:13px; letter-spacing:2px; margin-bottom:12px; font-weight:700; }
  .barRow { display:flex; align-items:center; gap:11px; margin-bottom:18px; }
  .barLabel { font-family:'Oswald'; flex:0 0 150px; color:#b6bac8; font-size:12px; letter-spacing:.4px; font-weight:500; }
  .bar { flex:1; height:14px; border-radius:7px; background:#1d2a25; overflow:hidden; }
  .barFill { display:block; height:100%; border-radius:7px; background:${accent}; }
  .barVal { font-family:'Oswald'; flex:0 0 30px; text-align:right; color:#fff; font-weight:700; font-size:16px; }
  .impact { flex:1; background:#08090c; border:2px solid ${accent}; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:14px 8px; }
  .impact .lab { color:#b6bac8; font-size:12px; letter-spacing:3px; font-family:'Oswald'; }
  .impact .score { font-family:'Oswald'; color:${accent}; font-weight:700; font-size:66px; line-height:.85; }
  .impact .rar { color:#fff; font-weight:700; font-size:13px; letter-spacing:2px; font-family:'Oswald'; }
  .impact .stars { color:${accent}; font-size:15px; letter-spacing:2px; margin-top:5px; }
  /* Series One left this region empty and the finish pass filled it with flat
     leather. Against our darker stock the model reads empty space as a licence to
     invent, and it invented something different on every card. Claiming the space
     with a deliberate watermark keeps the backs uniform across the deck. */
  .mark { flex:1; min-height:8px; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
  .mark .wm { opacity:.08; }
  .mark .alias { font-family:'JetBrains Mono',monospace; color:${accent}; opacity:.34; font-size:17px; letter-spacing:5px; text-transform:uppercase; }
  /* Editorial voice, not a quotation. Series Two wrapped this field in quote
     marks and it reads on the printed card as something the subject said. */
  .note { margin:10px 0 16px; border-left:3px solid ${accent}; padding-left:12px; }
  .note .lab { display:block; font-family:'Oswald'; color:${accent}; font-size:10px; letter-spacing:2.4px; font-weight:700; margin-bottom:4px; }
  .note p { color:#d7d9e2; font-size:15px; line-height:1.4; }
  .foot { border-top:1px solid ${accent}55; padding-top:11px; color:#9a9ead; font-size:11px; letter-spacing:.3px; }
  .foot .r { display:flex; justify-content:space-between; align-items:center; }
  .foot b { color:#d7d9e2; }
  /* CC BY and CC BY-SA reference photos oblige us to name the photographer, and
     a conditioned portrait is a derivative work. */
  .credit { color:#7f8698; font-size:10px; letter-spacing:.2px; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="row"><span class="num">${pad2(pro.number)}</span><span class="name">${esc(pro.name)}</span>${alias}</div>
      <div class="title">${esc(pro.title)}</div>
      <div class="rule"></div>
    </div>
    <div class="panels">
      <div class="panel scout"><h4>SCOUTING REPORT</h4><p>${esc(pro.scouting)}</p></div>
      <div class="panel sig"><h4>DOMAINS</h4><ul>${domains}</ul></div>
    </div>
    <div class="stack">
      <div class="skill"><h4>SKILL STACK</h4>${bars(pro, accent)}</div>
      <div class="impact"><span class="lab">IMPACT</span><span class="score">${pro.impact}</span><span class="rar">${rarity}</span><span class="stars">${STARS[pro.rarity] || '★★★★★'}</span></div>
    </div>
    <div class="mark"><span class="wm">${emblem(accent, 190)}</span>${
      pro.handle ? `<span class="alias">${esc(pro.handle)}</span>` : ''
    }</div>
    <div class="note"><span class="lab">CURATOR&rsquo;S NOTE</span><p>${esc(pro.note)}</p></div>
    <div class="foot">
      <div class="r"><span>ERA <b>${esc(pro.era)}</b></span><span>NATIONALITY <b>${esc(pro.nationality)}</b></span></div>
      <div class="r" style="margin-top:5px"><span>KNOWN FOR <b>${esc(pro.knownFor)}</b></span>${lockGlyph(accent, 18)}</div>
      ${
        ref
          ? `<div class="r" style="margin-top:5px"><span class="credit">PORTRAIT AFTER A PHOTOGRAPH BY <b>${esc(
              ref.credit
            )}</b>${ref.license && ref.license !== 'supplied' ? ` · ${esc(ref.license)}` : ''}</span></div>`
          : ''
      }
    </div>
  </div></body></html>`;
}
