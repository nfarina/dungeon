// Art generation via Gemini image models, cached by content hash.
//   bun run gen --all            every card without art (or with stale art)
//   bun run gen --deck gear      one deck
//   bun run gen --id goblin      one card
//   add --force to regenerate, --model <name> to switch models
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, STANDEE_TAB, cards, type Card } from "./catalog";

export const ART_DIR = join(ROOT, "art");
const MANIFEST = join(ART_DIR, "manifest.json");
const STYLE_MD = join(ROOT, "style.md");
const STYLE_REF = join(ROOT, "..", "art-style.png");
const KEY_FILE = join(ROOT, "..", ".gemini.key");

/** Nano Banana 2 by default. flash-lite is cheaper but not good enough for finals. gemini-3-pro-image is the slower, prettier, pricier one. */
export const DEFAULT_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";
export const MODELS = ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image", "gemini-3-pro-image", "gemini-2.5-flash-image"];

/** Output resolution. TEMPORARY: 512px drafts while the deck is in flux (about a third the cost of 1K).
 *  Switch to "1K" for the final print run; art made at a smaller size than this setting shows as stale. */
export const IMAGE_SIZE = process.env.GEMINI_IMAGE_SIZE ?? "512px";
/** Bump when the tile framing text in fullPrompt changes, so existing tile art shows as stale. */
const TILE_VIEW = "v2-threequarter";
const SIZE_RANK: Record<string, number> = { "512px": 0, "1K": 1, "2K": 2, "4K": 3 };
/** Is art made at `made` good enough for the current setting? Absent = 1K, the API default before this setting existed. */
const bigEnough = (made?: string) => (SIZE_RANK[made ?? "1K"] ?? 1) >= (SIZE_RANK[IMAGE_SIZE] ?? 1);

export type ManifestEntry = { file: string; hash: string; prompt: string; model: string; at: string; size?: string };
export type Manifest = Record<string, ManifestEntry>;

export function loadManifest(): Manifest {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
}
export function saveManifest(m: Manifest) {
  mkdirSync(ART_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + "\n");
}

export function readStyle(): string { return existsSync(STYLE_MD) ? readFileSync(STYLE_MD, "utf8").trim() : ""; }
export function writeStyle(s: string) { writeFileSync(STYLE_MD, s.trim() + "\n"); }
export function styleRef(): Buffer | null { return existsSync(STYLE_REF) ? readFileSync(STYLE_REF) : null; }

const sha = (b: string | Buffer) => createHash("sha1").update(b).digest("hex");

export function fullPrompt(c: Card): string {
  const style = readStyle();
  if (c.type === "tile") {
    // Furniture gets a high-angle three-quarter view so it reads as an object (legs, sides, height); traps stay flat.
    // Both are cropped tight: the object IS the tile, with floor only in the gaps.
    const view = c.tile?.kind === "trap"
      ? "This is a board game floor tile seen DIRECTLY FROM ABOVE: flat top-down orthographic view of a floor feature, no horizon, no walls, no perspective."
      : "This is a board game furniture token: high-angle three-quarter view, camera tilted about 60 degrees down and looking straight at the FRONT of the object (no diagonal rotation, the footprint stays a rectangle aligned with the frame), so the top surface AND the front side and legs are visible. No walls, no horizon.";
    const same = c.ref ? " The second reference image shows this exact object before it was used: keep the same object, colours, materials, viewpoint and framing, and change only what the description says." : "";
    return `${style}\n\n${view} The object is cropped TIGHT and fills the frame edge to edge with almost no floor margin, like a token cut out to fit its footprint exactly; dark grey stone flagstones show only in the small gaps around it.\n\nSubject: ${c.art}.${same}`;
  }
  const same = !c.ref ? ""
    : c.type === "tile" ? " The second reference image shows this exact object before it was used: keep the same object, colours, materials, viewpoint and framing, and change only what the description says."
    : " The second reference image shows this exact character: match their face, hair, skin, build and clothing, but take ONLY the character from it, not its background or framing.";
  if (c.type === "standee") {
    return `${style}\n\nThis is a stand-up game figure: one character shown full length, standing upright and facing the viewer, head near the top of the frame and feet near the bottom, nothing cropped. Portrait (tall) composition.\n\nSubject: ${c.art}.${same}\n\nBACKGROUND OVERRIDE: ignore the dungeon background described in the style above. The background here must be a plain, flat, uniform pale cream parchment colour, edge to edge, with only a soft ground shadow under the feet. No stone, no walls, no scenery, no gradient.`;
  }
  const subject = c.type === "player"
    ? `Subject: ${c.art}. This is a character portrait for a game card, landscape composition.`
    : `Subject: ${c.art}. Landscape composition.`;
  return `${style}\n\n${subject}${same}`;
}

/** Gemini only accepts a fixed set of aspect ratios; pick the nearest to the asset's shape. */
export function aspectRatio(c: Card): string {
  const want = c.tile ? c.tile.w / (c.tile.kind === "standee" ? c.tile.h - STANDEE_TAB : c.tile.h) : 4 / 3;
  const options = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
  return options.map(r => { const [a, b] = r.split(":").map(Number); return { r, d: Math.abs(Math.log(a / b) - Math.log(want)) }; })
    .sort((x, y) => x.d - y.d)[0].r;
}

/** The current art of the card `c.ref` points at, to send as a second reference image. Null until that card has art. */
export function refArt(c: Card, all?: Card[]): Buffer | null {
  if (!c.ref) return null;
  const target = (all ?? cards()).find(x => x.id === c.ref);
  const a = target && artFor(target, undefined, all);
  return a ? readFileSync(join(ART_DIR, a.file)) : null;
}

