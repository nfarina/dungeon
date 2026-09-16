// Does the printed catalog match what the simulator plays with? Compares by name.
import { CARDS, mapFootprints, unlabeledBlockers } from "./catalog";
import { BIG_GEAR, EXTRA, FLOOR2_DECKS, GEAR, KITS, POCKETS } from "../../sim/src/content/items";
import { FLOOR2_MONSTERS, MONSTERS } from "../../sim/src/content/monsters";

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
  if ((c.floor ?? 1) !== 1) continue;
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
for (const m of [...Object.values(MONSTERS), ...Object.values(FLOOR2_MONSTERS)] as any[]) {
  const n = String(m.name ?? m.id).toLowerCase();
  if (!monsterCards.has(n) && !(m.boss && monsterCards.has("the floor manager"))) { bad++; console.log(`sim monster "${n}" has no card`); }
}

// Floor 2 shuffled decks: the sim's lists must match the Floor 2 cards that are neither placed nor in an envelope.
{
  const sim2 = new Map<string, number>();
  for (const i of [...FLOOR2_DECKS.pockets, ...FLOOR2_DECKS.gear, ...FLOOR2_DECKS.big]) sim2.set(i.name, (sim2.get(i.name) ?? 0) + 1);
  const cat2 = new Map<string, number>();
  // Floor 1 cards that come back into the Floor 2 decks are the ones the sim lists that no Floor 2 card names.
  for (const c of CARDS) {
    if (c.floor !== 2 || !["pockets", "gear", "biggear"].includes(c.deck) || c.placed || c.envelope) continue;
    cat2.set(c.simName ?? c.name, (cat2.get(c.simName ?? c.name) ?? 0) + (c.qty ?? 1));
  }
  const f1names = new Set(CARDS.filter(c => (c.floor ?? 1) === 1).map(c => c.simName ?? c.name));
  for (const [n, k] of cat2) { const s = sim2.get(n) ?? 0; if (!f1names.has(n) && s !== k) { bad++; console.log(`Floor 2: catalog has ${k} × "${n}", sim deck has ${s}`); } }
  for (const [n, k] of sim2) if (!cat2.has(n) && !f1names.has(n)) { bad++; console.log(`Floor 2: sim deck has ${k} × "${n}", catalog has no card`); }
}

// Every piece on each floor's map needs a tile, and every tile should be on its map (the entrance is a printed board feature).
for (const floor of [1, 2] as const) {
  const fp = mapFootprints(floor);
  const keyed = new Set(CARDS.filter(c => c.type === "tile" && c.mapKey && (c.floor ?? 1) === floor).map(c => c.mapKey!));
  const anyFloor = new Set(CARDS.filter(c => c.type === "tile" && c.mapKey).map(c => c.mapKey!));   // traps and doors are shared tiles
  for (const k of Object.keys(fp)) if (k !== "entrance" && !keyed.has(k) && !anyFloor.has(k)) { bad++; console.log(`Floor ${floor} map has "${k}" (${fp[k].map(s => `${s.n}× ${s.w}x${s.h}`).join(", ")}) but no tile card`); }
  for (const k of keyed) if (!fp[k] && !["corpse", "grub"].includes(k)) { bad++; console.log(`Floor ${floor} tile "${k}" is not on the map`); }
  for (const b of unlabeledBlockers(floor)) { bad++; console.log(`Floor ${floor} map has unlabeled furniture at ${b.x},${b.y} (${b.w}x${b.h}); give it a label so it gets a tile`); }
}

console.log(bad ? `${bad} mismatch(es)` : "catalog, sim and map agree");
process.exit(bad ? 1 : 0);
