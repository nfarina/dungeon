// Floor 2: the map, the carry-over party, and what each piece of furniture holds.
// Rules live in floor-2.md; the engine reads this behind `floor: 2`.
import raw from "./floor2.map.json";
import { toFloorDef, type MapFile } from "../mapfile";
import { clone, FLOOR2_ITEMS, type Item } from "./items";
import { BIG_GEAR, GEAR, KITS, POCKETS } from "./items";

export const FLOOR2_MAP = raw as unknown as MapFile;
export const FLOOR2 = toFloorDef(FLOOR2_MAP);

/** Fixed furniture contents by room name (section 3). A room not listed here gives its normal draw. */
export const FIXED_LOOT: Record<string, string> = {
  "Reception": "Industrial Bleach",
  "Supply Closet": "Industrial Bleach",
  "Shift Office": "Scroll: Restructuring",
  "Boiler Room": "Industrial Bleach",
  "Records": "Industrial Bleach",
  "Laundry": "Wizard's Bathrobe",
  "Cafeteria": "Industrial Bleach",
  "Lockup": "Password of the Day",
  "Kennels": "Password of the Day",
  "Incinerator": "Orc Chainmail Bib",
};

const named = (name: string): Item => {
  const it = FLOOR2_ITEMS[name] ?? [...POCKETS, ...GEAR, ...BIG_GEAR, ...Object.values(KITS).flat()].find(i => i.name === name);
  if (!it) throw new Error(`no such item: ${name}`);
  return clone(it);
};

export type Carry = {
  name: string;
  equip: Partial<Record<"main" | "off" | "body" | "head" | "feet", string>>;
  trinkets: string[];
  learned: string[];
  pack: string[];
  goose?: number;
};

/** What each player carried down the stairs (floor-1-inventory.md) plus the shop. */
export const CARRYOVER: Carry[] = [
  { name: "Vicki", equip: { main: "Kitchen Knife", head: "Football Helmet" }, trinkets: [], learned: [],
    pack: ["Slingshot", "Bandage", "Scroll: Stone Skin"] },
  { name: "Ethan", equip: { head: "Homework Glasses" }, trinkets: ["Bookmark", "Skeleton Key"],
    learned: ["Spellbook: Spark", "Spellbook: Nope", "Spellbook: Shove", "Spellbook: Patch Up"],
    pack: ["Energy Drink"] },
  { name: "Lucas", equip: { main: "Fire Axe" }, trinkets: ["Sponsored Cape", "Goblin Ear Necklace"], learned: [],
    pack: ["Whistle of Doubtful Value", "Scroll: Sleep"], goose: 2 },
];

export const item = (name: string): Item =>
  name === "Bookmark" ? { name: "Bookmark", slot: "trinket", resetCd: true }
  : name === "Spellbook: Nope" ? { name: "Spellbook: Nope", slot: "learned", spell: { id: "nope", cooldown: 3 } }
  : named(name);
