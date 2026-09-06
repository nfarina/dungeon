// Does the printed catalog match what the simulator plays with? Compares by name.
import { CARDS, mapFootprints, unlabeledBlockers } from "./catalog";
import { BIG_GEAR, EXTRA, GEAR, KITS, POCKETS } from "../../sim/src/content/items";
import { MONSTERS } from "../../sim/src/content/monsters";

// Shuffled decks: the sim's deck lists must match the cards that are NOT bound to an envelope.
// Envelope copies only matter to the sim when it models them (EXTRA); gold and spare consumables are handouts it ignores.
const simNames = new Map<string, number>();
const bump = (n: string) => simNames.set(n, (simNames.get(n) ?? 0) + 1);
for (const i of [...POCKETS, ...GEAR, ...BIG_GEAR]) bump(i.name);
for (const items of Object.values(KITS)) for (const i of items) bump(i.name);
const simExtra = new Set(Object.values(EXTRA).map(i => i.name));

const cardNames = new Map<string, number>();
for (const c of CARDS) {
  const n = c.simName ?? c.name;
  if (!["kit", "pockets", "gear", "biggear"].includes(c.deck) || c.type === "companion" || c.type === "text") continue;
  const qty = c.qty ?? 1, reserved = c.envelope ? Math.min(qty, c.reserved ?? qty) : 0;
  if (reserved && simExtra.has(n)) simNames.set(n, (simNames.get(n) ?? 0) + reserved);   // the sim models this envelope item
  const counted = qty - reserved + (reserved && simExtra.has(n) ? reserved : 0);
  if (counted) cardNames.set(n, (cardNames.get(n) ?? 0) + counted);
}
// The sim keeps the Snack Bag as two Juice Boxes; the catalog has one kit card.
cardNames.delete("Snack Bag"); cardNames.set("Juice Box", (cardNames.get("Juice Box") ?? 0) + 2);

let bad = 0;
for (const [n, k] of simNames) { const c = cardNames.get(n) ?? 0; if (c !== k) { bad++; console.log(`sim has ${k} × "${n}", catalog has ${c}`); } }
for (const [n, k] of cardNames) if (!simNames.has(n)) { bad++; console.log(`catalog has ${k} × "${n}", sim has none`); }

const monsterCards = new Set(CARDS.filter(c => c.deck === "monster").map(c => c.name.toLowerCase()));
for (const m of Object.values(MONSTERS) as any[]) {
  const n = String(m.name ?? m.id).toLowerCase();
  if (!monsterCards.has(n) && !(m.boss && monsterCards.has("the floor manager"))) { bad++; console.log(`sim monster "${n}" has no card`); }
}
// Every piece on the map needs a tile, and every tile should be on the map (the entrance is a printed board feature).
const fp = mapFootprints();
const keyed = new Set(CARDS.filter(c => c.type === "tile" && c.mapKey).map(c => c.mapKey!));
for (const k of Object.keys(fp)) if (k !== "entrance" && !keyed.has(k)) { bad++; console.log(`map has "${k}" (${fp[k].map(s => `${s.n}× ${s.w}x${s.h}`).join(", ")}) but no tile card`); }
for (const k of keyed) if (!fp[k]) { bad++; console.log(`tile "${k}" is not on the map`); }
for (const b of unlabeledBlockers()) { bad++; console.log(`map has unlabeled furniture at ${b.x},${b.y} (${b.w}x${b.h}); give it a label so it gets a tile`); }

console.log(bad ? `${bad} mismatch(es)` : "catalog, sim and map agree");
process.exit(bad ? 1 : 0);