/** What the art for this card would be named under the current prompt, style, model and character reference.
 *  Regenerating the referenced card changes this hash, so the dependent art shows as stale. */
export function expectedHash(c: Card, model = DEFAULT_MODEL, all?: Card[]): string {
  const ref = styleRef();
  const ref2 = refArt(c, all);
  // tiles take their shape from the map, so a resize there makes the art stale; TILE_VIEW bumps when the tile framing prompt changes
  return sha([model, readStyle(), ref ? sha(ref) : "noref", c.art, ...(c.ref ? [ref2 ? sha(ref2) : "noref2"] : []), ...(c.type === "tile" ? [aspectRatio(c), TILE_VIEW] : [])].join(" ")).slice(0, 10);
}

/** Cards that would get the exact same request as `c` (same prompt text and shape), e.g. the four Juice Boxes.
 *  They share one image: generating any of them fills in all of them. */
export function linked(c: Card, all: Card[] = cards()): Card[] {
  const kind = (x: Card) => x.type === "tile" || x.type === "player" || x.type === "standee" ? x.type : "card";
  return all.filter(o => o.id !== c.id && o.art && o.art === c.art && o.ref === c.ref && kind(o) === kind(c) && aspectRatio(o) === aspectRatio(c));
}

/** Current art for a card, if the manifest has one for it or for a linked card.
 *  Stale = prompt, style or model changed since it was made. Fresh art on a twin beats stale art of our own. */
export function artFor(c: Card, model = DEFAULT_MODEL, all?: Card[]): { file: string; stale: boolean } | null {
  const m = loadManifest();
  const hash = expectedHash(c, model, all);
  const entries = [c, ...linked(c, all)].map(x => m[x.id]).filter(e => e && existsSync(join(ART_DIR, e.file)));
  const e = entries.find(e => e.hash === hash && bigEnough(e.size)) ?? entries.find(e => e.hash === hash) ?? entries[0];
  return e ? { file: e.file, stale: e.hash !== hash || !bigEnough(e.size) } : null;
}

function apiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (!existsSync(KEY_FILE)) throw new Error(`no API key: put it in ${KEY_FILE} or GEMINI_API_KEY`);
  return readFileSync(KEY_FILE, "utf8").trim();
}

export async function generate(c: Card, opts: { force?: boolean; model?: string; log?: (s: string) => void } = {}): Promise<ManifestEntry> {
  const model = opts.model ?? DEFAULT_MODEL;
  const log = opts.log ?? console.log;
  if (!c.art) throw new Error(`${c.id} has no art prompt`);
  const hash = expectedHash(c, model);
  const twins = linked(c);
  const ids = [c.id, ...twins.map(t => t.id)];
  /** Record `entry` for this card and every card sharing its prompt. */
  const record = (entry: ManifestEntry) => { const m = loadManifest(); for (const id of ids) m[id] = entry; saveManifest(m); };
  if (!opts.force) {
    const manifest = loadManifest();
    const have = ids.map(id => manifest[id]).find(e => e && e.hash === hash && bigEnough(e.size) && existsSync(join(ART_DIR, e.file)));
    if (have) { record(have); log(`= ${c.id} (cached${twins.length ? `, shared with ${twins.length} linked` : ""})`); return have; }
  }

  const prompt = fullPrompt(c);
  const ref = styleRef();
  const ref2 = refArt(c);
  if (c.ref && !ref2) log(`! ${c.id}: ${c.ref} has no art yet, generating without the character reference`);
  const parts: any[] = [{ text: prompt }];
  if (ref) parts.push({ inline_data: { mime_type: "image/png", data: ref.toString("base64") } });
  if (ref2) parts.push({ inline_data: { mime_type: "image/png", data: ref2.toString("base64") } });
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspectRatio(c), imageSize: IMAGE_SIZE } },
  };
  log(`> ${c.id} via ${model} @ ${IMAGE_SIZE}`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey() }, body: JSON.stringify(body),
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(`${c.id}: ${res.status} ${json?.error?.message ?? JSON.stringify(json).slice(0, 300)}`);
  const img = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.inline_data);
  if (!img) {
    const txt = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join(" ");
    throw new Error(`${c.id}: no image in response${txt ? ` (model said: ${txt.slice(0, 200)})` : ""} finish=${json?.candidates?.[0]?.finishReason ?? "?"}`);
  }
  const data = (img.inlineData ?? img.inline_data).data as string;
  const file = `${c.id}.${hash}.png`;
  mkdirSync(ART_DIR, { recursive: true });
  writeFileSync(join(ART_DIR, file), Buffer.from(data, "base64"));
  const entry: ManifestEntry = { file, hash, prompt, model, at: new Date().toISOString(), size: IMAGE_SIZE };
  record(entry);
  log(`ok ${c.id} -> art/${file}${twins.length ? ` (also ${twins.map(t => t.id).join(", ")})` : ""}`);
  return entry;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const force = args.includes("--force");
  const model = flag("--model");
  let list = cards().filter(c => c.art);
  if (flag("--deck")) list = list.filter(c => c.deck === flag("--deck"));
  if (flag("--id")) list = list.filter(c => c.id === flag("--id"));
  if (!args.includes("--all") && !flag("--deck") && !flag("--id")) { console.log("usage: bun run gen --all | --deck <deck> | --id <id> [--force] [--model <name>]"); process.exit(1); }
  let fail = 0;
  for (const c of list) {
    try { await generate(c, { force, model }); }
    catch (e: any) { fail++; console.error(`FAILED ${e.message}`); }
  }
  console.log(`done: ${list.length - fail} ok, ${fail} failed`);
}
