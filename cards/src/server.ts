// The card workshop: preview every card, edit prompts, generate art, print sheets.
//   bun run cards      ->  http://localhost:5174
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DECK_NAMES, DECK_ORDER, ROOT, cards, saveOverride, type Card, type Deck } from "./catalog";
import { ART_DIR, DEFAULT_MODEL, MODELS, artFor, fullPrompt, generate, readStyle, styleRef, writeStyle } from "./gen";
import { CARD_CSS, renderBack, renderFront, renderPrint, renderTileSheet } from "./templates";

const PORT = Number(process.env.PORT ?? 5174);
const EDITOR = join(import.meta.dir, "editor.html");

// ---- generation queue: one at a time, status polled by the UI ----
type Job = { id: string; force: boolean; model: string };
const queue: Job[] = [];
let running: Job | null = null;
const log: string[] = [];
const errors: Record<string, string> = {};
let done = 0;
function say(s: string) { log.push(`${new Date().toLocaleTimeString()} ${s}`); if (log.length > 200) log.shift(); }
async function pump() {
  if (running) return;
  const job = queue.shift(); if (!job) return;
  running = job;
  const c = cards().find(x => x.id === job.id);
  try { if (!c) throw new Error("unknown card " + job.id); await generate(c, { force: job.force, model: job.model, log: say }); delete errors[job.id]; done++; }
  catch (e: any) { errors[job.id] = e.message; say(`✗ ${e.message}`); }
  running = null;
  if (queue.length) setTimeout(pump, 250);
}
function enqueue(ids: string[], force: boolean, model: string) {
  for (const id of ids) if (!queue.some(j => j.id === id) && running?.id !== id) queue.push({ id, force, model });
  pump();
}

function artUrl(c: Card, model: string): string | null { const a = artFor(c, model); return a ? `/art/${a.file}` : null; }

function cardJson(c: Card, model: string) {
  const a = artFor(c, model);
  return {
    ...c, deckName: DECK_NAMES[c.deck],
    art: c.art, prompt: c.art ? fullPrompt(c) : "",
    artUrl: a ? `/art/${a.file}` : null, stale: a?.stale ?? false,
    front: renderFront(c, a ? `/art/${a.file}` : null), back: renderBack(c),
    queued: queue.some(j => j.id === c.id) || running?.id === c.id, error: errors[c.id] ?? null,
  };
}

const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { "content-type": "application/json" } });
const html = (x: string) => new Response(x, { headers: { "content-type": "text/html; charset=utf-8" } });

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const p = url.pathname;
    const model = url.searchParams.get("model") || DEFAULT_MODEL;

    if (p === "/") return html(readFileSync(EDITOR, "utf8"));
    if (p === "/card.css") return new Response(CARD_CSS, { headers: { "content-type": "text/css" } });
    if (p === "/art-style.png") { const r = styleRef(); return r ? new Response(r, { headers: { "content-type": "image/png" } }) : new Response("no reference", { status: 404 }); }
    if (p.startsWith("/art/")) {
      const f = join(ART_DIR, p.slice(5).replace(/[^\w.-]/g, ""));
      return existsSync(f) ? new Response(Bun.file(f)) : new Response("not found", { status: 404 });
    }

    if (p === "/api/cards") return json({ decks: DECK_ORDER.map(d => ({ id: d, name: DECK_NAMES[d] })), model, models: MODELS, cards: cards().map(c => cardJson(c, model)) });
    if (p === "/api/status") return json({ running: running?.id ?? null, queue: queue.map(j => j.id), done, errors, log: log.slice(-30) });
    if (p === "/api/style" && req.method === "GET") return json({ style: readStyle(), hasRef: !!styleRef() });
    if (p === "/api/style" && req.method === "PUT") { const b = await req.json(); writeStyle(String(b.style ?? "")); return json({ ok: true }); }
    if (p === "/api/prompt" && req.method === "PUT") { const b = await req.json(); saveOverride(String(b.id), { art: String(b.art ?? "") }); return json({ ok: true }); }
    if (p === "/api/gen" && req.method === "POST") {
      const b = await req.json();
      const ids: string[] = Array.isArray(b.ids) ? b.ids : [];
      enqueue(ids, !!b.force, String(b.model ?? DEFAULT_MODEL));
      return json({ queued: queue.length, running: running?.id ?? null });
    }

    if (p === "/print") {
      const deck = url.searchParams.get("deck") as Deck | null;
      const ids = url.searchParams.get("ids")?.split(",").filter(Boolean);
      const flip = url.searchParams.get("flip") === "short" ? "short" : "long";
      const perPage = url.searchParams.get("perPage") === "6" ? 6 : 9;
      let list = cards();
      if (ids?.length) list = ids.map(id => list.find(c => c.id === id)!).filter(Boolean);
      else if (deck) list = list.filter(c => c.deck === deck);
      const title = ids?.length ? `${list.length} selected cards` : deck ? `${DECK_NAMES[deck]} deck` : "Every card";
      if (list.length && list.every(c => c.type === "tile")) return html(renderTileSheet(list.map(c => ({ card: c, art: artUrl(c, model) })), deck ? "Floor tiles" : title));
      list = list.filter(c => c.type !== "tile");
      const alt = new URL(url); alt.searchParams.set("flip", flip === "long" ? "short" : "long");
      const backDx = Number(url.searchParams.get("bx") ?? 0) || 0, backDy = Number(url.searchParams.get("by") ?? 0) || 0;
      const nudge = (dx: number, dy: number) => { const u = new URL(url); u.searchParams.set("bx", String(+(backDx + dx).toFixed(1))); u.searchParams.set("by", String(+(backDy + dy).toFixed(1))); return u.pathname + u.search; };
      return html(renderPrint(list.map(c => ({ card: c, art: artUrl(c, model) })), { flip, perPage, title, flipUrl: alt.pathname + alt.search, backDx, backDy, nudge }));
    }
    if (p.startsWith("/preview/")) {
      const c = cards().find(x => x.id === p.slice(9));
      if (!c) return new Response("no such card", { status: 404 });
      return html(`<!doctype html><meta charset="utf-8"><style>${CARD_CSS} body{margin:0;background:#666;display:flex;gap:.3in;padding:.3in;flex-wrap:wrap}</style>${renderFront(c, artUrl(c, model))}${renderBack(c)}`);
    }
    return new Response("not found", { status: 404 });
  },
});
console.log(`cards workshop: http://localhost:${PORT}   (root ${ROOT})`);
