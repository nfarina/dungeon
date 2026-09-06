// Card layouts. Everything is sized in inches so print is exact; the editor
// scales cards down with a CSS transform for thumbnails.
import { DECK_NAMES, STANDEE_TAB, type Card, type Deck } from "./catalog";

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Accent colour per deck. Backs use it as a thin stroke only, to save toner. */
export const DECK_COLOR: Record<Deck, string> = {
  kit: "#5b7a3a", pockets: "#8a6d2f", gear: "#3d5a80", biggear: "#7a3b5e", fan: "#6b4fa0",
  monster: "#8b2e2e", player: "#2f6f6b", lootbox: "#b08d2c", envelope: "#555", tile: "#4a4036", standee: "#556b2f",
};
const DECK_GLYPH: Record<Deck, string> = {
  kit: "🎒", pockets: "👖", gear: "🛠", biggear: "⚒", fan: "📣", monster: "💀", player: "🙂", lootbox: "🎁", envelope: "✉", tile: "🧱", standee: "🧍",
};

export const CARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Alegreya:ital,wght@0,400;0,700;1,400&family=Alegreya+SC:wght@700&display=swap');
.card, .label { --parch:#ecdfc4; --parch2:#e2d2ae; --ink:#2b1e14; --line:#3a2a1c; --gold:#e3b746; --gold2:#b8862b; --stone:#3b4756; --muted:#6a5a48; color-scheme:light; }
.card { position:relative; width:2.5in; height:3.5in; box-sizing:border-box; overflow:hidden; border-radius:0;
  background:var(--parch); border:.1in solid var(--line); padding:.08in .09in .07in; display:flex; flex-direction:column;
  font-family:'Alegreya', Georgia, serif; color:var(--ink); -webkit-print-color-adjust:exact; print-color-adjust:exact; break-inside:avoid; }
.card::before { content:""; position:absolute; inset:.025in; border:.012in solid var(--gold2); border-radius:.07in; pointer-events:none; opacity:.7; }
.card .art { position:relative; flex:100 1 1.575in; min-height:.75in; max-height:1.575in; border:.02in solid var(--line); border-radius:.06in; background:var(--stone) center/cover no-repeat; }
.card .gap { flex:1 1 0; min-height:0; }
.card > *:not(.art):not(.gap) { flex-shrink:0; }
.card .art.noart { display:flex; align-items:center; justify-content:center; color:#c9d3df; font-size:7pt; font-style:italic; text-align:center; padding:.1in;
  background-image:repeating-linear-gradient(45deg, #3b4756 0 .12in, #43505f .12in .24in); }
.card .banner { position:absolute; left:50%; transform:translateX(-50%); bottom:-.13in; background:var(--gold); border:.018in solid var(--line); border-radius:.04in;
  padding:.015in .12in; font-family:'Cinzel', Georgia, serif; font-weight:800; font-size:11pt; white-space:nowrap; max-width:2.2in; overflow:hidden; text-overflow:ellipsis; letter-spacing:.01em;
  box-shadow:0 .01in 0 var(--gold2); }
.card .banner.long { font-size:9pt; } .card .banner.xlong { font-size:7.6pt; }
.card .meta { display:flex; gap:.05in; justify-content:center; margin-top:.19in; flex-wrap:wrap; }
.card .chip { font-family:'Alegreya SC', Georgia, serif; font-weight:700; font-size:7.2pt; letter-spacing:.06em; border:.012in solid var(--line); border-radius:.03in; padding:0 .05in; background:var(--parch2); }
.card .chip.deck { color:#fff; background:var(--deck); border-color:var(--deck); }
.card .rules { font-size:9pt; line-height:1.3; margin-top:.07in; text-align:center; }
.card .rules b { font-weight:700; }
.card .flavor { font-size:7.6pt; line-height:1.25; font-style:italic; color:var(--muted); text-align:center; margin-top:.08in; }
.card .foot { display:flex; justify-content:space-between; align-items:flex-end; font-family:'Alegreya SC', Georgia, serif; font-size:6.6pt; color:var(--muted); margin-top:.04in; letter-spacing:.04em; }
.card .cd { display:flex; align-items:center; justify-content:center; gap:.08in; margin-top:.05in; }
.card .die { width:.34in; height:.34in; border:.02in solid var(--line); border-radius:.06in; background:#fff; display:flex; align-items:center; justify-content:center; font-family:'Cinzel'; font-weight:800; font-size:13pt; }
.card .cdlabel { font-family:'Alegreya SC'; font-size:7pt; letter-spacing:.06em; color:var(--muted); text-align:left; line-height:1.2; }
.card .ticks { display:flex; gap:.05in; justify-content:center; margin-top:.04in; }
.card .tick { width:.16in; height:.16in; border:.014in solid var(--line); border-radius:.02in; background:#fff; }
.card .stats { display:flex; gap:.04in; justify-content:center; margin-top:.2in; }
.card .stat { flex:1; border:.016in solid var(--line); border-radius:.04in; background:#fff; text-align:center; padding:.02in 0 .015in; }
.card .stat .v { font-family:'Cinzel'; font-weight:800; font-size:12.5pt; line-height:1; }
.card .stat .k { font-family:'Alegreya SC'; font-size:6pt; letter-spacing:.05em; color:var(--muted); }
.card .loot { margin-top:.05in; font-size:8pt; line-height:1.3; }
.card .loot .h { font-family:'Alegreya SC'; font-weight:700; font-size:7pt; letter-spacing:.08em; color:var(--muted); text-align:center; margin-bottom:.01in; }
.card .loot .row { display:flex; justify-content:space-between; border-bottom:.008in dotted var(--gold2); padding:0 .1in; }
.card .special { font-size:7.4pt; line-height:1.25; margin-top:.04in; }
.card .special p { margin:0 0 .02in; }
.card .nameline { margin-top:.2in; display:flex; align-items:flex-end; gap:.06in; }
.card .nameline .k { font-family:'Alegreya SC'; font-size:7pt; letter-spacing:.08em; color:var(--muted); }
.card .nameline .line { flex:1; border-bottom:.014in solid var(--line); height:.22in; }
.card .slots { display:grid; display: none; grid-template-columns:1fr 1fr; gap:.02in .08in; margin-top:.05in; font-family:'Alegreya SC'; font-size:6.6pt; letter-spacing:.04em; color:var(--muted); }
.card .slots div::before { content:"☐ "; }
.card.fan { --parch:#e9e2f2; --parch2:#ddd3ec; --gold:#c8b3ee; --gold2:#8f76c4; --stone:#2d2540; }
.card.player .art { flex-basis:1.85in; max-height:1.95in; }
.card.text .art { flex-basis:1.2in; }
.card.text .rules { font-size:9.5pt; font-style:italic; }
/* ---- backs: white, one thin stroke, outlined type. Minimal toner. ---- */
.card.back { background:#fff; border:none; padding:.1in; align-items:center; justify-content:center; gap:.1in; }
.card.back::before { display:none; }
.card.back .glyph { font-size:30pt; line-height:1; filter:grayscale(1); opacity:.6; }
.card.back .word { font-family:'Cinzel'; font-weight:800; font-size:21pt; letter-spacing:.1em; color:var(--deck); text-align:center; line-height:1.1; }
.card.back .word.small { font-size:16pt; }
.card.back .sub { font-family:'Alegreya SC'; font-size:7.5pt; letter-spacing:.2em; color:var(--deck); opacity:.85; }
/* ---- Crawler back: a rules reference, text only ---- */
.card.back.ref { display:block; padding:.12in .14in .08in; font-family:'Alegreya', Georgia, serif; color:#222; font-size:7.7pt; line-height:1.22; }
.card.back.ref .hd { font-family:'Cinzel'; font-weight:800; font-size:9pt; letter-spacing:.12em; color:var(--deck); text-align:center; margin-bottom:.04in; }
.card.back.ref h4 { font-family:'Alegreya SC'; font-weight:700; font-size:7.8pt; letter-spacing:.1em; color:var(--deck); margin:.04in 0 .004in; border-bottom:.008in solid #bbb; }
.card.back.ref p { margin:0; }
.card.back.ref b { font-weight:700; }
.card.back.ref .dice { display:flex; justify-content:space-between; gap:.04in; margin-top:.015in; }
.card.back.ref .dice span { flex:1; text-align:center; border:.008in solid #999; border-radius:.03in; padding:.008in 0; font-size:6.2pt; }
/* ---- floor tiles: integer inches, thin dark frame as bleed ---- */
.tile { position:relative; box-sizing:border-box; border:.04in solid #2b2420; background:#3b4756 center/cover no-repeat; overflow:hidden; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.tile.noart { display:flex; align-items:center; justify-content:center; color:#c9d3df; font:italic 7pt 'Alegreya', Georgia, serif; text-align:center; padding:.05in;
  background-image:repeating-linear-gradient(45deg, #3b4756 0 .12in, #43505f .12in .24in); }
.tile.back { background:#fff; border-color:#ddd; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:.08in; font-family:'Alegreya SC', Georgia, serif; color:#444; }
.tile.back .nm { font-weight:700; font-size:8pt; letter-spacing:.06em; line-height:1.15; }
.tile.back .sz { font-size:6pt; letter-spacing:.15em; color:#888; margin-top:.03in; }
.tile.back.trap .nm { color:#8b2e2e; }
.standee { position:relative; box-sizing:border-box; background:#fff; display:flex; flex-direction:column; overflow:hidden; -webkit-print-color-adjust:exact; print-color-adjust:exact; color-scheme:light; }
.standee .fig { box-sizing:border-box; border:.02in solid #2b2420; border-bottom:none; background:#e6dcc8 center/cover no-repeat; }
.standee .fig.noart { display:flex; align-items:center; justify-content:center; text-align:center; color:#8a7a68; font:italic 6pt 'Alegreya', Georgia, serif; padding:.04in;
  background-image:repeating-linear-gradient(45deg, #e6dcc8 0 .1in, #ddd2bc .1in .2in); }
.standee.back .fig { transform:scaleX(-1); }
.standee .tab { box-sizing:border-box; border:.02in solid #2b2420; border-top:.015in dashed #999; display:flex; align-items:center; justify-content:center;
  font:5.5pt 'Alegreya SC', Georgia, serif; color:#777; letter-spacing:.1em; text-transform:uppercase; white-space:nowrap; overflow:hidden; }
/* ---- envelope labels: 4 x 2 in, low ink ---- */
.label { position:relative; width:4in; height:2in; box-sizing:border-box; border:.02in solid #333; border-radius:0; background:#fff; padding:.12in .18in .1in .3in; display:flex; flex-direction:column; justify-content:center;
  font-family:'Alegreya', Georgia, serif; color:#111; overflow:hidden; -webkit-print-color-adjust:exact; print-color-adjust:exact; break-inside:avoid; }
.label .stripe { position:absolute; left:0; top:0; bottom:0; width:.14in; background:var(--tier); }
.label .tier { font-family:'Alegreya SC'; font-weight:700; font-size:8.5pt; letter-spacing:.2em; color:var(--tier); }
.label .name { font-family:'Cinzel'; font-weight:800; font-size:20pt; line-height:1.1; margin:.03in 0 .05in; }
.label .name.long { font-size:15pt; }
.label .trig { font-size:11pt; line-height:1.3; }
.label .warn { position:absolute; right:.15in; bottom:.08in; font-family:'Alegreya SC'; font-size:6.5pt; letter-spacing:.15em; color:#777; }
`;

const TIER_COLOR: Record<string, string> = { Bronze: "#8a5a2b", Silver: "#6f7a86", Gold: "#b8862b", Platinum: "#3b4756", Companion: "#2f6f6b" };

function bannerClass(name: string) { return name.length > 22 ? "xlong" : name.length > 16 ? "long" : ""; }

function chips(c: Card): string {
  const out: string[] = [];
  if (c.type === "spell") out.push(`Spellbook · Mind ${c.mind}+`);
  else if (c.type === "scroll") out.push("Scroll · One use");
  else if (c.type === "consumable") out.push("One use");
  else if (c.type === "companion") out.push("Companion");
  else if (c.slot) out.push(c.slot);
  if (c.deck === "kit") out.push("Starting kit");
  return out.map(t => `<span class="chip">${esc(t)}</span>`).join("");
}

function artBlock(c: Card, artUrl: string | null, name = c.name): string {
  const inner = name ? `<div class="banner ${bannerClass(name)}">${esc(name)}</div>` : "";
  return artUrl
    ? `<div class="art" style="background-image:url('${artUrl}')">${inner}</div>`
    : `<div class="art noart">no art yet${inner}</div>`;
}

function statsRow(s: NonNullable<Card["stats"]>): string {
  const cell = (v: string | number, k: string) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
  return `<div class="stats">${cell(s.att, "Attack")}${cell(s.def, "Defend")}${cell(s.hp, "Health")}${cell(s.mind, "Mind")}${cell(s.move, "Move")}</div>`;
}

export function renderFront(c: Card, artUrl: string | null): string {
  if (c.type === "envelope") return renderLabel(c);
  if (c.type === "tile") return renderTile(c, artUrl);
  if (c.type === "standee") return renderStandee(c, artUrl, false);
  const deck = DECK_COLOR[c.deck];
  const foot = `<div class="foot"><span>${esc(DECK_NAMES[c.deck])}</span><span>Floor 1</span></div>`;
  const cls = `card ${c.type} ${c.deck === "fan" ? "fan" : ""}`;
  const style = `--deck:${deck}`;

  if (c.type === "monster") {
    const s = c.stats!;
    const loot = `<div class="loot"><div class="h">Loot · roll a d6</div>${c.loot!.map(l => {
      const [a, ...rest] = l.split(/\s{2,}/); return rest.length ? `<div class="row"><span>${esc(a)}</span><span>${esc(rest.join(" "))}</span></div>` : `<div class="row"><span style="flex:1;text-align:center">${esc(l)}</span></div>`;
    }).join("")}</div>`;
    const special = c.special?.length ? `<div class="special">${c.special.map(p => `<p><b>${esc(p.split(":")[0])}:</b>${esc(p.slice(p.indexOf(":") + 1))}</p>`).join("")}</div>` : "";
    const rules = c.rules ? `<div class="rules" style="margin-top:.03in">${esc(c.rules)}</div>` : "";
    return `<div class="${cls}${c.special?.length ? " boss" : ""}" style="${style}">${artBlock(c, artUrl)}${statsRow(s)}${loot}${special}${rules}<div class="gap"></div>${c.flavor ? `<div class="flavor">${esc(c.flavor)}</div>` : ""}${foot}</div>`;
  }
  if (c.type === "player") {
    const slots = ["Main hand", "Off hand", "Body", "Head", "Feet", "Trinket ×2"].map(s => `<div>${s}</div>`).join("");
    return `<div class="${cls}" style="${style}">${artBlock(c, artUrl, "")}
      <div class="nameline"><span class="k">Name</span><span class="line"></span></div>
      ${statsRow(c.stats!)}
      <div class="slots">${slots}</div>
      <div class="gap"></div>
      ${c.flavor ? `<div class="flavor">${esc(c.flavor)}</div>` : ""}${foot}</div>`;
  }
  const cooldown = c.type === "spell"
    ? `<div class="cd"><div class="die">${c.cooldown}</div><div class="cdlabel">Cooldown<br>set a die here</div></div>
       <div class="ticks">${"<div class=\"tick\"></div>".repeat(5)}</div>`
    : "";
  return `<div class="${cls}" style="${style}">${artBlock(c, artUrl)}
    <div class="meta">${chips(c)}</div>
    <div class="rules">${esc(c.rules)}</div>
    ${cooldown}
    <div class="gap"></div>
    ${c.flavor ? `<div class="flavor">${esc(c.flavor)}</div>` : ""}${foot}</div>`;
}

/** `artUrl` is what goes on the back: the same figure for standees (mirrored), the used-state art for furniture tiles. */
export function renderBack(c: Card, artUrl: string | null = null): string {
  if (c.type === "envelope") return "";
  if (c.type === "tile") return artUrl ? renderTile(c, artUrl) : renderTileBack(c);
  if (c.type === "standee") return renderStandee(c, artUrl, true);
  if (c.type === "player") return renderReference(c);
  const deck = DECK_COLOR[c.deck];
  const word = DECK_NAMES[c.deck].toUpperCase();
  const sub = c.deck === "player" ? "pick one · name yourself" : c.deck === "monster" ? "for the announcer" : c.deck === "fan" ? "viewers only" : c.deck === "lootbox" ? "do not peek" : "floor 1";
  return `<div class="card back" style="--deck:${deck}"><div class="glyph">${DECK_GLYPH[c.deck]}</div><div class="word ${word.length > 8 ? "small" : ""}">${esc(word)}</div><div class="sub">${esc(sub)}</div></div>`;
}

export function renderTile(c: Card, artUrl: string | null): string {
  const t = c.tile!;
  const size = `width:${t.w}in;height:${t.h}in`;
  return artUrl
    ? `<div class="tile ${t.kind}" style="${size};background-image:url('${artUrl}')"></div>`
    : `<div class="tile ${t.kind} noart" style="${size}">no art yet<br>${esc(c.name)}</div>`;
}

/** Tile backs: the name, for the announcer, in as little toner as possible. */
export function renderTileBack(c: Card): string {
  const t = c.tile!;
  return `<div class="tile back ${t.kind}" style="width:${t.w}in;height:${t.h}in"><div class="nm">${esc(c.name)}</div><div class="sz">${t.w}×${t.h}${t.kind === "trap" ? " · trap" : ""}</div></div>`;
}

/** A stand-up figure: the art with a thin frame, plus a plain tab at the bottom that disappears into the stand.
 *  The back shows the same figure mirrored, so the standee reads the same from either side of the table. */
export function renderStandee(c: Card, artUrl: string | null, back: boolean): string {
  const t = c.tile!;
  const fig = artUrl
    ? `<div class="fig" style="height:${t.h - STANDEE_TAB}in;background-image:url('${artUrl}')"></div>`
    : `<div class="fig noart" style="height:${t.h - STANDEE_TAB}in">no art yet<br>${esc(c.name)}</div>`;
  return `<div class="standee ${back ? "back" : ""}" style="width:${t.w}in;height:${t.h}in">${fig}<div class="tab" style="height:${STANDEE_TAB}in">${esc(c.name)}</div></div>`;
}

/** Tiles on letter pages, arranged for a guillotine cutter: rows of equal height, so every
 *  horizontal cut runs the full page width and vertical cuts are made per strip. */
export function renderTileSheet(items: { card: Card; art: string | null; back?: string | null }[], opts: { title: string; flip: "long" | "short"; flipUrl: string; backDx: number; backDy: number; nudge: (dx: number, dy: number) => string }): string {
  const title = opts.title;
  const PW = 8.5, PH = 11, M = 0.25, maxW = PW - 2 * M, maxH = PH - 2 * M;
  // expand copies, tallest first, widest first within a height
  const list: { card: Card; art: string | null }[] = [];
  for (const it of items) for (let i = 0; i < (it.card.qty ?? 1); i++) list.push(it);
  list.sort((a, b) => (b.card.tile!.h - a.card.tile!.h) || (b.card.tile!.w - a.card.tile!.w));
  // rows: same height, fill to maxW
  type Row = { h: number; items: typeof list; w: number };
  const rows: Row[] = [];
  for (const it of list) {
    const { w, h } = it.card.tile!;
    let row = rows.find(r => r.h === h && r.w + w <= maxW);
    if (!row) { row = { h, items: [], w: 0 }; rows.push(row); }
    row.items.push(it); row.w += w;
  }
  // pages: stack rows to maxH
  const pages: Row[][] = [[]];
  let used = 0;
  for (const r of rows) {
    if (used + r.h > maxH) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(r); used += r.h;
  }
  const shift = `transform:translate(${opts.backDx}mm,${opts.backDy}mm)`;
  // Each sheet renders twice: fronts, then backs mirrored for the duplex flip.
  const pageHtml = pages.flatMap(prow => [false, true].map(back => {
    const totalH = prow.reduce((a, r) => a + r.h, 0);
    let y = M; const out: string[] = [];
    const hCuts = new Set<number>([M]);
    for (const r of prow) {
      let x = M;
      // on the back, a strip's tiles run right-to-left (long-edge flip) or the strips stack bottom-up (short-edge)
      const ty = back && opts.flip === "short" ? M + totalH - (y - M) - r.h : y;
      for (const it of r.items) {
        const w = it.card.tile!.w;
        const tx = back && opts.flip === "long" ? PW - x - w : x;
        out.push(`<div class="slot" style="left:${tx}in;top:${ty}in;${back ? shift : ""}">${back ? renderBack(it.card, it.back ?? null) : renderFront(it.card, it.art)}</div>`);
        x += w;
        if (!back && x < M + r.w) out.push(`<i style="left:${x}in;top:${y}in;height:.1in;border-left:1px solid #fff;opacity:.9"></i><i style="left:${x}in;top:${y + r.h - .1}in;height:.1in;border-left:1px solid #fff;opacity:.9"></i>`);
      }
      y += r.h; hCuts.add(y);
    }
    if (!back) {
      for (const cy of hCuts) out.push(`<i style="top:${cy}in;left:0;width:${M - .06}in;border-top:1px solid #999"></i><i style="top:${cy}in;right:0;width:${M - .06}in;border-top:1px solid #999"></i>`);
      out.push(`<i style="left:${M}in;top:0;height:${M - .06}in;border-left:1px solid #999"></i><i style="left:${M}in;bottom:0;height:${M - .06}in;border-left:1px solid #999"></i>`);
    }
    return `<section class="page">${out.join("")}</section>`;
  }));
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="color-scheme" content="light only">
<style>${CARD_CSS}
@page { size: letter; margin: 0; }
html { color-scheme: light only; }
html, body { margin:0; background:#888; }
.page { position:relative; width:8.5in; height:11in; background:#fff; margin:0 auto .2in; overflow:hidden; page-break-after:always; break-after:page; }
.page i { position:absolute; display:block; }
.slot { position:absolute; }
.bar { position:fixed; top:0; left:0; right:0; background:#222; color:#eee; font:13px system-ui; padding:8px 14px; display:flex; gap:16px; align-items:center; z-index:9; }
.bar b { color:#fff; } .bar a { color:#9cf; } .bar .nudge a { text-decoration:none; padding:0 4px; border:1px solid #555; border-radius:4px; }
.spacer { height:40px; }
@media print { .bar, .spacer { display:none; } body { background:#fff; } .page { margin:0; } }
</style></head><body>
<div class="bar"><b>${esc(title)}</b><span>${list.length} pieces · ${pages.length} sheet${pages.length === 1 ? "" : "s"} front + back</span><span>Duplex, flip on ${opts.flip} edge. Cut the horizontal lines full width first, then each strip at the white ticks.</span>
<span class="nudge">Back offset <a href="${esc(opts.nudge(-0.5, 0))}">&larr;</a> <b>${opts.backDx.toFixed(1)}</b> <a href="${esc(opts.nudge(0.5, 0))}">&rarr;</a> &nbsp; <a href="${esc(opts.nudge(0, -0.5))}">&uarr;</a> <b>${opts.backDy.toFixed(1)}</b> <a href="${esc(opts.nudge(0, 0.5))}">&darr;</a> mm</span>
<a href="${esc(opts.flipUrl)}">flip on ${opts.flip === "long" ? "short" : "long"} edge instead</a><span style="margin-left:auto">⌘P</span></div>
<div class="spacer"></div>
${pageHtml.join("\n")}
</body></html>`;
}

/** The back of every Crawler card: the rules you actually need mid-turn. */
export function renderReference(c: Card): string {
  return `<div class="card back ref" style="--deck:${DECK_COLOR[c.deck]}">
    <div class="hd">CRAWLER</div>
    <h4>Your turn</h4>
    <p><b>1.</b> Turn every cooldown die down 1.</p>
    <p><b>2.</b> Move <b>2d6</b> and take <b>one action</b>, either order.</p>
    <p><b>Actions:</b> attack · cast · search for traps · open a chest or rack · disarm · pick up a Downed friend · learn a spellbook · in combat, swap gear or hand a card to an adjacent player.</p>
    <p><b>Free:</b> open doors · use consumables · out of combat, swap gear and hand cards freely.</p>
    <h4>Downed</h4>
    <p>At 0 Health lie down; skip turns, monsters ignore you. An adjacent friend spends an action to get you up with 1 Health. A Bandage does it free. Still down at the end of the <b>next round</b>: dead for the floor.</p>
    <h4>Spells and Mind</h4>
    <p><b>Scrolls:</b> anyone, once. <b>Spellbooks:</b> Mind 4+ to learn <i>and</i> to cast, yours for good, cooldown: set a d6 on the card. <b>Lockpick:</b> roll your Mind in dice, any skull opens it.</p>
    <h4>End of round</h4>
    <p>Monsters act, loot drops as they die, the countdown drops 1. On the stairs at round end: you're out.</p>
  </div>`;
}

export function renderLabel(c: Card): string {
  const tier = TIER_COLOR[c.tier ?? "Bronze"];
  return `<div class="label" style="--tier:${tier}"><div class="stripe"></div>
    <div class="tier">${esc(c.tier ?? "")} loot box</div>
    <div class="name ${c.name.length > 18 ? "long" : ""}">${esc(c.name)}</div>
    <div class="warn">do not open until earned</div></div>`;
}

/** A complete print document: letter pages, cards flush in a 3x3 grid, cut marks in the margins,
 *  each front page followed by its back page mirrored for duplex. */
export function renderPrint(items: { card: Card; art: string | null }[], opts: { flip: "long" | "short"; perPage: 6 | 9; title: string; flipUrl: string; backDx: number; backDy: number; nudge: (dx: number, dy: number) => string }): string {
  const cardsOnly = items.filter(i => i.card.type !== "envelope");
  const labels = items.filter(i => i.card.type === "envelope");
  const cols = 3, rows = opts.perPage / 3;
  const W = 2.5, H = 3.5, PW = 8.5, PH = 11;
  const gx = (PW - cols * W) / 2, gy = (PH - rows * H) / 2;
  const pages: string[] = [];

  const marks = () => {
    const m: string[] = [];
    for (let c = 0; c <= cols; c++) { const x = gx + c * W; m.push(`<i style="left:${x}in;top:0;height:${gy - .08}in;border-left:1px solid #999"></i><i style="left:${x}in;bottom:0;height:${gy - .08}in;border-left:1px solid #999"></i>`); }
    for (let r = 0; r <= rows; r++) { const y = gy + r * H; m.push(`<i style="top:${y}in;left:0;width:${gx - .08}in;border-top:1px solid #999"></i><i style="top:${y}in;right:0;width:${gx - .08}in;border-top:1px solid #999"></i>`); }
    return m.join("");
  };
  const shift = `transform:translate(${opts.backDx}mm,${opts.backDy}mm)`;
  const page = (cells: string[], back: boolean) => {
    const slots = Array.from({ length: opts.perPage }, (_, i) => {
      let r = Math.floor(i / cols), c = i % cols;
      if (back) { if (opts.flip === "long") c = cols - 1 - c; else r = rows - 1 - r; }
      const src = r * cols + c;
      return `<div class="slot" style="left:${gx + (i % cols) * W}in;top:${gy + Math.floor(i / cols) * H}in;${back ? shift : ""}">${cells[src] ?? ""}</div>`;
    }).join("");
    return `<section class="page">${marks()}${slots}</section>`;
  };
  for (let i = 0; i < cardsOnly.length; i += opts.perPage) {
    const chunk = cardsOnly.slice(i, i + opts.perPage);
    pages.push(page(chunk.map(x => renderFront(x.card, x.art)), false));
    pages.push(page(chunk.map(x => renderBack(x.card)), true));
  }
  // Labels: 2 x 5 per page (Avery 5163 shape), single-sided.
  for (let i = 0; i < labels.length; i += 10) {
    const chunk = labels.slice(i, i + 10);
    const cells = chunk.map((x, j) => `<div class="slot" style="left:${.25 + (j % 2) * 4}in;top:${.5 + Math.floor(j / 2) * 2}in">${renderLabel(x.card)}</div>`).join("");
    pages.push(`<section class="page">${cells}</section>`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title>
<meta name="color-scheme" content="light only">
<style>${CARD_CSS}
@page { size: letter; margin: 0; }
html { color-scheme: light only; }
html, body { margin:0; background:#888; }
.page { position:relative; width:8.5in; height:11in; background:#fff; margin:0 auto .2in; overflow:hidden; page-break-after:always; break-after:page; }
.page i { position:absolute; display:block; }
.slot { position:absolute; }
.bar { position:fixed; top:0; left:0; right:0; background:#222; color:#eee; font:13px system-ui; padding:8px 14px; display:flex; gap:16px; align-items:center; z-index:9; }
.bar b { color:#fff; } .bar a { color:#9cf; } .bar .nudge a { text-decoration:none; padding:0 4px; border:1px solid #555; border-radius:4px; }
.spacer { height:40px; }
@media print { .bar, .spacer { display:none; } body { background:#fff; } .page { margin:0; } }
</style></head><body>
<div class="bar"><b>${esc(opts.title)}</b><span>${cardsOnly.length} cards · ${Math.ceil(cardsOnly.length / opts.perPage)} sheets front + back${labels.length ? ` · ${labels.length} labels` : ""}</span>
<span>Print at 100% scale, duplex, flip on ${opts.flip} edge.</span>
<span class="nudge">Back offset <a href="${esc(opts.nudge(-0.5, 0))}">&larr;</a> <b>${opts.backDx.toFixed(1)}</b> <a href="${esc(opts.nudge(0.5, 0))}">&rarr;</a> &nbsp; <a href="${esc(opts.nudge(0, -0.5))}">&uarr;</a> <b>${opts.backDy.toFixed(1)}</b> <a href="${esc(opts.nudge(0, 0.5))}">&darr;</a> mm</span>
<a href="${esc(opts.flipUrl)}">flip on ${opts.flip === "long" ? "short" : "long"} edge instead</a>
<span style="margin-left:auto">⌘P</span></div>
<div class="spacer"></div>
<script>try{localStorage.setItem("cards.backOffset",JSON.stringify({bx:${opts.backDx},by:${opts.backDy}}))}catch{}</script>
${pages.join("\n")}
</body></html>`;
}
