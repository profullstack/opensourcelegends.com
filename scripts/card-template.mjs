// HTML/CSS card template for "Open Source Legends".
// REFERENCE: docs/proof1.png is the single source of truth — match it exactly.
//   Front: full-bleed portrait, number (top-left), crest (top-right), name plate,
//          keyword row with badges.
//   Back:  header, CREAM panels for Scouting Report + Signature Projects, dark
//          Skill Stack + IMPACT box, quote, two-line footer.

export const CARD_W = 750;
export const CARD_H = 1050;

const ACCENT = { iconic: '#f5c451', legendary: '#b06bff', epic: '#4f8cff', rare: '#25c26e' };
export const rarityOf = (n) => (n >= 95 ? 'iconic' : n >= 90 ? 'legendary' : n >= 85 ? 'epic' : 'rare');
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function traits(c) {
  const m = [['ARCHITECT', c.code_rating], ['PIONEER', c.innovation_rating], ['BUILDER', c.community_rating], ['RELENTLESS', c.longevity_rating]]
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);
  return [...m, rarityOf(c.impact_rating).toUpperCase()];
}

function bars(c) {
  const rows = [
    ['CODE ARCHITECTURE', c.code_rating],
    ['INNOVATION', c.innovation_rating],
    ['COMMUNITY IMPACT', c.community_rating],
    ['LONGEVITY', c.longevity_rating],
    ['OPEN SOURCE IMPACT', c.impact_rating],
  ];
  return rows.map(([label, v]) => {
    const filled = Math.round(v / 10);
    const segs = Array.from({ length: 10 }, (_, i) => `<span class="seg ${i < filled ? 'on' : ''}"></span>`).join('');
    return `<div class="barRow"><span class="barLabel">${esc(label)}</span><span class="bar">${segs}</span><span class="barVal">${v}</span></div>`;
  }).join('');
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`;

const shell = (accent) => `
  ${FONTS}
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${CARD_W}px; height:${CARD_H}px; }
  body { font-family:'Inter',Arial,sans-serif; background:#05060a; }
  .disp { font-family:'Oswald','Inter',sans-serif; }
  .card { position:relative; width:${CARD_W}px; height:${CARD_H}px; overflow:hidden; border-radius:34px;
    background:#13101c;
    box-shadow: inset 0 0 0 5px #0a0810, inset 0 0 0 7px ${accent}, inset 0 0 0 10px #0a0810, inset 0 0 0 12px ${accent}44; }
  .num { font-family:'Oswald',sans-serif; font-weight:700; color:#fff; }
  .crestBox { display:flex; flex-direction:column; align-items:flex-end; background:#0a0810; border:2px solid ${accent};
    border-radius:8px; padding:9px 14px 8px; clip-path:polygon(16% 0,100% 0,100% 100%,0 100%); }
  .crestBox .t { font-family:'Oswald',sans-serif; color:#fff; font-weight:700; font-size:17px; letter-spacing:1.5px; text-align:right; line-height:1; }
  .crestBox .c { color:${accent}; font-weight:700; font-size:12px; font-family:ui-monospace,monospace; margin-top:3px; }
`;

export function buildFront(card, portraitDataUri) {
  const accent = ACCENT[rarityOf(card.impact_rating)];
  const kw = traits(card).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  .portrait { position:absolute; inset:0; }
  .portrait img { width:100%; height:100%; object-fit:cover; object-position:center 18%; }
  .portrait::after { content:''; position:absolute; left:0; right:0; bottom:0; height:46%;
    background:linear-gradient(180deg, rgba(19,16,28,0) 0%, rgba(19,16,28,.85) 58%, #13101c 100%); }
  .num.top { position:absolute; top:24px; left:34px; z-index:5; font-size:62px; line-height:1; text-shadow:0 2px 12px rgba(0,0,0,.8); }
  .crest { position:absolute; top:26px; right:30px; z-index:5; }
  .plate { position:absolute; left:28px; right:28px; bottom:122px; z-index:5; text-align:center;
    background:linear-gradient(180deg,rgba(29,22,51,.94),rgba(19,13,34,.96)); border:2px solid ${accent}; border-radius:16px; padding:18px 20px 20px; }
  .name { font-family:'Oswald',sans-serif; color:#fff; font-weight:700; font-size:48px; letter-spacing:1px; line-height:1; text-transform:uppercase; }
  .title { color:${accent}; font-weight:600; font-size:17px; letter-spacing:2px; margin-top:9px; text-transform:uppercase; }
  .footer { position:absolute; left:28px; right:28px; bottom:36px; z-index:5; display:flex; align-items:center; gap:14px; }
  .badge { width:62px; height:62px; flex:0 0 auto; border-radius:50%; background:#0a0810; border:2px solid ${accent};
    display:flex; align-items:center; justify-content:center; color:${accent}; font-weight:700; font-size:22px; font-family:'Oswald',monospace; }
  .kw { font-family:'Oswald',sans-serif; flex:1; text-align:center; color:#e4e6ee; font-weight:600; font-size:18px; letter-spacing:1.5px; }
  </style></head><body>
  <div class="card">
    <div class="portrait"><img src="${portraitDataUri}"></div>
    <span class="num top">${pad2(card.card_number)}</span>
    <span class="crest"><span class="crestBox"><span class="t">OPEN SOURCE<br>LEGENDS</span><span class="c">&lt;/&gt;</span></span></span>
    <div class="plate"><div class="name">${esc(card.display_name)}</div><div class="title">${esc(card.card_title)}</div></div>
    <div class="footer">
      <span class="badge">${esc((card.primary_projects?.[0] || '?').replace(/[^A-Za-z]/g, '').slice(0, 2) || '?')}</span>
      <span class="kw">${kw}</span>
      <span class="badge">&lt;/&gt;</span>
    </div>
  </div></body></html>`;
}

export function buildBack(card) {
  const accent = ACCENT[rarityOf(card.impact_rating)];
  const bulletColor = accent === '#f5c451' ? '#b88a1e' : accent;
  const rarity = rarityOf(card.impact_rating).toUpperCase();
  const projects = (card.primary_projects || []).slice(0, 5).map((p) => `<li>${esc(p)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  ${shell(accent)}
  .card { display:flex; flex-direction:column; padding:30px 30px 26px; }
  .head { flex:0 0 auto; }
  .head .row { display:flex; align-items:baseline; gap:15px; }
  .head .num { font-size:48px; line-height:.9; }
  .head .name { font-family:'Oswald',sans-serif; color:#fff; font-weight:700; font-size:38px; text-transform:uppercase; line-height:.95; }
  .head .title { color:${accent}; font-weight:600; font-size:15px; letter-spacing:2px; margin-top:8px; text-transform:uppercase; font-family:'Oswald',sans-serif; }
  .rule { height:3px; background:linear-gradient(90deg,${accent},${accent}22); border-radius:2px; margin-top:13px; }
  /* content centered between header and footer — balanced, never sparse */
  .content { flex:1; display:flex; flex-direction:column; justify-content:center; gap:26px; padding:18px 0; min-height:0; }
  h4 { font-family:'Oswald',sans-serif; }
  .panels { display:flex; gap:15px; align-items:stretch; }
  .panel { background:#efeae0; border-radius:12px; padding:15px 17px; }
  .panel h4 { color:#15101f; font-size:14px; letter-spacing:1.5px; margin-bottom:9px; font-weight:700; }
  .scout { flex:1.5; } .scout p { color:#2c2935; font-size:15.5px; line-height:1.5; }
  .sig { flex:1; } .sig ul { list-style:none; }
  .sig li { color:#2c2935; font-size:15.5px; line-height:1.7; padding-left:15px; position:relative; }
  .sig li::before { content:'▸'; position:absolute; left:0; color:${bulletColor}; font-weight:800; }
  .stack { display:flex; gap:15px; align-items:stretch; }
  .skill { flex:1.75; }
  .skill h4 { color:${accent}; font-size:15px; letter-spacing:2px; margin-bottom:14px; font-weight:700; }
  .barsWrap { display:flex; flex-direction:column; gap:17px; }
  .barRow { display:flex; align-items:center; gap:12px; }
  .barLabel { font-family:'Oswald',sans-serif; flex:0 0 152px; color:#b6bac8; font-size:13px; letter-spacing:.6px; font-weight:500; }
  .bar { flex:1; display:flex; gap:3px; }
  .seg { flex:1; height:18px; border-radius:2px; background:#241d38; }
  .seg.on { background:${accent}; box-shadow:0 0 6px ${accent}55; }
  .barVal { font-family:'Oswald',sans-serif; flex:0 0 32px; text-align:right; color:#fff; font-weight:700; font-size:18px; }
  .impact { flex:1; background:linear-gradient(180deg,#191327,#0e0a18); border:2px solid ${accent}; border-radius:14px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:14px 8px; }
  .impact .lab { color:#b6bac8; font-size:13px; letter-spacing:3px; font-family:'Oswald',sans-serif; }
  .impact .score { font-family:'Oswald',sans-serif; color:${accent}; font-weight:700; font-size:80px; line-height:.85; }
  .impact .rar { color:#fff; font-weight:700; font-size:15px; letter-spacing:2px; font-family:'Oswald',sans-serif; }
  .impact .stars { color:${accent}; font-size:18px; letter-spacing:3px; margin-top:5px; }
  .quote { color:#e0e2ea; font-style:italic; font-size:16.5px; line-height:1.45; }
  .quote .q { color:${accent}; font-size:30px; font-weight:700; margin-right:5px; vertical-align:-7px; font-family:Georgia,serif; }
  .foot { flex:0 0 auto; border-top:1px solid ${accent}66; padding-top:12px; margin-top:12px; color:#9a9ead; font-size:11.5px; letter-spacing:.4px; }
  .foot .r { display:flex; justify-content:space-between; align-items:center; }
  .foot b { color:#e0e2ea; } .foot .c { color:${accent}; font-size:17px; font-family:ui-monospace,monospace; }
  </style></head><body>
  <div class="card">
    <div class="head">
      <div class="row"><span class="num">${pad2(card.card_number)}</span><span class="name">${esc(card.display_name)}</span></div>
      <div class="title">${esc(card.card_title)}</div>
      <div class="rule"></div>
    </div>
    <div class="content">
      <div class="panels">
        <div class="panel scout"><h4>SCOUTING REPORT</h4><p>${esc(card.scouting_report)}</p></div>
        <div class="panel sig"><h4>SIGNATURE PROJECTS</h4><ul>${projects}</ul></div>
      </div>
      <div class="stack">
        <div class="skill"><h4>SKILL STACK</h4><div class="barsWrap">${bars(card)}</div></div>
        <div class="impact"><span class="lab">IMPACT</span><span class="score">${card.impact_rating}</span><span class="rar">${rarity}</span><span class="stars">★★★★★</span></div>
      </div>
      <div class="quote"><span class="q">“</span>${esc(card.collector_note)}”</div>
    </div>
    <div class="foot">
      <div class="r"><span>BORN <b>${esc(card.birth_date)}</b></span><span>NATIONALITY <b>${esc(card.nationality)}</b></span></div>
      <div class="r" style="margin-top:6px"><span>KNOWN FOR <b>${esc(card.known_for)}</b></span><span class="c">&lt;/&gt;</span></div>
    </div>
  </div></body></html>`;
}
