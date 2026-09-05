// Art generation via Gemini image models, cached by content hash.
//   bun run gen --all            every card without art (or with stale art)
//   bun run gen --deck gear      one deck
//   bun run gen --id goblin      one card
//   add --force to regenerate, --model <name> to switch models
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cards, type Card } from "./catalog";

export const ART_DIR = join(ROOT, "art");
const MANIFEST = join(ART_DIR, "manifest.json");
const STYLE_MD = join(ROOT, "style.md");
const STYLE_REF = join(ROOT, "..", "art-style.png");
const KEY_FILE = join(ROOT, "..", ".gemini.key");

/** Nano Banana 2 Lite by default. gemini-3-pro-image is the slower, prettier, pricier one. */
export const DEFAULT_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-lite-image";
export const MODELS = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "gemini-3-pro-image", "gemini-2.5-flash-image"];

export type ManifestEntry = { file: string; hash: string; prompt: string; model: string; at: string };
export type Manifest = Record<string, ManifestEntry>;

export function loadManifest(): Manifest {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
}
function saveManifest(m: Manifest) {
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
    return `${style}\n\nThis is a board game floor tile seen DIRECTLY FROM ABOVE, like a map: flat top-down orthographic view, no horizon, no walls, nothing hanging or standing upright, no perspective. Objects lie flat on dark grey stone dungeon flagstones as seen from the ceiling, and fill the frame edge to edge.\n\nSubject: ${c.art}.`;
  }
  const subject = c.type === "player"
    ? `Subject: ${c.art}. This is a character portrait for a game card, landscape composition.`
    : `Subject: ${c.art}. Landscape composition.`;
  return `${style}\n\n${subject}`;
}

/** Gemini only accepts a fixed set of aspect ratios; pick the nearest to the asset's shape. */
export function aspectRatio(c: Card): string {
  const want = c.tile ? c.tile.w / c.tile.h : 4 / 3;
  const options = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
  return options.map(r => { const [a, b] = r.split(":").map(Number); return { r, d: Math.abs(Math.log(a / b) - Math.log(want)) }; })
    .sort((x, y) => x.d - y.d)[0].r;
}

/** What the art for this card would be named under the current prompt, style and model. */
export function expectedHash(c: Card, model = DEFAULT_MODEL): string {
  const ref = styleRef();
  return sha([model, readStyle(), ref ? sha(ref) : "noref", c.art].join(" ")).slice(0, 10);
}

/** Current art for a card, if the manifest has one. Stale = prompt, style or model changed since it was made. */
export function artFor(c: Card, model = DEFAULT_MODEL): { file: string; stale: boolean } | null {
  const e = loadManifest()[c.id];
  if (!e || !existsSync(join(ART_DIR, e.file))) return null;
  return { file: e.file, stale: e.hash !== expectedHash(c, model) };
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
  const manifest = loadManifest();
  const have = manifest[c.id];
  if (!opts.force && have && have.hash === hash && existsSync(join(ART_DIR, have.file))) { log(`= ${c.id} (cached)`); return have; }

  const prompt = fullPrompt(c);
  const ref = styleRef();
  const parts: any[] = [{ text: prompt }];
  if (ref) parts.push({ inline_data: { mime_type: "image/png", data: ref.toString("base64") } });
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspectRatio(c) } },
  };
  log(`> ${c.id} via ${model}`);
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
  const entry: ManifestEntry = { file, hash, prompt, model, at: new Date().toISOString() };
  const fresh = loadManifest(); fresh[c.id] = entry; saveManifest(fresh);
  log(`ok ${c.id} -> art/${file}`);
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
