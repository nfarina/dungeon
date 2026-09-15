// Deletes art no card uses any more: old hashes left behind by regenerating, and art for cards removed from the catalog.
//   bun run clean-art              delete them
//   bun run clean-art --dry-run    just list them
// A card's manifest entry is kept even when it's stale, since the workshop still shows that art until it's regenerated.
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { cards } from "./catalog";
import { ART_DIR, loadManifest, saveManifest } from "./gen";

const dry = process.argv.includes("--dry-run");
const ids = new Set(cards().map(c => c.id));
const manifest = loadManifest();

const gone = Object.keys(manifest).filter(id => !ids.has(id));
for (const id of gone) delete manifest[id];
const keep = new Set(Object.values(manifest).map(e => e.file));

const orphans = readdirSync(ART_DIR).filter(f => f.endsWith(".png") && !keep.has(f)).sort();
let bytes = 0;
for (const f of orphans) {
  bytes += statSync(join(ART_DIR, f)).size;
  console.log(`${dry ? "would delete" : "deleted"} art/${f}`);
  if (!dry) unlinkSync(join(ART_DIR, f));
}
for (const id of gone) console.log(`${dry ? "would drop" : "dropped"} manifest entry for removed card "${id}"`);
if (!dry && gone.length) saveManifest(manifest);

console.log(`${orphans.length} file${orphans.length === 1 ? "" : "s"} (${(bytes / 1e6).toFixed(1)} MB), ${gone.length} manifest entr${gone.length === 1 ? "y" : "ies"}${dry ? " — dry run, nothing changed" : ""}; ${keep.size} files in use`);
