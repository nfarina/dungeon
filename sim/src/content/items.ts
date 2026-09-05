export type Slot = "main" | "off" | "body" | "head" | "feet" | "trinket" | "learned" | "pack";

export type Item = {
  name: string;
  slot: Slot;
  twoHanded?: boolean;
  atk?: number;        // extra attack dice
  def?: number;        // extra defend dice
  mind?: number;
  move?: number;
  // one-shot consumables
  use?: "heal3" | "heal4" | "heal1" | "energy" | "firecracker" | "firebolt" | "sleep" | "stoneskin" | "smokebomb";
  // persistent specials
  torch?: boolean;         // auto-reveal traps on room entry, finds secret doors
  rope?: boolean;          // pits cost nothing
  disarms?: number;        // charges of trap disarm
  unlocks?: number;        // charges of "open any locked thing"
  trapImmuneOnce?: boolean;
  reroll?: number;         // rerolls per floor
  goblinAversion?: boolean;
  ranged?: { dice: number; sidearm?: boolean };   // replaces melee attack, cannot hit adjacent; sidearm = shoot when out of reach, melee normally when adjacent
  bonusVs1hp?: number;
  spell?: { id: "spark" | "shove" | "patchup" | "nope"; cooldown: number };
  gold?: number;
  inert?: boolean;
  fragile?: boolean;       // Hockey Stick: snaps on a zero-skull attack
  capeOnce?: boolean;      // Sponsored Cape: once per floor, die -> Downed at 1 Health instead
  resetCd?: boolean;       // Bookmark: once per floor, set one cooldown die to 0
};

const g = (n: number): Item => ({ name: `Gold (${n})`, slot: "pack", gold: n, inert: true });

export const POCKETS: Item[] = [
  ...Array.from({ length: 4 }, () => ({ name: "Juice Box", slot: "pack" as Slot, use: "heal3" as const })),
  ...Array.from({ length: 2 }, () => ({ name: "Energy Drink", slot: "pack" as Slot, use: "energy" as const })),
  g(1), g(1), g(2), g(3),
  { name: "Firecracker", slot: "pack", use: "firecracker" },
  { name: "Bandage", slot: "pack", use: "heal1" },
  { name: "Rope", slot: "trinket", rope: true },
  { name: "Whistle of Doubtful Value", slot: "trinket", inert: true },
  { name: "Scroll: Sleep", slot: "pack", use: "sleep" },
  { name: "Scroll: Heal", slot: "pack", use: "heal4" },
];

export const GEAR: Item[] = [
  { name: "Broken Table Leg", slot: "main", atk: 1 },
  { name: "Kitchen Knife", slot: "main", bonusVs1hp: 1 },
  { name: "Trash Can Lid", slot: "off", def: 1 },
  { name: "Frying Pan", slot: "off", def: 1 },
  { name: "Goblin-Chewed Leather Jacket", slot: "body", def: 1 },
  { name: "Orc Monocle", slot: "head", mind: 1 },
  { name: "Stolen Sneakers", slot: "feet", move: 2 },
  { name: "Lucky Rabbit's Foot", slot: "trinket", reroll: 1 },
  { name: "Trap Kit", slot: "trinket", disarms: 3 },
  { name: "Torch", slot: "off", torch: true },
  { name: "Goblin Ear Necklace", slot: "trinket", goblinAversion: true },
  { name: "Scroll: Firebolt", slot: "pack", use: "firebolt" },
  { name: "Scroll: Stone Skin", slot: "pack", use: "stoneskin" },
  { name: "Scroll: Smoke Bomb", slot: "pack", use: "smokebomb" },
];

export const BIG_GEAR: Item[] = [
  { name: "Fire Axe", slot: "main", twoHanded: true, atk: 2, unlocks: 99 },
  { name: "Goblin Shortbow", slot: "main", twoHanded: true, ranged: { dice: 2 } },
  { name: "Orc Chainmail Bib", slot: "body", def: 2, move: -2 },
  { name: "Football Helmet", slot: "head", trapImmuneOnce: true },
  { name: "Skeleton Key", slot: "trinket", unlocks: 1 },
  { name: "Spellbook: Spark", slot: "learned", spell: { id: "spark", cooldown: 2 } },
  { name: "Spellbook: Shove", slot: "learned", spell: { id: "shove", cooldown: 2 } },
  { name: "Spellbook: Patch Up", slot: "learned", spell: { id: "patchup", cooldown: 3 } },
  { name: "Sponsored Cape", slot: "trinket", capeOnce: true },
];

export const EXTRA: Record<string, Item> = {
  "Spellbook: Nope": { name: "Spellbook: Nope", slot: "learned", spell: { id: "nope", cooldown: 3 } },
  "Bookmark": { name: "Bookmark", slot: "trinket", resetCd: true },
};

export const KITS: Record<string, Item[]> = {
  Slingshot: [{ name: "Slingshot", slot: "main", ranged: { dice: 1, sidearm: true } }],
  HockeyStick: [{ name: "Hockey Stick", slot: "main", atk: 1, fragile: true }],
  Multitool: [{ name: "Multitool", slot: "trinket", disarms: 2 }],
  SnackBag: [{ name: "Juice Box", slot: "pack", use: "heal3" }, { name: "Juice Box", slot: "pack", use: "heal3" }],
  Glasses: [{ name: "Homework Glasses", slot: "head", mind: 1 }],
};

export function clone(i: Item): Item { return JSON.parse(JSON.stringify(i)); }
