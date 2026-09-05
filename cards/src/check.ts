// Does the printed catalog match what the simulator plays with? Compares by name.
import { CARDS } from "./catalog";
import { BIG_GEAR, EXTRA, GEAR, KITS, POCKETS } from "../../sim/src/content/items";
import { MONSTERS } from "../../sim/src/content/monsters";

const simNames = new Map<string, number>();
const bump = (n: string) => simNames.set(n, (simNames.get(n) ?? 0) + 1);
for (const i of [...POCKETS, ...GEAR, ...BIG_GEAR]) bump(i.name);
for (const i of Object.values(EXTRA)) bump(i.name);
for (const items of Object.values(KITS)) for (const i of items) bump(i.name);

const cardNames = new Map<string, number>();
for (const c of CARDS) {
  if (["kit", "pockets", "gear", "biggear", "lootbox"].includes(c.deck) && c.type !== "companion" && c.type !== "text")
    cardNames.set(c.simName ?? c.name, (cardNames.get(c.simName ?? c.name) ?? 0) + 1);
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
console.log(bad ? `${bad} mismatch(es)` : "catalog and sim agree");
process.exit(bad ? 1 : 0);
